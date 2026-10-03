import { m } from "@/i18n/translate";
import { z } from "zod";

/** Optional http(s) link. Rendered as <a href>, so other schemes (javascript:, data:) are rejected. */
export const optionalLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), m("Enter a full link starting with https://"))
  .transform((v) => v || null);

export const id = z.coerce.number().int().positive();

/** The first validation problem as form state: the message, plus which field to highlight. */
export const fieldError = (e: z.ZodError) => {
  const issue = e.issues[0];
  return { error: issue?.message ?? "Invalid input.", field: issue?.path[0]?.toString() };
};

/** Only same-site paths, so ?next= can't send users to another website after sign-in. */
export const safeNext = (next: unknown) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
