import { create } from "zustand";

export interface ActiveSet {
  setNumber: number;
  weight: number;
  reps: number;
  isLogged: boolean;
  isWarmup: boolean;
  dbId?: number;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  mediaSlug: string | null;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  sets: ActiveSet[];
  isComplete: boolean;
}

interface WorkoutState {
  sessionId: string | null;
  templateId: string | null;
  templateName: string | null;
  templateColor: string | null;
  exercises: ActiveExercise[];
  currentExerciseIndex: number;
  startedAt: string | null;
  isRestTimerActive: boolean;
  restTimeRemaining: number;
  restTotalSeconds: number;

  // Actions
  startWorkout: (
    sessionId: string,
    templateId: string,
    templateName: string,
    templateColor: string,
    exercises: ActiveExercise[]
  ) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<ActiveSet>) => void;
  markSetLogged: (exerciseIndex: number, setIndex: number, dbId: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  completeExercise: (exerciseIndex: number) => void;
  setCurrentExerciseIndex: (index: number) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  adjustRestTimer: (delta: number) => void;
  stopRestTimer: () => void;
  endWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  sessionId: null,
  templateId: null,
  templateName: null,
  templateColor: null,
  exercises: [],
  currentExerciseIndex: 0,
  startedAt: null,
  isRestTimerActive: false,
  restTimeRemaining: 0,
  restTotalSeconds: 0,

  startWorkout: (sessionId, templateId, templateName, templateColor, exercises) =>
    set({
      sessionId,
      templateId,
      templateName,
      templateColor,
      exercises,
      currentExerciseIndex: 0,
      startedAt: new Date().toISOString(),
      isRestTimerActive: false,
      restTimeRemaining: 0,
    }),

  updateSet: (exerciseIndex, setIndex, updates) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], ...updates };
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      return { exercises };
    }),

  markSetLogged: (exerciseIndex, setIndex, dbId) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], isLogged: true, dbId };
      exercise.sets = sets;
      // Check if all sets logged
      const allLogged = sets.every(s => s.isLogged);
      exercise.isComplete = allLogged;
      exercises[exerciseIndex] = exercise;
      // Auto-advance to next incomplete exercise
      let nextIndex = state.currentExerciseIndex;
      if (allLogged) {
        const nextIncomplete = exercises.findIndex((e, i) => i > exerciseIndex && !e.isComplete);
        if (nextIncomplete !== -1) nextIndex = nextIncomplete;
      }
      return { exercises, currentExerciseIndex: nextIndex };
    }),

  removeSet: (exerciseIndex, setIndex) =>
    set((state) => {
      const exercises = [...state.exercises];
      const exercise = { ...exercises[exerciseIndex] };
      const sets = [...exercise.sets];
      // Only remove if the set was logged via DB
      sets.splice(setIndex, 1);
      // Re-number
      sets.forEach((s, i) => { s.setNumber = i + 1; });
      exercise.sets = sets;
      exercises[exerciseIndex] = exercise;
      return { exercises };
    }),

  completeExercise: (exerciseIndex) =>
    set((state) => {
      const exercises = [...state.exercises];
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], isComplete: true };
      return { exercises };
    }),

  setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

  startRestTimer: (seconds) =>
    set({ isRestTimerActive: true, restTimeRemaining: seconds, restTotalSeconds: seconds }),

  tickRestTimer: () =>
    set((state) => {
      const newTime = state.restTimeRemaining - 1;
      if (newTime <= 0) {
        return { restTimeRemaining: 0, isRestTimerActive: false };
      }
      return { restTimeRemaining: newTime };
    }),

  adjustRestTimer: (delta) =>
    set((state) => ({
      restTimeRemaining: Math.max(0, state.restTimeRemaining + delta),
      restTotalSeconds: Math.max(0, state.restTotalSeconds + delta),
    })),

  stopRestTimer: () => set({ isRestTimerActive: false, restTimeRemaining: 0 }),

  endWorkout: () =>
    set({
      sessionId: null,
      templateId: null,
      templateName: null,
      templateColor: null,
      exercises: [],
      currentExerciseIndex: 0,
      startedAt: null,
      isRestTimerActive: false,
      restTimeRemaining: 0,
      restTotalSeconds: 0,
    }),
}));
