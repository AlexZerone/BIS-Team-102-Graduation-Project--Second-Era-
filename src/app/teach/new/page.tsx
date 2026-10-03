import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { CourseFields } from "../course-fields";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { createCourse } from "../actions";

export const generateMetadata = titled("New course");

export default async function NewCoursePage() {
  await requireRole("instructor");
  const t = await getT();
  return (
    <div className="max-w-2xl">
      <PageHeader title={t("New course")} subtitle={t("Start with the details. You'll add lessons and practical assessments next.")} />
      <Card>
        <ActionForm action={createCourse} submit={t("Create draft")}>
          <CourseFields />
        </ActionForm>
      </Card>
    </div>
  );
}
