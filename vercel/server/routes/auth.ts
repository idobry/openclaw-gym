import { Router, Request, Response, NextFunction } from "express";
import { eq, and, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { apiKeys } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { BadRequest, NotFound } from "../lib/errors";
import { randomUUID, createHash } from "crypto";

const router = Router();
router.use(authMiddleware);

// POST /api-key - Create a new API key
router.post(
  "/api-key",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      if (!name) {
        throw BadRequest("name is required");
      }

      const key = `gym_${randomUUID()}`;
      const keyHash = createHash("sha256").update(key).digest("hex");

      const [row] = await db
        .insert(apiKeys)
        .values({
          userId: req.auth!.userId,
          keyHash,
          name,
        })
        .returning({
          id: apiKeys.id,
          createdAt: apiKeys.createdAt,
        });

      res.json({ data: { id: row.id, key, name, createdAt: row.createdAt } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api-keys - List all non-revoked API keys
router.get(
  "/api-keys",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.userId, req.auth!.userId),
            isNull(apiKeys.revokedAt)
          )
        );

      res.json({ data: rows });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api-key/:id - Revoke an API key
router.delete(
  "/api-key/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keyId = parseInt(req.params.id, 10);

      const result = await db
        .update(apiKeys)
        .set({ revokedAt: sql`NOW()` })
        .where(
          and(
            eq(apiKeys.id, keyId),
            eq(apiKeys.userId, req.auth!.userId)
          )
        )
        .returning({ id: apiKeys.id });

      if (result.length === 0) {
        throw NotFound("API key not found");
      }

      res.json({ data: { revoked: true } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
