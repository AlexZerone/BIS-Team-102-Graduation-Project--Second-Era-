// Logins created by scripts/seed.mts, shared with the browser tests in e2e/.
// Local demo data only: never use these anywhere real.
export const DEMO_PASSWORD = "SecondEra-demo-2026";

export const DEMO = {
  admin: "admin@secondera.test",
  instructor: "mona@secondera.test",
  company: "hr@nilesoft.test",
  /** Has a certificate and an application. */
  certifiedStudent: "sara@student.test",
  /** Enrolled in the SQL course with one of two assessments submitted. */
  midwayStudent: "nour@student.test",
} as const;
