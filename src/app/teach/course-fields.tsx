import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, users, type courses } from "@/db/schema";
import { PLANS, type Plan } from "@/lib/plans";
import { Field } from "@/components/ui";

type Locks = { title: boolean; passingScore: boolean };

export async function CourseFields({ course, locks }: { course?: typeof courses.$inferSelect; locks?: Locks }) {
  const partners = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .innerJoin(users, eq(users.id, companies.userId))
    .where(eq(users.status, "active"))
    .orderBy(asc(companies.name));
  return (
    <>
      <Field
        label="Title"
        name="title"
        defaultValue={course?.title}
        required
        maxLength={120}
        disabled={locks?.title}
        hint={locks?.title ? "Locked: certificates already show this title." : undefined}
      />
      <Field label="Summary" name="summary" defaultValue={course?.summary} required maxLength={200} hint="One line shown on the course card." />
      <Field as="textarea" label="Description" name="description" defaultValue={course?.description} required rows={6} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field as="select" label="Level" name="level" defaultValue={course?.level ?? "beginner"} options={[["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]]} />
        <Field as="select" label="Required plan" name="requiredPlan" defaultValue={course?.requiredPlan ?? "free"} options={(Object.keys(PLANS) as Plan[]).map((p) => [p, PLANS[p].name])} />
        <Field
          label="Pass mark (%)"
          name="passingScore"
          type="number"
          min={1}
          max={100}
          defaultValue={course?.passingScore ?? 70}
          required
          disabled={locks?.passingScore}
          hint={locks?.passingScore ? "Locked: students are enrolled." : undefined}
        />
      </div>
      <Field
        as="select"
        label="Industry partner"
        name="partnerCompanyId"
        defaultValue={course?.partnerCompanyId?.toString() ?? ""}
        options={[["", "None"], ...partners.map((p): [string, string] => [String(p.id), p.name])]}
        hint="The company that co-designed this course."
      />
    </>
  );
}
