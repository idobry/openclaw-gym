import type { SQLiteDatabase } from "expo-sqlite";

/**
 * JSON Schema for importing workout programs:
 *
 * {
 *   "program_name": "My Program",
 *   "workouts": [
 *     {
 *       "name": "Push Day",
 *       "color": "#FF6B6B",
 *       "exercises": [
 *         {
 *           "name": "Bench Press",
 *           "muscle_group": "Chest",
 *           "equipment": "Barbell",
 *           "image_url": "https://example.com/bench.jpg",
 *           "sets": 4,
 *           "rep_min": 6,
 *           "rep_max": 8,
 *           "rest_seconds": 180
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export interface ImportExerciseDef {
  id?: string;
  name: string;
  muscle_group?: string;
  equipment?: string;
  image_url?: string;
  note?: string;
}

export interface ImportExercise {
  id?: string;
  name: string;
  muscle_group: string;
  equipment: string;
  image_url?: string;
  note?: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
}

export interface ImportWorkout {
  name: string;
  color?: string;
  description?: string;
  exercises: ImportExercise[];
}

export interface ImportProgram {
  program_name: string;
  workouts: ImportWorkout[];
}

const DEFAULT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA",
  "#F472B6", "#34D399", "#FB923C", "#60A5FA",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Parse reps from various formats:
 * - "6-8" → { min: 6, max: 8 }
 * - "10-12 per leg" → { min: 10, max: 12 }
 * - "30-45 sec" → { min: 30, max: 45 }
 * - "10" → { min: 10, max: 10 }
 * - 8 → { min: 8, max: 8 }
 */
