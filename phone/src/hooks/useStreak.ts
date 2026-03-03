import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getAllCompletedSessionDates } from "../db/queries/streaks";
import { calculateStreak, type StreakResult } from "../lib/streaks";

export function useStreak() {
  const db = useSQLiteContext();
  const [streak, setStreak] = useState<StreakResult>({
    currentStreak: 0,
    longestStreak: 0,
    workoutsThisWeek: 0,
    totalWorkouts: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const dates = await getAllCompletedSessionDates(db);
      setStreak(calculateStreak(dates));
    } catch (e) {
      console.error("Failed to load streak:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { ...streak, loading, refresh };
}
