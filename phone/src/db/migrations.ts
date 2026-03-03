import type { SQLiteDatabase } from "expo-sqlite";
import { CREATE_TABLES_SQL } from "./schema";
import exerciseCatalog from "./exercise-catalog.json";

const CURRENT_VERSION = 6;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create tables first
  await db.execAsync(CREATE_TABLES_SQL);

  // Get current version
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM user_settings WHERE key = 'db_version'"
  );
  const currentVersion = result ? parseInt(result.value, 10) : 0;

  if (currentVersion < 1) {
    // Initial version - tables already created above
    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      "1"
    );
  }

  if (currentVersion < 2) {
    // Remove hardcoded seed data - workouts should only come from JSON import
    await db.execAsync("DELETE FROM template_exercises");
    await db.execAsync("DELETE FROM workout_templates");
    await db.execAsync("DELETE FROM exercises");
    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      "2"
    );
  }

  if (currentVersion < 3) {
    // Add description column to workout_templates
    await db.execAsync(
      "ALTER TABLE workout_templates ADD COLUMN description TEXT"
    ).catch(() => {
      // Column may already exist from fresh install
    });

    // Backfill descriptions from stored JSON if available
    const jsonRow = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM user_settings WHERE key = 'program_json'"
    );
    if (jsonRow?.value) {
      try {
        const parsed = JSON.parse(jsonRow.value);
        const workouts = parsed.workouts;
        if (workouts && typeof workouts === "object" && !Array.isArray(workouts)) {
          // Object format: { "Upper_A": { focus: "..." } }
          for (const [key, w] of Object.entries(workouts as Record<string, any>)) {
            const desc = w.description || w.focus;
            if (desc) {
              const slug = (w.name || key.replace(/_/g, " "))
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");
              await db.runAsync(
                "UPDATE workout_templates SET description = ? WHERE id = ?",
                desc, slug
              );
            }
          }
        } else if (Array.isArray(workouts)) {
          for (const w of workouts) {
            const desc = w.description || w.focus;
            if (desc && w.name) {
              const slug = w.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");
              await db.runAsync(
                "UPDATE workout_templates SET description = ? WHERE id = ?",
                desc, slug
              );
            }
          }
        }
      } catch {
        // JSON parse failed, skip backfill
      }
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      "3"
    );
  }

  if (currentVersion < 4) {
    // Add weight_unit setting (default kg)
    await db.runAsync(
      "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('weight_unit', 'kg')"
    );
    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      "4"
    );
  }

  if (currentVersion < 5) {
    // Seed full exercise catalog (873 exercises from free-exercise-db)
    // INSERT OR IGNORE preserves existing exercises (user's program + notes)
    const catalog = exerciseCatalog as Array<{
      id: string;
      name: string;
      muscle_group: string;
      equipment: string;
      media_slug: string;
    }>;

    // Batch insert in chunks of 50 within a transaction for performance
    await db.execAsync("BEGIN TRANSACTION");
    try {
      for (const e of catalog) {
        await db.runAsync(
          "INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, media_slug) VALUES (?, ?, ?, ?, ?)",
          e.id, e.name, e.muscle_group, e.equipment, e.media_slug
        );
      }
      await db.execAsync("COMMIT");
    } catch (err) {
      await db.execAsync("ROLLBACK");
      throw err;
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      "5"
    );
  }

  if (currentVersion < 6) {
    // Simplify muscle groups to 7 categories: Chest, Back, Shoulders, Arms, Legs, Abs, Other
    const catalog = exerciseCatalog as Array<{
      id: string;
      name: string;
      muscle_group: string;
      equipment: string;
      media_slug: string;
    }>;

    // Update catalog exercises with correct groups
    await db.execAsync("BEGIN TRANSACTION");
    try {
      for (const e of catalog) {
        await db.runAsync(
          "UPDATE exercises SET muscle_group = ?, equipment = ? WHERE id = ?",
          e.muscle_group, e.equipment, e.id
        );
      }

      // Also remap any user-imported exercises with old group names
      const remap: Record<string, string> = {
        Biceps: "Arms",
        Triceps: "Arms",
        Forearms: "Arms",
        Quads: "Legs",
        Quadriceps: "Legs",
        Hamstrings: "Legs",
        Calves: "Legs",
        Glutes: "Legs",
        Abductors: "Legs",
        Adductors: "Legs",
        Lats: "Back",
        "Lower Back": "Back",
        "Middle Back": "Back",
        Traps: "Shoulders",
        Neck: "Other",
      };
      for (const [old, consolidated] of Object.entries(remap)) {
        await db.runAsync(
          "UPDATE exercises SET muscle_group = ? WHERE muscle_group = ?",
          consolidated, old
        );
      }

      await db.execAsync("COMMIT");
    } catch (err) {
      await db.execAsync("ROLLBACK");
      throw err;
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('db_version', ?)",
      CURRENT_VERSION.toString()
    );
  }
}
