import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { resolveMessage } from "../actions";

export const generateMetadata = titled("Messages");

export default async function MessagesPage() {
  const [, t] = await Promise.all([requireRole("admin"), getT()]);
  const rows = await db.select().from(contactMessages).orderBy(contactMessages.status, desc(contactMessages.createdAt)).limit(200);
  return (
    <>
      <PageHeader title={t("Contact messages")} subtitle={t("Open messages first.")} />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((msg) => (
            <Card key={msg.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  <bdi>{msg.name}</bdi>{" "}
                  <a href={`mailto:${msg.email}`} className="text-sm font-normal text-brand hover:underline">
                    <bdi>{msg.email}</bdi>
                  </a>
                </p>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {t.date(msg.createdAt)} <Badge tone={msg.status === "open" ? "warn" : "neutral"}>{t.label(msg.status)}</Badge>
                </span>
              </div>
              <p className="prose-text mt-2 text-sm" dir="auto">
                {msg.message}
              </p>
              {msg.status === "open" && (
                <div className="mt-3">
                  <ActionForm action={resolveMessage.bind(null, msg.id)} submit={t("Mark resolved")} variant="secondary" className="" />
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Empty>{t("No messages.")}</Empty>
      )}
    </>
  );
}
