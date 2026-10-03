import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, hasPlan, type Plan } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, PageHeader, btn } from "@/components/ui";
import { checkoutAction } from "./actions";

export const metadata = { title: "Plans" };

export default async function PlansPage() {
  const user = await getCurrentUser();
  const isStudent = user?.role === "student" && user.status === "active";
  const current = isStudent ? await studentPlan(user.id) : null;

  return (
    <>
      <PageHeader title="Plans" subtitle="Annual plans in EGP. Every plan includes verified certificates and access to partner jobs." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as Plan[]).map((key) => {
          const p = PLANS[key];
          return (
            <Card key={key} className={current === key ? "border-brand" : ""}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{p.name}</h2>
                {current === key && <Badge tone="brand">Current</Badge>}
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {p.priceEgp ? `${p.priceEgp.toLocaleString("en")} EGP` : "Free"}
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
                ) : isStudent && current && key !== "free" && !hasPlan(current, key) ? (
                  <ActionForm action={checkoutAction.bind(null, key)} submit={`Upgrade to ${p.name}`} />
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Payments are simulated in this version; no card details are collected.
      </p>
    </>
  );
}
