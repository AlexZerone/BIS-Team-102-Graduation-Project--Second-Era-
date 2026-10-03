export type Plan = "free" | "basic" | "standard" | "premium";

// Annual prices from the 2025 business plan (Basic 1,000 / Standard 1,500 / Premium 3,000 EGP).
export const PLANS: Record<Plan, { name: string; priceEgp: number; perks: string[] }> = {
  free: { name: "Free", priceEgp: 0, perks: ["Introductory courses", "Verified certificates", "Apply to jobs"] },
  basic: { name: "Basic", priceEgp: 1000, perks: ["Everything in Free", "Basic-tier courses", "Self-paced materials"] },
  standard: { name: "Standard", priceEgp: 1500, perks: ["Everything in Basic", "Standard-tier courses", "Practical assessments with feedback"] },
  premium: { name: "Premium", priceEgp: 3000, perks: ["Everything in Standard", "All partner courses", "Priority with hiring partners"] },
};

const RANK: Record<Plan, number> = { free: 0, basic: 1, standard: 2, premium: 3 };

export const hasPlan = (have: Plan, need: Plan) => RANK[have] >= RANK[need];

/** A lapsed paid plan falls back to free. */
export const effectivePlan = (p: { plan: Plan; planExpiresAt: Date | null } | undefined, now = new Date()): Plan =>
  !p || (p.planExpiresAt && p.planExpiresAt < now) ? "free" : p.plan;
