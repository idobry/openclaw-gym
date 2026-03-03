import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
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

const JWKS = createRemoteJWKSet(
  new URL(
    "https://kjymatxamlsdkjmgwkqi.supabase.co/auth/v1/.well-known/jwks.json"
  )
);

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
    const { payload } = await jwtVerify(token, JWKS);

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
  } catch (err: any) {
    if (err.code === "ERR_JWT_EXPIRED") {
      return next(Unauthorized("Token expired"));
    }
    if (err.code?.startsWith?.("ERR_J")) {
      return next(Unauthorized("Invalid token"));
    }
    next(err);
  }
}
