"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { upgradePlan } from "@/server/payments";
import { attempt, type ActionState } from "@/server/errors";

export async function checkoutAction(plan: string): Promise<ActionState> {
  const user = await requireRole("student");
  const parsed = z.enum(["basic", "standard", "premium"]).safeParse(plan);
  if (!parsed.success) return { error: "Unknown plan." };
  return attempt(async () => {
    await upgradePlan(user.id, parsed.data);
    revalidatePath("/", "layout");
    return "Plan upgraded.";
  });
}
