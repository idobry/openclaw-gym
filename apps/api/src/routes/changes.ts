import { Router, Request, Response, NextFunction } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client";
import { changeLog } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { parseLimit } from "../lib/pagination";

const router = Router();
router.use(authMiddleware);

// GET /changes?actor=agent&limit=20
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 100);
    const conditions = [eq(changeLog.userId, req.auth!.userId)];

    if (req.query.actor) {
      conditions.push(eq(changeLog.actor, String(req.query.actor)));
    }

    const results = await db
      .select()
      .from(changeLog)
      .where(and(...conditions))
      .orderBy(desc(changeLog.createdAt))
      .limit(limit);

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
