import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, PageHeader } from "@/components/ui";
import { CourseFields } from "../course-fields";
import { createCourse } from "../actions";

export const metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requireRole("instructor");
  return (
    <div className="max-w-2xl">
      <PageHeader title="New course" subtitle="Start with the details. You'll add lessons and practical assessments next." />
      <Card>
        <ActionForm action={createCourse} submit="Create draft">
          <CourseFields />
        </ActionForm>
      </Card>
    </div>
  );
}
