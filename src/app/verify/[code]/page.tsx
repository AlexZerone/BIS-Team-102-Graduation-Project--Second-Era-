import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { certificates, companies, courses, users } from "@/db/schema";
import { fmtDate } from "@/components/ui";

export const metadata = { title: "Certificate verification" };

const instructors = alias(users, "instructors");

/** Public page so employers can check a certificate code. */
export default async function VerifyPage({ params }: PageProps<"/verify/[code]">) {
  const code = (await params).code.toUpperCase();
  if (!/^[0-9A-F]{12}$/.test(code)) notFound();
  const [c] = await db
    .select({ cert: certificates, student: users.name, course: courses.title, courseId: courses.id, instructor: instructors.name, partner: companies.name })
    .from(certificates)
    .innerJoin(users, eq(users.id, certificates.studentId))
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .innerJoin(instructors, eq(instructors.id, courses.instructorId))
    .leftJoin(companies, eq(companies.id, courses.partnerCompanyId))
    .where(eq(certificates.code, code));
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-2xl rounded-xl border-2 border-brand bg-surface p-8 text-center md:p-12">
      <p className="text-sm font-medium uppercase tracking-widest text-brand">Verified certificate</p>
      <h1 className="mt-6 text-3xl font-semibold">{c.student}</h1>
      <p className="mt-2 text-muted">passed the practical assessments for</p>
      <p className="mt-2 text-xl font-semibold">
        <Link href={`/courses/${c.courseId}`} className="hover:text-brand">
          {c.course}
        </Link>
      </p>
      <p className="mt-6 text-4xl font-semibold text-brand">{c.cert.score}%</p>
      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">Issued</dt>
          <dd>{fmtDate(c.cert.issuedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Instructor</dt>
          <dd>{c.instructor}</dd>
        </div>
        <div>
          <dt className="text-muted">Industry partner</dt>
          <dd>{c.partner ?? "—"}</dd>
        </div>
      </dl>
      <p className="mt-8 font-mono text-xs text-muted">Code {c.cert.code}</p>
    </div>
  );
}
