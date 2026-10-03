import Link from "next/link";
import type { Metadata } from "next";
import { findReset } from "@/server/password-reset";
import { ActionForm } from "@/components/action-form";
import { Card, Field, btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { completeReset } from "../../auth-actions";

// no-referrer: the token is in the URL, so don't leak it to other sites.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Choose a new password"), referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  const [valid, t] = await Promise.all([findReset(token).then((id) => id !== null), getT()]);
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">{t("Choose a new password")}</h1>
      {valid ? (
        <Card>
          <ActionForm action={completeReset.bind(null, token)} submit={t("Save new password")}>
            <Field
              label={t("New password")}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              dir="ltr"
              hint={t("At least 8 characters. You'll be signed out everywhere else.")}
            />
          </ActionForm>
        </Card>
      ) : (
        <Card className="space-y-4">
          <p>{t("This reset link has expired or was already used.")}</p>
          <Link href="/forgot-password" className={btn.primary}>
            {t("Request a new link")}
          </Link>
        </Card>
      )}
    </div>
  );
}
