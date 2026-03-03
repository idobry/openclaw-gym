import type { SQLiteDatabase } from "expo-sqlite";

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  reps_at_max: number;
  date: string;
}

export interface VolumeByDate {
  date: string;
  total_volume: number;
}

export interface ExerciseProgressPoint {
  date: string;
  max_weight: number;
  best_set_reps: number;
}

export async function getPersonalRecords(
  db: SQLiteDatabase
): Promise<PersonalRecord[]> {
  return db.getAllAsync<PersonalRecord>(
    `SELECT sl.exercise_id, e.name as exercise_name, sl.weight as max_weight, sl.reps as reps_at_max, ws.date
     FROM set_logs sl
     JOIN exercises e ON sl.exercise_id = e.id
     JOIN workout_sessions ws ON sl.session_id = ws.id
     WHERE sl.is_warmup = 0
     AND sl.weight = (
       SELECT MAX(sl2.weight) FROM set_logs sl2 WHERE sl2.exercise_id = sl.exercise_id AND sl2.is_warmup = 0
     )
     GROUP BY sl.exercise_id
     ORDER BY sl.weight DESC`
  );
}

export async function getExercisePR(
  db: SQLiteDatabase,
  exerciseId: string
): Promise<{ max_weight: number; reps: number } | null> {
  return db.getFirstAsync(
    `SELECT MAX(weight) as max_weight, reps
     FROM set_logs
     WHERE exercise_id = ? AND is_warmup = 0
     GROUP BY exercise_id
     ORDER BY weight DESC
     LIMIT 1`,
    exerciseId
  );
}

export async function getExerciseProgress(
  db: SQLiteDatabase,
  exerciseId: string,
  limit: number = 30
): Promise<ExerciseProgressPoint[]> {
  return db.getAllAsync<ExerciseProgressPoint>(
    `SELECT ws.date, MAX(sl.weight) as max_weight, sl.reps as best_set_reps
     FROM set_logs sl
     JOIN workout_sessions ws ON sl.session_id = ws.id
     WHERE sl.exercise_id = ? AND sl.is_warmup = 0 AND ws.completed_at IS NOT NULL
     GROUP BY ws.date
     ORDER BY ws.date DESC
     LIMIT ?`,
    exerciseId, limit
  );
}

export async function getWeeklyVolume(
  db: SQLiteDatabase,
  weeks: number = 8
): Promise<VolumeByDate[]> {
  return db.getAllAsync<VolumeByDate>(
    `SELECT ws.date, SUM(sl.weight * sl.reps) as total_volume
     FROM set_logs sl
     JOIN workout_sessions ws ON sl.session_id = ws.id
     WHERE sl.is_warmup = 0 AND ws.completed_at IS NOT NULL
     AND ws.date >= date('now', '-' || ? || ' days')
     GROUP BY ws.date
     ORDER BY ws.date`,
    weeks * 7
  );
}

export async function getSessionVolume(
  db: SQLiteDatabase,
  sessionId: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(weight * reps), 0) as total
     FROM set_logs
     WHERE session_id = ? AND is_warmup = 0`,
    sessionId
  );
  return result?.total ?? 0;
}

export async function getSessionPRs(
  db: SQLiteDatabase,
  sessionId: string
): Promise<{ exercise_id: string; exercise_name: string; weight: number; reps: number }[]> {
  return db.getAllAsync(
    `SELECT sl.exercise_id, e.name as exercise_name, sl.weight, sl.reps
     FROM set_logs sl
     JOIN exercises e ON sl.exercise_id = e.id
     WHERE sl.session_id = ? AND sl.is_warmup = 0
     AND sl.weight >= (
       SELECT COALESCE(MAX(sl2.weight), 0)
       FROM set_logs sl2
       JOIN workout_sessions ws2 ON sl2.session_id = ws2.id
       WHERE sl2.exercise_id = sl.exercise_id
       AND sl2.is_warmup = 0
       AND ws2.completed_at IS NOT NULL
       AND sl2.session_id != ?
     )
     AND sl.weight > 0
     GROUP BY sl.exercise_id`,
    sessionId, sessionId
  );
}

export async function getLastSessionSetsForExercise(
  db: SQLiteDatabase,
  exerciseId: string,
  excludeSessionId?: string
): Promise<{ weight: number; reps: number; set_number: number }[]> {
  const excludeClause = excludeSessionId ? "AND ws.id != ?" : "";
  const params: (string | number)[] = [exerciseId];
  if (excludeSessionId) params.push(excludeSessionId);

  return db.getAllAsync(
    `SELECT sl.weight, sl.reps, sl.set_number
     FROM set_logs sl
     JOIN workout_sessions ws ON sl.session_id = ws.id
     WHERE sl.exercise_id = ? AND sl.is_warmup = 0 AND ws.completed_at IS NOT NULL ${excludeClause}
     AND ws.date = (
       SELECT MAX(ws2.date) FROM workout_sessions ws2
       JOIN set_logs sl2 ON sl2.session_id = ws2.id
       WHERE sl2.exercise_id = ? AND ws2.completed_at IS NOT NULL ${excludeSessionId ? "AND ws2.id != ?" : ""}
     )
     ORDER BY sl.set_number`,
    ...params, exerciseId, ...(excludeSessionId ? [excludeSessionId] : [])
  );
}

export async function getWorkoutCountForPeriod(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_sessions
     WHERE completed_at IS NOT NULL AND date >= ? AND date <= ?`,
    startDate, endDate
  );
  return result?.count ?? 0;
}
