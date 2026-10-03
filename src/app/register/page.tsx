import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { register } from "../auth-actions";

export const metadata = { title: "Create account" };

const ROLES: [string, string][] = [
  ["student", "Student or recent graduate"],
  ["instructor", "Instructor (needs admin approval)"],
  ["company", "Company representative (needs admin approval)"],
];

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { role } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <Card>
        <ActionForm action={register} submit="Create account">
          <Field as="select" label="I am a" name="role" options={ROLES} defaultValue={typeof role === "string" ? role : "student"} />
          <Field label="Full name" name="name" autoComplete="name" required />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
          <Field label="Company name" name="companyName" hint="Only for company representatives." />
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
