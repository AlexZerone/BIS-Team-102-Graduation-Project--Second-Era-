import { db } from "@/db";
import { auditLog } from "@/db/schema";

export const audit = (actorId: number, action: string, target: string, details?: Record<string, unknown>) =>
  db.insert(auditLog).values({ actorId, action, target, details });
