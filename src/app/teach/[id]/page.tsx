import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courses, lessons } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader } from "@/components/ui";
import { CourseFields } from "../course-fields";
import { STATUS_TONE } from "../status";
import { addAssessment, addLesson, removeItem, submitForReview, updateCourse } from "../actions";

export const metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: PageProps<"/teach/[id]">) {
  const user = await requireRole("instructor");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [course] = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.instructorId, user.id)));
  if (!course) notFound();
  const [lessonList, tasks] = await Promise.all([
    db.select().from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.position)),
    db.select().from(assessments).where(eq(assessments.courseId, id)).orderBy(asc(assessments.id)),
  ]);
  const editable = course.status === "draft" || course.status === "rejected";

  return (
    <>
      <PageHeader
        title={course.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[course.status]}>{course.status}</Badge>
            <Link href={`/courses/${id}`} className="text-brand hover:underline">
              Preview
            </Link>
            <Link href={`/teach/${id}/grade`} className="text-brand hover:underline">
              Grade submissions
            </Link>
          </span>
        }
        action={editable && <ActionForm action={submitForReview.bind(null, id)} submit="Submit for review" className="" />}
      />

      {course.status === "rejected" && course.rejectionReason && (
        <Card className="mb-6 border-danger">
          <p className="text-sm">
            <strong>Changes requested:</strong> {course.rejectionReason}
          </p>
        </Card>
      )}
      {!editable && (
        <Card className="mb-6">
          <p className="text-sm text-muted">
            This course is {course.status === "pending" ? "waiting for admin review" : "published"} and locked for editing.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Details</h2>
          {editable ? (
            <ActionForm action={updateCourse.bind(null, id)} submit="Save details">
              <CourseFields course={course} />
            </ActionForm>
          ) : (
            <p className="prose-text text-sm">{course.description}</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold">Lessons</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {lessonList.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span>
                    {l.position}. {l.title}
                  </span>
                  {editable && (
                    <ActionForm
                      action={removeItem.bind(null, id, "lesson", l.id)}
                      submit="Remove"
                      variant="danger"
                      className=""
                      confirm={`Remove the lesson "${l.title}"? This can't be undone.`}
                    />
                  )}
                </li>
              ))}
            </ol>
            {editable && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand">Add a lesson</summary>
                <div className="mt-3">
                  <ActionForm action={addLesson.bind(null, id)} submit="Add lesson" resetOnSuccess>
                    <Field label="Title" name="title" required />
                    <Field as="textarea" label="Content" name="body" required rows={6} />
                    <Field label="Video link (optional)" name="videoUrl" type="url" />
                  </ActionForm>
                </div>
              </details>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">Practical assessments</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span>
                    {t.title} · {t.maxScore} pts
                  </span>
                  {editable && (
                    <ActionForm
                      action={removeItem.bind(null, id, "assessment", t.id)}
                      submit="Remove"
                      variant="danger"
                      className=""
                      confirm={`Remove the assessment "${t.title}"? This can't be undone.`}
                    />
                  )}
                </li>
              ))}
            </ul>
            {editable && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand">Add an assessment</summary>
                <div className="mt-3">
                  <ActionForm action={addAssessment.bind(null, id)} submit="Add assessment" resetOnSuccess>
                    <Field label="Title" name="title" required />
                    <Field as="textarea" label="Instructions" name="instructions" required hint="What the student must deliver, and how you'll grade it." />
                    <Field label="Max score" name="maxScore" type="number" min={1} max={1000} defaultValue={100} required />
                  </ActionForm>
                </div>
              </details>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
