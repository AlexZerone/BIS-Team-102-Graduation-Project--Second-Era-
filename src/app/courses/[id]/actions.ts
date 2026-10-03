"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { enroll } from "@/server/learning";
import { attempt, type ActionState } from "@/server/errors";

export async function enrollAction(courseId: number): Promise<ActionState> {
  const user = await requireRole("student");
  const result = await attempt(() => enroll(user.id, courseId));
  if (result?.error) return result;
  redirect(`/learn/${courseId}`);
}
