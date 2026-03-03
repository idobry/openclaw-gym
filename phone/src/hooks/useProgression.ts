import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getSessionSets } from "../db/queries/workouts";
import { getTemplateExercises } from "../db/queries/exercises";
import { calculateAllProgressions } from "../lib/progression";

interface ProgressionSuggestion {
  exerciseId: string;
  currentWeight: number;
  suggestedWeight: number;
  increase: number;
  reason: string;
}

export function useProgression(sessionId: string | null, templateId: string | null) {
  const db = useSQLiteContext();
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);

  useEffect(() => {
    if (!sessionId || !templateId) return;
    (async () => {
      try {
        const [sets, templateExs] = await Promise.all([
          getSessionSets(db, sessionId),
          getTemplateExercises(db, templateId),
        ]);

        const exerciseMap = new Map(templateExs.map((te) => [te.exercise_id, te]));

        const inputs = templateExs.map((te) => ({
          exerciseId: te.exercise_id,
          equipment: te.equipment,
          repRangeMax: te.rep_range_max,
          sets: sets
            .filter((s) => s.exercise_id === te.exercise_id)
            .map((s) => ({ weight: s.weight, reps: s.reps, isWarmup: s.is_warmup === 1 })),
        }));

        setSuggestions(calculateAllProgressions(inputs));
      } catch (e) {
        console.error("Progression calc failed:", e);
      }
    })();
  }, [sessionId, templateId]);

  return suggestions;
}
