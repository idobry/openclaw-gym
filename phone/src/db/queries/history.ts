import type { SQLiteDatabase } from "expo-sqlite";
import { getLastSessionSetsForExercise } from "./progress";

export interface SessionExerciseLog {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface SessionDetail {
  id: string;
  template_name: string;
  template_color: string;
  date: string;
  started_at: string;
  completed_at: string;
  weight_unit: string;
  exercises: SessionExerciseLog[];
}

export async function getSessionDetail(
  db: SQLiteDatabase,
  sessionId: string
): Promise<SessionDetail | null> {
  const session = await db.getFirstAsync<{
    id: string;
    template_name: string;
    template_color: string;
    date: string;
    started_at: string;
    completed_at: string;
    notes: string | null;
  }>(
    `SELECT ws.*, wt.name as template_name, wt.color as template_color
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.id = ?`,
    sessionId
  );
  if (!session) return null;

  let weightUnit = "kg";
  if (session.notes) {
    try {
      const parsed = JSON.parse(session.notes);
      if (parsed.weight_unit) weightUnit = parsed.weight_unit;
    } catch {}
  }

  const logs = await db.getAllAsync<{
    exercise_name: string;
    set_count: number;
    avg_reps: number;
    avg_weight: number;
  }>(
    `SELECT e.name as exercise_name,
            COUNT(sl.id) as set_count,
            ROUND(AVG(sl.reps)) as avg_reps,
            ROUND(AVG(sl.weight), 1) as avg_weight
     FROM set_logs sl
     JOIN exercises e ON sl.exercise_id = e.id
     WHERE sl.session_id = ?
     GROUP BY sl.exercise_id
     ORDER BY MIN(sl.set_number)`,
    sessionId
  );

  return {
    ...session,
    weight_unit: weightUnit,
    exercises: logs.map((l) => ({
      exercise_name: l.exercise_name,
      sets: l.set_count,
      reps: l.avg_reps,
      weight:
        weightUnit === "lb"
          ? Math.round((l.avg_weight / 0.453592) * 10) / 10
          : l.avg_weight,
    })),
  };
}

/**
 * Export everything as a single unified JSON:
 * {
 *   program_name, settings, workouts, history
 * }
 *
 * This single file can fully restore the app state.
 * Future: upload/download from S3 for cloud sync.
 */
export async function exportFullData(
  db: SQLiteDatabase
): Promise<object> {
  // --- Settings ---
  const unitRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = 'weight_unit'"
  );
  const weightUnit = unitRow?.value || "kg";

  const nameRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = 'program_name'"
  );
  const programName = nameRow?.value || "GymTracker";

  // --- Workouts (program template) ---
  const templates = await db.getAllAsync<{
    id: string;
    name: string;
    day_label: string;
    color: string;
    description: string | null;
  }>("SELECT * FROM workout_templates ORDER BY day_label");

  // Collect all exercises used across all templates into a catalog
  const exerciseCatalog = new Map<string, Record<string, any>>();
  const workouts: Record<string, any> = {};

  for (const tmpl of templates) {
    const exercises = await db.getAllAsync<{
      exercise_id: string;
      exercise_name: string;
      muscle_group: string;
      equipment: string;
      media_slug: string | null;
      notes: string | null;
      sets: number;
      rep_range_min: number;
      rep_range_max: number;
      rest_seconds: number;
    }>(
      `SELECT e.id as exercise_id, e.name as exercise_name, e.muscle_group, e.equipment, e.media_slug, e.notes,
              te.sets, te.rep_range_min, te.rep_range_max, te.rest_seconds
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.template_id = ?
       ORDER BY te.sort_order`,
      tmpl.id
    );

    const exerciseRefs = [];
    for (const e of exercises) {
      // Build catalog entry if not already present
      if (!exerciseCatalog.has(e.exercise_id)) {
        const catalogEntry: Record<string, any> = {
          id: e.exercise_id,
          name: e.exercise_name,
          muscle_group: e.muscle_group || undefined,
          equipment: e.equipment || undefined,
          image_url: e.media_slug || undefined,
          note: e.notes || undefined,
        };
        const lastSets = await getLastSessionSetsForExercise(db, e.exercise_id);
        if (lastSets.length > 0) {
          const w =
            weightUnit === "lb"
              ? Math.round((lastSets[0].weight / 0.453592) * 10) / 10
              : lastSets[0].weight;
          catalogEntry.last_used = {
            weight: w,
            reps: lastSets[0].reps,
            sets: lastSets.length,
          };
        }
        exerciseCatalog.set(e.exercise_id, catalogEntry);
      }

      // Workout entry is a reference + config only
      exerciseRefs.push({
        id: e.exercise_id,
        sets: e.sets,
        reps:
          e.rep_range_min === e.rep_range_max
            ? String(e.rep_range_min)
            : `${e.rep_range_min}-${e.rep_range_max}`,
        rest_seconds: e.rest_seconds,
      });
    }

    workouts[tmpl.id] = {
      name: tmpl.name,
      color: tmpl.color,
      focus: tmpl.description || undefined,
      exercises: exerciseRefs,
    };
  }

  // --- History (all completed sessions) ---
  const sessions = await db.getAllAsync<{
    id: string;
    template_id: string;
    template_name: string;
    date: string;
    started_at: string;
    completed_at: string;
    notes: string | null;
  }>(
    `SELECT ws.*, wt.name as template_name
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.completed_at IS NOT NULL
     ORDER BY ws.date ASC, ws.started_at ASC`
  );

  const history = [];

  for (const session of sessions) {
    let sessionUnit = weightUnit;
    if (session.notes) {
      try {
        const parsed = JSON.parse(session.notes);
        if (parsed.weight_unit) sessionUnit = parsed.weight_unit;
      } catch {}
    }

    const logs = await db.getAllAsync<{
      exercise_id: string;
      exercise_name: string;
      set_number: number;
      weight: number;
      reps: number;
    }>(
      `SELECT sl.exercise_id, e.name as exercise_name, sl.set_number, sl.weight, sl.reps
       FROM set_logs sl
       JOIN exercises e ON sl.exercise_id = e.id
       WHERE sl.session_id = ?
       ORDER BY sl.exercise_id, sl.set_number`,
      session.id
    );

    // Group by exercise
    const exerciseMap = new Map<
      string,
      { id: string; sets: { set: number; weight: number; reps: number }[] }
    >();
    for (const log of logs) {
      if (!exerciseMap.has(log.exercise_name)) {
        exerciseMap.set(log.exercise_name, { id: log.exercise_id, sets: [] });
      }
      const w =
        sessionUnit === "lb"
          ? Math.round((log.weight / 0.453592) * 10) / 10
          : log.weight;
      exerciseMap.get(log.exercise_name)!.sets.push({
        set: log.set_number,
        weight: w,
        reps: log.reps,
      });
    }

    history.push({
      date: session.date,
      workout: session.template_name,
      started_at: session.started_at,
      completed_at: session.completed_at,
      exercises: Array.from(exerciseMap.entries()).map(([name, data]) => ({
        id: data.id,
        name,
        sets: data.sets,
      })),
    });
  }

  return {
    program_name: programName,
    settings: {
      weight_unit: weightUnit,
    },
    exercises: Array.from(exerciseCatalog.values()),
    workouts,
    history,
    exported_at: new Date().toISOString(),
  };
}

// Keep backward compat alias
export const exportFullHistory = exportFullData;
