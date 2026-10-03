import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, certificates, companies, courses, jobRequirements, jobs, studentProfiles, users } from "@/db/schema";
import { DomainError } from "./errors";

/** Required courses the student holds no certificate for. Empty means eligible. */
export async function missingRequirements(studentId: number, jobId: number) {
  return db
    .select({ id: courses.id, title: courses.title })
    .from(jobRequirements)
    .innerJoin(courses, eq(courses.id, jobRequirements.courseId))
    .leftJoin(certificates, and(eq(certificates.courseId, courses.id), eq(certificates.studentId, studentId)))
    .where(and(eq(jobRequirements.jobId, jobId), isNull(certificates.id)));
}

export async function applyToJob(studentId: number, jobId: number, coverNote: string | null) {
  const [row] = await db
    .select({ job: jobs, companyStatus: users.status })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .innerJoin(users, eq(users.id, companies.userId))
    .where(eq(jobs.id, jobId));
  const job = row?.job;
  if (!job || !job.isOpen || (job.deadline && job.deadline < new Date()) || row.companyStatus !== "active")
    throw new DomainError("This job is no longer accepting applications.");
  const missing = await missingRequirements(studentId, jobId);
  if (missing.length)
    throw new DomainError("Earn these certificates first: {list}.", { params: { list: missing.map((c) => c.title).join(", ") } });
  const created = await db
    .insert(applications)
    .values({ jobId, studentId, coverNote })
    .onConflictDoNothing()
    .returning({ id: applications.id });
  if (!created.length) throw new DomainError("You have already applied to this job.");
}

/**
 * Applicants ranked by their verified score: the average certificate score over the
 * job's required courses, or over all their certificates when the job requires none.
 */
export async function rankedApplicants(jobId: number) {
  const apps = await db
    .select({
      id: applications.id,
      status: applications.status,
      coverNote: applications.coverNote,
      createdAt: applications.createdAt,
      studentId: users.id,
      name: users.name,
      email: users.email,
      university: studentProfiles.university,
      major: studentProfiles.major,
      graduationYear: studentProfiles.graduationYear,
      hasResume: studentProfiles.resumePath,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.studentId))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.createdAt));
  if (!apps.length) return [];

  const required = new Set(
    (await db.select({ id: jobRequirements.courseId }).from(jobRequirements).where(eq(jobRequirements.jobId, jobId))).map((r) => r.id),
  );
  const certs = await db
    .select({ studentId: certificates.studentId, courseId: certificates.courseId, score: certificates.score, code: certificates.code, title: courses.title })
    .from(certificates)
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .where(inArray(certificates.studentId, apps.map((a) => a.studentId)));

  return apps
    .map((a) => {
      const mine = certs.filter((c) => c.studentId === a.studentId);
      const counted = required.size ? mine.filter((c) => required.has(c.courseId)) : mine;
      const score = counted.length ? Math.round(counted.reduce((s, c) => s + c.score, 0) / counted.length) : null;
      return { ...a, hasResume: !!a.hasResume, certificates: mine, score };
    })
    .sort((x, y) => (y.score ?? -1) - (x.score ?? -1));
}
