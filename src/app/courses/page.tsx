import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses } from "@/db/schema";
import { CourseCard } from "@/components/course-card";
import { Empty, PageHeader, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";

export const generateMetadata = titled("Courses");

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const [rows, t] = await Promise.all([
    db
      .select({ course: courses, partner: companies.name })
      .from(courses)
      .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
      .where(
        and(
          eq(courses.status, "published"),
          query ? or(ilike(courses.title, `%${query}%`), ilike(courses.summary, `%${query}%`)) : undefined,
        ),
      )
      .orderBy(desc(courses.createdAt)),
    getT(),
  ]);

  return (
    <>
      <PageHeader
        title={t("Courses")}
        subtitle={t("Practical courses designed with industry partners. Pass the assessments to earn a verified certificate.")}
      />
      <form className="mb-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          {t("Search courses")}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder={t("Search courses")}
          type="search"
          dir="auto"
          className="w-full max-w-sm rounded-md border border-field bg-surface px-3 py-2 text-base sm:text-sm"
        />
        <button className={btn.secondary}>{t("Search")}</button>
      </form>
      <h2 className="sr-only">{query ? t("Results for “{query}”", { query }) : t("All courses")}</h2>
      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ course, partner }) => (
            <CourseCard key={course.id} course={course} partner={partner} />
          ))}
        </div>
      ) : (
        <Empty>
          {t("No courses match “{query}”.", { query })}{" "}
          <Link href="/courses" className="text-brand hover:underline">
            {t("Clear search")}
          </Link>
        </Empty>
      )}
    </>
  );
}
