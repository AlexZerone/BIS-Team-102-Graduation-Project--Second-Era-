import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { StudentDashboard } from "./student";
import { InstructorDashboard } from "./instructor";
import { CompanyDashboard } from "./company";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";

export const generateMetadata = titled("Dashboard");

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  const t = await getT();
  const welcome = t("Welcome, {name}", { name: user.name });

  if (user.status !== "active")
    return (
      <>
        <PageHeader title={welcome} />
        <Card>
          {user.status === "pending" ? (
            <p>{t("Your account is waiting for admin approval. You'll get full access as soon as it's reviewed.")}</p>
          ) : (
            <p>
              {t("Your application was not approved.")}{" "}
              {user.rejectionReason && (
                <>
                  {t("Reason:")} <bdi>{user.rejectionReason}</bdi>{" "}
                </>
              )}
              {t("Contact support if you think this is a mistake.")}
            </p>
          )}
        </Card>
      </>
    );

  return (
    <>
      <PageHeader title={welcome} />
      {user.role === "student" && <StudentDashboard userId={user.id} />}
      {user.role === "instructor" && <InstructorDashboard userId={user.id} />}
      {user.role === "company" && <CompanyDashboard userId={user.id} />}
    </>
  );
}
