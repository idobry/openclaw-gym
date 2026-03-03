import type { SQLiteDatabase } from "expo-sqlite";
import { exercises } from "../data/exercises";
import { workoutTemplates, templateExercises } from "../data/templates";

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM exercises"
  );
  if (existing && existing.count > 0) return;

  await db.withTransactionAsync(async () => {
    // Seed exercises
    for (const ex of exercises) {
      await db.runAsync(
        "INSERT INTO exercises (id, name, muscle_group, equipment, media_slug, notes) VALUES (?, ?, ?, ?, ?, ?)",
        ex.id, ex.name, ex.muscleGroup, ex.equipment, ex.mediaSlug, ex.notes ?? null
      );
    }

    // Seed workout templates
    for (const tmpl of workoutTemplates) {
      await db.runAsync(
        "INSERT INTO workout_templates (id, name, day_label, color) VALUES (?, ?, ?, ?)",
        tmpl.id, tmpl.name, tmpl.dayLabel, tmpl.color
      );
    }

    // Seed template exercises
    for (const te of templateExercises) {
      await db.runAsync(
        "INSERT INTO template_exercises (template_id, exercise_id, sets, rep_range_min, rep_range_max, rest_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        te.templateId, te.exerciseId, te.sets, te.repRangeMin, te.repRangeMax, te.restSeconds, te.sortOrder
      );
    }

    // Set default settings
    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('weight_unit', 'lbs')"
    );
  });
}
