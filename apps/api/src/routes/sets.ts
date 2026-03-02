import { Router, Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { setLogs, workoutSessions } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { NotFound, BadRequest } from "../lib/errors";

const router = Router();
router.use(authMiddleware);

// POST /sessions/:id/sets
router.post(
  "/:sessionId/sets",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { exerciseId, setNumber, weight, reps, isWarmup } = req.body;
      if (!exerciseId || setNumber == null)
        throw BadRequest("exerciseId and setNumber required");

      // Verify session belongs to user
      const [session] = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.id, req.params.sessionId),
            eq(workoutSessions.userId, req.auth!.userId)
          )
        )
        .limit(1);

      if (!session) throw NotFound("Session");

      const [inserted] = await db
        .insert(setLogs)
        .values({
          sessionId: req.params.sessionId,
          exerciseId,
          setNumber,
          weight: weight ?? 0,
          reps: reps ?? 0,
          isWarmup: isWarmup ?? false,
        })
        .returning();

      res.status(201).json({ data: inserted });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /sets/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setId = parseInt(req.params.id);
    if (isNaN(setId)) throw BadRequest("Invalid set ID");

    const updates: Record<string, unknown> = {};
    if (req.body.weight !== undefined) updates.weight = req.body.weight;
    if (req.body.reps !== undefined) updates.reps = req.body.reps;

    const [updated] = await db
      .update(setLogs)
      .set(updates)
      .where(eq(setLogs.id, setId))
      .returning();

    if (!updated) throw NotFound("Set");

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /sets/:id
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const setId = parseInt(req.params.id);
      if (isNaN(setId)) throw BadRequest("Invalid set ID");

      await db.delete(setLogs).where(eq(setLogs.id, setId));
      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
