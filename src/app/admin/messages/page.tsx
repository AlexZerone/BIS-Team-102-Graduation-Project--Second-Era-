import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Empty, PageHeader, fmtDate } from "@/components/ui";
import { resolveMessage } from "../actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireRole("admin");
  const rows = await db.select().from(contactMessages).orderBy(contactMessages.status, desc(contactMessages.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Contact messages" subtitle="Open messages first." />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {m.name} <a href={`mailto:${m.email}`} className="text-sm font-normal text-brand hover:underline">{m.email}</a>
                </p>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {fmtDate(m.createdAt)} <Badge tone={m.status === "open" ? "warn" : "neutral"}>{m.status}</Badge>
                </span>
              </div>
              <p className="prose-text mt-2 text-sm">{m.message}</p>
              {m.status === "open" && (
                <div className="mt-3">
                  <ActionForm action={resolveMessage.bind(null, m.id)} submit="Mark resolved" variant="secondary" className="" />
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Empty>No messages.</Empty>
      )}
    </>
  );
}
