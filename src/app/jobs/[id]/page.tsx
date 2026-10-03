import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { missingRequirements } from "@/server/hiring";
import { listJobs, visibleJob } from "@/server/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { applyAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">) {
  const [j] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, Number((await params).id) || 0));
  return { title: j?.title ?? (await getT())("Job") };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await listJobs(and(eq(jobs.id, id), visibleJob()));
  if (!row) notFound();
  const { job, company, requires } = row;
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);

  let panel: React.ReactNode = (
    <Link href="/register" className={btn.primary}>
      {t("Sign up to apply")}
    </Link>
  );
  if (user?.role === "student" && user.status === "active") {
    const [[applied], missing] = await Promise.all([
      db.select().from(applications).where(and(eq(applications.jobId, id), eq(applications.studentId, user.id))),
      missingRequirements(user.id, id),
    ]);
    if (applied)
      panel = (
        <p className="text-sm">
          {t("You applied on {date}. Status:", { date: t.date(applied.createdAt) })} <Badge tone="brand">{t.label(applied.status)}</Badge>
        </p>
      );
    else if (missing.length)
      panel = (
        <div className="text-sm">
          <p>{t("Earn these certificates to apply:")}</p>
          <ul className="mt-2 list-disc ps-5">
            {missing.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.id}`} className="text-brand hover:underline" dir="auto">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    else
      panel = (
        <ActionForm action={applyAction.bind(null, id)} submit={t("Apply")}>
          <Field as="textarea" label={t("Cover note (optional)")} name="coverNote" maxLength={2000} dir="auto" />
        </ActionForm>
      );
  } else if (user) panel = null;

  return (
    // Same order as the course page: header, requirements + Apply, then the description.
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[1fr_320px]">
      <header className="lg:col-start-1">
        <Badge>{t.label(job.type)}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight" dir="auto">
          {job.title}
        </h1>
        <p className="mt-1 text-muted">
          <bdi>{company}</bdi>
          {job.location && (
            <>
              {" · "}
              <bdi>{job.location}</bdi>
            </>
          )}
          {" · "}
          {t("posted {date}", { date: t.date(job.createdAt) })}
          {job.deadline && <> · {t("apply by {date}", { date: t.date(job.deadline) })}</>}
        </p>
      </header>
      <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <Card>
          <h2 className="font-semibold">{t("Requirements")}</h2>
          {requires.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {requires.map((r) => (
                <li key={r.id}>
                  ✓ {t("Certificate in")}{" "}
                  <Link href={`/courses/${r.id}`} className="text-brand hover:underline" dir="auto">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("No certificate required.")}</p>
          )}
          {panel && <div className="mt-4">{panel}</div>}
        </Card>
      </aside>
      <p className="prose-text max-w-prose lg:col-start-1" dir="auto">
        {job.description}
      </p>
    </div>
  );
}
