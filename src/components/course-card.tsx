import Link from "next/link";
import type { courses } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { getT } from "@/i18n/server";
import { Badge } from "./ui";

export async function CourseCard({ course, partner }: { course: typeof courses.$inferSelect; partner?: string | null }) {
  const t = await getT();
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex flex-col rounded-lg border border-line bg-surface p-5 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="flex flex-wrap gap-2">
        <Badge>{t.label(course.level)}</Badge>
        {course.requiredPlan !== "free" && <Badge tone="warn">{t(PLANS[course.requiredPlan].name)}</Badge>}
        {partner && (
          <Badge tone="brand">
            {t("with")} <bdi>{partner}</bdi>
          </Badge>
        )}
      </div>
      {/* Course content is in whatever language the instructor wrote it. */}
      <h3 className="mt-3 font-semibold" dir="auto">
        {course.title}
      </h3>
      <p className="mt-1 text-sm text-muted" dir="auto">
        {course.summary}
      </p>
    </Link>
  );
}
