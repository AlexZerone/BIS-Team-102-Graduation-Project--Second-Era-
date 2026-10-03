import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { missingRequirements } from "@/server/hiring";
import { JOB_TYPES, listJobs, visibleJob } from "@/server/queries";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, btn, fmtDate } from "@/components/ui";
import { applyAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">) {
  const [j] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, Number((await params).id) || 0));
  return { title: j?.title ?? "Job" };
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await listJobs(and(eq(jobs.id, id), visibleJob()));
  if (!row) notFound();
  const { job, company, requires } = row;
  const user = await getCurrentUser();

  let panel: React.ReactNode = (
    <Link href="/register" className={btn.primary}>
      Sign up to apply
    </Link>
  );
  if (user?.role === "student" && user.status === "active") {
    const [[applied], missing] = await Promise.all([
      db.select().from(applications).where(and(eq(applications.jobId, id), eq(applications.studentId, user.id))),
      missingRequirements(user.id, id),
    ]);
    if (applied) panel = <p className="text-sm">You applied on {fmtDate(applied.createdAt)}. Status: <Badge tone="brand">{applied.status}</Badge></p>;
    else if (missing.length)
      panel = (
        <div className="text-sm">
          <p>Earn these certificates to apply:</p>
          <ul className="mt-2 list-disc pl-5">
            {missing.map((c) => (
              <li key={c.id}>
                <Link href={`/courses/${c.id}`} className="text-brand hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    else
      panel = (
        <ActionForm action={applyAction.bind(null, id)} submit="Apply">
          <Field as="textarea" label="Cover note (optional)" name="coverNote" maxLength={2000} />
        </ActionForm>
      );
  } else if (user) panel = null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <article>
        <Badge>{JOB_TYPES[job.type]}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-muted">
          {company}
          {job.location && ` · ${job.location}`} · posted {fmtDate(job.createdAt)}
          {job.deadline && ` · apply by ${fmtDate(job.deadline)}`}
        </p>
        <p className="prose-text mt-6">{job.description}</p>
      </article>
      <aside>
        <Card>
          <h2 className="font-semibold">Requirements</h2>
          {requires.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {requires.map((r) => (
                <li key={r.id}>
                  ✓ Certificate in{" "}
                  <Link href={`/courses/${r.id}`} className="text-brand hover:underline">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No certificate required.</p>
          )}
          {panel && <div className="mt-4">{panel}</div>}
        </Card>
      </aside>
    </div>
  );
}
