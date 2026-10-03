import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { login } from "../auth-actions";

export const generateMetadata = titled("Log in");

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next ?? "/dashboard");
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">{t("Log in")}</h1>
      <p className="mb-6 text-muted">{next ? t("Log in to continue where you left off.") : t("Welcome back.")}</p>
      <Card>
        <ActionForm action={login} submit={t("Log in")}>
          {next && <input type="hidden" name="next" value={next} />}
          <Field label={t("Email")} name="email" type="email" autoComplete="email" required dir="ltr" />
          <Field label={t("Password")} name="password" type="password" autoComplete="current-password" required dir="ltr" />
        </ActionForm>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-brand hover:underline">
          {t("Forgot your password?")}
        </Link>
      </Card>
      <p className="mt-4 text-sm text-muted">
        {t("New here?")}{" "}
        <Link href="/register" className="text-brand hover:underline">
          {t("Create an account")}
        </Link>
      </p>
    </div>
  );
}
