import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses, jobRequirements, jobs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { rankedApplicants } from "@/server/hiring";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { setApplicationStatus, toggleJob } from "../../actions";

const STATUSES = ["submitted", "shortlisted", "rejected", "hired"] as const;

export const generateMetadata = titled("Applicants");

export default async function CompanyJobPage({ params }: PageProps<"/company/jobs/[id]">) {
  const [user, t] = await Promise.all([requireRole("company"), getT()]);
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await db
    .select({ job: jobs })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(and(eq(jobs.id, id), eq(companies.userId, user.id)));
  if (!row) notFound();
  const { job } = row;
  const [required, applicants] = await Promise.all([
    db.select({ title: courses.title }).from(jobRequirements).innerJoin(courses, eq(courses.id, jobRequirements.courseId)).where(eq(jobRequirements.jobId, id)),
    rankedApplicants(id),
  ]);

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={
          <>
            <Badge tone={job.isOpen ? "brand" : "neutral"}>{t.label(job.isOpen ? "open" : "closed")}</Badge>{" "}
            {required.length ? t("Requires: {list}", { list: required.map((r) => r.title).join(", ") }) : t("No certificate required")}
          </>
        }
        action={<ActionForm action={toggleJob.bind(null, id)} submit={job.isOpen ? t("Close job") : t("Reopen job")} variant="secondary" className="" />}
      />
      <h2 className="mb-3 text-lg font-semibold">{t("Applicants, ranked by verified score")}</h2>
      {applicants.length ? (
        <div className="space-y-4">
          {applicants.map((a, i) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    #{i + 1} <bdi>{a.name}</bdi>
                  </h3>
                  <p className="text-sm text-muted" dir="auto">
                    {[a.major, a.university, a.graduationYear && t("class of {year}", { year: String(a.graduationYear) })].filter(Boolean).join(" · ") ||
                      t("No profile details")}
                  </p>
                  <p className="text-sm text-muted">
                    <a href={`mailto:${a.email}`} className="hover:text-brand">
                      <bdi>{a.email}</bdi>
                    </a>{" "}
                    · {t("applied {date}", { date: t.date(a.createdAt) })}
                    {a.hasResume && (
                      <>
                        {" · "}
                        <a href={`/api/resumes/${a.studentId}`} className="text-brand hover:underline">
                          {t("Resume (PDF)")}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-2xl font-semibold" dir="ltr">
                    {a.score ?? "—"}
                    {a.score !== null && "%"}
                  </p>
                  <p className="text-xs text-muted">{t("verified score")}</p>
                </div>
              </div>
              {a.certificates.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {a.certificates.map((c) => (
                    <li key={c.code}>
                      <Link href={`/verify/${c.code}`}>
                        <Badge tone="brand">
                          <bdi>{c.title}</bdi> · <bdi>{c.score}%</bdi>
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {a.coverNote && (
                <p className="prose-text mt-3 rounded-md bg-background p-3 text-sm" dir="auto">
                  {a.coverNote}
                </p>
              )}
              <div className="mt-4 max-w-xs">
                <ActionForm action={setApplicationStatus.bind(null, id, a.id)} submit={t("Update")} variant="secondary" className="flex items-end gap-2">
                  <Field as="select" label={t("Status")} name="status" defaultValue={a.status} options={STATUSES.map((s): [string, string] => [s, t.label(s)])} />
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>{t("No applications yet.")}</Empty>
      )}
    </>
  );
}
