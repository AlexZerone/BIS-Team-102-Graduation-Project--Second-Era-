import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { login } from "../auth-actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next ?? "/dashboard");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">Log in</h1>
      <p className="mb-6 text-muted">{next ? "Log in to continue where you left off." : "Welcome back."}</p>
      <Card>
        <ActionForm action={login} submit="Log in">
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        </ActionForm>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-brand hover:underline">
          Forgot your password?
        </Link>
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
