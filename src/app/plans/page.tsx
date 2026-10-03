import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, hasPlan, type Plan } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { paymobConfig } from "@/server/paymob";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader, btn } from "@/components/ui";
import { checkoutAction } from "./actions";

export const metadata = { title: "Plans" };

const egp = (n: number) => `${n.toLocaleString("en")} EGP`;

export default async function PlansPage({ searchParams }: PageProps<"/plans">) {
  const user = await getCurrentUser();
  const isStudent = user?.role === "student" && user.status === "active";
  const current = isStudent ? await studentPlan(user.id) : null;
  const canBuy = (key: Plan) => !!current && key !== "free" && !hasPlan(current, key);
  const { plan: picked } = await searchParams;
  const checkout = (Object.keys(PLANS) as Plan[]).find((k) => k === picked && canBuy(k));
  const paymob = !!paymobConfig();

  return (
    <>
      <PageHeader title="Plans" subtitle="Annual plans in EGP. Every plan includes verified certificates and access to partner jobs." />

      {/* One checkout step: the plan is chosen below, details and payment happen here. */}
      {checkout && (
        <Card className="mb-8 max-w-xl border-brand">
          <h2 className="text-lg font-semibold">Upgrade to {PLANS[checkout].name}</h2>
          <p className="mt-1 text-sm text-muted">
            {egp(PLANS[checkout].priceEgp)} for one year, starting today. Upgrading starts a new year at the full price; time left on
            your current plan isn&apos;t credited.
          </p>
          <div className="mt-4">
            <ActionForm action={checkoutAction.bind(null, checkout)} submit={paymob ? `Pay ${egp(PLANS[checkout].priceEgp)}` : "Upgrade (simulated)"}>
              <Field
                label="Mobile number"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01012345678"
                required
                hint="Paymob needs it to process card and wallet payments. Used only for this payment; we don't store it."
              />
            </ActionForm>
          </div>
          <p className="mt-4 text-xs text-muted">
            {paymob
              ? "You'll pay on Paymob's secure page (cards and mobile wallets). Second Era never sees your card details."
              : "Payments are simulated in this environment; no money is charged."}{" "}
            <Link href="/plans" className="text-brand hover:underline">
              Cancel
            </Link>
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as Plan[]).map((key) => {
          const p = PLANS[key];
          return (
            <Card key={key} className={current === key || checkout === key ? "border-brand" : ""}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.name}</h2>
                {current === key && <Badge tone="brand">Current</Badge>}
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {p.priceEgp ? egp(p.priceEgp) : "Free"}
                {p.priceEgp > 0 && <span className="text-sm font-normal text-muted"> / year</span>}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {p.perks.map((perk) => (
                  <li key={perk}>✓ {perk}</li>
                ))}
              </ul>
              <div className="mt-4">
                {!user ? (
                  <Link href="/register" className={btn.secondary}>
                    Sign up
                  </Link>
                ) : canBuy(key) && checkout !== key ? (
                  <Link href={`/plans?plan=${key}`} className={`${btn.primary} w-full`}>
                    Choose {p.name}
                  </Link>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
