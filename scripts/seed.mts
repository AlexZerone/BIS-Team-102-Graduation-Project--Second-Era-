// Demo data for local development. `npm run db:seed` (add `-- --reset` to wipe first).
// Every demo account uses DEMO_PASSWORD. Never run against production.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { migrate } from "@/db/migrate";
import { assessments, companies, courses, jobRequirements, jobs, lessons, studentProfiles, submissions, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { enroll, gradeSubmission, submitAssessment } from "@/server/learning";
import { applyToJob } from "@/server/hiring";

const DEMO_PASSWORD = "SecondEra-demo-2026";

await migrate();

if (process.argv.includes("--reset")) {
  await db.execute(sql`TRUNCATE users, companies, courses, contact_messages, audit_log RESTART IDENTITY CASCADE`);
} else if ((await db.select({ id: users.id }).from(users).limit(1)).length) {
  console.log("Database already has data; run with --reset to wipe it.");
  process.exit(0);
}

const passwordHash = await hashPassword(DEMO_PASSWORD);
const mk = (email: string, name: string, role: "student" | "instructor" | "company" | "admin", status: "active" | "pending" = "active") =>
  db.insert(users).values({ email, name, role, status, passwordHash }).returning().then((r) => r[0]);

await mk("admin@secondera.test", "Platform Admin", "admin");
const mona = await mk("mona@secondera.test", "Mona Hassan", "instructor");
const karim = await mk("karim@secondera.test", "Karim Adel", "instructor");
await mk("pending.instructor@secondera.test", "Youssef Nabil", "instructor", "pending");

const companyUser = await mk("hr@nilesoft.test", "Nile Soft HR", "company");
const [nileSoft] = await db
  .insert(companies)
  .values({ userId: companyUser.id, name: "Nile Soft", industry: "Software", website: "https://nilesoft.test", description: "Cairo-based product studio hiring junior engineers and analysts." })
  .returning();
const pendingCo = await mk("talent@deltabank.test", "Delta Bank Talent", "company", "pending");
await db.insert(companies).values({ userId: pendingCo.id, name: "Delta Bank", industry: "Finance" });

const students = [];
for (const [email, name, university, major] of [
  ["sara@student.test", "Sara Ali", "Helwan University", "Business Information Systems"],
  ["omar@student.test", "Omar Tarek", "Cairo University", "Computer Science"],
  ["nour@student.test", "Nour Ibrahim", "Ain Shams University", "Commerce"],
]) {
  const s = await mk(email, name, "student");
  await db.insert(studentProfiles).values({ userId: s.id, university, major, graduationYear: 2026 });
  students.push(s);
}

type CourseSeed = { title: string; summary: string; level: "beginner" | "intermediate"; plan: "free" | "standard"; partner?: number; instructor: number; status: "published" | "pending"; lessons: [string, string][]; tasks: [string, string, number][] };
const courseSeeds: CourseSeed[] = [
  {
    title: "SQL for Business Analysts", summary: "Query real sales data the way analysts do on the job.", level: "beginner", plan: "free", partner: nileSoft.id, instructor: mona.id, status: "published",
    lessons: [["Thinking in tables", "Rows, columns, keys, and why analysts care."], ["Filtering and aggregating", "WHERE, GROUP BY, HAVING on a sales dataset."]],
    tasks: [["Monthly revenue report", "Write a query returning revenue per month for 2025. Submit the SQL and your result table.", 50], ["Top customers", "Find the 10 customers with the highest lifetime value and explain your approach.", 50]],
  },
  {
    title: "Excel to Dashboards", summary: "Turn messy spreadsheets into a dashboard a manager can read.", level: "beginner", plan: "free", instructor: mona.id, status: "published",
    lessons: [["Cleaning data", "Removing duplicates, fixing types, consistent dates."], ["Pivot tables", "Summaries that answer business questions."]],
    tasks: [["Clean the dataset", "Clean the provided file and describe each fix you made.", 100]],
  },
  {
    title: "Git & Team Workflow", summary: "Branches, pull requests, and code review as practised at Nile Soft.", level: "intermediate", plan: "standard", partner: nileSoft.id, instructor: karim.id, status: "published",
    lessons: [["Branching", "Feature branches and keeping main green."], ["Pull requests", "Writing a PR a reviewer can approve quickly."]],
    tasks: [["Open a pull request", "Link a public repo PR that fixes a small bug, with a clear description.", 100]],
  },
  {
    title: "Business Writing for Interns", summary: "Emails, status updates, and reports that get read.", level: "beginner", plan: "free", instructor: karim.id, status: "pending",
    lessons: [["Clear emails", "Subject lines, structure, and asks."]],
    tasks: [["Weekly status update", "Write a status update for a project of your choice.", 100]],
  },
];

const created: Record<string, { id: number; tasks: number[] }> = {};
for (const c of courseSeeds) {
  const [course] = await db
    .insert(courses)
    .values({ instructorId: c.instructor, partnerCompanyId: c.partner ?? null, title: c.title, summary: c.summary, description: `${c.summary}\n\nYou'll finish with practical work reviewed by an instructor, and a verifiable certificate if you pass.`, level: c.level, requiredPlan: c.plan, status: c.status })
    .returning();
  await db.insert(lessons).values(c.lessons.map(([title, body], i) => ({ courseId: course.id, position: i + 1, title, body })));
  const tasks = await db.insert(assessments).values(c.tasks.map(([title, instructions, maxScore]) => ({ courseId: course.id, title, instructions, maxScore }))).returning();
  created[c.title] = { id: course.id, tasks: tasks.map((t) => t.id) };
}

const sqlCourse = created["SQL for Business Analysts"];
const [job] = await db
  .insert(jobs)
  .values({ companyId: nileSoft.id, title: "Junior Data Analyst (Internship)", description: "Three-month paid internship on our analytics team. You'll build reports for product managers.", type: "internship", location: "Cairo (hybrid)" })
  .returning();
await db.insert(jobRequirements).values({ jobId: job.id, courseId: sqlCourse.id });
await db.insert(jobs).values({ companyId: nileSoft.id, title: "Operations Trainee", description: "Support our operations team with spreadsheets and reporting.", type: "full_time", location: "Giza" });

// Sara and Omar complete the SQL course with different scores; Nour is mid-way.
for (const [student, scores] of [[students[0], [45, 47]], [students[1], [38, 40]]] as const) {
  await enroll(student.id, sqlCourse.id);
  for (const [i, taskId] of sqlCourse.tasks.entries()) {
    await submitAssessment(student.id, taskId, "SELECT date_trunc('month', ordered_at) AS month, sum(total) FROM orders GROUP BY 1;", null);
    const [sub] = await db.select().from(submissions).where(and(eq(submissions.assessmentId, taskId), eq(submissions.studentId, student.id)));
    await gradeSubmission(mona.id, sub.id, scores[i], "Correct and clearly explained.");
  }
  await applyToJob(student.id, job.id, "I completed the SQL for Business Analysts course and would love to join the analytics team.");
}
await enroll(students[2].id, sqlCourse.id);
await submitAssessment(students[2].id, sqlCourse.tasks[0], "My monthly revenue query and results...", null);

console.log(`Seeded. Demo accounts use password: ${DEMO_PASSWORD}`);
process.exit(0);
