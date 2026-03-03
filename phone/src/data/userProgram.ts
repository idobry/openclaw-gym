import { colors } from "../constants/theme";

// ─── User's Workout Program ─────────────────────────────────────
// This file defines YOUR personal workout plan: which templates you
// follow, which exercises are in each template, rotation order, etc.
// Edit this file to customize your program.
//
// Exercise IDs reference the catalog in exerciseCatalog.ts.
// Use exerciseCatalogMap.get(id) to look up full exercise details.

export interface WorkoutTemplate {
  id: string;
  name: string;
  dayLabel: string;
  color: string;
  description?: string;
}

export interface TemplateExercise {
  templateId: string;
  exerciseId: string;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  sortOrder: number;
}

// ─── Templates ───────────────────────────────────────────────────

export const workoutTemplates: WorkoutTemplate[] = [
  { id: "upper_a", name: "Upper A", dayLabel: "Day 1", color: colors.upperA, description: "Chest and Shoulders with balanced pulling" },
  { id: "lower_a", name: "Lower A", dayLabel: "Day 2", color: colors.lowerA, description: "Heavy compound strength for legs" },
  { id: "upper_b", name: "Upper B", dayLabel: "Day 4", color: colors.upperB, description: "Back dominant with arm work" },
  { id: "lower_b", name: "Lower B", dayLabel: "Day 5", color: colors.lowerB, description: "Hypertrophy and metabolic stress" },
];

// ─── Rotation ────────────────────────────────────────────────────

export const ROTATION_ORDER = ["upper_a", "lower_a", "rest", "upper_b", "lower_b", "rest", "rest"] as const;

// ─── Template Exercises ──────────────────────────────────────────
// exerciseId values match IDs in exerciseCatalog.ts

export const templateExercises: TemplateExercise[] = [
  // Upper A - Chest/Shoulder Focus
  { templateId: "upper_a", exerciseId: "bench_press", sets: 4, repRangeMin: 6, repRangeMax: 8, restSeconds: 180, sortOrder: 1 },
  { templateId: "upper_a", exerciseId: "incline_db_press", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 120, sortOrder: 2 },
  { templateId: "upper_a", exerciseId: "ohp", sets: 3, repRangeMin: 6, repRangeMax: 8, restSeconds: 150, sortOrder: 3 },
  { templateId: "upper_a", exerciseId: "lateral_raises", sets: 3, repRangeMin: 12, repRangeMax: 15, restSeconds: 90, sortOrder: 4 },
  { templateId: "upper_a", exerciseId: "chest_supported_row", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 120, sortOrder: 5 },
  { templateId: "upper_a", exerciseId: "triceps_pushdown", sets: 3, repRangeMin: 10, repRangeMax: 12, restSeconds: 90, sortOrder: 6 },

  // Lower A - Heavy Strength
  { templateId: "lower_a", exerciseId: "back_squat", sets: 4, repRangeMin: 5, repRangeMax: 6, restSeconds: 210, sortOrder: 1 },
  { templateId: "lower_a", exerciseId: "rdl", sets: 3, repRangeMin: 6, repRangeMax: 8, restSeconds: 150, sortOrder: 2 },
  { templateId: "lower_a", exerciseId: "leg_press", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 120, sortOrder: 3 },
  { templateId: "lower_a", exerciseId: "seated_leg_curl", sets: 3, repRangeMin: 10, repRangeMax: 12, restSeconds: 90, sortOrder: 4 },
  { templateId: "lower_a", exerciseId: "standing_calf_raises", sets: 4, repRangeMin: 12, repRangeMax: 15, restSeconds: 90, sortOrder: 5 },
  { templateId: "lower_a", exerciseId: "cable_crunch", sets: 3, repRangeMin: 12, repRangeMax: 15, restSeconds: 90, sortOrder: 6 },

  // Upper B - Back Focus
  { templateId: "upper_b", exerciseId: "pullups", sets: 4, repRangeMin: 6, repRangeMax: 8, restSeconds: 180, sortOrder: 1 },
  { templateId: "upper_b", exerciseId: "bb_row", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 120, sortOrder: 2 },
  { templateId: "upper_b", exerciseId: "face_pull", sets: 3, repRangeMin: 12, repRangeMax: 15, restSeconds: 90, sortOrder: 3 },
  { templateId: "upper_b", exerciseId: "incline_db_press", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 120, sortOrder: 4 },
  { templateId: "upper_b", exerciseId: "curls", sets: 3, repRangeMin: 8, repRangeMax: 12, restSeconds: 90, sortOrder: 5 },
  { templateId: "upper_b", exerciseId: "hanging_leg_raises", sets: 3, repRangeMin: 10, repRangeMax: 15, restSeconds: 90, sortOrder: 6 },

  // Lower B - Hypertrophy Volume
  { templateId: "lower_b", exerciseId: "front_squat", sets: 3, repRangeMin: 8, repRangeMax: 10, restSeconds: 150, sortOrder: 1 },
  { templateId: "lower_b", exerciseId: "walking_lunges", sets: 3, repRangeMin: 10, repRangeMax: 12, restSeconds: 120, sortOrder: 2 },
  { templateId: "lower_b", exerciseId: "hip_thrust", sets: 3, repRangeMin: 8, repRangeMax: 12, restSeconds: 120, sortOrder: 3 },
  { templateId: "lower_b", exerciseId: "lying_leg_curl", sets: 3, repRangeMin: 12, repRangeMax: 15, restSeconds: 90, sortOrder: 4 },
  { templateId: "lower_b", exerciseId: "seated_calf_raises", sets: 4, repRangeMin: 12, repRangeMax: 20, restSeconds: 90, sortOrder: 5 },
  { templateId: "lower_b", exerciseId: "ab_wheel", sets: 3, repRangeMin: 10, repRangeMax: 15, restSeconds: 90, sortOrder: 6 },
];
