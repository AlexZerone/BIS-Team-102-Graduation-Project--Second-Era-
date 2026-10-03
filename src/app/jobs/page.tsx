import Link from "next/link";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { JOB_TYPES, listJobs } from "@/server/queries";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const rows = await listJobs();
  return (
    <>
      <PageHeader title="Jobs & internships" subtitle="Openings from partner companies. Many require a Second Era certificate, so applicants arrive verified." />
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map(({ job, company, requires }) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="block rounded-lg border border-line bg-surface p-5 hover:border-brand">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{job.title}</h2>
                  <Badge>{JOB_TYPES[job.type]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {company}
                  {job.location && ` · ${job.location}`}
                </p>
                {requires.length > 0 && (
                  <p className="mt-2 text-sm">
                    Requires certificate: {requires.map((r) => r.title).join(", ")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No open positions right now. Check back soon.</Empty>
      )}
    </>
  );
}