function parseReps(reps: unknown): { min: number; max: number } | null {
  if (typeof reps === "number") return { min: reps, max: reps };
  if (typeof reps !== "string") return null;
  const match = reps.match(/^(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = reps.match(/^(\d+)/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return null;
}

/**
 * Build a lookup map from a top-level exercises catalog array.
 */
function buildCatalog(exercises: unknown): Map<string, ImportExerciseDef> | null {
  if (!Array.isArray(exercises) || exercises.length === 0) return null;
  const map = new Map<string, ImportExerciseDef>();
  for (const e of exercises) {
    if (e && typeof e === "object" && (e.id || e.name)) {
      const id = e.id || slugify(e.name);
      map.set(id, {
        id: e.id || undefined,
        name: e.name,
        muscle_group: e.muscle_group,
        equipment: e.equipment,
        image_url: e.image_url,
        note: e.note,
      });
    }
  }
  return map.size > 0 ? map : null;
}

/**
 * Normalize workouts from either format:
 * - Array: [{ name, exercises }]
 * - Object: { "Upper_A": { exercises }, "Lower_A": { exercises } }
 *
 * When a catalog is provided, workout exercises that only have id + config
 * are merged with the catalog data to produce full ImportExercise objects.
 */
function normalizeWorkouts(workouts: unknown, catalog?: Map<string, ImportExerciseDef> | null): ImportWorkout[] | null {
  const normalizeWithCatalog = (e: any) => {
    if (catalog && e.id && !e.name) {
      const def = catalog.get(e.id);
      if (def) {
        return normalizeExercise({ ...def, ...e });
      }
    }
    return normalizeExercise(e);
  };

  if (Array.isArray(workouts)) {
    return workouts.map((w: any, i: number) => ({
      name: w.name || `Workout ${i + 1}`,
      color: w.color,
      description: w.description || w.focus || undefined,
      exercises: (w.exercises || []).map(normalizeWithCatalog),
    }));
  }

  if (workouts && typeof workouts === "object" && !Array.isArray(workouts)) {
    const entries = Object.entries(workouts as Record<string, any>);
    return entries.map(([key, w]) => ({
      name: w.name || key.replace(/_/g, " "),
      color: w.color,
      description: w.description || w.focus || undefined,
      exercises: (w.exercises || []).map(normalizeWithCatalog),
    }));
  }

  return null;
}

function normalizeExercise(e: any): ImportExercise {
  // Handle reps as string "6-8" or separate rep_min/rep_max
  let repMin = e.rep_min;
  let repMax = e.rep_max;

  if (repMin == null || repMax == null) {
    const parsed = parseReps(e.reps);
    if (parsed) {
      repMin = parsed.min;
      repMax = parsed.max;
    } else {
      repMin = repMin ?? 8;
      repMax = repMax ?? repMin;
    }
  }

  return {
    id: e.id || undefined,
    name: e.name,
    muscle_group: e.muscle_group || "",
    equipment: e.equipment || "",
    image_url: e.image_url,
    note: e.note || undefined,
    sets: e.sets || 3,
    rep_min: repMin,
    rep_max: repMax,
    rest_seconds: e.rest_seconds || 90,
  };
}

export function validateProgram(json: unknown): { valid: boolean; error?: string; program?: ImportProgram } {
  if (!json || typeof json !== "object") {
    return { valid: false, error: "Invalid JSON object" };
  }

  const obj = json as Record<string, unknown>;

  if (!obj.program_name || typeof obj.program_name !== "string") {
    return { valid: false, error: 'Missing "program_name" (string)' };
  }

  // Build catalog from top-level exercises array (if present)
  const catalog = buildCatalog(obj.exercises);

  const workouts = normalizeWorkouts(obj.workouts, catalog);

  if (!workouts || workouts.length === 0) {
    return { valid: false, error: 'Missing or empty "workouts" (array or object)' };
  }

  if (workouts.length > 7) {
    return { valid: false, error: "Maximum 7 workout days allowed" };
  }

  for (let i = 0; i < workouts.length; i++) {
    const w = workouts[i];
    if (!w.exercises || w.exercises.length === 0) {
      return { valid: false, error: `Workout "${w.name}": no exercises found` };
    }

    for (let j = 0; j < w.exercises.length; j++) {
      const e = w.exercises[j];
      if (!e.name || typeof e.name !== "string") {
        // If catalog exists, give a more helpful error
        if (catalog && (e as any).id) {
          return { valid: false, error: `Workout "${w.name}", exercise ${j + 1}: id "${(e as any).id}" not found in exercises catalog` };
        }
        return { valid: false, error: `Workout "${w.name}", exercise ${j + 1}: missing "name"` };
      }
    }
  }

  return {
    valid: true,
    program: { program_name: obj.program_name as string, workouts },
  };
}

export async function importProgram(
  db: SQLiteDatabase,
  program: ImportProgram,
  rawJson?: string
): Promise<void> {
  // Clear existing program data (keep workout_sessions and set_logs for history)
  // Temporarily disable FK checks so history rows don't block the delete
  await db.execAsync("PRAGMA foreign_keys = OFF");
  await db.execAsync("DELETE FROM template_exercises");
  await db.execAsync("DELETE FROM workout_templates");
  await db.execAsync("DELETE FROM exercises");
  await db.execAsync("PRAGMA foreign_keys = ON");

  // Store program name
  await db.runAsync(
    "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('program_name', ?)",
    program.program_name
  );

  // Store the original JSON for re-display (use raw input if available)
  await db.runAsync(
    "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('program_json', ?)",
    rawJson || JSON.stringify(program, null, 2)
  );

  // Track unique exercises (same name = same exercise across workouts)
  const exerciseMap = new Map<string, { id: string; exercise: ImportExercise }>();

  for (let wi = 0; wi < program.workouts.length; wi++) {
    const workout = program.workouts[wi];
    const templateId = slugify(workout.name);
    const color = workout.color || DEFAULT_COLORS[wi % DEFAULT_COLORS.length];

    await db.runAsync(
      "INSERT INTO workout_templates (id, name, day_label, color, description) VALUES (?, ?, ?, ?, ?)",
      templateId,
      workout.name,
      `Day ${wi + 1}`,
      color,
      workout.description || null
    );

    for (let ei = 0; ei < workout.exercises.length; ei++) {
      const exercise = workout.exercises[ei];
      const exerciseId = exercise.id || slugify(exercise.name);

      // Insert exercise if not already inserted
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, { id: exerciseId, exercise });
        await db.runAsync(
          "INSERT INTO exercises (id, name, muscle_group, equipment, media_slug, notes) VALUES (?, ?, ?, ?, ?, ?)",
          exerciseId,
          exercise.name,
          exercise.muscle_group || "General",
          exercise.equipment || "Bodyweight",
          exercise.image_url || null,
          exercise.note || null
        );
      }

      await db.runAsync(
        "INSERT INTO template_exercises (template_id, exercise_id, sets, rep_range_min, rep_range_max, rest_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        templateId,
        exerciseId,
        exercise.sets,
        exercise.rep_min,
        exercise.rep_max,
        exercise.rest_seconds || 90,
        ei + 1
      );
    }
  }
}

export async function getProgramJson(
  db: SQLiteDatabase
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = 'program_json'"
  );
  return row?.value ?? null;
}

