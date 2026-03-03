import { Router, Request, Response, NextFunction } from "express";
import { eq, and, gte, sql, desc, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import {
  setLogs,
  exercises,
  workoutSessions,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { NotFound } from "../lib/errors";
import { parseLimit } from "../lib/pagination";

const router = Router();
router.use(authMiddleware);

// GET /stats/prs
router.get("/prs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 100);

    const results = await db.execute(sql`
      SELECT sl.exercise_id, e.name AS exercise_name,
             sl.weight AS max_weight, sl.reps AS reps_at_max, ws.date
      FROM set_logs sl
      JOIN exercises e ON sl.exercise_id = e.id
      JOIN workout_sessions ws ON sl.session_id = ws.id
      WHERE ws.user_id = ${req.auth!.userId}
        AND sl.is_warmup = false
        AND sl.weight = (
          SELECT MAX(sl2.weight) FROM set_logs sl2
          JOIN workout_sessions ws2 ON sl2.session_id = ws2.id
          WHERE sl2.exercise_id = sl.exercise_id
            AND sl2.is_warmup = false
            AND ws2.user_id = ${req.auth!.userId}
        )
      GROUP BY sl.exercise_id, e.name, sl.weight, sl.reps, ws.date
      ORDER BY sl.weight DESC
      LIMIT ${limit}
    `);

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// GET /stats/prs/:exerciseId
router.get(
  "/prs/:exerciseId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await db.execute(sql`
        SELECT MAX(sl.weight) AS max_weight, sl.reps
        FROM set_logs sl
        JOIN workout_sessions ws ON sl.session_id = ws.id
        WHERE sl.exercise_id = ${req.params.exerciseId}
          AND sl.is_warmup = false
          AND ws.user_id = ${req.auth!.userId}
        GROUP BY sl.exercise_id
        ORDER BY max_weight DESC
        LIMIT 1
      `);

      if (results.length === 0) throw NotFound("Exercise PR");
      res.json({ data: results[0] });
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats/streaks
router.get(
  "/streaks",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all completed session dates
      const sessions = await db
        .selectDistinct({ date: workoutSessions.date })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, req.auth!.userId),
            isNotNull(workoutSessions.completedAt)
          )
        )
        .orderBy(workoutSessions.date);

      const dates = sessions.map((s) => s.date);
      const totalWorkouts = dates.length;

      // Calculate streaks (consecutive weeks with 3+ workouts)
      const { currentStreak, longestStreak, thisWeek } =
        calculateStreaks(dates);

      res.json({
        data: {
          currentStreak,
          longestStreak,
          thisWeek,
          totalWorkouts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats/volume?weeks=8
router.get(
  "/volume",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weeks = Math.min(Number(req.query.weeks) || 8, 52);
      const daysAgo = weeks * 7;

      const results = await db.execute(sql`
        SELECT ws.date, SUM(sl.weight * sl.reps) AS total_volume
        FROM set_logs sl
        JOIN workout_sessions ws ON sl.session_id = ws.id
        WHERE sl.is_warmup = false
          AND ws.completed_at IS NOT NULL
          AND ws.user_id = ${req.auth!.userId}
          AND ws.date >= CURRENT_DATE - ${daysAgo}::integer
        GROUP BY ws.date
        ORDER BY ws.date
      `);

      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats/progress/:exerciseId
router.get(
  "/progress/:exerciseId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseLimit(req.query.limit, 30, 100);

      const results = await db.execute(sql`
        SELECT ws.date, MAX(sl.weight) AS max_weight, sl.reps AS best_set_reps
        FROM set_logs sl
        JOIN workout_sessions ws ON sl.session_id = ws.id
        WHERE sl.exercise_id = ${req.params.exerciseId}
          AND sl.is_warmup = false
          AND ws.completed_at IS NOT NULL
          AND ws.user_id = ${req.auth!.userId}
        GROUP BY ws.date, sl.reps
        ORDER BY ws.date DESC
        LIMIT ${limit}
      `);

      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /stats/summary
router.get(
  "/summary",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all dates for streak calc
      const sessions = await db
        .selectDistinct({ date: workoutSessions.date })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.userId, req.auth!.userId),
            isNotNull(workoutSessions.completedAt)
          )
        )
        .orderBy(workoutSessions.date);

      const dates = sessions.map((s) => s.date);
      const { currentStreak, longestStreak, thisWeek } =
        calculateStreaks(dates);

      // Top 5 PRs
      const prs = await db.execute(sql`
        SELECT sl.exercise_id, e.name AS exercise_name,
               sl.weight AS max_weight, sl.reps AS reps_at_max
        FROM set_logs sl
        JOIN exercises e ON sl.exercise_id = e.id
        JOIN workout_sessions ws ON sl.session_id = ws.id
        WHERE ws.user_id = ${req.auth!.userId}
          AND sl.is_warmup = false
          AND sl.weight = (
            SELECT MAX(sl2.weight) FROM set_logs sl2
            JOIN workout_sessions ws2 ON sl2.session_id = ws2.id
            WHERE sl2.exercise_id = sl.exercise_id
              AND sl2.is_warmup = false
              AND ws2.user_id = ${req.auth!.userId}
          )
        GROUP BY sl.exercise_id, e.name, sl.weight, sl.reps
        ORDER BY sl.weight DESC
        LIMIT 5
      `);

      res.json({
        data: {
          streaks: {
            current: currentStreak,
            longest: longestStreak,
            thisWeek,
            total: dates.length,
          },
          prs: Array.from(prs),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Streak calculation (mirrors src/lib/streaks.ts logic)
function calculateStreaks(dates: string[]) {
  if (dates.length === 0)
    return { currentStreak: 0, longestStreak: 0, thisWeek: 0 };

  const now = new Date();
  const weekStart = getWeekStart(now);

  // Count workouts this week
  const thisWeek = dates.filter((d) => new Date(d) >= weekStart).length;

  // Group by week
  const weekMap = new Map<string, number>();
  for (const d of dates) {
    const ws = getWeekStart(new Date(d)).toISOString().slice(0, 10);
    weekMap.set(ws, (weekMap.get(ws) || 0) + 1);
  }

  // Get sorted weeks with 3+ workouts
  const qualifiedWeeks = Array.from(weekMap.entries())
    .filter(([, count]) => count >= 3)
    .map(([week]) => new Date(week))
    .sort((a, b) => a.getTime() - b.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  for (let i = 0; i < qualifiedWeeks.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const diff =
        (qualifiedWeeks[i].getTime() - qualifiedWeeks[i - 1].getTime()) /
        (7 * 24 * 60 * 60 * 1000);
      streak = Math.abs(diff - 1) < 0.01 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  // Check if current week or last week is in the streak
  const currentWeekStr = weekStart.toISOString().slice(0, 10);
  const lastWeekStr = new Date(
    weekStart.getTime() - 7 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);

  if (qualifiedWeeks.length > 0) {
    const lastQualified = qualifiedWeeks[qualifiedWeeks.length - 1]
      .toISOString()
      .slice(0, 10);
    if (lastQualified === currentWeekStr || lastQualified === lastWeekStr) {
      // Count backwards from end
      currentStreak = 1;
      for (let i = qualifiedWeeks.length - 2; i >= 0; i--) {
        const diff =
          (qualifiedWeeks[i + 1].getTime() - qualifiedWeeks[i].getTime()) /
          (7 * 24 * 60 * 60 * 1000);
        if (Math.abs(diff - 1) < 0.01) currentStreak++;
        else break;
      }
    }
  }

  return { currentStreak, longestStreak, thisWeek };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
