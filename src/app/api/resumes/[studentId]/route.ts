import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, companies, jobs, studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readStored } from "@/server/storage";

/** Resumes are private: the student, admins, and companies the student applied to. */
export async function GET(_: Request, { params }: RouteContext<"/api/resumes/[studentId]">) {
  const studentId = Number((await params).studentId);
  const user = await getCurrentUser();
  if (!user || user.status !== "active" || !Number.isInteger(studentId)) return new Response("Not found", { status: 404 });

  let allowed = user.id === studentId || user.role === "admin";
  if (!allowed && user.role === "company") {
    const [hit] = await db
      .select({ id: applications.id })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .where(and(eq(applications.studentId, studentId), eq(companies.userId, user.id)))
      .limit(1);
    allowed = !!hit;
  }
  const [profile] = allowed ? await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)) : [];
  if (!profile?.resumePath) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(await readStored(profile.resumePath)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="resume-${studentId}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
