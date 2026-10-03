import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { sendMessage } from "./actions";

export const generateMetadata = titled("Contact");

export default async function ContactPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  return (
    <div className="max-w-xl">
      <PageHeader
        title={t("Contact & support")}
        subtitle={t("Questions about courses, partnerships, or your account? We usually reply within two working days.")}
      />
      <Card>
        <ActionForm action={sendMessage} submit={t("Send message")} resetOnSuccess>
          <Field label={t("Name")} name="name" defaultValue={user?.name} required maxLength={100} autoComplete="name" />
          <Field label={t("Email")} name="email" type="email" defaultValue={user?.email} required autoComplete="email" dir="ltr" />
          <Field as="textarea" label={t("Message")} name="message" required maxLength={5000} rows={6} dir="auto" />
        </ActionForm>
      </Card>
    </div>
  );
}
