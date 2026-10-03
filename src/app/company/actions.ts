"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, companies, courses, jobRequirements, jobs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { fieldError, id } from "@/lib/validation";
import { DomainError, attempt, type ActionState } from "@/server/errors";

async function myCompany(userId: number) {
  const [c] = await db.select().from(companies).where(eq(companies.userId, userId));
  return c;
}

/** The job, if it belongs to the signed-in company. */
async function myJob(userId: number, jobId: number) {
  const company = await myCompany(userId);
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.companyId, company.id)));
  if (!job) throw new DomainError("Job not found.");
  return job;
}

const jobSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(120),
  description: z.string().trim().min(20, "Describe the role in a few sentences.").max(10000),
  type: z.enum(["internship", "full_time", "part_time"]),
  location: z.string().trim().max(120).transform((v) => v || null),
  deadline: z
    .string()
    .transform((v) => (v ? new Date(`${v}T23:59:59`) : null))
    .refine((d) => d === null || (!isNaN(d.getTime()) && d > new Date()), "Deadline must be a future date."),
  requiredCourses: z.array(id).max(10, "Require at most 10 certificates."),
});

export async function createJob(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("company");
  const parsed = jobSchema.safeParse({ ...Object.fromEntries(form), requiredCourses: form.getAll("requiredCourses") });
  if (!parsed.success) return fieldError(parsed.error);
  const { requiredCourses, ...data } = parsed.data;
  const company = await myCompany(user.id);
  let jobId = 0;
  const r = await attempt(async () => {
    if (requiredCourses.length) {
      const found = await db.select({ id: courses.id }).from(courses).where(and(inArray(courses.id, requiredCourses), eq(courses.status, "published")));
      if (found.length !== new Set(requiredCourses).size) throw new DomainError("Only published courses can be required.");
    }
    jobId = await db.transaction(async (tx) => {
      const [job] = await tx.insert(jobs).values({ ...data, companyId: company.id }).returning({ id: jobs.id });
      if (requiredCourses.length)
        await tx.insert(jobRequirements).values([...new Set(requiredCourses)].map((courseId) => ({ jobId: job.id, courseId })));
      return job.id;
    });
  });
  if (r?.error) return r;
  redirect(`/company/jobs/${jobId}`);
}

export async function toggleJob(jobId: number): Promise<ActionState> {
  const user = await requireRole("company");
  return attempt(async () => {
    const job = await myJob(user.id, jobId);
    await db.update(jobs).set({ isOpen: !job.isOpen }).where(eq(jobs.id, jobId));
    revalidatePath(`/company/jobs/${jobId}`);
  });
}

const status = z.enum(["submitted", "shortlisted", "rejected", "hired"]);

export async function setApplicationStatus(jobId: number, applicationId: number, _: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("company");
  const parsed = status.safeParse(form.get("status"));
  if (!parsed.success) return { error: "Choose a status." };
  return attempt(async () => {
    await myJob(user.id, jobId);
    await db.update(applications).set({ status: parsed.data }).where(and(eq(applications.id, applicationId), eq(applications.jobId, jobId)));
    revalidatePath(`/company/jobs/${jobId}`);
    return "Updated.";
  });
}
