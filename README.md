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

Demo accounts and their shared password are defined at the top of [`scripts/seed.mts`](scripts/seed.mts) (`admin@secondera.test`, `mona@secondera.test`, `hr@nilesoft.test`, `sara@student.test`, …). PGlite allows one process at a time, so stop the dev server before running database scripts. `npm run db:reset` deletes the local database and reseeds it; use it if the database won't open after the dev server was killed abruptly.

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
| `npm run db:reset` | Delete the local PGlite database and reseed |

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
docs/            original idea and the 2025 project plan
```

## Payments (Paymob)

Plan upgrades go through [Paymob](https://developers.paymob.com) Unified Checkout (cards and mobile wallets) when the `PAYMOB_*` and `APP_URL` variables in [`.env.example`](.env.example) are set. Without them, upgrades are simulated and succeed at once, which is what local development and the tests use.

1. Upgrading creates a `pending` payment and a Paymob intention, then sends the student to Paymob's checkout.
2. Paymob calls `POST /api/payments/paymob` (the transaction processed callback). The app checks the HMAC-SHA512 signature and the amount, then marks the payment `paid` and activates the plan for a year. Repeated callbacks are ignored, and a declined card leaves the payment pending so the student can retry.
3. The student returns to `/plans/return/<id>`. Paymob signs that redirect too, so it can settle the payment if the callback hasn't arrived yet.

Paymob must be able to reach `APP_URL`. To test from your machine, expose port 3000 with a tunnel (for example `cloudflared tunnel --url http://localhost:3000`) and set `APP_URL` to the tunnel URL. Use your Paymob **test** keys and integration IDs with Paymob's test cards.

## Previous version

The original Flask/MySQL implementation is preserved in git history under the `flask-legacy` tag:

```bash
git checkout flask-legacy
```

## Known limitations

- **Paymob is untested against the live sandbox in this repo's CI.** The tests mock Paymob's API with its documented request and callback formats; run one sandbox payment with your test keys before going live.
- Paid plans run for one year from the payment date; there are no refunds, renewals, or installments in the app.
- **Resumes go to local disk** (`STORAGE_DIR`). Serverless hosts need object storage (S3/R2) behind `src/server/storage.ts`.
- No email sending (verification, password reset, notifications) and no login rate limiting yet.
- Certificates are immutable: re-grading after a certificate is issued doesn't revoke it.
