import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { assessments, certificates, courses, enrollments, studentProfiles, submissions } from "@/db/schema";
import { PLANS, effectivePlan, hasPlan } from "@/lib/plans";
import { DomainError } from "./errors";

export async function studentPlan(studentId: number) {
  const [p] = await db
    .select({ plan: studentProfiles.plan, planExpiresAt: studentProfiles.planExpiresAt })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, studentId));
  return effectivePlan(p);
}

export async function enroll(studentId: number, courseId: number) {
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
  if (!course || course.status !== "published") throw new DomainError("This course is not available.");
  if (!hasPlan(await studentPlan(studentId), course.requiredPlan))
    throw new DomainError("This course needs the {plan} plan or higher.", { params: { plan: { key: PLANS[course.requiredPlan].name } } });
  await db.insert(enrollments).values({ studentId, courseId }).onConflictDoNothing();
}

export async function submitAssessment(studentId: number, assessmentId: number, answer: string, link: string | null) {
  const [enrolled] = await db
    .select({ id: enrollments.id })
    .from(assessments)
    .innerJoin(enrollments, and(eq(enrollments.courseId, assessments.courseId), eq(enrollments.studentId, studentId)))
    .where(eq(assessments.id, assessmentId));
  if (!enrolled) throw new DomainError("Enroll in the course before submitting.");

  const saved = await db
    .insert(submissions)
    .values({ assessmentId, studentId, answer, link })
    .onConflictDoUpdate({
      target: [submissions.assessmentId, submissions.studentId],
      set: { answer, link, submittedAt: new Date() },
      setWhere: isNull(submissions.gradedAt), // graded work is final
    })
    .returning({ id: submissions.id });
  if (!saved.length) throw new DomainError("This assessment has already been graded.");
}

export async function gradeSubmission(graderId: number, submissionId: number, score: number, feedback: string | null) {
  const [row] = await db
    .select({ sub: submissions, maxScore: assessments.maxScore, courseId: courses.id, instructorId: courses.instructorId })
    .from(submissions)
    .innerJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .innerJoin(courses, eq(courses.id, assessments.courseId))
    .where(eq(submissions.id, submissionId));
  if (!row || row.instructorId !== graderId) throw new DomainError("Submission not found.");
  if (!Number.isInteger(score) || score < 0 || score > row.maxScore)
    throw new DomainError("Score must be a whole number between 0 and {max}.", { params: { max: row.maxScore }, field: "score" });

  await db
    .update(submissions)
    .set({ score, feedback, gradedAt: new Date(), gradedBy: graderId })
    .where(eq(submissions.id, submissionId));
  return issueCertificateIfEarned(row.sub.studentId, row.courseId);
}

/**
 * The core rule of the platform: a certificate is issued only when every assessment
 * in the course is graded and the weighted score reaches the course's passing score.
 * Certificates are immutable once issued.
 */
export async function issueCertificateIfEarned(studentId: number, courseId: number) {
  const [course] = await db.select({ passingScore: courses.passingScore }).from(courses).where(eq(courses.id, courseId));
  const rows = await db
    .select({ max: assessments.maxScore, score: submissions.score })
    .from(assessments)
    .leftJoin(submissions, and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, studentId)))
    .where(eq(assessments.courseId, courseId));

  if (!course || !rows.length || rows.some((r) => r.score === null)) return null;
  const percent = Math.round((rows.reduce((s, r) => s + r.score!, 0) / rows.reduce((s, r) => s + r.max, 0)) * 100);
  if (percent < course.passingScore) return null;

  const [cert] = await db
    .insert(certificates)
    .values({ studentId, courseId, score: percent, code: randomBytes(6).toString("hex").toUpperCase() })
    .onConflictDoNothing()
    .returning();
  await db
    .update(enrollments)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId), eq(enrollments.status, "active")));
  return cert ?? null;
}
