import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { db } from ".";
import type * as schema from "./schema";

export async function migrate() {
  const opts = { migrationsFolder: "drizzle" };
  // db is the driver chosen in ./index, so the cast matches the runtime driver.
  if (process.env.DATABASE_URL) await migratePg(db as unknown as NodePgDatabase<typeof schema>, opts);
  else await migratePglite(db as unknown as PgliteDatabase<typeof schema>, opts);
}
