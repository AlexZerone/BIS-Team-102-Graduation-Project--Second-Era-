import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { assessments, courses, enrollments, submissions } from "@/db/schema";
import { Badge, Card, Empty, btn } from "@/components/ui";
import { STATUS_TONE } from "../teach/status";

export async function InstructorDashboard({ userId }: { userId: number }) {
  const [mine, toGrade, students] = await Promise.all([
    db.select().from(courses).where(eq(courses.instructorId, userId)).orderBy(desc(courses.createdAt)),
    db
      .select({ courseId: courses.id, n: count() })
      .from(submissions)
      .innerJoin(assessments, eq(assessments.id, submissions.assessmentId))
      .innerJoin(courses, eq(courses.id, assessments.courseId))
      .where(and(eq(courses.instructorId, userId), isNull(submissions.gradedAt)))
      .groupBy(courses.id),
    db
      .select({ courseId: enrollments.courseId, n: count() })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(courses.instructorId, userId))
      .groupBy(enrollments.courseId),
  ]);
  const n = (rows: { courseId: number; n: number }[], id: number) => rows.find((r) => r.courseId === id)?.n ?? 0;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">My courses</h2>
        <Link href="/teach/new" className={btn.primary}>
          New course
        </Link>
      </div>
      {mine.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-start text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 font-medium">Course</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Students</th>
                <th className="font-medium">To grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((c) => (
                <tr key={c.id}>
                  <td className="py-2">
                    <Link href={`/teach/${c.id}`} className="hover:text-brand">
                      {c.title}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </td>
                  <td>{n(students, c.id)}</td>
                  <td>
                    {n(toGrade, c.id) ? (
                      <Link href={`/teach/${c.id}/grade`} className="font-medium text-brand hover:underline">
                        {n(toGrade, c.id)} waiting
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <Empty>Create your first course. It goes live after an admin reviews it.</Empty>
        </div>
      )}
    </Card>
  );
}
