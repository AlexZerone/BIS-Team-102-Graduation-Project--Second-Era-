import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { forgotPassword } from "../auth-actions";

export const generateMetadata = titled("Reset password");

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">{t("Reset your password")}</h1>
      <p className="mb-6 text-muted">{t("Enter your account email and we'll send you a link to choose a new password.")}</p>
      <Card>
        <ActionForm action={forgotPassword} submit={t("Send reset link")}>
          <Field label={t("Email")} name="email" type="email" autoComplete="email" required dir="ltr" />
        </ActionForm>
      </Card>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-4 text-xs text-muted">{t("Development: the link is printed in the server log instead of emailed.")}</p>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-brand hover:underline">
          {t("Back to log in")}
        </Link>
      </p>
    </div>
  );
}
