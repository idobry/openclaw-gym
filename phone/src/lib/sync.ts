import type { SQLiteDatabase } from "expo-sqlite";
import { apiFetch } from "./api";
import { exportFullData } from "../db/queries/history";
import { importProgram, validateProgram } from "../db/queries/import";

async function getSetting(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = ?",
    key
  );
  return row?.value ?? null;
}

async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)",
    key,
    value
  );
}

/**
 * Push all local data to server on first login.
 */
export async function pushFullSnapshot(db: SQLiteDatabase): Promise<void> {
  const data = (await exportFullData(db)) as Record<string, any>;

  // Push program (templates + exercises)
  if (data.workouts && Object.keys(data.workouts).length > 0) {
    await apiFetch("/program/import", {
      method: "POST",
      body: {
        program_name: data.program_name,
        exercises: data.exercises,
        workouts: data.workouts,
      },
      requireAuth: true,
    });
  }

  // Push completed sessions
  if (Array.isArray(data.history)) {
    for (const entry of data.history) {
      try {
        const sessionBody = {
          date: entry.date,
          workout_name: entry.workout,
          started_at: entry.started_at,
          completed_at: entry.completed_at,
        };

        const session = await apiFetch<{ id: string }>("/sessions", {
          method: "POST",
          body: sessionBody,
          requireAuth: true,
        });

        if (session?.id && Array.isArray(entry.exercises)) {
          for (const ex of entry.exercises) {
            if (Array.isArray(ex.sets)) {
              await apiFetch(`/sessions/${session.id}/sets`, {
                method: "POST",
                body: {
                  exercise_id: ex.id,
                  exercise_name: ex.name,
                  sets: ex.sets,
                },
                requireAuth: true,
              });
            }
          }
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
  sessionId: string
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

  const template = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM workout_templates WHERE id = ?",
    session.template_id
  );

  const sets = await db.getAllAsync<{
    exercise_id: string;
    exercise_name: string;
    set_number: number;
    weight: number;
    reps: number;
    is_warmup: number;
  }>(
    `SELECT sl.*, e.name as exercise_name
     FROM set_logs sl
     JOIN exercises e ON sl.exercise_id = e.id
     WHERE sl.session_id = ?
     ORDER BY sl.exercise_id, sl.set_number`,
    sessionId
  );

  const serverSession = await apiFetch<{ id: string }>("/sessions", {
    method: "POST",
    body: {
      date: session.date,
      workout_name: template?.name || "Unknown",
      started_at: session.started_at,
      completed_at: session.completed_at,
    },
    requireAuth: true,
  });

  if (!serverSession?.id) return;

  // Group sets by exercise
  const byExercise = new Map<
    string,
    {
      exercise_id: string;
      exercise_name: string;
      sets: { set: number; weight: number; reps: number }[];
    }
  >();

  for (const s of sets) {
    if (!byExercise.has(s.exercise_id)) {
      byExercise.set(s.exercise_id, {
        exercise_id: s.exercise_id,
        exercise_name: s.exercise_name,
        sets: [],
      });
    }
    byExercise.get(s.exercise_id)!.sets.push({
      set: s.set_number,
      weight: s.weight,
      reps: s.reps,
    });
  }

  for (const ex of byExercise.values()) {
    await apiFetch(`/sessions/${serverSession.id}/sets`, {
      method: "POST",
      body: {
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
      },
      requireAuth: true,
    });
  }
}

/**
 * Pull agent-made changes from server.
 */
export async function pullFromServer(db: SQLiteDatabase): Promise<boolean> {
  const lastSynced = await getSetting(db, "lastSyncedAt");

  try {
    // Check for agent changes
    const query = lastSynced
      ? `/changes?actor=agent&since=${encodeURIComponent(lastSynced)}&limit=1`
      : "/changes?actor=agent&limit=1";

    const changes = await apiFetch<any[]>(query);
    if (!changes || changes.length === 0) return false;

    // Agent made changes, pull the full program
    const serverProgram = await apiFetch<Record<string, any>>(
      "/program/export",
      { requireAuth: true }
    );

    if (serverProgram) {
      const result = validateProgram(serverProgram);
      if (result.valid && result.program) {
        await importProgram(
          db,
          result.program,
          JSON.stringify(serverProgram, null, 2)
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
 * Full bidirectional sync.
 */
export async function syncAll(db: SQLiteDatabase): Promise<boolean> {
  const hadChanges = await pullFromServer(db);

  // Push local sessions newer than lastSyncedAt
  const lastSynced = await getSetting(db, "lastSyncedAt");
  if (lastSynced) {
    const newSessions = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM workout_sessions
       WHERE completed_at IS NOT NULL AND completed_at > ?
       ORDER BY completed_at ASC`,
      lastSynced
    );

    for (const session of newSessions) {
      try {
        await pushSession(db, session.id);
      } catch (e) {
        console.warn("Failed to push session:", session.id, e);
      }
    }
  }

  await setSetting(db, "lastSyncedAt", new Date().toISOString());
  return hadChanges;
}
