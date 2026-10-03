import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses, jobRequirements, jobs, users } from "@/db/schema";

/** Jobs students can see: open, before deadline, from an approved company. */
export const visibleJob = () =>
  and(eq(jobs.isOpen, true), or(isNull(jobs.deadline), gt(jobs.deadline, new Date())), eq(users.status, "active"));

export async function listJobs(where = visibleJob()) {
  const rows = await db
    .select({ job: jobs, company: companies.name })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .innerJoin(users, eq(users.id, companies.userId))
    .where(where)
    .orderBy(desc(jobs.createdAt));
  const reqs = rows.length
    ? await db
        .select({ jobId: jobRequirements.jobId, id: courses.id, title: courses.title })
        .from(jobRequirements)
        .innerJoin(courses, eq(courses.id, jobRequirements.courseId))
        .where(inArray(jobRequirements.jobId, rows.map((r) => r.job.id)))
    : [];
  return rows.map((r) => ({ ...r, requires: reqs.filter((q) => q.jobId === r.job.id) }));
}

export const JOB_TYPES = { internship: "Internship", full_time: "Full-time", part_time: "Part-time" } as const;
