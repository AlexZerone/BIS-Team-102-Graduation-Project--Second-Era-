"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, sessions, studentProfiles, users } from "@/db/schema";
import { requireRole, startSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { firstError, optionalLink } from "@/lib/validation";
import { attempt, type ActionState } from "@/server/errors";
import { deleteStored, saveResume } from "@/server/storage";

const text = (maxLen: number) => z.string().trim().max(maxLen).transform((v) => v || null);
const name = z.string().trim().min(2, "Enter your name.").max(100);

const studentSchema = z.object({
  name,
  university: text(120),
  major: text(120),
  graduationYear: z.union([z.literal(""), z.coerce.number().int().min(1990).max(2100)]).transform((v) => (v === "" ? null : v)),
  bio: text(2000),
});

export async function saveStudentProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const parsed = studentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { name, ...profile } = parsed.data;
  return attempt(async () => {
    const resume = form.get("resume");
    const [current] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    let resumePath = current?.resumePath ?? null;
    if (resume instanceof File && resume.size > 0) resumePath = await saveResume(user.id, resume);

    await db.update(users).set({ name }).where(eq(users.id, user.id));
    await db
      .insert(studentProfiles)
      .values({ userId: user.id, ...profile, resumePath })
      .onConflictDoUpdate({ target: studentProfiles.userId, set: { ...profile, resumePath } });
    if (current?.resumePath && current.resumePath !== resumePath) await deleteStored(current.resumePath);
    revalidatePath("/", "layout");
    return "Profile saved.";
  });
}

const companySchema = z.object({
  name,
  companyName: z.string().trim().min(2, "Enter the company name.").max(120),
  industry: text(80),
  website: optionalLink,
  description: text(4000),
});

export async function saveCompanyProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("company");
  const parsed = companySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { name, companyName, ...rest } = parsed.data;
  await db.update(users).set({ name }).where(eq(users.id, user.id));
  await db.update(companies).set({ name: companyName, ...rest }).where(eq(companies.userId, user.id));
  revalidatePath("/", "layout");
  return { ok: "Profile saved." };
}

export async function saveName(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("instructor", "admin");
  const parsed = name.safeParse(form.get("name"));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.update(users).set({ name: parsed.data }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("student", "instructor", "company", "admin");
  const parsed = z
    .object({ current: z.string().min(1, "Enter your current password."), next: z.string().min(8, "New password must be at least 8 characters.").max(200) })
    .safeParse({ current: form.get("current"), next: form.get("next") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!(await verifyPassword(parsed.data.current, row.hash))) return { error: "Current password is incorrect." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(users.id, user.id));
  // Sign out every other device, then issue a fresh session here.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await startSession(user.id);
  return { ok: "Password changed. Other devices were signed out." };
}