export async function getProgramName(
  db: SQLiteDatabase
): Promise<string> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = 'program_name'"
  );
  return row?.value ?? "GymTracker";
}

export async function hasProgram(
  db: SQLiteDatabase
): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM workout_templates"
  );
  return (row?.count ?? 0) > 0;
}

export async function deleteProgram(
  db: SQLiteDatabase
): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = OFF");
  await db.execAsync("DELETE FROM template_exercises");
  await db.execAsync("DELETE FROM workout_templates");
  await db.execAsync("DELETE FROM exercises");
  await db.execAsync("PRAGMA foreign_keys = ON");
  await db.runAsync("DELETE FROM user_settings WHERE key = 'program_json'");
  await db.runAsync("DELETE FROM user_settings WHERE key = 'program_name'");
}

/**
 * Import unified JSON that may include settings and history.
 * Called after importProgram() with the parsed JSON to restore extra data.
 */
export async function importUnifiedData(
  db: SQLiteDatabase,
  json: Record<string, unknown>
): Promise<{ historyCount: number }> {
  let historyCount = 0;

  // Restore settings
  if (json.settings && typeof json.settings === "object") {
    const settings = json.settings as Record<string, string>;
    if (settings.weight_unit) {
      await db.runAsync(
        "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('weight_unit', ?)",
        settings.weight_unit
      );
    }
  }

  // Restore history
  if (Array.isArray(json.history) && json.history.length > 0) {
    // Clear existing history
    await db.execAsync("DELETE FROM set_logs");
    await db.execAsync("DELETE FROM workout_sessions");

    for (const entry of json.history as any[]) {
      if (!entry.date || !entry.workout) continue;

      // Find template id by name
      const tmpl = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM workout_templates WHERE name = ?",
        entry.workout
      );
      if (!tmpl) continue;

      const sessionId = `imported-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      const startedAt = entry.started_at || `${entry.date}T09:00:00.000Z`;
      const completedAt = entry.completed_at || `${entry.date}T10:00:00.000Z`;

      const settings = json.settings as Record<string, string> | undefined;
      const weightUnit = settings?.weight_unit || "kg";

      await db.runAsync(
        "INSERT INTO workout_sessions (id, template_id, date, started_at, completed_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
        sessionId,
        tmpl.id,
        entry.date,
        startedAt,
        completedAt,
        JSON.stringify({ weight_unit: weightUnit })
      );

      if (Array.isArray(entry.exercises)) {
        for (const ex of entry.exercises) {
          // Find exercise by id first, then fall back to name
          let exercise: { id: string } | null = null;
          if (ex.id) {
            exercise = await db.getFirstAsync<{ id: string }>(
              "SELECT id FROM exercises WHERE id = ?",
              ex.id
            );
          }
          if (!exercise) {
            exercise = await db.getFirstAsync<{ id: string }>(
              "SELECT id FROM exercises WHERE name = ?",
              ex.name
            );
          }
          if (!exercise) continue;

          if (Array.isArray(ex.sets)) {
            // Detailed format: sets: [{ set, weight, reps }]
            for (const s of ex.sets) {
              const weightKg =
                weightUnit === "lb"
                  ? (s.weight || 0) * 0.453592
                  : s.weight || 0;
              await db.runAsync(
                "INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps, is_warmup) VALUES (?, ?, ?, ?, ?, 0)",
                sessionId,
                exercise.id,
                s.set || 1,
                weightKg,
                s.reps || 0
              );
            }
          }
        }
      }

      historyCount++;
    }
  }

  return { historyCount };
}
