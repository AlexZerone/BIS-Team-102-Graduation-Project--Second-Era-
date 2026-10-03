import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { DomainError } from "./errors";
import { appUrl, sendMail } from "./mail";

const TTL_MS = 30 * 60 * 1000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Emails a single-use reset link if the account exists. Says nothing either way, so the
 * form can't be used to discover which emails are registered.
 */
export async function requestPasswordReset(email: string) {
  const [user] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  if (!user || user.status === "suspended") return;
  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({ id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TTL_MS) });
  // Built from APP_URL, never the request's Host header, so a forged host can't capture the token.
  await sendMail({
    to: email,
    subject: "Reset your Second Era password",
    text: `Someone asked to reset the password for this account.\n\nReset it here (valid for 30 minutes, works once):\n${appUrl()}/reset-password/${token}\n\nIf it wasn't you, ignore this email; your password hasn't changed.`,
  });
  return token; // for tests; callers must not show it
}

/** A valid, unused, unexpired reset's user id, or null. */
export async function findReset(token: string) {
  const [r] = await db
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(and(eq(passwordResets.id, sha256(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())));
  return r?.userId ?? null;
}

/** Sets the new password, burns every outstanding reset link, and signs out all devices. */
export async function resetPassword(token: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  return db.transaction(async (tx) => {
    const [r] = await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.id, sha256(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
      .returning({ userId: passwordResets.userId });
    if (!r) throw new DomainError("This reset link has expired or was already used. Request a new one.");
    await tx.update(users).set({ passwordHash }).where(eq(users.id, r.userId));
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(and(eq(passwordResets.userId, r.userId), isNull(passwordResets.usedAt)));
    await tx.delete(sessions).where(eq(sessions.userId, r.userId));
    return r.userId;
  });
}
