import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, studentProfiles } from "@/db/schema";
import { PLANS, hasPlan, type Plan } from "@/lib/plans";
import { DomainError } from "./errors";
import { studentPlan } from "./learning";
import { createIntention, paymobConfig, type TransactionFields } from "./paymob";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type Student = { id: number; name: string; email: string };

/**
 * Starts an upgrade. Records a pending payment, then returns where to send the student:
 * Paymob's checkout when configured, otherwise a simulated payment that succeeds at once.
 */
export async function startCheckout(student: Student, plan: Exclude<Plan, "free">, phone: string) {
  if (hasPlan(await studentPlan(student.id), plan)) throw new DomainError("You already have this plan or a higher one.");
  const cfg = paymobConfig();
  const amountEgp = PLANS[plan].priceEgp;
  const [payment] = await db
    .insert(payments)
    .values({ studentId: student.id, plan, amountEgp, provider: cfg ? "paymob" : "simulated", status: "pending" })
    .returning({ id: payments.id });
  const returnPath = `/plans/return/${payment.id}`;

  if (!cfg) {
    await markPaid(payment.id);
    return returnPath;
  }

  try {
    const { orderId, checkoutUrl } = await createIntention(cfg, {
      amountCents: amountEgp * 100,
      // Must be unique per Paymob account; the id alone could repeat across databases.
      reference: `se-${payment.id}-${Date.now()}`,
      itemName: `Second Era ${PLANS[plan].name} plan (1 year)`,
      customer: { name: student.name, email: student.email, phone },
      notificationUrl: `${cfg.appUrl}/api/payments/paymob`,
      redirectionUrl: `${cfg.appUrl}${returnPath}`,
    });
    await db.update(payments).set({ providerRef: orderId }).where(eq(payments.id, payment.id));
    return checkoutUrl;
  } catch (e) {
    await db.update(payments).set({ status: "failed" }).where(eq(payments.id, payment.id));
    console.error("Paymob checkout failed", e);
    throw new DomainError("The payment service is unavailable right now. Please try again in a few minutes.");
  }
}

/** Marks a pending payment paid and activates its plan. Safe to call more than once. */
export async function markPaid(paymentId: number) {
  return db.transaction(async (tx) => {
    const [p] = await tx
      .update(payments)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")))
      .returning();
    if (!p) return false; // already settled
    const set = { plan: p.plan, planExpiresAt: new Date(Date.now() + YEAR_MS) };
    await tx.insert(studentProfiles).values({ userId: p.studentId, ...set }).onConflictDoUpdate({ target: studentProfiles.userId, set });
    return true;
  });
}

/**
 * Applies a verified Paymob transaction (from the server callback or the signed redirect).
 * The caller must verify the HMAC first. Returns what happened, for logging.
 */
export async function applyPaymobTransaction(t: TransactionFields) {
  const [p] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "paymob"), eq(payments.providerRef, t.order)));
  if (!p) return "unknown-order";
  if (p.status !== "pending") return "already-settled";
  if (t.pending === "true") return "still-pending";

  const succeeded = t.success === "true" && t.is_voided !== "true" && t.is_refunded !== "true";
  if (succeeded && (t.currency !== "EGP" || Number(t.amount_cents) !== p.amountEgp * 100)) {
    console.error(`Paymob amount mismatch for payment ${p.id}: got ${t.amount_cents} ${t.currency}`);
    await db.update(payments).set({ status: "failed" }).where(and(eq(payments.id, p.id), eq(payments.status, "pending")));
    return "amount-mismatch";
  }
  if (succeeded) return (await markPaid(p.id)) ? "paid" : "already-settled";
  // A declined attempt stays pending: the student can retry inside the same Paymob checkout.
  return "declined";
}
