import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, courses } from "@/db/schema";
import { CourseCard } from "@/components/course-card";
import { Empty, PageHeader, btn } from "@/components/ui";

export const metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const rows = await db
    .select({ course: courses, partner: companies.name })
    .from(courses)
    .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
    .where(
      and(
        eq(courses.status, "published"),
        query ? or(ilike(courses.title, `%${query}%`), ilike(courses.summary, `%${query}%`)) : undefined,
      ),
    )
    .orderBy(desc(courses.createdAt));

  return (
    <>
      <PageHeader title="Courses" subtitle="Practical courses designed with industry partners. Pass the assessments to earn a verified certificate." />
      <form className="mb-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Search courses
        </label>
        <input id="q" name="q" defaultValue={query} placeholder="Search courses" className="w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2 text-sm" />
        <button className={btn.secondary}>Search</button>
      </form>
      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ course, partner }) => (
            <CourseCard key={course.id} course={course} partner={partner} />
          ))}
        </div>
      ) : (
        <Empty>No courses match your search.</Empty>
      )}
    </>
  );
}
