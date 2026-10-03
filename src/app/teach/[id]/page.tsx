import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, lessons } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader } from "@/components/ui";
import { CourseFields } from "../course-fields";
import { STATUS_TONE } from "../status";
import { addAssessment, addLesson, removeItem, submitForReview, updateCourse, updateLesson } from "../actions";
import { ownCourseWithLocks } from "@/server/courses";
import { DomainError } from "@/server/errors";

export const metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: PageProps<"/teach/[id]">) {
  const user = await requireRole("instructor");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const owned = await ownCourseWithLocks(user.id, id).catch((e) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  const { course, locks, enrolled } = owned;
  const [lessonList, tasks] = await Promise.all([
    db.select().from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.position)),
    db.select().from(assessments).where(eq(assessments.courseId, id)).orderBy(asc(assessments.id)),
  ]);
  const canSubmit = course.status === "draft" || course.status === "rejected";

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
        action={canSubmit && <ActionForm action={submitForReview.bind(null, id)} submit="Submit for review" className="" />}
      />

      {course.status === "rejected" && course.rejectionReason && (
        <Card className="mb-6 border-danger">
          <p className="text-sm">
            <strong>Changes requested:</strong> {course.rejectionReason}
          </p>
        </Card>
      )}
      {locks.reviewing ? (
        <Card className="mb-6">
          <p className="text-sm text-muted">This course is waiting for admin review. You can edit it again once it&apos;s decided.</p>
        </Card>
      ) : (
        course.status === "published" && (
          <Card className="mb-6">
            <p className="text-sm text-muted">
              Published: changes go live immediately.{" "}
              {enrolled > 0
                ? `${enrolled} student${enrolled === 1 ? " is" : "s are"} enrolled, so assessments and the pass mark are locked; lessons and details stay editable.`
                : "No one has enrolled yet, so everything is still editable."}
            </p>
          </Card>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Details</h2>
          {!locks.details ? (
            <ActionForm action={updateCourse.bind(null, id)} submit="Save details">
              <CourseFields course={course} locks={locks} />
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
                <li key={l.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {l.position}. {l.title}
                    </span>
                    {!locks.lessons && (
                      <ActionForm
                        action={removeItem.bind(null, id, "lesson", l.id)}
                        submit="Remove"
                        variant="danger"
                        className=""
                        confirm={`Remove the lesson "${l.title}"? This can't be undone.`}
                      />
                    )}
                  </div>
                  {!locks.lessons && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-sm text-brand">Edit lesson</summary>
                      <div className="mt-3">
                        <ActionForm action={updateLesson.bind(null, id, l.id)} submit="Save lesson">
                          <Field label="Title" name="title" defaultValue={l.title} required />
                          <Field as="textarea" label="Content" name="body" defaultValue={l.body} required rows={6} />
                          <Field label="Video link (optional)" name="videoUrl" type="url" defaultValue={l.videoUrl ?? ""} />
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ol>
            {!locks.lessons && (
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
                  {!locks.assessments && (
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
            {locks.assessments && !locks.reviewing && (
              <p className="mt-3 text-xs text-muted">Locked because students are enrolled and graded against these.</p>
            )}
            {!locks.assessments && (
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
