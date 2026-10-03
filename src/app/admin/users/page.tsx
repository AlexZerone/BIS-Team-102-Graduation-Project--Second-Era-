import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole, type Role } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Badge, PageHeader, fmtDate } from "@/components/ui";
import { setSuspended } from "../actions";

export const metadata = { title: "Users" };

const ROLES: Role[] = ["student", "instructor", "company", "admin"];
const STATUS_TONE = { active: "brand", pending: "warn", rejected: "danger", suspended: "danger" } as const;

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireRole("admin");
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
      <PageHeader title="Users" subtitle={`${rows.length} shown`} />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label="Filter by role">
        {[undefined, ...ROLES].map((r) => (
          <Link
            key={r ?? "all"}
            href={r ? `/admin/users?role=${r}` : "/admin/users"}
            className={`rounded-full border px-3 py-1 ${filter === r ? "border-brand text-brand" : "border-line text-muted"}`}
          >
            {r ?? "all"}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  {u.name}
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                </td>
                <td className="p-3">{fmtDate(u.createdAt)}</td>
                <td className="p-3 text-right">
                  {u.role !== "admin" && u.status === "active" && (
                    <ActionForm
                      action={setSuspended.bind(null, u.id, true)}
                      submit="Suspend"
                      variant="danger"
                      className=""
                      confirm={`Suspend ${u.name}? They will be signed out and can't log in until reactivated.`}
                    />
                  )}
                  {u.status === "suspended" && <ActionForm action={setSuspended.bind(null, u.id, false)} submit="Reactivate" variant="secondary" className="" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
