import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, certificates, companies, courses, enrollments, jobs } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { listJobs } from "@/server/queries";
import { Badge, Card, Empty, fmtDate } from "@/components/ui";

export async function StudentDashboard({ userId }: { userId: number }) {
  const [plan, myCourses, certs, apps, openJobs] = await Promise.all([
    studentPlan(userId),
    db
      .select({ id: courses.id, title: courses.title, status: enrollments.status })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.studentId, userId))
      .orderBy(desc(enrollments.enrolledAt)),
    db
      .select({ code: certificates.code, score: certificates.score, courseId: certificates.courseId, title: courses.title, issuedAt: certificates.issuedAt })
      .from(certificates)
      .innerJoin(courses, eq(courses.id, certificates.courseId))
      .where(eq(certificates.studentId, userId)),
    db
      .select({ id: applications.id, status: applications.status, createdAt: applications.createdAt, jobId: jobs.id, title: jobs.title, company: companies.name })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .where(eq(applications.studentId, userId))
      .orderBy(desc(applications.createdAt)),
    listJobs(),
  ]);

  const certified = new Set(certs.map((c) => c.courseId));
  const appliedTo = new Set(apps.map((a) => a.jobId));
  const qualified = openJobs.filter((j) => !appliedTo.has(j.job.id) && j.requires.length && j.requires.every((r) => certified.has(r.id)));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">My courses</h2>
          <span className="text-sm text-muted">
            Plan: <Badge tone="brand">{PLANS[plan].name}</Badge>{" "}
            <Link href="/plans" className="text-brand hover:underline">
              Change
            </Link>
          </span>
        </div>
        {myCourses.length ? (
          <ul className="mt-3 divide-y divide-line">
            {myCourses.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/learn/${c.id}`} className="hover:text-brand">
                  {c.title}
                </Link>
                <Badge tone={c.status === "completed" ? "brand" : "neutral"}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <Empty>
              No courses yet. <Link href="/courses" className="text-brand hover:underline">Browse the catalog</Link>.
            </Empty>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Verified certificates</h2>
        {certs.length ? (
          <ul className="mt-3 divide-y divide-line">
            {certs.map((c) => (
              <li key={c.code} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/verify/${c.code}`} className="hover:text-brand">
                  {c.title}
                </Link>
                <span className="text-muted">
                  {c.score}% · {fmtDate(c.issuedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Pass a course&apos;s assessments to earn your first certificate.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Jobs you qualify for</h2>
        {qualified.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {qualified.map(({ job, company }) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="text-brand hover:underline">
                  {job.title}
                </Link>{" "}
                <span className="text-muted">· {company}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Jobs that require your certificates will appear here. <Link href="/jobs" className="text-brand hover:underline">See all jobs</Link>.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">My applications</h2>
        {apps.length ? (
          <ul className="mt-3 divide-y divide-line">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/jobs/${a.jobId}`} className="hover:text-brand">
                  {a.title} <span className="text-muted">· {a.company}</span>
                </Link>
                <Badge tone={a.status === "rejected" ? "danger" : a.status === "submitted" ? "neutral" : "brand"}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">You haven&apos;t applied to any jobs yet.</p>
        )}
      </Card>
    </div>
  );
}
