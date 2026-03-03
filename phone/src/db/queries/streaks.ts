import type { SQLiteDatabase } from "expo-sqlite";

export async function getAllCompletedSessionDates(
  db: SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM workout_sessions
     WHERE completed_at IS NOT NULL
     ORDER BY date`
  );
  return rows.map(r => r.date);
}
