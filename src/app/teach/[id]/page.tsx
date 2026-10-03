import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, lessons } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Field, PageHeader } from "@/components/ui";
import { ownCourseWithLocks } from "@/server/courses";
import { DomainError } from "@/server/errors";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { CourseFields } from "../course-fields";
import { STATUS_TONE } from "../status";
import { addAssessment, addLesson, removeItem, submitForReview, updateCourse, updateLesson } from "../actions";

export const generateMetadata = titled("Edit course");

export default async function EditCoursePage({ params }: PageProps<"/teach/[id]">) {
  const [user, t] = await Promise.all([requireRole("instructor"), getT()]);
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
            <Badge tone={STATUS_TONE[course.status]}>{t.label(course.status)}</Badge>
            <Link href={`/courses/${id}`} className="text-brand hover:underline">
              {t("Preview")}
            </Link>
            <Link href={`/teach/${id}/grade`} className="text-brand hover:underline">
              {t("Grade submissions")}
            </Link>
          </span>
        }
        action={canSubmit && <ActionForm action={submitForReview.bind(null, id)} submit={t("Submit for review")} className="" />}
      />

      {course.status === "rejected" && course.rejectionReason && (
        <Card className="mb-6 border-danger">
          <p className="text-sm">
            <strong>{t("Changes requested:")}</strong> <bdi>{course.rejectionReason}</bdi>
          </p>
        </Card>
      )}
      {locks.reviewing ? (
        <Card className="mb-6">
          <p className="text-sm text-muted">{t("This course is waiting for admin review. You can edit it again once it's decided.")}</p>
        </Card>
      ) : (
        course.status === "published" && (
          <Card className="mb-6">
            <p className="text-sm text-muted">
              {t("Published: changes go live immediately.")}{" "}
              {enrolled > 0
                ? t("Students enrolled: {n}. Assessments and the pass mark are locked; lessons and details stay editable.", { n: enrolled })
                : t("No one has enrolled yet, so everything is still editable.")}
            </p>
          </Card>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">{t("Details")}</h2>
          {!locks.details ? (
            <ActionForm action={updateCourse.bind(null, id)} submit={t("Save details")}>
              <CourseFields course={course} locks={locks} />
            </ActionForm>
          ) : (
            <p className="prose-text text-sm" dir="auto">
              {course.description}
            </p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold">{t("Lessons")}</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {lessonList.map((l) => (
                <li key={l.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {l.position}. <bdi>{l.title}</bdi>
                    </span>
                    {!locks.lessons && (
                      <ActionForm
                        action={removeItem.bind(null, id, "lesson", l.id)}
                        submit={t("Remove")}
                        variant="danger"
                        className=""
                        confirm={t("Remove the lesson “{title}”? This can't be undone.", { title: l.title })}
                      />
                    )}
                  </div>
                  {!locks.lessons && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-sm text-brand">{t("Edit lesson")}</summary>
                      <div className="mt-3">
                        <ActionForm action={updateLesson.bind(null, id, l.id)} submit={t("Save lesson")}>
                          <LessonFields t={t} lesson={l} />
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ol>
            {!locks.lessons && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand">{t("Add a lesson")}</summary>
                <div className="mt-3">
                  <ActionForm action={addLesson.bind(null, id)} submit={t("Add lesson")} resetOnSuccess>
                    <LessonFields t={t} />
                  </ActionForm>
                </div>
              </details>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">{t("Practical assessments")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-2">
                  <span>
                    <bdi>{task.title}</bdi> · {t("{n} pts", { n: task.maxScore })}
                  </span>
                  {!locks.assessments && (
                    <ActionForm
                      action={removeItem.bind(null, id, "assessment", task.id)}
                      submit={t("Remove")}
                      variant="danger"
                      className=""
                      confirm={t("Remove the assessment “{title}”? This can't be undone.", { title: task.title })}
                    />
                  )}
                </li>
              ))}
            </ul>
            {locks.assessments && !locks.reviewing && (
              <p className="mt-3 text-xs text-muted">{t("Locked because students are enrolled and graded against these.")}</p>
            )}
            {!locks.assessments && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand">{t("Add an assessment")}</summary>
                <div className="mt-3">
                  <ActionForm action={addAssessment.bind(null, id)} submit={t("Add assessment")} resetOnSuccess>
                    <Field label={t("Title")} name="title" required dir="auto" />
                    <Field
                      as="textarea"
                      label={t("Instructions")}
                      name="instructions"
                      required
                      dir="auto"
                      hint={t("What the student must deliver, and how you'll grade it.")}
                    />
                    <Field label={t("Max score")} name="maxScore" type="number" min={1} max={1000} defaultValue={100} required />
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

function LessonFields({ t, lesson }: { t: Awaited<ReturnType<typeof getT>>; lesson?: typeof lessons.$inferSelect }) {
  return (
    <>
      <Field label={t("Title")} name="title" defaultValue={lesson?.title} required dir="auto" />
      <Field as="textarea" label={t("Content")} name="body" defaultValue={lesson?.body} required rows={6} dir="auto" />
      <Field label={t("Video link (optional)")} name="videoUrl" type="url" defaultValue={lesson?.videoUrl ?? ""} dir="ltr" />
    </>
  );
}
