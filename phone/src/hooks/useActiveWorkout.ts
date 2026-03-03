import { useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { format } from "date-fns";

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
import { useWorkoutStore, type ActiveExercise, type ActiveSet } from "../stores/workoutStore";
import { getTemplateExercises, type TemplateExerciseRow } from "../db/queries/exercises";
import { createSession, completeSession, logSet } from "../db/queries/workouts";
import { getLastSessionSetsForExercise } from "../db/queries/progress";
import type { WorkoutTemplate } from "../data/templates";

export function useActiveWorkout() {
  const db = useSQLiteContext();
  const store = useWorkoutStore();

  const startWorkout = useCallback(
    async (template: WorkoutTemplate) => {
      const sessionId = generateId();
      const now = new Date();
      const date = format(now, "yyyy-MM-dd");
      const startedAt = now.toISOString();

      await createSession(db, sessionId, template.id, date, startedAt);

      const templateExercises = await getTemplateExercises(db, template.id);

      const exercises: ActiveExercise[] = await Promise.all(
        templateExercises.map(async (te: TemplateExerciseRow) => {
          const lastSets = await getLastSessionSetsForExercise(db, te.exercise_id);
          const prefillWeight = lastSets.length > 0 ? lastSets[0].weight : 0;

          const sets: ActiveSet[] = Array.from({ length: te.sets }, (_, i) => ({
            setNumber: i + 1,
            weight: prefillWeight,
            reps: 0,
            isLogged: false,
            isWarmup: false,
          }));

          return {
            exerciseId: te.exercise_id,
            exerciseName: te.exercise_name,
            muscleGroup: te.muscle_group,
            equipment: te.equipment,
            mediaSlug: te.media_slug,
            targetSets: te.sets,
            repRangeMin: te.rep_range_min,
            repRangeMax: te.rep_range_max,
            restSeconds: te.rest_seconds,
            sets,
            isComplete: false,
          };
        })
      );

      store.startWorkout(sessionId, template.id, template.name, template.color, exercises);
    },
    [db, store]
  );

  const handleLogSet = useCallback(
    async (exerciseIndex: number, setIndex: number) => {
      const exercise = store.exercises[exerciseIndex];
      const set = exercise.sets[setIndex];
      if (!store.sessionId || set.isLogged) return;

      const dbId = await logSet(
        db,
        store.sessionId,
        exercise.exerciseId,
        set.setNumber,
        set.weight,
        set.reps,
        set.isWarmup
      );

      store.markSetLogged(exerciseIndex, setIndex, dbId);
      store.startRestTimer(exercise.restSeconds);
    },
    [db, store]
  );

  const handleCompleteWorkout = useCallback(async () => {
    if (!store.sessionId) return null;
    const completedAt = new Date().toISOString();
    await completeSession(db, store.sessionId, completedAt);
    const sessionId = store.sessionId;
    store.endWorkout();

    // Push session to server in background if authenticated
    const { useAuthStore } = await import("../stores/authStore");
    if (useAuthStore.getState().isAuthenticated) {
      const { pushSession } = await import("../lib/sync");
      pushSession(db, sessionId).catch(console.warn);
    }

    return sessionId;
  }, [db, store]);

  const handleCancelWorkout = useCallback(async () => {
    if (!store.sessionId) return;
    const { deleteSession } = await import("../db/queries/workouts");
    await deleteSession(db, store.sessionId);
    store.endWorkout();
  }, [db, store]);

  return {
    startWorkout,
    handleLogSet,
    handleCompleteWorkout,
    handleCancelWorkout,
    isActive: store.sessionId !== null,
  };
}
