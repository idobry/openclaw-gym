import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString, {
  prepare: false, // Required for Supabase connection pooler (pgBouncer)
});

export const db = drizzle(queryClient, { schema });
export { queryClient };
