import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { profiles } from "../db/schema";
import { Unauthorized } from "../lib/errors";

export interface AuthPayload {
  userId: string;
  actor: "user" | "agent";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw Unauthorized("Missing Bearer token");
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
    }) as { sub: string; role?: string };

    if (!payload.sub) {
      throw Unauthorized("Invalid token: missing subject");
    }

    const userId = payload.sub;

    // Lazy-upsert profile on first request
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!existing) {
      await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
    }

    const actor =
      (req.headers["x-actor"] as string) === "agent" ? "agent" : "user";
    req.auth = { userId, actor };
    return next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(Unauthorized("Invalid token"));
    }
    next(err);
  }
}
