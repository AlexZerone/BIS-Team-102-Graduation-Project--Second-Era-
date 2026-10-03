import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, assessments, certificates, companies, courses, enrollments, jobs, submissions } from "@/db/schema";

export type CourseProgress = {
  courseId: number;
  title: string;
  total: number;
  submitted: number;
  graded: number;
  /** First assessment not yet submitted, if any. */
  nextTask: string | null;
};

/** Progress through each active (not yet certified) course, most recently enrolled first. */
export async function activeCourseProgress(studentId: number): Promise<CourseProgress[]> {
  const active = await db
    .select({ courseId: courses.id, title: courses.title })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, "active")))
    .orderBy(desc(enrollments.enrolledAt));
  if (!active.length) return [];

  const rows = await db
    .select({ courseId: assessments.courseId, title: assessments.title, submittedAt: submissions.submittedAt, gradedAt: submissions.gradedAt })
    .from(assessments)
    .leftJoin(submissions, and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, studentId)))
    .where(inArray(assessments.courseId, active.map((c) => c.courseId)))
    .orderBy(assessments.id);

  return active.map((c) => {
    const tasks = rows.filter((r) => r.courseId === c.courseId);
    return {
      ...c,
      total: tasks.length,
      submitted: tasks.filter((t) => t.submittedAt).length,
      graded: tasks.filter((t) => t.gradedAt).length,
      nextTask: tasks.find((t) => !t.submittedAt)?.title ?? null,
    };
  });
}

/** The single most useful thing to do next: unsubmitted work first, then courses waiting on grades. */
export const pickContinue = (progress: CourseProgress[]) =>
  progress.find((p) => p.nextTask) ?? progress.find((p) => p.total > 0 && p.graded < p.total) ?? null;

export type Update =
  | { kind: "graded"; at: Date; courseId: number; course: string; task: string; score: number; max: number; feedback: string | null }
  | { kind: "certified"; at: Date; code: string; course: string; score: number }
  | { kind: "application"; at: Date; jobId: number; job: string; company: string; status: "shortlisted" | "rejected" | "hired" | "submitted" };

/** Recent things that happened to the student, newest first. */
export async function recentUpdates(studentId: number, limit = 6): Promise<Update[]> {
  const [graded, certs, apps] = await Promise.all([
    db
      .select({ at: submissions.gradedAt, courseId: courses.id, course: courses.title, task: assessments.title, score: submissions.score, max: assessments.maxScore, feedback: submissions.feedback })
      .from(submissions)
      .innerJoin(assessments, eq(assessments.id, submissions.assessmentId))
      .innerJoin(courses, eq(courses.id, assessments.courseId))
      .where(and(eq(submissions.studentId, studentId), isNotNull(submissions.gradedAt)))
      .orderBy(desc(submissions.gradedAt))
      .limit(limit),
    db
      .select({ at: certificates.issuedAt, code: certificates.code, course: courses.title, score: certificates.score })
      .from(certificates)
      .innerJoin(courses, eq(courses.id, certificates.courseId))
      .where(eq(certificates.studentId, studentId))
      .orderBy(desc(certificates.issuedAt))
      .limit(limit),
    db
      .select({ at: applications.statusChangedAt, jobId: jobs.id, job: jobs.title, company: companies.name, status: applications.status })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .where(and(eq(applications.studentId, studentId), isNotNull(applications.statusChangedAt)))
      .orderBy(desc(applications.statusChangedAt))
      .limit(limit),
  ]);
  const all: Update[] = [
    ...graded.map((g) => ({ kind: "graded" as const, ...g, at: g.at!, score: g.score! })),
    ...certs.map((c) => ({ kind: "certified" as const, ...c })),
    ...apps.map((a) => ({ kind: "application" as const, ...a, at: a.at! })),
  ];
  return all.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
