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
import { enrollAction } from "./actions";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">) {
  const [c] = await db
    .select({ title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, Number((await params).id) || 0), eq(courses.status, "published")));
  return { title: c?.title ?? "Course" };
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
  const user = await getCurrentUser();
  const canPreview = user && (user.role === "admin" || user.id === row?.course.instructorId);
  if (!row || (row.course.status !== "published" && !canPreview)) notFound();
  const { course, partner, instructor } = row;

  const [lessonList, tasks] = await Promise.all([
    db.select({ title: lessons.title }).from(lessons).where(eq(lessons.courseId, id)).orderBy(asc(lessons.position)),
    db.select({ title: assessments.title, maxScore: assessments.maxScore }).from(assessments).where(eq(assessments.courseId, id)),
  ]);

  let cta: React.ReactNode = (
    <Link href={`/register`} className={btn.primary}>
      Sign up to enroll
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
          You earned this certificate with <strong>{cert.score}%</strong>.{" "}
          <Link className="text-brand hover:underline" href={`/verify/${cert.code}`}>
            View certificate
          </Link>
        </p>
      );
    else if (enrollment)
      cta = (
        <Link href={`/learn/${id}`} className={btn.primary}>
          Continue learning
        </Link>
      );
    else if (!hasPlan(plan, course.requiredPlan))
      cta = (
        <Link href="/plans" className={btn.primary}>
          Upgrade to {PLANS[course.requiredPlan].name} to enroll
        </Link>
      );
    else cta = <ActionForm action={enrollAction.bind(null, id)} submit="Enroll" />;
  } else if (user) cta = null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <article>
        {course.status !== "published" && (
          <p className="mb-4">
            <Badge tone="warn">Preview: {course.status}</Badge>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge>{course.level}</Badge>
          <Badge tone={course.requiredPlan === "free" ? "neutral" : "warn"}>{PLANS[course.requiredPlan].name} plan</Badge>
          {partner && <Badge tone="brand">Designed with {partner}</Badge>}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-2 text-muted">By {instructor}</p>
        <p className="prose-text mt-6">{course.description}</p>

        <h2 className="mt-8 text-lg font-semibold">Lessons</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {lessonList.map((l) => (
            <li key={l.title}>{l.title}</li>
          ))}
        </ol>
      </article>

      <aside className="space-y-4">
        <Card>
          <h2 className="font-semibold">Practical assessments</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {tasks.map((t) => (
              <li key={t.title}>
                {t.title} · {t.maxScore} pts
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            Score <strong>{course.passingScore}%</strong> or more overall to earn a verified certificate.
          </p>
          {cta && <div className="mt-4">{cta}</div>}
        </Card>
      </aside>
    </div>
  );
}
