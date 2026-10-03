import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { register } from "../auth-actions";

export const metadata = { title: "Create account" };

const ROLES = [
  ["student", "I'm a student or recent graduate", "Take courses, earn verified certificates, apply to jobs. Ready right away."],
  ["instructor", "I teach", "Build practical courses and grade students' work. An admin reviews new instructors first."],
  ["company", "I'm hiring", "Post internships and see certified applicants ranked by score. An admin reviews new companies first."],
] as const;

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  const chosen = ROLES.some(([r]) => r === role) ? role : "student";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <Card>
        <ActionForm action={register} submit="Create account">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Who are you?</legend>
            {ROLES.map(([value, title, detail]) => (
              <label
                key={value}
                className="flex cursor-pointer gap-3 rounded-md border border-field p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
              >
                <input type="radio" name="role" value={value} defaultChecked={value === chosen} className="mt-1 accent-brand" />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-xs text-muted">{detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="company-only">
            <Field label="Company name" name="companyName" autoComplete="organization" />
          </div>
          <Field label="Full name" name="name" autoComplete="name" required />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
        </ActionForm>
      </Card>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
