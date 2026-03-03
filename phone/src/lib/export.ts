import type { SQLiteDatabase } from "expo-sqlite";

interface ExportData {
  version: 1;
  exportedAt: string;
  sessions: Array<{
    id: string;
    template_id: string;
    date: string;
    started_at: string;
    completed_at: string | null;
    notes: string | null;
    sets: Array<{
      exercise_id: string;
      set_number: number;
      weight: number;
      reps: number;
      is_warmup: number;
    }>;
  }>;
}

export async function exportData(db: SQLiteDatabase): Promise<string> {
  const sessions = await db.getAllAsync<{
    id: string;
    template_id: string;
    date: string;
    started_at: string;
    completed_at: string | null;
    notes: string | null;
  }>("SELECT * FROM workout_sessions WHERE completed_at IS NOT NULL ORDER BY date");

  const exportSessions = [];
  for (const session of sessions) {
    const sets = await db.getAllAsync<{
      exercise_id: string;
      set_number: number;
      weight: number;
      reps: number;
      is_warmup: number;
    }>(
      "SELECT exercise_id, set_number, weight, reps, is_warmup FROM set_logs WHERE session_id = ? ORDER BY exercise_id, set_number",
      session.id
    );
    exportSessions.push({ ...session, sets });
  }

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: exportSessions,
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(db: SQLiteDatabase, jsonString: string): Promise<{ imported: number; skipped: number }> {
  const data: ExportData = JSON.parse(jsonString);
  if (data.version !== 1) throw new Error("Unsupported export version");

  let imported = 0;
  let skipped = 0;

  await db.withTransactionAsync(async () => {
    for (const session of data.sessions) {
      // Skip if session already exists
      const existing = await db.getFirstAsync(
        "SELECT id FROM workout_sessions WHERE id = ?",
        session.id
      );
      if (existing) {
        skipped++;
        continue;
      }

      await db.runAsync(
        "INSERT INTO workout_sessions (id, template_id, date, started_at, completed_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
        session.id, session.template_id, session.date, session.started_at, session.completed_at, session.notes
      );

      for (const set of session.sets) {
        await db.runAsync(
          "INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps, is_warmup) VALUES (?, ?, ?, ?, ?, ?)",
          session.id, set.exercise_id, set.set_number, set.weight, set.reps, set.is_warmup
        );
      }

      imported++;
    }
  });

  return { imported, skipped };
}
