"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, courses, sessions, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { audit } from "@/server/audit";
import type { ActionState } from "@/server/errors";

const reasonOf = (form: FormData) => String(form.get("reason") ?? "").trim().slice(0, 1000);

export async function reviewUser(userId: number, decision: "approve" | "reject", _: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireRole("admin");
  const reason = reasonOf(form);
  if (decision === "reject" && !reason) return { error: "Give a reason so the applicant knows what to fix." };
  const updated = await db
    .update(users)
    .set(decision === "approve" ? { status: "active", rejectionReason: null } : { status: "rejected", rejectionReason: reason })
    .where(and(eq(users.id, userId), eq(users.status, "pending"), inArray(users.role, ["instructor", "company"])))
    .returning({ id: users.id });
  if (!updated.length) return { error: "This application was already reviewed." };
  await audit(admin.id, `user.${decision}`, `user:${userId}`, reason ? { reason } : undefined);
  revalidatePath("/admin");
  return { ok: decision === "approve" ? "Approved." : "Rejected." };
}

export async function reviewCourse(courseId: number, decision: "approve" | "reject", _: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireRole("admin");
  const reason = reasonOf(form);
  if (decision === "reject" && !reason) return { error: "Tell the instructor what to change." };
  const updated = await db
    .update(courses)
    .set(decision === "approve" ? { status: "published", rejectionReason: null } : { status: "rejected", rejectionReason: reason })
    .where(and(eq(courses.id, courseId), eq(courses.status, "pending")))
    .returning({ id: courses.id });
  if (!updated.length) return { error: "This course was already reviewed." };
  await audit(admin.id, `course.${decision}`, `course:${courseId}`, reason ? { reason } : undefined);
  revalidatePath("/admin");
  return { ok: decision === "approve" ? "Published." : "Sent back to the instructor." };
}

export async function setSuspended(userId: number, suspend: boolean): Promise<ActionState> {
  const admin = await requireRole("admin");
  const updated = await db
    .update(users)
    .set({ status: suspend ? "suspended" : "active" })
    .where(and(eq(users.id, userId), ne(users.role, "admin"), eq(users.status, suspend ? "active" : "suspended")))
    .returning({ id: users.id });
  if (!updated.length) return { error: "Nothing to change." };
  if (suspend) await db.delete(sessions).where(eq(sessions.userId, userId));
  await audit(admin.id, suspend ? "user.suspend" : "user.reactivate", `user:${userId}`);
  revalidatePath("/admin/users");
  return {};
}

export async function resolveMessage(messageId: number): Promise<ActionState> {
  const admin = await requireRole("admin");
  await db.update(contactMessages).set({ status: "resolved" }).where(eq(contactMessages.id, messageId));
  await audit(admin.id, "message.resolve", `message:${messageId}`);
  revalidatePath("/admin/messages");
  return {};
}
