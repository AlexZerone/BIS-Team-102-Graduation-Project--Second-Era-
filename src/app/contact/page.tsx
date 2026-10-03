import { getCurrentUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { sendMessage } from "./actions";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="max-w-xl">
      <PageHeader title="Contact & support" subtitle="Questions about courses, partnerships, or your account? We usually reply within two working days." />
      <Card>
        <ActionForm action={sendMessage} submit="Send message" resetOnSuccess>
          <Field label="Name" name="name" defaultValue={user?.name} required maxLength={100} />
          <Field label="Email" name="email" type="email" defaultValue={user?.email} required />
          <Field as="textarea" label="Message" name="message" required maxLength={5000} rows={6} />
        </ActionForm>
      </Card>
    </div>
  );
}
