import { expect, it } from "vitest";
import { db } from "@/db";
import { migrate } from "@/db/migrate";
import { eq } from "drizzle-orm";
import { applications, assessments, companies, courses, jobs, submissions, users } from "@/db/schema";
import { enroll, gradeSubmission, submitAssessment } from "./learning";
import { activeCourseProgress, pickContinue, recentUpdates } from "./progress";

await migrate();

it("points the student at unsubmitted work first and lists what happened recently", async () => {
  const mk = (email: string, role: "student" | "instructor" | "company") =>
    db.insert(users).values({ email, passwordHash: "x", name: email, role, status: "active" }).returning().then((r) => r[0]);
  const [teacher, student, co] = [await mk("t@x", "instructor"), await mk("s@x", "student"), await mk("c@x", "company")];
  const course = async (title: string, tasks: string[]) => {
    const [c] = await db.insert(courses).values({ instructorId: teacher.id, title, summary: "s", description: "d", status: "published", passingScore: 50 }).returning();
    const a = await db.insert(assessments).values(tasks.map((t) => ({ courseId: c.id, title: t, instructions: "i", maxScore: 10 }))).returning();
    return { c, a };
  };
  const sql = await course("SQL", ["Query", "Report"]);
  const excel = await course("Excel", ["Clean"]);

  expect(pickContinue(await activeCourseProgress(student.id))).toBeNull();

  await enroll(student.id, sql.c.id);
  await enroll(student.id, excel.c.id); // most recent enrollment
  await submitAssessment(student.id, excel.a[0].id, "done", null);
  await submitAssessment(student.id, sql.a[0].id, "done", null);

  // Excel is newer but fully submitted; SQL still has "Report" to submit, so it wins.
  expect(pickContinue(await activeCourseProgress(student.id))).toMatchObject({ title: "SQL", nextTask: "Report", total: 2, submitted: 1 });

  const subId = (await db.select().from(submissions).where(eq(submissions.assessmentId, excel.a[0].id)))[0].id;
  await gradeSubmission(teacher.id, subId, 9, "Nice"); // passes Excel -> certificate, course leaves "active"
  const [company] = await db.insert(companies).values({ userId: co.id, name: "Acme" }).returning();
  const [job] = await db.insert(jobs).values({ companyId: company.id, title: "Intern", description: "d" }).returning();
  await db.insert(applications).values({ jobId: job.id, studentId: student.id, status: "shortlisted", statusChangedAt: new Date(Date.now() + 1000) });

  expect((await activeCourseProgress(student.id)).map((p) => p.title)).toEqual(["SQL"]);
  const updates = await recentUpdates(student.id);
  expect(updates.map((u) => u.kind)).toEqual(["application", expect.any(String), expect.any(String)]);
  expect(updates).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "graded", task: "Clean", score: 9, feedback: "Nice" }),
      expect.objectContaining({ kind: "certified", course: "Excel", score: 90 }),
    ]),
  );
});
