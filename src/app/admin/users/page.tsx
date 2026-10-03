import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole, type Role } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, PageHeader } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";
import { setSuspended } from "../actions";

export const generateMetadata = titled("Users");

const ROLES: Role[] = ["student", "instructor", "company", "admin"];
const STATUS_TONE = { active: "brand", pending: "warn", rejected: "danger", suspended: "danger" } as const;

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const [, t] = await Promise.all([requireRole("admin"), getT()]);
  const { role } = await searchParams;
  const filter = ROLES.find((r) => r === role);
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt })
    .from(users)
    .where(filter ? eq(users.role, filter) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(500);

  return (
    <>
      <PageHeader title={t("Users")} subtitle={t("{n} shown", { n: rows.length })} />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label={t("Filter by role")}>
        {[undefined, ...ROLES].map((r) => (
          <Link
            key={r ?? "all"}
            href={r ? `/admin/users?role=${r}` : "/admin/users"}
            aria-current={filter === r ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${filter === r ? "border-brand text-brand" : "border-line text-muted"}`}
          >
            {r ? t.label(r) : t("All")}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3 text-start font-medium">{t("Name")}</th>
              <th className="p-3 text-start font-medium">{t("Role")}</th>
              <th className="p-3 text-start font-medium">{t("Status")}</th>
              <th className="p-3 text-start font-medium">{t("Joined")}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <bdi>{u.name}</bdi>
                  <div className="text-xs text-muted">
                    <bdi>{u.email}</bdi>
                  </div>
                </td>
                <td className="p-3">{t.label(u.role)}</td>
                <td className="p-3">
                  <Badge tone={STATUS_TONE[u.status]}>{t.label(u.status)}</Badge>
                </td>
                <td className="p-3">{t.date(u.createdAt)}</td>
                <td className="p-3 text-end">
                  {u.role !== "admin" && u.status === "active" && (
                    <ActionForm
                      action={setSuspended.bind(null, u.id, true)}
                      submit={t("Suspend")}
                      variant="danger"
                      className=""
                      confirm={t("Suspend {name}? They will be signed out and can't log in until reactivated.", { name: u.name })}
                    />
                  )}
                  {u.status === "suspended" && (
                    <ActionForm action={setSuspended.bind(null, u.id, false)} submit={t("Reactivate")} variant="secondary" className="" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
