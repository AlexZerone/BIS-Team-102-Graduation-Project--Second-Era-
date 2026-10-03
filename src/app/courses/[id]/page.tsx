import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assessments, certificates, companies, courses, enrollments, lessons, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, hasPlan } from "@/lib/plans";
import { studentPlan } from "@/server/learning";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { enrollAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">) {
  const [c] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, Number((await params).id) || 0), eq(courses.status, "published")));
  return { title: c?.title ?? (await getT())("Course") };
}

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const id = Number((await params).id);
  const [row] = Number.isInteger(id)
    ? await db
        .select({ course: courses, partner: companies.name, instructor: users.name })
        .from(courses)
        .innerJoin(users, eq(users.id, courses.instructorId))
        .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
        .where(eq(courses.id, id))
    : [];
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const canPreview = user && (user.role === "admin" || user.id === row?.course.instructorId);
  if (!row || (row.course.status !== "published" && !canPreview)) notFound();
  const { course, partner, instructor } = row;

  const [lessonList, tasks] = await Promise.all([
    db.select({ title: lessons.title }).from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.position)),
    db.select({ title: assessments.title, maxScore: assessments.maxScore }).from(assessments).where(eq(assessments.courseId, id)),
  ]);

  let cta: React.ReactNode = (
    <Link href={`/register`} className={btn.primary}>
      {t("Sign up to enroll")}
    </Link>
  );
  if (user?.role === "student" && user.status === "active") {
    const [[enrollment], [cert], plan] = await Promise.all([
      db.select().from(enrollments).where(and(eq(enrollments.courseId, id), eq(enrollments.studentId, user.id))),
      db.select().from(certificates).where(and(eq(certificates.courseId, id), eq(certificates.studentId, user.id))),
      studentPlan(user.id),
    ]);
    if (cert)
      cta = (
        <p className="text-sm">
          {t("You earned this certificate with {score}%.", { score: cert.score })}{" "}
          <Link className="text-brand hover:underline" href={`/verify/${cert.code}`}>
            {t("View certificate")}
          </Link>
        </p>
      );
    else if (enrollment)
      cta = (
        <Link href={`/learn/${id}`} className={btn.primary}>
          {t("Continue learning")}
        </Link>
      );
    else if (!hasPlan(plan, course.requiredPlan))
      cta = (
        <Link href="/plans" className={btn.primary}>
          {t("Upgrade to {plan} to enroll", { plan: t(PLANS[course.requiredPlan].name) })}
        </Link>
      );
    else cta = <ActionForm action={enrollAction.bind(null, id)} submit={t("Enroll")} />;
  } else if (user) cta = null;

  return (
    // Header, then the action panel, then details: on phones the Enroll button sits right
    // under the title; on desktop the panel spans both rows on the right and stays in view.
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[1fr_320px]">
      <header className="lg:col-start-1">
        {course.status !== "published" && (
          <p className="mb-4">
            <Badge tone="warn">{t("Preview: {status}", { status: t.label(course.status) })}</Badge>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge>{t.label(course.level)}</Badge>
          {course.requiredPlan !== "free" && <Badge tone="warn">{t("{plan} plan", { plan: t(PLANS[course.requiredPlan].name) })}</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight" dir="auto">
          {course.title}
        </h1>
        <p className="mt-2 text-muted">
          {t("By")} <bdi>{instructor}</bdi>
        </p>
        {partner && (
          <p className="mt-1 text-sm">
            {t("Designed with industry partner")} <strong><bdi>{partner}</bdi></strong>
          </p>
        )}
      </header>

      <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <Card>
          <h2 className="font-semibold">{t("Practical assessments")}</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {tasks.map((task) => (
              <li key={task.title}>
                <bdi>{task.title}</bdi> · {t("{n} pts", { n: task.maxScore })}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            {t("Score {score}% or more overall to earn a verified certificate.", { score: course.passingScore })}
          </p>
          {cta && <div className="mt-4">{cta}</div>}
        </Card>
      </aside>

      <div className="max-w-prose lg:col-start-1">
        <p className="prose-text" dir="auto">
          {course.description}
        </p>
        <h2 className="mt-8 text-lg font-semibold">{t("Lessons")}</h2>
        <ol className="mt-2 list-decimal space-y-1 ps-5">
          {lessonList.map((l) => (
            <li key={l.title} dir="auto">
              {l.title}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
