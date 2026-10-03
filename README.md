# Second Era

Practical, company-backed training that turns final-year students and fresh graduates into verified, hire-ready interns.
This is the BIS graduation project, Team 102, Helwan University.

## How it works

1. **Instructors** build courses, optionally with an **industry partner** company, made of lessons and practical assessments. An admin reviews each course before it's published.
2. **Students** enroll (gated by plan), submit their work, and get it graded by the instructor.
3. When every assessment is graded and the overall score reaches the course's pass mark, the student automatically receives a **certificate** with a public verification page (`/verify/<code>`).
4. **Companies** post jobs that require specific certificates. Only certified students can apply, and companies see applicants **ranked by their verified score**.
5. **Admins** approve instructor and company accounts, review courses, suspend users, and read contact messages. Every admin action is recorded in an audit log.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Drizzle ORM · PostgreSQL · Zod · Tailwind CSS 4 · Vitest

Local development needs **no database server**. Without `DATABASE_URL`, the app uses an embedded Postgres ([PGlite](https://pglite.dev)) stored in `.data/`.

## Getting started

Requires Node.js 22 or later.

```bash
npm install
npm run db:seed     # applies migrations and loads demo data
npm run dev         # http://localhost:3000
```

Demo accounts and their shared password are defined at the top of [`scripts/seed.mts`](scripts/seed.mts) (`admin@secondera.test`, `mona@secondera.test`, `hr@nilesoft.test`, `sara@student.test`, …). To wipe and reseed, stop the dev server and run `npm run db:seed -- --reset`. PGlite allows one process at a time.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Vitest: core rules against an in-memory Postgres |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Migrate and load demo data |

## Configuration

See [`.env.example`](.env.example). In production set `DATABASE_URL` to a Postgres database (Neon, Supabase, RDS, …), run `npm run db:migrate`, then `npm run build && npm start`.

## Project layout

```
src/db/          schema.ts (the data model), connection, migrations runner
src/server/      business rules: learning.ts (enroll, submit, grade, certificates),
                 hiring.ts (eligibility, applying, ranking), payments.ts, storage.ts
src/lib/         auth (DB sessions, scrypt), plans, validation
src/app/         pages and server actions, grouped by area (teach, learn, company, admin, …)
drizzle/         generated SQL migrations
_legacy/         the previous Flask/MySQL implementation, kept for reference
docs/            original idea and the 2025 project plan
```

## Known limitations

- **Payments are simulated.** Upgrading always succeeds and records a `simulated` payment. `src/server/payments.ts` marks where a Paymob/Fawry checkout and webhook would go.
- **Resumes go to local disk** (`STORAGE_DIR`). Serverless hosts need object storage (S3/R2) behind `src/server/storage.ts`.
- No email sending (verification, password reset, notifications) and no login rate limiting yet.
- Certificates are immutable: re-grading after a certificate is issued doesn't revoke it.
