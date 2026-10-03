import Link from "next/link";
import type { courses } from "@/db/schema";
import { PLANS } from "@/lib/plans";
import { Badge } from "./ui";

export function CourseCard({ course, partner }: { course: typeof courses.$inferSelect; partner?: string | null }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex flex-col rounded-lg border border-line bg-surface p-5 transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="flex flex-wrap gap-2">
        <Badge>{course.level}</Badge>
        {course.requiredPlan !== "free" && <Badge tone="warn">{PLANS[course.requiredPlan].name}</Badge>}
        {partner && <Badge tone="brand">with {partner}</Badge>}
      </div>
      <h3 className="mt-3 font-semibold">{course.title}</h3>
      <p className="mt-1 text-sm text-muted">{course.summary}</p>
    </Link>
  );
}
