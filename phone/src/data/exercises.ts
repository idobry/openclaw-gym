// User's custom exercise definitions (used by seed.ts for initial DB population).
// These are exercises with custom IDs/names that may not match the catalog exactly.
// For the full exercise catalog, see exerciseCatalog.ts.

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  mediaSlug: string;
  notes?: string;
}

export const exercises: ExerciseDefinition[] = [
  { id: "bench_press", name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", mediaSlug: "Barbell_Bench_Press_-_Medium_Grip" },
  { id: "incline_db_press", name: "Incline DB Press", muscleGroup: "Chest", equipment: "Dumbbell", mediaSlug: "Incline_Dumbbell_Press" },
  { id: "ohp", name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell", mediaSlug: "Barbell_Shoulder_Press" },
  { id: "lateral_raises", name: "Lateral Raises", muscleGroup: "Shoulders", equipment: "Dumbbell", mediaSlug: "Side_Lateral_Raise" },
  { id: "chest_supported_row", name: "Chest Supported Row", muscleGroup: "Back", equipment: "Dumbbell", mediaSlug: "Dumbbell_Incline_Row" },
  { id: "triceps_pushdown", name: "Triceps Pushdown", muscleGroup: "Triceps", equipment: "Cable", mediaSlug: "Triceps_Pushdown" },
  { id: "back_squat", name: "Back Squat", muscleGroup: "Quads", equipment: "Barbell", mediaSlug: "Barbell_Squat" },
  { id: "rdl", name: "Romanian Deadlift", muscleGroup: "Hamstrings", equipment: "Barbell", mediaSlug: "Romanian_Deadlift" },
  { id: "leg_press", name: "Leg Press", muscleGroup: "Quads", equipment: "Machine", mediaSlug: "Leg_Press" },
  { id: "seated_leg_curl", name: "Seated Leg Curl", muscleGroup: "Hamstrings", equipment: "Machine", mediaSlug: "Seated_Leg_Curl" },
  { id: "standing_calf_raises", name: "Standing Calf Raises", muscleGroup: "Calves", equipment: "Machine", mediaSlug: "Standing_Calf_Raises" },
  { id: "cable_crunch", name: "Cable Crunch", muscleGroup: "Abs", equipment: "Cable", mediaSlug: "Cable_Crunch" },
  { id: "pullups", name: "Pull Ups / Lat Pulldown", muscleGroup: "Back", equipment: "Bodyweight", mediaSlug: "Pullups" },
  { id: "bb_row", name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell", mediaSlug: "Bent_Over_Barbell_Row" },
  { id: "face_pull", name: "Face Pull", muscleGroup: "Rear Delts", equipment: "Cable", mediaSlug: "Face_Pull" },
  { id: "curls", name: "Barbell Curls", muscleGroup: "Biceps", equipment: "Barbell", mediaSlug: "Barbell_Curl" },
  { id: "hanging_leg_raises", name: "Hanging Leg Raises", muscleGroup: "Abs", equipment: "Bodyweight", mediaSlug: "Hanging_Leg_Raise" },
  { id: "front_squat", name: "Front / Hack Squat", muscleGroup: "Quads", equipment: "Barbell", mediaSlug: "Front_Barbell_Squat" },
  { id: "walking_lunges", name: "Walking Lunges", muscleGroup: "Quads", equipment: "Dumbbell", mediaSlug: "Dumbbell_Lunges" },
  { id: "hip_thrust", name: "Hip Thrust", muscleGroup: "Glutes", equipment: "Barbell", mediaSlug: "Barbell_Hip_Thrust" },
  { id: "lying_leg_curl", name: "Lying Leg Curl", muscleGroup: "Hamstrings", equipment: "Machine", mediaSlug: "Lying_Leg_Curls" },
  { id: "seated_calf_raises", name: "Seated Calf Raises", muscleGroup: "Calves", equipment: "Machine", mediaSlug: "Seated_Calf_Raise" },
  { id: "ab_wheel", name: "Ab Wheel / Plank", muscleGroup: "Abs", equipment: "Bodyweight", mediaSlug: "Ab_Roller" },
];
