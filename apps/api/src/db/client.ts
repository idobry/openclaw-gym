import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import "dotenv/config";
import * as schema from "./schema.js";

let _queryClient: Sql | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getQueryClient() {
  if (!_queryClient) {
    _queryClient = postgres(process.env.DATABASE_URL!, {
      prepare: false, // Required for Supabase connection pooler (pgBouncer)
    });
  }
  return _queryClient;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getQueryClient(), { schema });
  }
  return _db;
}

// Keep backwards-compatible exports using getters
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export const queryClient = new Proxy({} as Sql, {
  get(_target, prop) {
    return (getQueryClient() as any)[prop];
  },
});
