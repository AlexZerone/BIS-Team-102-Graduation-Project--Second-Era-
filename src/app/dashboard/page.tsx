import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { StudentDashboard } from "./student";
import { InstructorDashboard } from "./instructor";
import { CompanyDashboard } from "./company";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");

  if (user.status !== "active")
    return (
      <>
        <PageHeader title={`Welcome, ${user.name}`} />
        <Card>
          {user.status === "pending" ? (
            <p>
              Your {user.role} account is waiting for admin approval. You&apos;ll get full access as soon as it&apos;s
              reviewed.
            </p>
          ) : (
            <p>
              Your application was not approved{user.rejectionReason ? `: ${user.rejectionReason}` : "."} Contact
              support if you think this is a mistake.
            </p>
          )}
        </Card>
      </>
    );

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} />
      {user.role === "student" && <StudentDashboard userId={user.id} />}
      {user.role === "instructor" && <InstructorDashboard userId={user.id} />}
      {user.role === "company" && <CompanyDashboard userId={user.id} />}
    </>
  );
}
