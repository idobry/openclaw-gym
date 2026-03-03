// Re-export from userProgram.ts - the user's personal workout configuration.
// This file exists for backward compatibility with existing imports.
export {
  type WorkoutTemplate,
  type TemplateExercise,
  workoutTemplates,
  templateExercises,
  ROTATION_ORDER,
} from "./userProgram";
