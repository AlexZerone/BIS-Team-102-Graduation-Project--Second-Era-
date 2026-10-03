import Link from "next/link";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLog, certificates, companies, courses, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Empty, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { m, type T } from "@/i18n/translate";
import { reviewCourse, reviewUser } from "./actions";

export const generateMetadata = titled("Admin");

// Readable names for audit log action codes.
const AUDIT_ACTIONS: Record<string, string> = {
  "user.approve": m("approved an account"),
  "user.reject": m("rejected an account"),
  "user.suspend": m("suspended a user"),
  "user.reactivate": m("reactivated a user"),
  "course.approve": m("published a course"),
  "course.reject": m("sent a course back"),
  "course.edit": m("edited a published course"),
  "message.resolve": m("resolved a message"),
};

function Review({ t, approve, reject }: { t: T; approve: Parameters<typeof ActionForm>[0]["action"]; reject: Parameters<typeof ActionForm>[0]["action"] }) {
  return (
    <div className="mt-3 flex flex-wrap items-start gap-3">
      <ActionForm action={approve} submit={t("Approve")} className="" />
      <details>
        <summary className="cursor-pointer py-2 text-sm text-danger">{t("Reject…")}</summary>
        <ActionForm action={reject} submit={t("Confirm rejection")} variant="danger" className="mt-2 space-y-2">
          <Field label={t("Reason (shown to the applicant)")} name="reason" required maxLength={1000} dir="auto" />
        </ActionForm>
      </details>
    </div>
  );
}

export default async function AdminPage() {
  await requireRole("admin");
  const [t, byRole, [published], [certs], [apps], [hires], pendingUsers, pendingCourses, log] = await Promise.all([
    getT(),
    db.select({ role: users.role, n: count() }).from(users).where(eq(users.status, "active")).groupBy(users.role),
    db.select({ n: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ n: count() }).from(certificates),
    db.select({ n: count() }).from(applications),
    db.select({ n: count() }).from(applications).where(eq(applications.status, "hired")),
    db
      .select({ user: users, company: companies.name })
      .from(users)
      .leftJoin(companies, eq(companies.userId, users.id))
      .where(and(eq(users.status, "pending"), inArray(users.role, ["instructor", "company"])))
      .orderBy(users.createdAt),
    db
      .select({ course: courses, instructor: users.name })
      .from(courses)
      .innerJoin(users, eq(users.id, courses.instructorId))
      .where(eq(courses.status, "pending"))
      .orderBy(courses.createdAt),
    db.select({ entry: auditLog, actor: users.name }).from(auditLog).leftJoin(users, eq(users.id, auditLog.actorId)).orderBy(desc(auditLog.createdAt)).limit(15),
  ]);
  const roleCount = (r: string) => byRole.find((x) => x.role === r)?.n ?? 0;
  const stats: [string, number][] = [
    [t("Students"), roleCount("student")],
    [t("Instructors"), roleCount("instructor")],
    [t("Companies"), roleCount("company")],
    [t("Published courses"), published.n],
    [t("Certificates issued"), certs.n],
    [t("Applications"), apps.n],
    [t("Hires"), hires.n],
  ];

  return (
    <>
      <PageHeader title={t("Admin")} subtitle={t("Approvals, platform activity, and the training-to-hiring funnel.")} />
      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{t.num(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("Pending accounts ({n})", { n: pendingUsers.length })}</h2>
          {pendingUsers.length ? (
            <div className="space-y-3">
              {pendingUsers.map(({ user, company }) => (
                <Card key={user.id}>
                  <p className="font-medium">
                    <bdi>{user.name}</bdi> <span className="text-sm font-normal text-muted">· {t.label(user.role)}</span>
                  </p>
                  <p className="text-sm text-muted">
                    <bdi>{user.email}</bdi>
                    {company && (
                      <>
                        {" · "}
                        <bdi>{company}</bdi>
                      </>
                    )}{" "}
                    · {t("registered {date}", { date: t.date(user.createdAt) })}
                  </p>
                  <Review t={t} approve={reviewUser.bind(null, user.id, "approve")} reject={reviewUser.bind(null, user.id, "reject")} />
                </Card>
              ))}
            </div>
          ) : (
            <Empty>{t("No accounts waiting.")}</Empty>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("Courses awaiting review ({n})", { n: pendingCourses.length })}</h2>
          {pendingCourses.length ? (
            <div className="space-y-3">
              {pendingCourses.map(({ course, instructor }) => (
                <Card key={course.id}>
                  <p className="font-medium">
                    <Link href={`/courses/${course.id}`} className="hover:text-brand" dir="auto">
                      {course.title}
                    </Link>
                  </p>
                  <p className="text-sm text-muted">
                    {t("By")} <bdi>{instructor}</bdi> · <bdi>{course.summary}</bdi>
                  </p>
                  <Review t={t} approve={reviewCourse.bind(null, course.id, "approve")} reject={reviewCourse.bind(null, course.id, "reject")} />
                </Card>
              ))}
            </div>
          ) : (
            <Empty>{t("No courses waiting.")}</Empty>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{t("Recent admin activity")}</h2>
        {log.length ? (
          <Card>
            <ul className="divide-y divide-line text-sm">
              {log.map(({ entry, actor }) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    <strong>
                      <bdi>{actor ?? t("deleted user")}</bdi>
                    </strong>{" "}
                    {t(AUDIT_ACTIONS[entry.action] ?? entry.action)}{" "}
                    <code className="font-mono text-xs" dir="ltr">
                      {entry.target}
                    </code>
                  </span>
                  <span className="text-muted">{t.date(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Empty>{t("No activity yet.")}</Empty>
        )}
      </section>
    </>
  );
}
