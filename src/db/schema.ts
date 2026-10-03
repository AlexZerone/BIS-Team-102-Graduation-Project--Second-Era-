import {
  pgTable,
  pgEnum,
  integer,
  text,
  timestamp,
  boolean,
  primaryKey,
  unique,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

const id = () => integer().primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const role = pgEnum("role", ["student", "instructor", "company", "admin"]);
// Students are active on sign-up; instructors and companies wait for admin approval.
export const userStatus = pgEnum("user_status", ["pending", "active", "rejected", "suspended"]);
export const plan = pgEnum("plan", ["free", "basic", "standard", "premium"]);
export const courseStatus = pgEnum("course_status", ["draft", "pending", "published", "rejected"]);
export const level = pgEnum("level", ["beginner", "intermediate", "advanced"]);
export const enrollmentStatus = pgEnum("enrollment_status", ["active", "completed"]);
export const jobType = pgEnum("job_type", ["internship", "full_time", "part_time"]);
export const applicationStatus = pgEnum("application_status", ["submitted", "shortlisted", "rejected", "hired"]);
export const paymentStatus = pgEnum("payment_status", ["paid", "failed"]);
export const messageStatus = pgEnum("message_status", ["open", "resolved"]);

export const users = pgTable("users", {
  id: id(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  role: role().notNull(),
  status: userStatus().notNull(),
  rejectionReason: text(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  // sha256 of the cookie token, so a DB leak doesn't leak live sessions
  id: text().primaryKey(),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  userId: integer().primaryKey().references(() => users.id, { onDelete: "cascade" }),
  university: text(),
  major: text(),
  graduationYear: integer(),
  bio: text(),
  resumePath: text(), // relative to STORAGE_DIR, never public
  plan: plan().notNull().default("free"),
  planExpiresAt: timestamp({ withTimezone: true }),
});

export const companies = pgTable("companies", {
  id: id(),
  userId: integer().notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  industry: text(),
  website: text(),
  description: text(),
});

export const courses = pgTable("courses", {
  id: id(),
  instructorId: integer().notNull().references(() => users.id),
  // The industry partner that co-designed this course, if any.
  partnerCompanyId: integer().references(() => companies.id, { onDelete: "set null" }),
  title: text().notNull(),
  summary: text().notNull(),
  description: text().notNull(),
  level: level().notNull().default("beginner"),
  requiredPlan: plan().notNull().default("free"),
  passingScore: integer().notNull().default(70), // percent
  status: courseStatus().notNull().default("draft"),
  rejectionReason: text(),
  createdAt: createdAt(),
});

export const lessons = pgTable("lessons", {
  id: id(),
  courseId: integer().notNull().references(() => courses.id, { onDelete: "cascade" }),
  position: integer().notNull(),
  title: text().notNull(),
  body: text().notNull(),
  videoUrl: text(),
});

export const assessments = pgTable("assessments", {
  id: id(),
  courseId: integer().notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text().notNull(),
  instructions: text().notNull(),
  maxScore: integer().notNull().default(100),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    studentId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: integer().notNull().references(() => courses.id, { onDelete: "cascade" }),
    status: enrollmentStatus().notNull().default("active"),
    enrolledAt: createdAt(),
    completedAt: timestamp({ withTimezone: true }),
  },
  (t) => [unique().on(t.studentId, t.courseId)],
);

export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    assessmentId: integer().notNull().references(() => assessments.id, { onDelete: "cascade" }),
    studentId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    answer: text().notNull(),
    link: text(),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    score: integer(),
    feedback: text(),
    gradedAt: timestamp({ withTimezone: true }),
    gradedBy: integer().references(() => users.id),
  },
  (t) => [unique().on(t.assessmentId, t.studentId)],
);

export const certificates = pgTable(
  "certificates",
  {
    id: id(),
    studentId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: integer().notNull().references(() => courses.id, { onDelete: "cascade" }),
    score: integer().notNull(), // percent, as verified by graded assessments
    code: text().notNull().unique(), // public verification code
    issuedAt: createdAt(),
  },
  (t) => [unique().on(t.studentId, t.courseId)],
);

export const jobs = pgTable("jobs", {
  id: id(),
  companyId: integer().notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text().notNull(),
  description: text().notNull(),
  type: jobType().notNull().default("internship"),
  location: text(),
  isOpen: boolean().notNull().default(true),
  deadline: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
});

// A job is open to students holding a certificate for every required course.
export const jobRequirements = pgTable(
  "job_requirements",
  {
    jobId: integer().notNull().references(() => jobs.id, { onDelete: "cascade" }),
    courseId: integer().notNull().references(() => courses.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.jobId, t.courseId] })],
);

export const applications = pgTable(
  "applications",
  {
    id: id(),
    jobId: integer().notNull().references(() => jobs.id, { onDelete: "cascade" }),
    studentId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
    coverNote: text(),
    status: applicationStatus().notNull().default("submitted"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.jobId, t.studentId)],
);

export const payments = pgTable("payments", {
  id: id(),
  studentId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: plan().notNull(),
  amountEgp: integer().notNull(),
  provider: text().notNull(),
  status: paymentStatus().notNull(),
  createdAt: createdAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text().notNull(),
  email: text().notNull(),
  message: text().notNull(),
  status: messageStatus().notNull().default("open"),
  createdAt: createdAt(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: integer().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    target: text().notNull(), // e.g. "user:12", "course:4"
    details: jsonb(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.createdAt)],
);
