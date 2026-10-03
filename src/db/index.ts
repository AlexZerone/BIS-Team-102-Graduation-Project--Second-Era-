import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const config = { schema, casing: "snake_case" } as const;

// DATABASE_URL=postgres://... in production; otherwise an embedded Postgres (PGlite)
// stored on disk, so local dev needs no database server. PGLITE_DIR=memory:// for tests.
function connect(): DB {
  const url = process.env.DATABASE_URL;
  if (url) return drizzlePg({ client: new Pool({ connectionString: url }), ...config });
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  if (!dir.includes("://")) mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  // PGlite only writes a consistent data directory when closed; a process killed mid-write
  // can leave it unreadable. Close on Ctrl+C / termination (`npm run db:reset` recovers otherwise).
  const shutdown = () => void client.close().finally(() => process.exit(0));
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return drizzlePglite({ client, ...config });
}

// One connection per process, opened on first use (not at import, so parallel build
// workers never open the same PGlite directory) and kept across dev hot reloads.
const g = globalThis as { __db?: DB & { $client: PGlite | Pool } };
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = (g.__db ??= connect() as NonNullable<typeof g.__db>);
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** Closes the connection so scripts exit with the database flushed to disk. */
export async function closeDb() {
  const client = g.__db?.$client;
  g.__db = undefined;
  if (client instanceof PGlite) await client.close();
  else await client?.end();
}
