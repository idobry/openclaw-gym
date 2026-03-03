import type { SQLiteDatabase } from "expo-sqlite";

export interface WorkoutSession {
  id: string;
  template_id: string;
  date: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface SetLog {
  id: number;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  is_warmup: number;
}

export interface SessionWithTemplate extends WorkoutSession {
  template_name: string;
  template_color: string;
}

export async function createSession(
  db: SQLiteDatabase,
  id: string,
  templateId: string,
  date: string,
  startedAt: string
): Promise<void> {
  await db.runAsync(
    "INSERT INTO workout_sessions (id, template_id, date, started_at) VALUES (?, ?, ?, ?)",
    id, templateId, date, startedAt
  );
}

export async function completeSession(
  db: SQLiteDatabase,
  sessionId: string,
  completedAt: string,
  notes?: string
): Promise<void> {
  await db.runAsync(
    "UPDATE workout_sessions SET completed_at = ?, notes = ? WHERE id = ?",
    completedAt, notes ?? null, sessionId
  );
}

export async function deleteSession(
  db: SQLiteDatabase,
  sessionId: string
): Promise<void> {
  await db.runAsync("DELETE FROM workout_sessions WHERE id = ?", sessionId);
}

export async function logSet(
  db: SQLiteDatabase,
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  isWarmup: boolean = false
): Promise<number> {
  const result = await db.runAsync(
    "INSERT INTO set_logs (session_id, exercise_id, set_number, weight, reps, is_warmup) VALUES (?, ?, ?, ?, ?, ?)",
    sessionId, exerciseId, setNumber, weight, reps, isWarmup ? 1 : 0
  );
  return result.lastInsertRowId;
}

export async function deleteSetLog(
  db: SQLiteDatabase,
  setLogId: number
): Promise<void> {
  await db.runAsync("DELETE FROM set_logs WHERE id = ?", setLogId);
}

export async function getSessionSets(
  db: SQLiteDatabase,
  sessionId: string
): Promise<SetLog[]> {
  return db.getAllAsync<SetLog>(
    "SELECT * FROM set_logs WHERE session_id = ? ORDER BY exercise_id, set_number",
    sessionId
  );
}

export async function getRecentSessions(
  db: SQLiteDatabase,
  limit: number = 20
): Promise<SessionWithTemplate[]> {
  return db.getAllAsync<SessionWithTemplate>(
    `SELECT ws.*, wt.name as template_name, wt.color as template_color
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.completed_at IS NOT NULL
     ORDER BY ws.date DESC, ws.started_at DESC
     LIMIT ?`,
    limit
  );
}

export async function getLastSession(
  db: SQLiteDatabase
): Promise<SessionWithTemplate | null> {
  return db.getFirstAsync<SessionWithTemplate>(
    `SELECT ws.*, wt.name as template_name, wt.color as template_color
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.completed_at IS NOT NULL
     ORDER BY ws.date DESC, ws.started_at DESC
     LIMIT 1`
  );
}

export async function getSessionsByDateRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<SessionWithTemplate[]> {
  return db.getAllAsync<SessionWithTemplate>(
    `SELECT ws.*, wt.name as template_name, wt.color as template_color
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.completed_at IS NOT NULL AND ws.date >= ? AND ws.date <= ?
     ORDER BY ws.date DESC`,
    startDate, endDate
  );
}

export async function getSessionDates(
  db: SQLiteDatabase
): Promise<{ date: string; template_id: string; color: string }[]> {
  return db.getAllAsync(
    `SELECT ws.date, ws.template_id, wt.color
     FROM workout_sessions ws
     JOIN workout_templates wt ON ws.template_id = wt.id
     WHERE ws.completed_at IS NOT NULL
     ORDER BY ws.date`
  );
}

export interface SetLogWithExercise extends SetLog {
  exercise_name: string;
  muscle_group: string;
  equipment: string;
  media_slug: string | null;
}

export async function getSessionSetsWithExercises(
  db: SQLiteDatabase,
  sessionId: string
): Promise<SetLogWithExercise[]> {
  return db.getAllAsync<SetLogWithExercise>(
    `SELECT sl.*, e.name as exercise_name, e.muscle_group, e.equipment, e.media_slug
     FROM set_logs sl
     JOIN exercises e ON sl.exercise_id = e.id
     WHERE sl.session_id = ?
     ORDER BY sl.exercise_id, sl.set_number`,
    sessionId
  );
}

export async function updateSetLog(
  db: SQLiteDatabase,
  setLogId: number,
  weight: number,
  reps: number
): Promise<void> {
  await db.runAsync(
    "UPDATE set_logs SET weight = ?, reps = ? WHERE id = ?",
    weight, reps, setLogId
  );
}
