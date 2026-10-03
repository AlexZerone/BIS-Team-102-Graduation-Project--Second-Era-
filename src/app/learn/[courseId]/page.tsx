import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, certificates, courses, enrollments, lessons, submissions } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader } from "@/components/ui";
import { submitAction } from "./actions";

export const metadata = { title: "Learn" };

export default async function LearnPage({ params }: PageProps<"/learn/[courseId]">) {
  const user = await requireRole("student");
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
  const graded = tasks.filter((t) => t.sub?.gradedAt).length;

  return (
    <>
      <PageHeader
        title={row.course.title}
        subtitle={`${graded} of ${tasks.length} assessments graded · pass mark ${row.course.passingScore}%`}
        action={<Link href={`/courses/${courseId}`} className="text-sm text-brand hover:underline">Course overview</Link>}
      />

      {cert && (
        <Card className="mb-6 border-brand">
          <p>
            🎓 You passed with <strong>{cert.score}%</strong>. Your certificate code is <code className="font-mono">{cert.code}</code>.{" "}
            <Link href={`/verify/${cert.code}`} className="text-brand hover:underline">
              View certificate
            </Link>{" "}
            or{" "}
            <Link href="/jobs" className="text-brand hover:underline">
              find jobs that require it
            </Link>
            .
          </p>
        </Card>
      )}
      {!cert && graded === tasks.length && tasks.length > 0 && (
        <Card className="mb-6">
          All work is graded but the total is below the pass mark. Your instructor can re-grade a submission after
          discussing it with you.
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Lessons</h2>
          <div className="space-y-2">
            {lessonList.map((l) => (
              <details key={l.id} className="rounded-lg border border-line bg-surface p-4">
                <summary className="cursor-pointer font-medium">
                  {l.position}. {l.title}
                </summary>
                <p className="prose-text mt-3 text-sm">{l.body}</p>
                {l.videoUrl && (
                  <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand hover:underline">
                    Watch video
                  </a>
                )}
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Assessments</h2>
          <div className="space-y-4">
            {tasks.map(({ task, sub }) => (
              <Card key={task.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  {sub?.gradedAt ? (
                    <Badge tone="brand">
                      {sub.score}/{task.maxScore}
                    </Badge>
                  ) : sub ? (
                    <Badge tone="warn">Awaiting grade</Badge>
                  ) : (
                    <Badge>Not submitted</Badge>
                  )}
                </div>
                <p className="prose-text mt-2 text-sm text-muted">{task.instructions}</p>
                {sub?.gradedAt ? (
                  sub.feedback && <p className="mt-3 rounded-md bg-background p-3 text-sm">Feedback: {sub.feedback}</p>
                ) : (
                  <div className="mt-4">
                    <ActionForm action={submitAction.bind(null, task.id)} submit={sub ? "Update submission" : "Submit"}>
                      <Field as="textarea" label="Your answer" name="answer" defaultValue={sub?.answer} required maxLength={20000} />
                      <Field label="Link (optional)" name="link" type="url" defaultValue={sub?.link ?? ""} hint="Repository, document, or file share." />
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
