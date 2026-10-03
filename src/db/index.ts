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
  return drizzlePglite({ client: new PGlite(dir), ...config });
}

// One connection per process, opened on first use (not at import, so parallel build
// workers never open the same PGlite directory) and kept across dev hot reloads.
const g = globalThis as { __db?: DB };
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = (g.__db ??= connect());
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
