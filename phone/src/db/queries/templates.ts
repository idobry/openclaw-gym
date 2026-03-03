import type { SQLiteDatabase } from "expo-sqlite";

export interface WorkoutTemplateRow {
  id: string;
  name: string;
  day_label: string;
  color: string;
  description: string | null;
  exercise_count: number;
}

export async function getAllTemplates(
  db: SQLiteDatabase
): Promise<WorkoutTemplateRow[]> {
  return db.getAllAsync<WorkoutTemplateRow>(
    `SELECT wt.*, COUNT(te.id) as exercise_count
     FROM workout_templates wt
     LEFT JOIN template_exercises te ON wt.id = te.template_id
     GROUP BY wt.id
     ORDER BY wt.day_label`
  );
}
