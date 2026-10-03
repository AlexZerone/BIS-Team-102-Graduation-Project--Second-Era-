import Link from "next/link";
import { findReset } from "@/server/password-reset";
import { ActionForm } from "@/components/action-form";
import { Card, Field, btn } from "@/components/ui";
import { completeReset } from "../../auth-actions";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  const valid = (await findReset(token)) !== null;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Choose a new password</h1>
      {valid ? (
        <Card>
          <ActionForm action={completeReset.bind(null, token)} submit="Save new password">
            <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters. You'll be signed out everywhere else." />
          </ActionForm>
        </Card>
      ) : (
        <Card className="space-y-4">
          <p>This reset link has expired or was already used.</p>
          <Link href="/forgot-password" className={btn.primary}>
            Request a new link
          </Link>
        </Card>
      )}
    </div>
  );
}
