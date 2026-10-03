"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assessments, companies, courses, lessons, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { fieldError, id, optionalLink } from "@/lib/validation";
import { gradeSubmission } from "@/server/learning";
import { DomainError, attempt, type ActionState } from "@/server/errors";

const courseSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(120),
  summary: z.string().trim().min(10, "Add a one-line summary.").max(200),
  description: z.string().trim().min(20, "Describe the course in a few sentences.").max(10000),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  requiredPlan: z.enum(["free", "basic", "standard", "premium"]),
  passingScore: z.coerce.number().int().min(1).max(100),
  partnerCompanyId: z.union([z.literal(""), id]).transform((v) => (v === "" ? null : v)),
});

async function checkPartner(partnerId: number | null) {
  if (partnerId === null) return;
  const [ok] = await db
    .select({ id: companies.id })
    .from(companies)
    .innerJoin(users, eq(users.id, companies.userId))
    .where(and(eq(companies.id, partnerId), eq(users.status, "active")));
  if (!ok) throw new DomainError("Choose an approved partner company.");
}

/** The instructor's own course, and only while it can still change (draft or rejected). */
async function editableCourse(instructorId: number, courseId: number) {
  const [c] = await db.select().from(courses).where(and(eq(courses.id, courseId), eq(courses.instructorId, instructorId)));
  if (!c) throw new DomainError("Course not found.");
  if (c.status === "pending" || c.status === "published")
    throw new DomainError("Courses under review or published can't be edited, so issued certificates stay meaningful.");
  return c;
}

export async function createCourse(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor");
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldError(parsed.error);
  let courseId = 0;
  const r = await attempt(async () => {
    await checkPartner(parsed.data.partnerCompanyId);
    [{ id: courseId }] = await db.insert(courses).values({ ...parsed.data, instructorId: user.id }).returning({ id: courses.id });
  });
  if (r?.error) return r;
  redirect(`/teach/${courseId}`);
}

export async function updateCourse(courseId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor");
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldError(parsed.error);
  return attempt(async () => {
    await editableCourse(user.id, courseId);
    await checkPartner(parsed.data.partnerCompanyId);
    await db.update(courses).set(parsed.data).where(eq(courses.id, courseId));
    revalidatePath(`/teach/${courseId}`);
    return "Saved.";
  });
}

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Give the lesson a title.").max(120),
  body: z.string().trim().min(1, "Add the lesson content.").max(50000),
  videoUrl: optionalLink,
});

export async function addLesson(courseId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor");
  const parsed = lessonSchema.safeParse({ title: form.get("title") ?? "", body: form.get("body") ?? "", videoUrl: form.get("videoUrl") ?? "" });
  if (!parsed.success) return fieldError(parsed.error);
  return attempt(async () => {
    await editableCourse(user.id, courseId);
    const [{ last }] = await db.select({ last: max(lessons.position) }).from(lessons).where(eq(lessons.courseId, courseId));
    await db.insert(lessons).values({ ...parsed.data, courseId, position: (last ?? 0) + 1 });
    revalidatePath(`/teach/${courseId}`);
    return "Lesson added.";
  });
}

const assessmentSchema = z.object({
  title: z.string().trim().min(2, "Give the assessment a title.").max(120),
  instructions: z.string().trim().min(10, "Explain what the student must deliver.").max(10000),
  maxScore: z.coerce.number().int().min(1).max(1000),
});

export async function addAssessment(courseId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor");
  const parsed = assessmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldError(parsed.error);
  return attempt(async () => {
    await editableCourse(user.id, courseId);
    await db.insert(assessments).values({ ...parsed.data, courseId });
    revalidatePath(`/teach/${courseId}`);
    return "Assessment added.";
  });
}

export async function removeItem(courseId: number, kind: "lesson" | "assessment", itemId: number): Promise<ActionState> {
  const user = await requireRole("instructor");
  return attempt(async () => {
    await editableCourse(user.id, courseId);
    const table = kind === "lesson" ? lessons : assessments;
    await db.delete(table).where(and(eq(table.id, itemId), eq(table.courseId, courseId)));
    revalidatePath(`/teach/${courseId}`);
  });
}

export async function submitForReview(courseId: number): Promise<ActionState> {
  const user = await requireRole("instructor");
  return attempt(async () => {
    await editableCourse(user.id, courseId);
    const [[l], [a]] = await Promise.all([
      db.select({ n: count() }).from(lessons).where(eq(lessons.courseId, courseId)),
      db.select({ n: count() }).from(assessments).where(eq(assessments.courseId, courseId)),
    ]);
    if (!l.n || !a.n) throw new DomainError("Add at least one lesson and one assessment first.");
    await db.update(courses).set({ status: "pending", rejectionReason: null }).where(eq(courses.id, courseId));
    revalidatePath(`/teach/${courseId}`);
    return "Submitted for review.";
  });
}

export async function gradeAction(courseId: number, submissionId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor");
  const parsed = z
    .object({ score: z.coerce.number({ message: "Enter a score." }).int("Use a whole number."), feedback: z.string().trim().max(5000) })
    .safeParse({ score: form.get("score"), feedback: form.get("feedback") ?? "" });
  if (!parsed.success) return fieldError(parsed.error);
  return attempt(async () => {
    const cert = await gradeSubmission(user.id, submissionId, parsed.data.score, parsed.data.feedback || null);
    revalidatePath(`/teach/${courseId}/grade`);
    return cert ? `Graded. The student passed with ${cert.score}% and received a certificate.` : "Graded.";
  });
}
