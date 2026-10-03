import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses, jobRequirements, jobs } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { rankedApplicants } from "@/server/hiring";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, Field, PageHeader, fmtDate } from "@/components/ui";
import { setApplicationStatus, toggleJob } from "../../actions";

const STATUSES: [string, string][] = [["submitted", "Submitted"], ["shortlisted", "Shortlisted"], ["rejected", "Rejected"], ["hired", "Hired"]];

export const metadata = { title: "Applicants" };

export default async function CompanyJobPage({ params }: PageProps<"/company/jobs/[id]">) {
  const user = await requireRole("company");
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
            <Badge tone={job.isOpen ? "brand" : "neutral"}>{job.isOpen ? "open" : "closed"}</Badge>{" "}
            {required.length ? `Requires: ${required.map((r) => r.title).join(", ")}` : "No certificate required"}
          </>
        }
        action={<ActionForm action={toggleJob.bind(null, id)} submit={job.isOpen ? "Close job" : "Reopen job"} variant="secondary" className="" />}
      />
      <h2 className="mb-3 text-lg font-semibold">Applicants, ranked by verified score</h2>
      {applicants.length ? (
        <div className="space-y-4">
          {applicants.map((a, i) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    #{i + 1} {a.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {[a.major, a.university, a.graduationYear && `class of ${a.graduationYear}`].filter(Boolean).join(" · ") || "No profile details"}
                  </p>
                  <p className="text-sm text-muted">
                    <a href={`mailto:${a.email}`} className="hover:text-brand">{a.email}</a> · applied {fmtDate(a.createdAt)}
                    {a.hasResume && (
                      <>
                        {" · "}
                        <a href={`/api/resumes/${a.studentId}`} className="text-brand hover:underline">
                          Resume (PDF)
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">{a.score ?? "—"}{a.score !== null && "%"}</p>
                  <p className="text-xs text-muted">verified score</p>
                </div>
              </div>
              {a.certificates.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {a.certificates.map((c) => (
                    <li key={c.code}>
                      <Link href={`/verify/${c.code}`}>
                        <Badge tone="brand">
                          {c.title} · {c.score}%
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {a.coverNote && <p className="prose-text mt-3 rounded-md bg-background p-3 text-sm">{a.coverNote}</p>}
              <div className="mt-4 max-w-xs">
                <ActionForm action={setApplicationStatus.bind(null, id, a.id)} submit="Update" variant="secondary" className="flex items-end gap-2">
                  <Field as="select" label="Status" name="status" defaultValue={a.status} options={STATUSES} />
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>No applications yet.</Empty>
      )}
    </>
  );
}
