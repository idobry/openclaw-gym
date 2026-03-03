import type { SQLiteDatabase } from "expo-sqlite";

export async function removeExerciseFromTemplate(
  db: SQLiteDatabase,
  templateExerciseId: number,
  templateId: string
): Promise<void> {
  await db.runAsync(
    "DELETE FROM template_exercises WHERE id = ?",
    templateExerciseId
  );
  // Re-normalize sort_order for remaining rows
  const remaining = await db.getAllAsync<{ id: number }>(
    "SELECT id FROM template_exercises WHERE template_id = ? ORDER BY sort_order",
    templateId
  );
  for (let i = 0; i < remaining.length; i++) {
    await db.runAsync(
      "UPDATE template_exercises SET sort_order = ? WHERE id = ?",
      i,
      remaining[i].id
    );
  }
}

export async function addExerciseToTemplate(
  db: SQLiteDatabase,
  templateId: string,
  exerciseId: string,
  defaults?: { sets?: number; repMin?: number; repMax?: number; rest?: number }
): Promise<void> {
  const row = await db.getFirstAsync<{ max_order: number | null }>(
    "SELECT MAX(sort_order) as max_order FROM template_exercises WHERE template_id = ?",
    templateId
  );
  const nextOrder = (row?.max_order ?? -1) + 1;
  await db.runAsync(
    `INSERT INTO template_exercises (template_id, exercise_id, sets, rep_range_min, rep_range_max, rest_seconds, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    templateId,
    exerciseId,
    defaults?.sets ?? 3,
    defaults?.repMin ?? 8,
    defaults?.repMax ?? 12,
    defaults?.rest ?? 90,
    nextOrder
  );
}

export async function replaceExerciseInTemplate(
  db: SQLiteDatabase,
  templateExerciseId: number,
  newExerciseId: string
): Promise<void> {
  await db.runAsync(
    "UPDATE template_exercises SET exercise_id = ? WHERE id = ?",
    newExerciseId,
    templateExerciseId
  );
}
