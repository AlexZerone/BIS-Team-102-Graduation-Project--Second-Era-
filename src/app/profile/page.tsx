import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { changePassword, saveCompanyProfile, saveName, saveStudentProfile } from "./actions";

export const generateMetadata = titled("Profile");

export default async function ProfilePage() {
  const [user, t] = await Promise.all([requireRole("student", "instructor", "company", "admin"), getT()]);

  let form: React.ReactNode;
  if (user.role === "student") {
    const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    form = (
      <ActionForm action={saveStudentProfile} submit={t("Save profile")}>
        <Field label={t("Full name")} name="name" defaultValue={user.name} required dir="auto" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("University")} name="university" defaultValue={p?.university ?? ""} dir="auto" />
          <Field label={t("Major")} name="major" defaultValue={p?.major ?? ""} dir="auto" />
        </div>
        <Field label={t("Graduation year")} name="graduationYear" type="number" min={1990} max={2100} defaultValue={p?.graduationYear ?? ""} />
        <Field as="textarea" label={t("About you")} name="bio" defaultValue={p?.bio ?? ""} dir="auto" />
        <Field
          label={p?.resumePath ? t("Replace resume (PDF)") : t("Resume (PDF)")}
          name="resume"
          type="file"
          accept="application/pdf"
          hint={p?.resumePath ? t("A resume is on file. Only companies you apply to can see it.") : t("Max 5 MB. Only companies you apply to can see it.")}
        />
        {p?.resumePath && (
          <a href={`/api/resumes/${user.id}`} className="text-sm text-brand hover:underline">
            {t("View current resume")}
          </a>
        )}
      </ActionForm>
    );
  } else if (user.role === "company") {
    const [c] = await db.select().from(companies).where(eq(companies.userId, user.id));
    form = (
      <ActionForm action={saveCompanyProfile} submit={t("Save profile")}>
        <Field label={t("Your name")} name="name" defaultValue={user.name} required dir="auto" />
        <Field label={t("Company name")} name="companyName" defaultValue={c.name} required dir="auto" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Industry")} name="industry" defaultValue={c.industry ?? ""} dir="auto" />
          <Field label={t("Website")} name="website" type="url" defaultValue={c.website ?? ""} dir="ltr" />
        </div>
        <Field as="textarea" label={t("About the company")} name="description" defaultValue={c.description ?? ""} dir="auto" />
      </ActionForm>
    );
  } else {
    form = (
      <ActionForm action={saveName} submit={t("Save")}>
        <Field label={t("Full name")} name="name" defaultValue={user.name} required dir="auto" />
      </ActionForm>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("Profile")} subtitle={<bdi>{user.email}</bdi>} />
      <Card>{form}</Card>
      <Card>
        <h2 className="mb-4 font-semibold">{t("Change password")}</h2>
        <ActionForm action={changePassword} submit={t("Change password")} resetOnSuccess>
          <Field label={t("Current password")} name="current" type="password" autoComplete="current-password" required dir="ltr" />
          <Field label={t("New password")} name="next" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
        </ActionForm>
      </Card>
    </div>
  );
}
