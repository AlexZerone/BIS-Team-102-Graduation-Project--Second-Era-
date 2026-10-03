import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { login } from "../auth-actions";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <Card>
        <ActionForm action={login} submit="Log in">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        </ActionForm>
      </Card>
      <p className="mt-4 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
