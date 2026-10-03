import Link from "next/link";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { listJobs } from "@/server/queries";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";

export const generateMetadata = titled("Jobs");

export default async function JobsPage() {
  const [rows, t] = await Promise.all([listJobs(), getT()]);
  return (
    <>
      <PageHeader
        title={t("Jobs & internships")}
        subtitle={t("Openings from partner companies. Many require a Second Era certificate, so applicants arrive verified.")}
      />
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map(({ job, company, requires }) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="block rounded-lg border border-line bg-surface p-5 hover:border-brand">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold" dir="auto">
                    {job.title}
                  </h2>
                  <Badge>{t.label(job.type)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  <bdi>{company}</bdi>
                  {job.location && (
                    <>
                      {" · "}
                      <bdi>{job.location}</bdi>
                    </>
                  )}
                </p>
                {requires.length > 0 && (
                  <p className="mt-2 text-sm">
                    {t("Requires certificate:")} <bdi>{requires.map((r) => r.title).join(", ")}</bdi>
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("No open positions right now. Check back soon.")}</Empty>
      )}
    </>
  );
}
