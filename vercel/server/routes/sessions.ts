import { Router, Request, Response, NextFunction } from "express";
import { eq, and, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client";
import {
  workoutSessions,
  setLogs,
  exercises,
  workoutTemplates,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { NotFound, BadRequest } from "../lib/errors";
import { parseLimit } from "../lib/pagination";

const router = Router();
router.use(authMiddleware);

// POST /sessions
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, date } = req.body;
    if (!templateId || !date) throw BadRequest("templateId and date required");

    const id = uuidv4();
    const [session] = await db
      .insert(workoutSessions)
      .values({
        id,
        userId: req.auth!.userId,
        templateId,
        date,
        startedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
});

// PUT /sessions/:id/complete
router.put(
  "/:id/complete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [existing] = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.id, req.params.id),
            eq(workoutSessions.userId, req.auth!.userId)
          )
        )
        .limit(1);

      if (!existing) throw NotFound("Session");

      const [updated] = await db
        .update(workoutSessions)
        .set({
          completedAt: new Date(),
          notes: req.body.notes ?? existing.notes,
        })
        .where(eq(workoutSessions.id, req.params.id))
        .returning();

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /sessions/:id
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await db
        .delete(workoutSessions)
        .where(
          and(
            eq(workoutSessions.id, req.params.id),
            eq(workoutSessions.userId, req.auth!.userId)
          )
        );

      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /sessions?from=2026-01-01&to=2026-03-01&limit=20
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 100);
    const conditions = [
      eq(workoutSessions.userId, req.auth!.userId),
      isNotNull(workoutSessions.completedAt),
    ];

    if (req.query.from)
      conditions.push(gte(workoutSessions.date, String(req.query.from)));
    if (req.query.to)
      conditions.push(lte(workoutSessions.date, String(req.query.to)));

    const results = await db
      .select({
        id: workoutSessions.id,
        templateId: workoutSessions.templateId,
        templateName: workoutTemplates.name,
        templateColor: workoutTemplates.color,
        date: workoutSessions.date,
        startedAt: workoutSessions.startedAt,
        completedAt: workoutSessions.completedAt,
        notes: workoutSessions.notes,
      })
      .from(workoutSessions)
      .leftJoin(
        workoutTemplates,
        eq(workoutSessions.templateId, workoutTemplates.id)
      )
      .where(and(...conditions))
      .orderBy(desc(workoutSessions.date))
      .limit(limit);

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// GET /sessions/dates
router.get(
  "/dates",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await db
        .select({
          date: workoutSessions.date,
          templateId: workoutSessions.templateId,
          color: workoutTemplates.color,
        })
        .from(workoutSessions)
        .leftJoin(
          workoutTemplates,
          eq(workoutSessions.templateId, workoutTemplates.id)
        )
        .where(
          and(
            eq(workoutSessions.userId, req.auth!.userId),
            isNotNull(workoutSessions.completedAt)
          )
        )
        .orderBy(workoutSessions.date);

      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /sessions/recent?limit=5
router.get(
  "/recent",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseLimit(req.query.limit, 5, 50);

      const results = await db
        .select({
          id: workoutSessions.id,
          templateId: workoutSessions.templateId,
          templateName: workoutTemplates.name,
          templateColor: workoutTemplates.color,
          date: workoutSessions.date,
          startedAt: workoutSessions.startedAt,
          completedAt: workoutSessions.completedAt,
        })
        .from(workoutSessions)
        .leftJoin(
          workoutTemplates,
          eq(workoutSessions.templateId, workoutTemplates.id)
        )
        .where(
          and(
            eq(workoutSessions.userId, req.auth!.userId),
            isNotNull(workoutSessions.completedAt)
          )
        )
        .orderBy(desc(workoutSessions.date))
        .limit(limit);

      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /sessions/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [session] = await db
      .select({
        id: workoutSessions.id,
        templateId: workoutSessions.templateId,
        templateName: workoutTemplates.name,
        templateColor: workoutTemplates.color,
        date: workoutSessions.date,
        startedAt: workoutSessions.startedAt,
        completedAt: workoutSessions.completedAt,
        notes: workoutSessions.notes,
      })
      .from(workoutSessions)
      .leftJoin(
        workoutTemplates,
        eq(workoutSessions.templateId, workoutTemplates.id)
      )
      .where(
        and(
          eq(workoutSessions.id, req.params.id),
          eq(workoutSessions.userId, req.auth!.userId)
        )
      )
      .limit(1);

    if (!session) throw NotFound("Session");

    // Get all sets with exercise info
    const sets = await db
      .select({
        id: setLogs.id,
        exerciseId: setLogs.exerciseId,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        equipment: exercises.equipment,
        setNumber: setLogs.setNumber,
        weight: setLogs.weight,
        reps: setLogs.reps,
        isWarmup: setLogs.isWarmup,
      })
      .from(setLogs)
      .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
      .where(eq(setLogs.sessionId, req.params.id))
      .orderBy(setLogs.exerciseId, setLogs.setNumber);

    // Group sets by exercise
    const exerciseMap = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        muscleGroup: string;
        equipment: string | null;
        sets: typeof sets;
      }
    >();

    for (const set of sets) {
      if (!exerciseMap.has(set.exerciseId)) {
        exerciseMap.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          muscleGroup: set.muscleGroup,
          equipment: set.equipment,
          sets: [],
        });
      }
      exerciseMap.get(set.exerciseId)!.sets.push(set);
    }

    res.json({
      data: {
        ...session,
        exercises: Array.from(exerciseMap.values()),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
