import { closeDb } from "@/db";
import { migrate } from "@/db/migrate";

await migrate();
await closeDb();
console.log("Migrations applied.");
