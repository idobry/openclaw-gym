import type { SQLiteDatabase } from "expo-sqlite";
import * as api from "./apiClient";
import { exportFullData } from "../db/queries/history";
import { importProgram, importUnifiedData, validateProgram } from "../db/queries/import";

async function getSetting(
  db: SQLiteDatabase,
  key: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)",
    key,
    value,
  );
}

/**
 * Push all local data to server on first login.
 */
export async function pushFullSnapshot(db: SQLiteDatabase): Promise<void> {
  const data = (await exportFullData(db)) as Record<string, any>;

  // Push program (templates + exercises)
  if (data.workouts && Object.keys(data.workouts).length > 0) {
    // Build exercise lookup from the exported catalog so we can include
    // name/muscle_group/equipment in the import payload
    const exerciseLookup = new Map<string, Record<string, any>>();
    if (Array.isArray(data.exercises)) {
      for (const e of data.exercises) {
        exerciseLookup.set(e.id, e);
      }
    }

    await api.program.import({
      program_name: data.program_name,
      workouts: Object.values(data.workouts).map((w: any) => ({
        name: w.name,
        color: w.color,
        description: w.focus,
        exercises: (w.exercises || []).map((e: any) => {
          const catalog = exerciseLookup.get(e.id);
          return {
            ...e,
            name: catalog?.name || e.id,
            muscle_group: catalog?.muscle_group,
            equipment: catalog?.equipment,
          };
        }),
      })),
    });
  }

  // Push completed sessions
  if (Array.isArray(data.history)) {
    for (const entry of data.history) {
      try {
        // Find the template for this session by matching workout name
        const localTemplate = await db.getFirstAsync<{ id: string }>(
          "SELECT id FROM workout_templates WHERE name = ?",
          entry.workout,
        );
        if (!localTemplate) continue;

        const session = await api.sessions.create({
          templateId: localTemplate.id,
          date: entry.date,
        });

        if (session?.id && Array.isArray(entry.exercises)) {
          for (const ex of entry.exercises) {
            if (Array.isArray(ex.sets)) {
              for (const s of ex.sets) {
                await api.sets.create(session.id, {
                  exerciseId: ex.id,
                  setNumber: s.set,
                  weight: s.weight,
                  reps: s.reps,
                });
              }
            }
          }
          await api.sessions.complete(session.id);
        }
      } catch (e) {
        console.warn("Failed to push session:", entry.date, e);
      }
    }
  }

  await setSetting(db, "lastSyncedAt", new Date().toISOString());
}

/**
 * Push a single completed session to server.
 */
export async function pushSession(
  db: SQLiteDatabase,
  sessionId: string,
): Promise<void> {
  const session = await db.getFirstAsync<{
    id: string;
    template_id: string;
    date: string;
    started_at: string;
    completed_at: string | null;
    notes: string | null;
  }>("SELECT * FROM workout_sessions WHERE id = ?", sessionId);

  if (!session) return;

  const sets = await db.getAllAsync<{
    exercise_id: string;
    set_number: number;
    weight: number;
    reps: number;
    is_warmup: number;
  }>(
    `SELECT sl.exercise_id, sl.set_number, sl.weight, sl.reps, sl.is_warmup
     FROM set_logs sl
     WHERE sl.session_id = ?
     ORDER BY sl.exercise_id, sl.set_number`,
    sessionId,
  );

  const serverSession = await api.sessions.create({
    templateId: session.template_id,
    date: session.date,
  });

  if (!serverSession?.id) return;

  for (const s of sets) {
    await api.sets.create(serverSession.id, {
      exerciseId: s.exercise_id,
      setNumber: s.set_number,
      weight: s.weight,
      reps: s.reps,
      isWarmup: s.is_warmup === 1,
    });
  }

  if (session.completed_at) {
    await api.sessions.complete(serverSession.id);
  }
}

/**
 * Pull agent-made changes from server into local DB.
 */
export async function pullFromServer(db: SQLiteDatabase): Promise<boolean> {
  const lastSynced = await getSetting(db, "lastSyncedAt");

  try {
    const agentChanges = await api.changes.list({
      actor: "agent",
      limit: 1,
      since: lastSynced ?? undefined,
    });

    if (!agentChanges || agentChanges.length === 0) return false;

    // Agent made changes -- pull full program
    const serverProgram = await api.program.export();

    if (serverProgram) {
      const result = validateProgram(serverProgram);
      if (result.valid && result.program) {
        await importProgram(
          db,
          result.program,
          JSON.stringify(serverProgram, null, 2),
        );
      }
    }

    await setSetting(db, "lastSyncedAt", new Date().toISOString());
    return true;
  } catch (e) {
    console.warn("Pull from server failed:", e);
    return false;
  }
}

/**
 * Pull full program + history from server into an empty local DB.
 * Returns true if data was pulled.
 */
export async function pullFullSnapshot(db: SQLiteDatabase): Promise<boolean> {
  try {
    const serverProgram = await api.program.export();
    if (!serverProgram) return false;

    const result = validateProgram(serverProgram);
    if (!result.valid || !result.program) return false;

    await importProgram(db, result.program, JSON.stringify(serverProgram, null, 2));
    await importUnifiedData(db, serverProgram as unknown as Record<string, unknown>);

    await setSetting(db, "lastSyncedAt", new Date().toISOString());
    return true;
  } catch (e) {
    console.warn("Pull full snapshot failed:", e);
    return false;
  }
}

/**
 * Full bidirectional sync.
 */
export async function syncAll(db: SQLiteDatabase): Promise<boolean> {
  const lastSynced = await getSetting(db, "lastSyncedAt");

  const localCount = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM workout_templates",
  );
  const hasLocalData = (localCount?.cnt ?? 0) > 0;

  if (!lastSynced) {
    if (hasLocalData) {
      // Local has data, server doesn't know about it yet -- push
      await pushFullSnapshot(db);
      return false;
    } else {
      // Fresh device with no data -- pull from server
      const pulled = await pullFullSnapshot(db);
      return pulled;
    }
  }

  // Server may have lost data (e.g. reset) -- re-push if needed
  try {
    const serverTemplates = await api.templates.list();
    if (serverTemplates.length === 0 && hasLocalData) {
      await pushFullSnapshot(db);
      return false;
    }
  } catch {
    // Can't reach server, continue with normal sync
  }

  const hadChanges = await pullFromServer(db);

  // Push local sessions newer than lastSyncedAt
  const newSessions = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM workout_sessions
     WHERE completed_at IS NOT NULL AND completed_at > ?
     ORDER BY completed_at ASC`,
    lastSynced,
  );

  for (const session of newSessions) {
    try {
      await pushSession(db, session.id);
    } catch (e) {
      console.warn("Failed to push session:", session.id, e);
    }
  }

  await setSetting(db, "lastSyncedAt", new Date().toISOString());
  return hadChanges;
}
