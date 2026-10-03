import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courses, submissions, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { gradeAction } from "../../actions";

export const generateMetadata = titled("Grade submissions");

export default async function GradePage({ params }: PageProps<"/teach/[id]/grade">) {
  const [user, t] = await Promise.all([requireRole("instructor"), getT()]);
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [course] = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.instructorId, user.id)));
  if (!course) notFound();

  const rows = await db
    .select({ sub: submissions, task: assessments.title, maxScore: assessments.maxScore, student: users.name })
    .from(submissions)
    .innerJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .innerJoin(users, eq(users.id, submissions.studentId))
    .where(eq(assessments.courseId, id))
    .orderBy(sql`${submissions.gradedAt} is not null`, asc(submissions.submittedAt));

  return (
    <>
      <PageHeader
        title={t("Grade · {course}", { course: course.title })}
        subtitle={t("Ungraded work first. A certificate is issued automatically once all of a student's work is graded and passes.")}
        action={
          <Link href={`/teach/${id}`} className="text-sm text-brand hover:underline">
            {t("Back to course")}
          </Link>
        }
      />
      {rows.length ? (
        <div className="space-y-4">
          {rows.map(({ sub, task, maxScore, student }) => (
            <Card key={sub.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  <bdi>{student}</bdi> · <bdi>{task}</bdi>
                </h2>
                {sub.gradedAt ? (
                  <Badge tone="brand">
                    <bdi>
                      {sub.score}/{maxScore}
                    </bdi>
                  </Badge>
                ) : (
                  <Badge tone="warn">{t("Needs grading")}</Badge>
                )}
              </div>
              <p className="text-xs text-muted">{t("Submitted {date}", { date: t.date(sub.submittedAt) })}</p>
              <p className="prose-text mt-3 rounded-md bg-background p-3 text-sm" dir="auto">
                {sub.answer}
              </p>
              {sub.link && (
                <a href={sub.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block break-all text-sm text-brand hover:underline" dir="ltr">
                  {sub.link}
                </a>
              )}
              <div className="mt-4">
                <ActionForm action={gradeAction.bind(null, id, sub.id)} submit={sub.gradedAt ? t("Re-grade") : t("Save grade")}>
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    <Field label={t("Score / {max}", { max: maxScore })} name="score" type="number" min={0} max={maxScore} defaultValue={sub.score ?? ""} required />
                    <Field
                      as="textarea"
                      rows={3}
                      label={t("Feedback")}
                      name="feedback"
                      defaultValue={sub.feedback ?? ""}
                      dir="auto"
                      hint={t("The student sees this with their score.")}
                    />
                  </div>
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>{t("No submissions yet.")}</Empty>
      )}
    </>
  );
}
