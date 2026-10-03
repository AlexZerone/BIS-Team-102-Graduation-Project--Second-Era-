import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, companies, courses, enrollments, jobRequirements, jobs, studentProfiles, submissions, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { effectivePlan } from "@/lib/plans";
import { enroll, gradeSubmission, submitAssessment } from "./learning";
import { applyToJob, missingRequirements, rankedApplicants } from "./hiring";
import { migrate } from "@/db/migrate";

await migrate();

async function user(role: "student" | "instructor" | "company", email: string) {
  const [u] = await db.insert(users).values({ email, passwordHash: "x", name: email, role, status: "active" }).returning();
  return u;
}

describe("training-to-hiring loop", async () => {
  const instructor = await user("instructor", "i@t");
  const otherInstructor = await user("instructor", "i2@t");
  const student = await user("student", "s@t");
  await db.insert(studentProfiles).values({ userId: student.id });
  const companyUser = await user("company", "c@t");
  const [company] = await db.insert(companies).values({ userId: companyUser.id, name: "Acme" }).returning();

  const [course] = await db
    .insert(courses)
    .values({ instructorId: instructor.id, title: "SQL Basics", summary: "s", description: "d", status: "published", passingScore: 70 })
    .returning();
  const [premiumCourse] = await db
    .insert(courses)
    .values({ instructorId: instructor.id, title: "Pro", summary: "s", description: "d", status: "published", requiredPlan: "premium" })
    .returning();
  const [a1, a2] = await db
    .insert(assessments)
    .values([
      { courseId: course.id, title: "Task 1", instructions: "i", maxScore: 50 },
      { courseId: course.id, title: "Task 2", instructions: "i", maxScore: 50 },
    ])
    .returning();
  const [job] = await db.insert(jobs).values({ companyId: company.id, title: "Data Intern", description: "d" }).returning();
  await db.insert(jobRequirements).values({ jobId: job.id, courseId: course.id });

  const subId = async (assessmentId: number) =>
    (await db.select().from(submissions).where(eq(submissions.assessmentId, assessmentId)))[0].id;

  it("blocks applying without the required certificate", async () => {
    expect(await missingRequirements(student.id, job.id)).toEqual([{ id: course.id, title: "SQL Basics" }]);
    await expect(applyToJob(student.id, job.id, null)).rejects.toThrow(/SQL Basics/);
  });

  it("gates courses by plan and submissions by enrollment", async () => {
    await expect(enroll(student.id, premiumCourse.id)).rejects.toThrow(/Premium/);
    await expect(submitAssessment(student.id, a1.id, "answer", null)).rejects.toThrow(/Enroll/);
  });

  it("issues a certificate only when all work is graded and the score passes", async () => {
    await enroll(student.id, course.id);
    await submitAssessment(student.id, a1.id, "answer", null);
    await submitAssessment(student.id, a2.id, "answer", null);

    await expect(gradeSubmission(otherInstructor.id, await subId(a1.id), 40, null)).rejects.toThrow(/not found/);
    await expect(gradeSubmission(instructor.id, await subId(a1.id), 51, null)).rejects.toThrow(/between 0 and 50/);

    expect(await gradeSubmission(instructor.id, await subId(a1.id), 30, null)).toBeNull(); // Task 2 still ungraded
    expect(await gradeSubmission(instructor.id, await subId(a2.id), 30, null)).toBeNull(); // 60% < 70%
    const cert = await gradeSubmission(instructor.id, await subId(a2.id), 40, "better"); // regrade: 70%
    expect(cert?.score).toBe(70);

    const [enr] = await db.select().from(enrollments).where(eq(enrollments.courseId, course.id));
    expect(enr.status).toBe("completed");
    await expect(submitAssessment(student.id, a1.id, "late edit", null)).rejects.toThrow(/already been graded/);
  });

  it("lets a certified student apply once and ranks them by verified score", async () => {
    await applyToJob(student.id, job.id, "hi");
    await expect(applyToJob(student.id, job.id, null)).rejects.toThrow(/already applied/);
    const [ranked] = await rankedApplicants(job.id);
    expect(ranked).toMatchObject({ studentId: student.id, score: 70 });
  });

  it("rejects closed jobs", async () => {
    await db.update(jobs).set({ isOpen: false }).where(eq(jobs.id, job.id));
    await expect(applyToJob(student.id, job.id, null)).rejects.toThrow(/no longer accepting/);
  });
});

describe("helpers", () => {
  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });

  it("drops lapsed plans to free", () => {
    expect(effectivePlan({ plan: "premium", planExpiresAt: new Date(Date.now() - 1000) })).toBe("free");
    expect(effectivePlan({ plan: "premium", planExpiresAt: null })).toBe("premium");
    expect(effectivePlan(undefined)).toBe("free");
  });
});
