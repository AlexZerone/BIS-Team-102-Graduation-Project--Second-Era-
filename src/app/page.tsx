import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { companies, courses } from "@/db/schema";
import { CourseCard } from "@/components/course-card";
import { btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { m } from "@/i18n/translate";

const STEPS = [
  [m("Learn what companies need"), m("Courses are built with industry partners around the skills interns actually use on day one.")],
  [m("Prove it with practical work"), m("Every course ends in hands-on assessments graded by an instructor, not multiple-choice quizzes.")],
  [m("Get hired on verified skills"), m("Pass and you earn a verifiable certificate that unlocks partner jobs and internships.")],
];

export default async function Home() {
  // The landing page is for visitors; signed-in users get their own home.
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const [featured, t] = await Promise.all([
    db
      .select({ course: courses, partner: companies.name })
      .from(courses)
      .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
      .where(eq(courses.status, "published"))
      .orderBy(desc(courses.createdAt))
      .limit(3),
    getT(),
  ]);

  return (
    <div className="space-y-16">
      <section className="py-8 md:py-16">
        <p className="text-sm font-medium text-brand">{t("Noktat Intilaq · Where your journey to the future begins")}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          {t("Practical training that turns final-year students into hire-ready interns.")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          {t(
            "Second Era connects students and fresh graduates with company-backed courses and practical assessments, so companies spend less time and money onboarding, and you start contributing from day one.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className={btn.primary}>
            {t("Create a free account")}
          </Link>
          <Link href="/courses" className={btn.secondary}>
            {t("Browse courses")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="grid gap-4 md:grid-cols-3">
        <h2 id="how" className="sr-only">
          {t("How it works")}
        </h2>
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-brand">{t("Step {n}", { n: i + 1 })}</p>
            <h3 className="mt-1 font-semibold">{t(title)}</h3>
            <p className="mt-2 text-sm text-muted">{t(body)}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">{t("Latest courses")}</h2>
            <Link href="/courses" className="text-sm text-brand hover:underline">
              {t("See all")}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map(({ course, partner }) => (
              <CourseCard key={course.id} course={course} partner={partner} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-line bg-surface p-6 md:p-8">
        <h2 className="text-xl font-semibold">{t("Hiring interns?")}</h2>
        <p className="mt-2 max-w-2xl text-muted">
          {t(
            "Register as a company to post internships that require specific certificates. Applicants arrive pre-screened and ranked by their verified assessment scores.",
          )}
        </p>
        <Link href="/register?role=company" className={`${btn.secondary} mt-4`}>
          {t("Register your company")}
        </Link>
      </section>
    </div>
  );
}
