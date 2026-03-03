import { startOfWeek, differenceInCalendarWeeks, parseISO, format } from "date-fns";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  workoutsThisWeek: number;
  totalWorkouts: number;
}

export function calculateStreak(sessionDates: string[]): StreakResult {
  if (sessionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, workoutsThisWeek: 0, totalWorkouts: 0 };
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const currentWeekStr = format(weekStart, "yyyy-MM-dd");

  // Group sessions by week (Monday start)
  const weekMap = new Map<string, number>();
  for (const dateStr of sessionDates) {
    const date = parseISO(dateStr);
    const week = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1);
  }

  // Count workouts this week
  const workoutsThisWeek = weekMap.get(currentWeekStr) ?? 0;

  // Get all weeks sorted descending
  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]));

  // Calculate current streak (consecutive weeks with >= 3 sessions)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort weeks ascending for streak calculation
  const weeksAsc = [...weeks].reverse();

  for (let i = 0; i < weeksAsc.length; i++) {
    const [weekStr, count] = weeksAsc[i];
    if (count >= 3) {
      // Check if consecutive with previous qualifying week
      if (tempStreak === 0) {
        tempStreak = 1;
      } else {
        const prevWeek = parseISO(weeksAsc[i - 1][0]);
        const thisWeek = parseISO(weekStr);
        const weekDiff = differenceInCalendarWeeks(thisWeek, prevWeek, { weekStartsOn: 1 });
        if (weekDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
    } else {
      tempStreak = 0;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Current streak = streak ending at current or previous week
  currentStreak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    // Walk from most recent week backwards
  }
  // Recalculate from most recent week
  const sortedDesc = [...weeks];
  // Check if current week or last week qualifies
  if (sortedDesc.length > 0) {
    const mostRecentWeek = sortedDesc[0][0];
    const weekDiffFromNow = differenceInCalendarWeeks(weekStart, parseISO(mostRecentWeek), { weekStartsOn: 1 });

    if (weekDiffFromNow <= 1) {
      // Start counting streak from most recent qualifying week
      for (let i = 0; i < sortedDesc.length; i++) {
        const [weekStr, count] = sortedDesc[i];
        if (count >= 3) {
          if (i === 0) {
            currentStreak = 1;
          } else {
            const prevWeek = parseISO(sortedDesc[i - 1][0]);
            const thisWeek = parseISO(weekStr);
            const diff = differenceInCalendarWeeks(prevWeek, thisWeek, { weekStartsOn: 1 });
            if (diff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        } else {
          break;
        }
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    workoutsThisWeek,
    totalWorkouts: sessionDates.length,
  };
}
