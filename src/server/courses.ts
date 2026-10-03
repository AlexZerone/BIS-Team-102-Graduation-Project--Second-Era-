import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, courses, enrollments } from "@/db/schema";
import { DomainError } from "./errors";

type Status = (typeof courses.$inferSelect)["status"];

/**
 * What an instructor may still change. Lessons and descriptive details stay editable after
 * publishing; anything that decides who passes freezes once students rely on it.
 */
export function courseLocks(status: Status, enrolled: number, certified: number) {
  const reviewing = status === "pending"; // the admin reviews exactly what was submitted
  return {
    reviewing,
    lessons: reviewing,
    details: reviewing,
    assessments: reviewing || enrolled > 0,
    passingScore: reviewing || enrolled > 0,
    title: reviewing || certified > 0, // issued certificates show the course title
  };
}

export type CourseLocks = ReturnType<typeof courseLocks>;

/** The instructor's own course with its current locks; throws if it isn't theirs. */
export async function ownCourseWithLocks(instructorId: number, courseId: number) {
  const [course] = await db.select().from(courses).where(and(eq(courses.id, courseId), eq(courses.instructorId, instructorId)));
  if (!course) throw new DomainError("Course not found.");
  const [[e], [c]] = await Promise.all([
    db.select({ n: count() }).from(enrollments).where(eq(enrollments.courseId, courseId)),
    db.select({ n: count() }).from(certificates).where(eq(certificates.courseId, courseId)),
  ]);
  return { course, enrolled: e.n, certified: c.n, locks: courseLocks(course.status, e.n, c.n) };
}

/** Throws a user-facing error when the given part is locked. */
export function assertUnlocked(locks: CourseLocks, part: "lessons" | "details" | "assessments") {
  if (locks.reviewing) throw new DomainError("This course is under review. You can edit it again once the admin has decided.");
  if (locks[part]) throw new DomainError("Students are already enrolled, so assessments can't change. Create a new course for a different assessment.");
}
