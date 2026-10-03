import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, certificates, companies, courses, enrollments, jobs } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { listJobs } from "@/server/queries";
import { activeCourseProgress, pickContinue, recentUpdates, type Update } from "@/server/progress";
import { Badge, Card, Empty, btn, fmtDate } from "@/components/ui";

export async function StudentDashboard({ userId }: { userId: number }) {
  const [progress, updates, plan, myCourses, certs, apps, openJobs] = await Promise.all([
    activeCourseProgress(userId),
    recentUpdates(userId),
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

  const next = pickContinue(progress);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <ContinueCard next={next} qualifiedJob={qualified[0]?.job} hasCourses={myCourses.length > 0} />
        <Card>
          <h2 className="font-semibold">Recent updates</h2>
          {updates.length ? (
            <ul className="mt-3 space-y-3">
              {updates.map((u, i) => (
                <UpdateItem key={i} u={u} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Grades, certificates and replies from companies will show up here.</p>
          )}
        </Card>
      </div>

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
    </div>
  );
}

/** The one thing to do next, shown first so the dashboard works as the student's home. */
function ContinueCard({
  next,
  qualifiedJob,
  hasCourses,
}: {
  next: ReturnType<typeof pickContinue>;
  qualifiedJob?: { id: number; title: string };
  hasCourses: boolean;
}) {
  if (next)
    return (
      <Card className="border-brand">
        <p className="text-sm font-medium text-brand">Continue where you left off</p>
        <h2 className="mt-1 text-xl font-semibold" dir="auto">
          {next.title}
        </h2>
        <progress value={next.graded} max={next.total} aria-label="Assessments graded" className="mt-3 h-2 w-full accent-brand" />
        <p className="mt-2 text-sm">
          {next.nextTask ? (
            <>
              Next: submit <strong dir="auto">{next.nextTask}</strong>
            </>
          ) : (
            "All your work is submitted. Your instructor will grade it soon."
          )}
          <span className="text-muted">
            {" "}
            · {next.graded} of {next.total} graded
          </span>
        </p>
        <Link href={`/learn/${next.courseId}`} className={`${btn.primary} mt-4`}>
          {next.nextTask ? "Continue course" : "View course"}
        </Link>
      </Card>
    );
  if (qualifiedJob)
    return (
      <Card className="border-brand">
        <p className="text-sm font-medium text-brand">You qualify for a job</p>
        <h2 className="mt-1 text-xl font-semibold" dir="auto">
          {qualifiedJob.title}
        </h2>
        <p className="mt-2 text-sm text-muted">Your certificates meet every requirement for this opening.</p>
        <Link href={`/jobs/${qualifiedJob.id}`} className={`${btn.primary} mt-4`}>
          View and apply
        </Link>
      </Card>
    );
  return (
    <Card className="border-brand">
      <p className="text-sm font-medium text-brand">{hasCourses ? "Ready for the next step" : "Start here"}</p>
      <h2 className="mt-1 text-xl font-semibold">Pick a practical course</h2>
      <p className="mt-2 text-sm text-muted">
        Pass its assessments to earn a verified certificate that partner companies ask for in their job posts.
      </p>
      <Link href="/courses" className={`${btn.primary} mt-4`}>
        Browse courses
      </Link>
    </Card>
  );
}

function UpdateItem({ u }: { u: Update }) {
  const when = <span className="block text-xs text-muted">{fmtDate(u.at)}</span>;
  if (u.kind === "graded")
    return (
      <li className="text-sm">
        <Link href={`/learn/${u.courseId}`} className="hover:text-brand">
          <strong dir="auto">{u.task}</strong> graded: {u.score}/{u.max}
        </Link>
        {u.feedback && (
          <span className="block text-muted" dir="auto">
            “{u.feedback}”
          </span>
        )}
        {when}
      </li>
    );
  if (u.kind === "certified")
    return (
      <li className="text-sm">
        <Link href={`/verify/${u.code}`} className="hover:text-brand">
          🎓 Certificate earned: <strong dir="auto">{u.course}</strong> ({u.score}%)
        </Link>
        {when}
      </li>
    );
  const verb = { shortlisted: "shortlisted you for", hired: "hired you for", rejected: "declined your application for", submitted: "reopened your application for" }[u.status];
  return (
    <li className="text-sm">
      <Link href={`/jobs/${u.jobId}`} className="hover:text-brand">
        <bdi>{u.company}</bdi> {verb} <strong dir="auto">{u.job}</strong>
      </Link>
      {when}
    </li>
  );
}
