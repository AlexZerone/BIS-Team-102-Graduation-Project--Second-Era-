import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, companies, courses, jobs } from "@/db/schema";
import { Badge, Card, Empty, btn, fmtDate } from "@/components/ui";

export async function CompanyDashboard({ userId }: { userId: number }) {
  const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
  const [myJobs, partnered] = await Promise.all([
    db
      .select({ job: jobs, applicants: count(applications.id) })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt)),
    db.select({ id: courses.id, title: courses.title, status: courses.status }).from(courses).where(eq(courses.partnerCompanyId, company.id)),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{company.name} · Job postings</h2>
          <Link href="/company/jobs/new" className={btn.primary}>
            Post a job
          </Link>
        </div>
        {myJobs.length ? (
          <ul className="mt-4 divide-y divide-line">
            {myJobs.map(({ job, applicants }) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link href={`/company/jobs/${job.id}`} className="font-medium hover:text-brand">
                    {job.title}
                  </Link>
                  <p className="text-muted">Posted {fmtDate(job.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={job.isOpen ? "brand" : "neutral"}>{job.isOpen ? "open" : "closed"}</Badge>
                  <Link href={`/company/jobs/${job.id}`} className="text-brand hover:underline">
                    {applicants} applicant{applicants === 1 ? "" : "s"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <Empty>Post an internship and require the certificates that matter to your team.</Empty>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="font-semibold">Courses you partner on</h2>
        {partnered.length ? (
          <ul className="mt-3 space-y-1 text-sm">
            {partnered.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.id}`} className="hover:text-brand">
                  {c.title}
                </Link>{" "}
                <span className="text-muted">({c.status})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Instructors can list your company as the industry partner on courses you help design.
          </p>
        )}
      </Card>
    </div>
  );
}
