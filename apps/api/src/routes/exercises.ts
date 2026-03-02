import { Router, Request, Response, NextFunction } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import { exercises } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { NotFound } from "../lib/errors";
import { parseLimit } from "../lib/pagination";

const router = Router();
router.use(authMiddleware);

// GET /exercises?q=bench&muscle=chest&equipment=barbell&limit=50
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, muscle, equipment } = req.query;
    const limit = parseLimit(req.query.limit, 50, 200);

    const conditions = [];
    if (q) conditions.push(ilike(exercises.name, `%${q}%`));
    if (muscle)
      conditions.push(
        ilike(exercises.muscleGroup, String(muscle))
      );
    if (equipment)
      conditions.push(ilike(exercises.equipment, String(equipment)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(exercises)
      .where(where)
      .orderBy(exercises.name)
      .limit(limit);

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// GET /exercises/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, req.params.id))
      .limit(1);

    if (!exercise) throw NotFound("Exercise");
    res.json({ data: exercise });
  } catch (err) {
    next(err);
  }
});

export default router;
