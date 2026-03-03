import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  getExerciseProgress,
  getExercisePR,
  getLastSessionSetsForExercise,
  type ExerciseProgressPoint,
} from "../db/queries/progress";

interface ExerciseHistory {
  progress: ExerciseProgressPoint[];
  pr: { max_weight: number; reps: number } | null;
  lastSets: { weight: number; reps: number; set_number: number }[];
  loading: boolean;
}

export function useExerciseHistory(exerciseId: string, excludeSessionId?: string): ExerciseHistory {
  const db = useSQLiteContext();
  const [progress, setProgress] = useState<ExerciseProgressPoint[]>([]);
  const [pr, setPR] = useState<{ max_weight: number; reps: number } | null>(null);
  const [lastSets, setLastSets] = useState<{ weight: number; reps: number; set_number: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progressData, prData, lastSetsData] = await Promise.all([
          getExerciseProgress(db, exerciseId),
          getExercisePR(db, exerciseId),
          getLastSessionSetsForExercise(db, exerciseId, excludeSessionId),
        ]);
        if (!cancelled) {
          setProgress(progressData);
          setPR(prData);
          setLastSets(lastSetsData);
        }
      } catch (e) {
        console.error("Failed to load exercise history:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [exerciseId, excludeSessionId]);

  return { progress, pr, lastSets, loading };
}
