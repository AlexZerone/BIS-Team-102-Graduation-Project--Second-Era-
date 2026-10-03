import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/ui";
import { forgotPassword } from "../auth-actions";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-muted">Enter your account email and we&apos;ll send you a link to choose a new password.</p>
      <Card>
        <ActionForm action={forgotPassword} submit="Send reset link">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
        </ActionForm>
      </Card>
      {process.env.NODE_ENV !== "production" && (
        <p className="mt-4 text-xs text-muted">Development: the link is printed in the server log instead of emailed.</p>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
