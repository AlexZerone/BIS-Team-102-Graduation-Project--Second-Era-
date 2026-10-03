import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses } from "@/db/schema";
import { CourseCard } from "@/components/course-card";
import { btn } from "@/components/ui";

const STEPS = [
  ["Learn what companies need", "Courses are built with industry partners around the skills interns actually use on day one."],
  ["Prove it with practical work", "Every course ends in hands-on assessments graded by an instructor, not multiple-choice quizzes."],
  ["Get hired on verified skills", "Pass and you earn a verifiable certificate that unlocks partner jobs and internships."],
];

export default async function Home() {
  const featured = await db
    .select({ course: courses, partner: companies.name })
    .from(courses)
    .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
    .where(eq(courses.status, "published"))
    .orderBy(desc(courses.createdAt))
    .limit(3);

  return (
    <div className="space-y-16">
      <section className="py-8 md:py-16">
        <p className="text-sm font-medium text-brand">Noktat Intilaq · Where your journey to the future begins</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Practical training that turns final-year students into hire-ready interns.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Second Era connects students and fresh graduates with company-backed courses and practical assessments, so
          companies spend less time and money onboarding, and you start contributing from day one.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className={btn.primary}>
            Create a free account
          </Link>
          <Link href="/courses" className={btn.secondary}>
            Browse courses
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="grid gap-4 md:grid-cols-3">
        <h2 id="how" className="sr-only">
          How it works
        </h2>
        {STEPS.map(([title, body], i) => (
          <div key={title} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-brand">Step {i + 1}</p>
            <h3 className="mt-1 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Latest courses</h2>
            <Link href="/courses" className="text-sm text-brand hover:underline">
              See all
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
        <h2 className="text-xl font-semibold">Hiring interns?</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Register as a company to post internships that require specific certificates. Applicants arrive pre-screened
          and ranked by their verified assessment scores.
        </p>
        <Link href="/register?role=company" className={`${btn.secondary} mt-4`}>
          Register your company
        </Link>
      </section>
    </div>
  );
}
