import express from "express";

const app = express();

app.get("/debug", async (_req, res) => {
  const errors: string[] = [];

  try { await import("../src/lib/errors"); } catch (e: any) { errors.push(`errors: ${e.message}`); }
  try { await import("../src/lib/pagination"); } catch (e: any) { errors.push(`pagination: ${e.message}`); }
  try { await import("../src/db/schema"); } catch (e: any) { errors.push(`schema: ${e.message}`); }
  try { await import("../src/db/client"); } catch (e: any) { errors.push(`client: ${e.message}`); }
  try { await import("../src/middleware/auth"); } catch (e: any) { errors.push(`auth: ${e.message}`); }
  try { await import("../src/middleware/changeLog"); } catch (e: any) { errors.push(`changeLog: ${e.message}`); }
  try { await import("../src/routes/templates"); } catch (e: any) { errors.push(`templates: ${e.message}`); }
  try { await import("../src/routes/exercises"); } catch (e: any) { errors.push(`exercises: ${e.message}`); }
  try { await import("../src/routes/sessions"); } catch (e: any) { errors.push(`sessions: ${e.message}`); }
  try { await import("../src/routes/sets"); } catch (e: any) { errors.push(`sets: ${e.message}`); }
  try { await import("../src/routes/stats"); } catch (e: any) { errors.push(`stats: ${e.message}`); }
  try { await import("../src/routes/program"); } catch (e: any) { errors.push(`program: ${e.message}`); }
  try { await import("../src/routes/changes"); } catch (e: any) { errors.push(`changes: ${e.message}`); }
  try { await import("../src/index"); } catch (e: any) { errors.push(`index: ${e.message}`); }

  res.json({
    ok: errors.length === 0,
    errors,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_JWT_SECRET: !!process.env.SUPABASE_JWT_SECRET,
    },
  });
});

export default app;
