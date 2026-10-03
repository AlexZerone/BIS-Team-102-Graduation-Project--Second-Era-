"use server";

import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { firstError } from "@/lib/validation";
import type { ActionState } from "@/server/errors";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  message: z.string().trim().min(10, "Write a little more so we can help.").max(5000),
});

// ponytail: no rate limit or CAPTCHA; add one if the inbox gets spammed.
export async function sendMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.insert(contactMessages).values(parsed.data);
  return { ok: "Thanks! We received your message." };
}
