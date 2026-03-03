import { Request, Response, NextFunction } from "express";
import { eq, and, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { profiles, apiKeys } from "../db/schema";
import { Unauthorized } from "../lib/errors";
import { createHash } from "crypto";

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

// jose v5+ is ESM-only; dynamic import() keeps CJS compat for Vercel ncc
let _jwks: any;
async function getJWKS() {
  if (!_jwks) {
    const { createRemoteJWKSet } = await import("jose");
    _jwks = createRemoteJWKSet(
      new URL(
        "https://kjymatxamlsdkjmgwkqi.supabase.co/auth/v1/.well-known/jwks.json"
      )
    );
  }
  return _jwks;
}

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

    // API key authentication
    if (token.startsWith("gym_")) {
      const keyHash = createHash("sha256").update(token).digest("hex");

      const [key] = await db
        .select({ id: apiKeys.id, userId: apiKeys.userId })
        .from(apiKeys)
        .where(
          and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt))
        )
        .limit(1);

      if (!key) {
        throw Unauthorized("Invalid API key");
      }

      // Update lastUsedAt
      await db
        .update(apiKeys)
        .set({ lastUsedAt: sql`NOW()` })
        .where(eq(apiKeys.id, key.id));

      req.auth = { userId: key.userId, actor: "agent" };
      return next();
    }

    // JWT authentication
    const jwks = await getJWKS();
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, jwks);

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
