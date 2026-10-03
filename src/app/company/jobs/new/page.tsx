import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { createJob } from "../../actions";

export const generateMetadata = titled("Post a job");

export default async function NewJobPage() {
  await requireRole("company");
  const t = await getT();
  const published = await db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.status, "published")).orderBy(asc(courses.title));
  return (
    <div className="max-w-2xl">
      <PageHeader title={t("Post a job")} subtitle={t("Require certificates and only verified students can apply. You'll see them ranked by score.")} />
      <Card>
        <ActionForm action={createJob} submit={t("Publish job")}>
          <Field label={t("Title")} name="title" required maxLength={120} dir="auto" />
          <Field as="textarea" label={t("Description")} name="description" required rows={6} dir="auto" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              as="select"
              label={t("Type")}
              name="type"
              options={(["internship", "full_time", "part_time"] as const).map((v): [string, string] => [v, t.label(v)])}
            />
            <Field label={t("Location")} name="location" placeholder={t("Cairo (hybrid)")} dir="auto" />
            <Field label={t("Apply by (optional)")} name="deadline" type="date" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium">{t("Required certificates")}</legend>
            <p className="text-xs text-muted">{t("Leave empty to accept any student.")}</p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {published.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="requiredCourses" value={c.id} className="accent-brand" />
                  <bdi>{c.title}</bdi>
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </Card>
    </div>
  );
}
