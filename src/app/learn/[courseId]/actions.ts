"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { firstError, optionalLink } from "@/lib/validation";
import { submitAssessment } from "@/server/learning";
import { attempt, type ActionState } from "@/server/errors";

const schema = z.object({
  answer: z.string().trim().min(1, "Write an answer before submitting.").max(20000),
  link: optionalLink,
});

export async function submitAction(assessmentId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const parsed = schema.safeParse({ answer: form.get("answer") ?? "", link: form.get("link") ?? "" });
  if (!parsed.success) return { error: firstError(parsed.error) };
  return attempt(async () => {
    await submitAssessment(user.id, assessmentId, parsed.data.answer, parsed.data.link);
    revalidatePath(`/learn/[courseId]`, "page");
    return "Submitted.";
  });
}
