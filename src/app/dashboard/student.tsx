import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, certificates, companies, courses, enrollments, jobs } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { listJobs } from "@/server/queries";
import { activeCourseProgress, pickContinue, recentUpdates, type Update } from "@/server/progress";
import { Badge, Card, Empty, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { m, type T } from "@/i18n/translate";

export async function StudentDashboard({ userId }: { userId: number }) {
  const [t, progress, updates, plan, myCourses, certs, apps, openJobs] = await Promise.all([
    getT(),
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
        <ContinueCard t={t} next={next} qualifiedJob={qualified[0]?.job} hasCourses={myCourses.length > 0} />
        <Card>
          <h2 className="font-semibold">{t("Recent updates")}</h2>
          {updates.length ? (
            <ul className="mt-3 space-y-3">
              {updates.map((u, i) => (
                <UpdateItem key={i} u={u} t={t} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("Grades, certificates and replies from companies will show up here.")}</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("My courses")}</h2>
            <span className="text-sm text-muted">
              {t("Plan:")} <Badge tone="brand">{t(PLANS[plan].name)}</Badge>{" "}
              <Link href="/plans" className="text-brand hover:underline">
                {t("Change")}
              </Link>
            </span>
          </div>
          {myCourses.length ? (
            <ul className="mt-3 divide-y divide-line">
              {myCourses.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/learn/${c.id}`} className="hover:text-brand" dir="auto">
                    {c.title}
                  </Link>
                  <Badge tone={c.status === "completed" ? "brand" : "neutral"}>{t.label(c.status)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <Empty>
                {t("No courses yet.")}{" "}
                <Link href="/courses" className="text-brand hover:underline">
                  {t("Browse the catalog")}
                </Link>
              </Empty>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">{t("Verified certificates")}</h2>
          {certs.length ? (
            <ul className="mt-3 divide-y divide-line">
              {certs.map((c) => (
                <li key={c.code} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/verify/${c.code}`} className="hover:text-brand" dir="auto">
                    {c.title}
                  </Link>
                  <span className="text-muted">
                    <bdi>{c.score}%</bdi> · {t.date(c.issuedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("Pass a course's assessments to earn your first certificate.")}</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">{t("Jobs you qualify for")}</h2>
          {qualified.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {qualified.map(({ job, company }) => (
                <li key={job.id}>
                  <Link href={`/jobs/${job.id}`} className="text-brand hover:underline" dir="auto">
                    {job.title}
                  </Link>{" "}
                  <span className="text-muted">
                    · <bdi>{company}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {t("Jobs that require your certificates will appear here.")}{" "}
              <Link href="/jobs" className="text-brand hover:underline">
                {t("See all jobs")}
              </Link>
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">{t("My applications")}</h2>
          {apps.length ? (
            <ul className="mt-3 divide-y divide-line">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/jobs/${a.jobId}`} className="hover:text-brand">
                    <bdi>{a.title}</bdi>{" "}
                    <span className="text-muted">
                      · <bdi>{a.company}</bdi>
                    </span>
                  </Link>
                  <Badge tone={a.status === "rejected" ? "danger" : a.status === "submitted" ? "neutral" : "brand"}>{t.label(a.status)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("You haven't applied to any jobs yet.")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}

/** The one thing to do next, shown first so the dashboard works as the student's home. */
function ContinueCard({
  t,
  next,
  qualifiedJob,
  hasCourses,
}: {
  t: T;
  next: ReturnType<typeof pickContinue>;
  qualifiedJob?: { id: number; title: string };
  hasCourses: boolean;
}) {
  if (next)
    return (
      <Card className="border-brand">
        <p className="text-sm font-medium text-brand">{t("Continue where you left off")}</p>
        <h2 className="mt-1 text-xl font-semibold" dir="auto">
          {next.title}
        </h2>
        <progress value={next.graded} max={next.total} aria-label={t("Assessments graded")} className="mt-3 h-2 w-full accent-brand" />
        <p className="mt-2 text-sm">
          {next.nextTask ? t("Next: submit {tasks}.", { tasks: next.nextTask }) : t("All your work is submitted. Your instructor will grade it soon.")}
          <span className="text-muted"> · {t("{graded} of {total} graded", { graded: next.graded, total: next.total })}</span>
        </p>
        <Link href={`/learn/${next.courseId}`} className={`${btn.primary} mt-4`}>
          {next.nextTask ? t("Continue course") : t("View course")}
        </Link>
      </Card>
    );
  if (qualifiedJob)
    return (
      <Card className="border-brand">
        <p className="text-sm font-medium text-brand">{t("You qualify for a job")}</p>
        <h2 className="mt-1 text-xl font-semibold" dir="auto">
          {qualifiedJob.title}
        </h2>
        <p className="mt-2 text-sm text-muted">{t("Your certificates meet every requirement for this opening.")}</p>
        <Link href={`/jobs/${qualifiedJob.id}`} className={`${btn.primary} mt-4`}>
          {t("View and apply")}
        </Link>
      </Card>
    );
  return (
    <Card className="border-brand">
      <p className="text-sm font-medium text-brand">{hasCourses ? t("Ready for the next step") : t("Start here")}</p>
      <h2 className="mt-1 text-xl font-semibold">{t("Pick a practical course")}</h2>
      <p className="mt-2 text-sm text-muted">{t("Pass its assessments to earn a verified certificate that partner companies ask for in their job posts.")}</p>
      <Link href="/courses" className={`${btn.primary} mt-4`}>
        {t("Browse courses")}
      </Link>
    </Card>
  );
}

// Whole sentences per status, because word order differs between English and Arabic.
const APPLICATION_UPDATE = {
  shortlisted: m("{company} shortlisted you for {job}"),
  hired: m("{company} hired you for {job}"),
  rejected: m("{company} declined your application for {job}"),
  submitted: m("{company} reopened your application for {job}"),
};

function UpdateItem({ u, t }: { u: Update; t: T }) {
  const when = <span className="block text-xs text-muted">{t.date(u.at)}</span>;
  if (u.kind === "graded")
    return (
      <li className="text-sm">
        <Link href={`/learn/${u.courseId}`} className="hover:text-brand">
          {t("{task} graded: {score}/{max}", { task: u.task, score: u.score, max: u.max })}
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
          🎓 {t("Certificate earned: {course} ({score}%)", { course: u.course, score: u.score })}
        </Link>
        {when}
      </li>
    );
  return (
    <li className="text-sm">
      <Link href={`/jobs/${u.jobId}`} className="hover:text-brand">
        {t(APPLICATION_UPDATE[u.status], { company: u.company, job: u.job })}
      </Link>
      {when}
    </li>
  );
}
