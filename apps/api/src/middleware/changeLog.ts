import { db } from "../db/client.js";
import { changeLog } from "../db/schema.js";
import type { AuthPayload } from "./auth.js";

export async function logChange(
  auth: AuthPayload,
  action: string,
  entityType: string,
  entityId: string,
  diff?: { before?: unknown; after?: unknown },
  message?: string
) {
  await db.insert(changeLog).values({
    userId: auth.userId,
    actor: auth.actor,
    action,
    entityType,
    entityId,
    diff: diff ?? null,
    message: message ?? null,
  });
}
