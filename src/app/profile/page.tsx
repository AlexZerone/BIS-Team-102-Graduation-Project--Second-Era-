import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { changePassword, saveCompanyProfile, saveName, saveStudentProfile } from "./actions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireRole("student", "instructor", "company", "admin");

  let form: React.ReactNode;
  if (user.role === "student") {
    const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
    form = (
      <ActionForm action={saveStudentProfile} submit="Save profile">
        <Field label="Full name" name="name" defaultValue={user.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="University" name="university" defaultValue={p?.university ?? ""} />
          <Field label="Major" name="major" defaultValue={p?.major ?? ""} />
        </div>
        <Field label="Graduation year" name="graduationYear" type="number" min={1990} max={2100} defaultValue={p?.graduationYear ?? ""} />
        <Field as="textarea" label="About you" name="bio" defaultValue={p?.bio ?? ""} />
        <Field
          label={p?.resumePath ? "Replace resume (PDF)" : "Resume (PDF)"}
          name="resume"
          type="file"
          accept="application/pdf"
          hint={p?.resumePath ? "A resume is on file. Only companies you apply to can see it." : "Max 5 MB. Only companies you apply to can see it."}
        />
        {p?.resumePath && (
          <a href={`/api/resumes/${user.id}`} className="text-sm text-brand hover:underline">
            View current resume
          </a>
        )}
      </ActionForm>
    );
  } else if (user.role === "company") {
    const [c] = await db.select().from(companies).where(eq(companies.userId, user.id));
    form = (
      <ActionForm action={saveCompanyProfile} submit="Save profile">
        <Field label="Your name" name="name" defaultValue={user.name} required />
        <Field label="Company name" name="companyName" defaultValue={c.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" name="industry" defaultValue={c.industry ?? ""} />
          <Field label="Website" name="website" type="url" defaultValue={c.website ?? ""} />
        </div>
        <Field as="textarea" label="About the company" name="description" defaultValue={c.description ?? ""} />
      </ActionForm>
    );
  } else {
    form = (
      <ActionForm action={saveName} submit="Save">
        <Field label="Full name" name="name" defaultValue={user.name} required />
      </ActionForm>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" subtitle={user.email} />
      <Card>{form}</Card>
      <Card>
        <h2 className="mb-4 font-semibold">Change password</h2>
        <ActionForm action={changePassword} submit="Change password" resetOnSuccess>
          <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
          <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={8} required />
        </ActionForm>
      </Card>
    </div>
  );
}
