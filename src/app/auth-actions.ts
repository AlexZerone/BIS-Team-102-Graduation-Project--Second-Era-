"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, studentProfiles, users } from "@/db/schema";
import { endSession, homeFor, startSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { fieldError, safeNext } from "@/lib/validation";
import type { ActionState } from "@/server/errors";

const email = z.string().trim().toLowerCase().email("Enter a valid email.");
// Same cost as a real check, so response time doesn't reveal which emails exist.
const DUMMY_HASH = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ email, password: z.string().min(1) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password." };
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Email or password is incorrect." };
  if (user.status === "suspended") return { error: "This account is suspended. Contact support." };
  await startSession(user.id);
  redirect(safeNext(form.get("next")) ?? homeFor(user.role));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email,
    password: z.string().min(8, "Password must be at least 8 characters.").max(200),
    role: z.enum(["student", "instructor", "company"]),
    companyName: z.string().trim().max(120).optional(),
  })
  .refine((d) => d.role !== "company" || (d.companyName?.length ?? 0) >= 2, {
    message: "Enter your company's name.",
    path: ["companyName"],
  });

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldError(parsed.error);
  const d = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email));
  if (existing) return { error: "An account with this email already exists.", field: "email" };

  const passwordHash = await hashPassword(d.password);
  const userId = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({ name: d.name, email: d.email, passwordHash, role: d.role, status: d.role === "student" ? "active" : "pending" })
      .returning({ id: users.id });
    if (d.role === "student") await tx.insert(studentProfiles).values({ userId: u.id });
    if (d.role === "company") await tx.insert(companies).values({ userId: u.id, name: d.companyName! });
    return u.id;
  });
  await startSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}
