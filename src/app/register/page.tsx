import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { m } from "@/i18n/translate";
import { register } from "../auth-actions";

export const generateMetadata = titled("Create account");

const ROLES = [
  ["student", m("I'm a student or recent graduate"), m("Take courses, earn verified certificates, apply to jobs. Ready right away.")],
  ["instructor", m("I teach"), m("Build practical courses and grade students' work. An admin reviews new instructors first.")],
  ["company", m("I'm hiring"), m("Post internships and see certified applicants ranked by score. An admin reviews new companies first.")],
] as const;

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const t = await getT();
  const { role } = await searchParams;
  const chosen = ROLES.some(([r]) => r === role) ? role : "student";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">{t("Create your account")}</h1>
      <Card>
        <ActionForm action={register} submit={t("Create account")}>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("Who are you?")}</legend>
            {ROLES.map(([value, title, detail]) => (
              <label
                key={value}
                className="flex cursor-pointer gap-3 rounded-md border border-field p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
              >
                <input type="radio" name="role" value={value} defaultChecked={value === chosen} className="mt-1 accent-brand" />
                <span>
                  <span className="block text-sm font-medium">{t(title)}</span>
                  <span className="block text-xs text-muted">{t(detail)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="company-only">
            <Field label={t("Company name")} name="companyName" autoComplete="organization" dir="auto" />
          </div>
          <Field label={t("Full name")} name="name" autoComplete="name" required dir="auto" />
          <Field label={t("Email")} name="email" type="email" autoComplete="email" required dir="ltr" />
          <Field
            label={t("Password")}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            dir="ltr"
            hint={t("At least 8 characters.")}
          />
        </ActionForm>
      </Card>
      <p className="mt-4 text-sm text-muted">
        {t("Already have an account?")}{" "}
        <Link href="/login" className="text-brand hover:underline">
          {t("Log in")}
        </Link>
      </p>
    </div>
  );
}
