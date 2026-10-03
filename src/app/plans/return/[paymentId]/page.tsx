import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { applyPaymobTransaction } from "@/server/payments";
import { fieldsFromRedirect, paymobConfig, verifyTransaction } from "@/server/paymob";
import { Card, PageHeader, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { PaymentPoller } from "./poller";

export const generateMetadata = titled("Payment");

/** Where Paymob sends the student back. The server callback normally settles the payment first. */
export default async function PaymentReturnPage({ params, searchParams }: PageProps<"/plans/return/[paymentId]">) {
  const user = await requireRole("student");
  const id = Number((await params).paymentId);
  if (!Number.isInteger(id)) notFound();
  const load = async () =>
    (await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.studentId, user.id))))[0];
  let payment = await load();
  if (!payment) notFound();

  // Paymob signs the redirect with the same HMAC as the callback, so a verified redirect can
  // settle the payment too (e.g. when the callback is delayed or can't reach a dev machine).
  let declined = false;
  const cfg = paymobConfig();
  if (cfg && payment.status === "pending" && payment.provider === "paymob") {
    const q = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    const fields = fieldsFromRedirect(q);
    if (fields.order === payment.providerRef && verifyTransaction(fields, q.get("hmac"), cfg.hmacSecret)) {
      const outcome = await applyPaymobTransaction(fields);
      declined = outcome === "declined";
      payment = (await load())!;
    }
  }

  const t = await getT();
  const plan = t(PLANS[payment.plan].name);
  if (payment.status === "paid") {
    const [profile] = await db.select({ until: studentProfiles.planExpiresAt }).from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    return (
      <Result title={t("Payment successful")}>
        <p>
          {profile?.until
            ? t("You're now on the {plan} plan until {date}.", { plan, date: t.date(profile.until) })
            : t("You're now on the {plan} plan.", { plan })}{" "}
          {t("Your receipt number is")} <bdi className="font-mono">#{payment.id}</bdi>.
        </p>
        <Link href="/courses" className={btn.primary}>
          {t("Browse courses")}
        </Link>
      </Result>
    );
  }
  if (payment.status === "failed" || declined)
    return (
      <Result title={t("Payment didn't go through")}>
        <p>{t("You haven't been charged for the {plan} plan. You can try again with another card or wallet.", { plan })}</p>
        <Link href="/plans" className={btn.primary}>
          {t("Back to plans")}
        </Link>
      </Result>
    );
  return (
    <Result title={t("Confirming your payment…")}>
      <p>{t("We're waiting for Paymob to confirm your {plan} plan payment. This page updates on its own.", { plan })}</p>
      <PaymentPoller />
      <Link href="/dashboard" className={btn.secondary}>
        {t("Go to dashboard")}
      </Link>
    </Result>
  );
}

function Result({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={title} />
      <Card className="space-y-4">{children}</Card>
    </div>
  );
}
