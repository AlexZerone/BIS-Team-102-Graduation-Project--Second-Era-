import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courses, submissions, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, Field, PageHeader, fmtDate } from "@/components/ui";
import { gradeAction } from "../../actions";

export const metadata = { title: "Grade submissions" };

export default async function GradePage({ params }: PageProps<"/teach/[id]/grade">) {
  const user = await requireRole("instructor");
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
        title={`Grade · ${course.title}`}
        subtitle="Ungraded work first. A certificate is issued automatically once all of a student's work is graded and passes."
        action={<Link href={`/teach/${id}`} className="text-sm text-brand hover:underline">Back to course</Link>}
      />
      {rows.length ? (
        <div className="space-y-4">
          {rows.map(({ sub, task, maxScore, student }) => (
            <Card key={sub.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {student} · {task}
                </h2>
                {sub.gradedAt ? <Badge tone="brand">{sub.score}/{maxScore}</Badge> : <Badge tone="warn">Needs grading</Badge>}
              </div>
              <p className="text-xs text-muted">Submitted {fmtDate(sub.submittedAt)}</p>
              <p className="prose-text mt-3 rounded-md bg-background p-3 text-sm">{sub.answer}</p>
              {sub.link && (
                <a href={sub.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block break-all text-sm text-brand hover:underline">
                  {sub.link}
                </a>
              )}
              <div className="mt-4">
                <ActionForm action={gradeAction.bind(null, id, sub.id)} submit={sub.gradedAt ? "Re-grade" : "Save grade"}>
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    <Field label={`Score / ${maxScore}`} name="score" type="number" min={0} max={maxScore} defaultValue={sub.score ?? ""} required />
                    <Field label="Feedback" name="feedback" defaultValue={sub.feedback ?? ""} />
                  </div>
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>No submissions yet.</Empty>
      )}
    </>
  );
}
