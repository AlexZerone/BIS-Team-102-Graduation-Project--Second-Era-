import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, users, type courses } from "@/db/schema";
import { PLANS, type Plan } from "@/lib/plans";
import { Field } from "@/components/ui";
import { getT } from "@/i18n/server";

type Locks = { title: boolean; passingScore: boolean };

export async function CourseFields({ course, locks }: { course?: typeof courses.$inferSelect; locks?: Locks }) {
  const [t, partners] = await Promise.all([
    getT(),
    db
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .innerJoin(users, eq(users.id, companies.userId))
      .where(eq(users.status, "active"))
      .orderBy(asc(companies.name)),
  ]);
  return (
    <>
      <Field
        label={t("Title")}
        name="title"
        defaultValue={course?.title}
        required
        maxLength={120}
        dir="auto"
        disabled={locks?.title}
        hint={locks?.title ? t("Locked: certificates already show this title.") : undefined}
      />
      <Field label={t("Summary")} name="summary" defaultValue={course?.summary} required maxLength={200} dir="auto" hint={t("One line shown on the course card.")} />
      <Field as="textarea" label={t("Description")} name="description" defaultValue={course?.description} required rows={6} dir="auto" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          as="select"
          label={t("Level")}
          name="level"
          defaultValue={course?.level ?? "beginner"}
          options={(["beginner", "intermediate", "advanced"] as const).map((v): [string, string] => [v, t.label(v)])}
        />
        <Field
          as="select"
          label={t("Required plan")}
          name="requiredPlan"
          defaultValue={course?.requiredPlan ?? "free"}
          options={(Object.keys(PLANS) as Plan[]).map((p): [string, string] => [p, t(PLANS[p].name)])}
        />
        <Field
          label={t("Pass mark (%)")}
          name="passingScore"
          type="number"
          min={1}
          max={100}
          defaultValue={course?.passingScore ?? 70}
          required
          disabled={locks?.passingScore}
          hint={locks?.passingScore ? t("Locked: students are enrolled.") : undefined}
        />
      </div>
      <Field
        as="select"
        label={t("Industry partner")}
        name="partnerCompanyId"
        defaultValue={course?.partnerCompanyId?.toString() ?? ""}
        options={[["", t("None")], ...partners.map((p): [string, string] => [String(p.id), p.name])]}
        hint={t("The company that co-designed this course.")}
      />
    </>
  );
}
