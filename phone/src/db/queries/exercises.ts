import type { SQLiteDatabase } from "expo-sqlite";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  media_slug: string | null;
  notes: string | null;
}

export interface TemplateExerciseRow {
  id: number;
  template_id: string;
  exercise_id: string;
  sets: number;
  rep_range_min: number;
  rep_range_max: number;
  rest_seconds: number;
  sort_order: number;
  exercise_name: string;
  muscle_group: string;
  equipment: string;
  media_slug: string | null;
  notes: string | null;
}

export async function getExercise(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<Exercise | null> {
  return db.getFirstAsync<Exercise>(
    "SELECT * FROM exercises WHERE id = ?",
    exerciseId
  );
}

export async function getTemplateExercises(
  db: SQLiteDatabase,
  templateId: string
): Promise<TemplateExerciseRow[]> {
  return db.getAllAsync<TemplateExerciseRow>(
    `SELECT te.*, e.name as exercise_name, e.muscle_group, e.equipment, e.media_slug, e.notes
     FROM template_exercises te
     JOIN exercises e ON te.exercise_id = e.id
     WHERE te.template_id = ?
     ORDER BY te.sort_order`,
    templateId
  );
}

export async function getAllExercises(
  db: SQLiteDatabase
): Promise<Exercise[]> {
  return db.getAllAsync<Exercise>("SELECT * FROM exercises ORDER BY name");
}
