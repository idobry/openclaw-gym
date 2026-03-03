export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  muscle_group  TEXT NOT NULL,
  equipment     TEXT NOT NULL,
  media_slug    TEXT,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  day_label   TEXT NOT NULL,
  color       TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id     TEXT NOT NULL REFERENCES workout_templates(id),
  exercise_id     TEXT NOT NULL REFERENCES exercises(id),
  sets            INTEGER NOT NULL,
  rep_range_min   INTEGER NOT NULL,
  rep_range_max   INTEGER NOT NULL,
  rest_seconds    INTEGER NOT NULL,
  sort_order      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id            TEXT PRIMARY KEY,
  template_id   TEXT NOT NULL REFERENCES workout_templates(id),
  date          TEXT NOT NULL,
  started_at    TEXT NOT NULL,
  completed_at  TEXT,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS set_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  set_number    INTEGER NOT NULL,
  weight        REAL NOT NULL,
  reps          INTEGER NOT NULL,
  is_warmup     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercise_media_cache (
  exercise_id   TEXT PRIMARY KEY REFERENCES exercises(id),
  image_urls    TEXT NOT NULL,
  fetched_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_set_logs_session ON set_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);
`;
