import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export type Role = (typeof users.$inferSelect)["role"];
export type CurrentUser = Pick<typeof users.$inferSelect, "id" | "email" | "name" | "role" | "status" | "rejectionReason">;

/** Where a signed-in user's "home" is: the logo, `/` and sign-in all lead here. */
export const homeFor = (role: Role) => (role === "admin" ? "/admin" : "/dashboard");

const COOKIE = "session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

/** The signed-in user (any status), or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      rejectionReason: users.rejectionReason,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)));
  if (!row || row.expiresAt < new Date() || row.status === "suspended") return null;
  const { expiresAt: _, ...user } = row;
  return user;
});

/** Signed in, any status. Pending/rejected users can still see their dashboard. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const here = (await headers()).get("x-pathname"); // set by src/proxy.ts
    redirect(here && here !== "/" ? `/login?next=${encodeURIComponent(here)}` : "/login");
  }
  return user;
}

/** Signed in, approved, and one of the given roles. Use in every page and action that needs a role. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (user.status !== "active" || !roles.includes(user.role)) redirect("/dashboard");
  return user;
}
