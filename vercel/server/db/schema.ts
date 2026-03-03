import {
  pgTable,
  text,
  uuid,
  integer,
  real,
  boolean,
  serial,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// -- Profiles (synced with Supabase auth.users) --

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  displayName: text("display_name"),
  weightUnit: text("weight_unit").default("kg"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// -- Exercises --

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment"),
  mediaSlug: text("media_slug"),
  notes: text("notes"),
});

// -- Workout Templates --

export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    dayLabel: text("day_label"),
    color: text("color"),
    description: text("description"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_templates_user").on(table.userId)]
);

// -- Template Exercises --

export const templateExercises = pgTable("template_exercises", {
  id: serial("id").primaryKey(),
  templateId: text("template_id")
    .references(() => workoutTemplates.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: text("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  sets: integer("sets").default(3),
  repRangeMin: integer("rep_range_min").default(8),
  repRangeMax: integer("rep_range_max").default(12),
  restSeconds: integer("rest_seconds").default(90),
  sortOrder: integer("sort_order").default(0),
});

// -- Workout Sessions --

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    templateId: text("template_id").references(() => workoutTemplates.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: jsonb("notes"),
  },
  (table) => [
    index("idx_sessions_user_date").on(table.userId, table.date),
    index("idx_sessions_template").on(table.templateId),
  ]
);

// -- Set Logs --

export const setLogs = pgTable(
  "set_logs",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id")
      .references(() => workoutSessions.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: text("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    setNumber: integer("set_number").notNull(),
    weight: real("weight"),
    reps: integer("reps"),
    isWarmup: boolean("is_warmup").default(false),
  },
  (table) => [
    index("idx_set_logs_session").on(table.sessionId),
    index("idx_set_logs_exercise").on(table.exerciseId),
  ]
);

// -- Change Log --

export const changeLog = pgTable(
  "change_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    actor: text("actor").notNull(), // 'user' | 'agent'
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    diff: jsonb("diff"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_change_log_user").on(table.userId, table.createdAt)]
);

// -- API Keys --

export const apiKeys = pgTable(
  "api_keys",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    keyHash: text("key_hash").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("idx_api_keys_user").on(table.userId)]
);
