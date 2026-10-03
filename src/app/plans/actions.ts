"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { fieldError } from "@/lib/validation";
import { startCheckout } from "@/server/payments";
import { attempt, type ActionState } from "@/server/errors";

const schema = z.object({
  plan: z.enum(["basic", "standard", "premium"]),
  // Egyptian mobile number; Paymob requires one and wallets charge it directly.
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+20|0020|0)?1[0125]\d{8}$/.test(v), "Enter an Egyptian mobile number, e.g. 01012345678.")
    .transform((v) => `+20${v.slice(-10)}`),
});

export async function checkoutAction(plan: string, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const parsed = schema.safeParse({ plan, phone: form.get("phone") ?? "" });
  if (!parsed.success) return fieldError(parsed.error);
  let url = "";
  const r = await attempt(async () => {
    url = await startCheckout(user, parsed.data.plan, parsed.data.phone);
  });
  if (r?.error) return r;
  redirect(url);
}
