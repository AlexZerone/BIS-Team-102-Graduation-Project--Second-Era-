import { migrate } from "@/db/migrate";

await migrate();
console.log("Migrations applied.");
process.exit(0);
