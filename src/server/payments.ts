import { db } from "@/db";
import { payments, studentProfiles } from "@/db/schema";
import { PLANS, hasPlan, type Plan } from "@/lib/plans";
import { DomainError } from "./errors";
import { studentPlan } from "./learning";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * ponytail: payment is simulated and always succeeds. To go live, create a Paymob/Fawry
 * checkout here, and move the plan activation below into their verified webhook.
 */
export async function upgradePlan(studentId: number, plan: Exclude<Plan, "free">) {
  if (hasPlan(await studentPlan(studentId), plan)) throw new DomainError("You already have this plan or a higher one.");
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({ studentId, plan, amountEgp: PLANS[plan].priceEgp, provider: "simulated", status: "paid" });
    const set = { plan, planExpiresAt: new Date(Date.now() + YEAR_MS) };
    await tx.insert(studentProfiles).values({ userId: studentId, ...set }).onConflictDoUpdate({ target: studentProfiles.userId, set });
  });
}
