import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, certificates, courses, enrollments, lessons, submissions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { submitAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/learn/[courseId]">) {
  const [c] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, Number((await params).courseId) || 0), eq(courses.status, "published")));
  const t = await getT();
  return { title: c ? t("Learn: {course}", { course: c.title }) : t("Learn") };
}

export default async function LearnPage({ params }: PageProps<"/learn/[courseId]">) {
  const [user, t] = await Promise.all([requireRole("student"), getT()]);
  const courseId = Number((await params).courseId);
  if (!Number.isInteger(courseId)) notFound();
  const [row] = await db
    .select({ course: courses, enrollment: enrollments })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.studentId, user.id)));
  if (!row) notFound();

  const [lessonList, tasks, [cert]] = await Promise.all([
    db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.position)),
    db
      .select({ task: assessments, sub: submissions })
      .from(assessments)
      .leftJoin(submissions, and(eq(submissions.assessmentId, assessments.id), eq(submissions.studentId, user.id)))
      .where(eq(assessments.courseId, courseId))
      .orderBy(asc(assessments.id)),
    db.select().from(certificates).where(and(eq(certificates.courseId, courseId), eq(certificates.studentId, user.id))),
  ]);
  const graded = tasks.filter((x) => x.sub?.gradedAt).length;
  const toSubmit = tasks.filter((x) => !x.sub).map((x) => x.task.title);
  const next = cert
    ? null
    : toSubmit.length
      ? t("Next: submit {tasks}.", { tasks: toSubmit.join(", ") })
      : graded < tasks.length
        ? t("All work is submitted. Your instructor will grade it.")
        : null;

  return (
    <>
      <PageHeader
        title={row.course.title}
        subtitle={t("{graded} of {total} assessments graded · pass mark {pass}%", { graded, total: tasks.length, pass: row.course.passingScore })}
        action={
          <Link href={`/courses/${courseId}`} className="text-sm text-brand hover:underline">
            {t("Course overview")}
          </Link>
        }
      />
      {tasks.length > 0 && !cert && (
        <div className="-mt-3 mb-6 max-w-md">
          <progress value={graded} max={tasks.length} aria-label={t("Assessments graded")} className="h-2 w-full accent-brand" />
          {next && <p className="mt-1 text-sm">{next}</p>}
        </div>
      )}

      {cert && (
        <Card className="mb-6 border-brand">
          <p>
            🎓 {t("You passed with {score}%. Your certificate code is", { score: cert.score })}{" "}
            <bdi className="font-mono">{cert.code}</bdi>.{" "}
            <Link href={`/verify/${cert.code}`} className="text-brand hover:underline">
              {t("View certificate")}
            </Link>
            {" · "}
            <Link href="/jobs" className="text-brand hover:underline">
              {t("Find jobs that require it")}
            </Link>
          </p>
        </Card>
      )}
      {!cert && graded === tasks.length && tasks.length > 0 && (
        <Card className="mb-6">
          {t("All work is graded but the total is below the pass mark. Your instructor can re-grade a submission after discussing it with you.")}
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("Lessons")}</h2>
          <div className="space-y-2">
            {lessonList.map((l) => (
              <details key={l.id} className="rounded-lg border border-line bg-surface p-4">
                <summary className="cursor-pointer font-medium">
                  {l.position}. <bdi>{l.title}</bdi>
                </summary>
                <p className="prose-text mt-3 max-w-prose" dir="auto">
                  {l.body}
                </p>
                {l.videoUrl && (
                  <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand hover:underline">
                    {t("Watch video")}
                  </a>
                )}
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("Assessments")}</h2>
          <div className="space-y-4">
            {tasks.map(({ task, sub }) => (
              <Card key={task.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold" dir="auto">
                    {task.title}
                  </h3>
                  {sub?.gradedAt ? (
                    <Badge tone="brand">
                      <bdi>
                        {sub.score}/{task.maxScore}
                      </bdi>
                    </Badge>
                  ) : sub ? (
                    <Badge tone="warn">{t("Awaiting grade")}</Badge>
                  ) : (
                    <Badge>{t("Not submitted")}</Badge>
                  )}
                </div>
                <p className="prose-text mt-2 text-sm text-muted" dir="auto">
                  {task.instructions}
                </p>
                {sub?.gradedAt ? (
                  sub.feedback && (
                    <p className="mt-3 rounded-md bg-background p-3 text-sm">
                      {t("Feedback:")} <bdi>{sub.feedback}</bdi>
                    </p>
                  )
                ) : (
                  <div className="mt-4">
                    <ActionForm action={submitAction.bind(null, task.id)} submit={sub ? t("Update submission") : t("Submit")}>
                      <Field as="textarea" label={t("Your answer")} name="answer" defaultValue={sub?.answer} required maxLength={20000} dir="auto" />
                      <Field
                        label={t("Link (optional)")}
                        name="link"
                        type="url"
                        dir="ltr"
                        defaultValue={sub?.link ?? ""}
                        hint={t("Repository, document, or file share.")}
                      />
                    </ActionForm>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
