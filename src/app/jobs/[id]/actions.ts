"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { applyToJob } from "@/server/hiring";
import { attempt, type ActionState } from "@/server/errors";

export async function applyAction(jobId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const note = String(form.get("coverNote") ?? "").trim().slice(0, 2000) || null;
  return attempt(async () => {
    await applyToJob(user.id, jobId, note);
    revalidatePath(`/jobs/${jobId}`);
    return "Application sent.";
  });
}
