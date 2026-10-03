import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { createJob } from "../../actions";

export const metadata = { title: "Post a job" };

export default async function NewJobPage() {
  await requireRole("company");
  const published = await db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "published")).orderBy(asc(courses.title));
  return (
    <div className="max-w-2xl">
      <PageHeader title="Post a job" subtitle="Require certificates and only verified students can apply. You'll see them ranked by score." />
      <Card>
        <ActionForm action={createJob} submit="Publish job">
          <Field label="Title" name="title" required maxLength={120} />
          <Field as="textarea" label="Description" name="description" required rows={6} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field as="select" label="Type" name="type" options={[["internship", "Internship"], ["full_time", "Full-time"], ["part_time", "Part-time"]]} />
            <Field label="Location" name="location" placeholder="Cairo (hybrid)" />
            <Field label="Apply by (optional)" name="deadline" type="date" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Required certificates</legend>
            <p className="text-xs text-muted">Leave empty to accept any student.</p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {published.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="requiredCourses" value={c.id} className="accent-brand" />
                  {c.title}
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </Card>
    </div>
  );
}
