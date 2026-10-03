import { afterEach, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { migrate } from "@/db/migrate";
import { passwordResets, sessions, users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { findReset, requestPasswordReset, resetPassword } from "./password-reset";

await migrate();
afterEach(() => vi.restoreAllMocks());

const user = async (email: string) =>
  (await db.insert(users).values({ email, passwordHash: "x", name: "N", role: "student", status: "active" }).returning())[0];

it("resets once, signs out every device, and invalidates other links", async () => {
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const u = await user("r1@t");
  await db.insert(sessions).values({ id: "s1", userId: u.id, expiresAt: new Date(Date.now() + 1e6) });
  const older = (await requestPasswordReset("r1@t"))!;
  const token = (await requestPasswordReset("r1@t"))!;
  expect(log.mock.calls.at(-1)![0]).toContain(`http://localhost:3000/reset-password/${token}`);

  expect(await findReset(token)).toBe(u.id);
  await resetPassword(token, "new-password-1");
  const [after] = await db.select().from(users).where(eq(users.id, u.id));
  expect(await verifyPassword("new-password-1", after.passwordHash)).toBe(true);
  expect(await db.select().from(sessions).where(eq(sessions.userId, u.id))).toEqual([]);

  await expect(resetPassword(token, "again-password")).rejects.toThrow(/expired or was already used/);
  await expect(resetPassword(older, "again-password")).rejects.toThrow(/expired or was already used/);
});

it("stays silent for unknown emails and rejects expired links", async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  expect(await requestPasswordReset("nobody@t")).toBeUndefined();
  await user("r2@t");
  const token = (await requestPasswordReset("r2@t"))!;
  await db.update(passwordResets).set({ expiresAt: new Date(Date.now() - 1000) });
  expect(await findReset(token)).toBeNull();
  await expect(resetPassword(token, "new-password-1")).rejects.toThrow(/expired/);
});
