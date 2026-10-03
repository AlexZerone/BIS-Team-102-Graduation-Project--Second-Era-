import { z } from "zod";

/** Optional http(s) link. Rendered as <a href>, so other schemes (javascript:, data:) are rejected. */
export const optionalLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Enter a full link starting with https://")
  .transform((v) => v || null);

export const id = z.coerce.number().int().positive();

/** First validation message, for showing in a form. */
export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input.";
