import { m } from "@/i18n/translate";

export type Plan = "free" | "basic" | "standard" | "premium";

// Annual prices from the 2025 business plan (Basic 1,000 / Standard 1,500 / Premium 3,000 EGP).
export const PLANS: Record<Plan, { name: string; priceEgp: number; perks: string[] }> = {
  free: { name: m("Free"), priceEgp: 0, perks: [m("Introductory courses"), m("Verified certificates"), m("Apply to jobs")] },
  basic: { name: m("Basic"), priceEgp: 1000, perks: [m("Everything in Free"), m("Basic-tier courses"), m("Self-paced materials")] },
  standard: { name: m("Standard"), priceEgp: 1500, perks: [m("Everything in Basic"), m("Standard-tier courses"), m("Practical assessments with feedback")] },
  premium: { name: m("Premium"), priceEgp: 3000, perks: [m("Everything in Standard"), m("All partner courses"), m("Priority with hiring partners")] },
};

const RANK: Record<Plan, number> = { free: 0, basic: 1, standard: 2, premium: 3 };

export const hasPlan = (have: Plan, need: Plan) => RANK[have] >= RANK[need];

/** A lapsed paid plan falls back to free. */
export const effectivePlan = (p: { plan: Plan; planExpiresAt: Date | null } | undefined, now = new Date()): Plan =>
  !p || (p.planExpiresAt && p.planExpiresAt < now) ? "free" : p.plan;
