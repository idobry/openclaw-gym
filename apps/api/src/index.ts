import express from "express";
import cors from "cors";
import "dotenv/config";
import { AppError } from "./lib/errors";

import templateRoutes from "./routes/templates";
import exerciseRoutes from "./routes/exercises";
import sessionRoutes from "./routes/sessions";
import setRoutes from "./routes/sets";
import statsRoutes from "./routes/stats";
import programRoutes from "./routes/program";
import changeRoutes from "./routes/changes";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Agent discovery
app.get("/.well-known/agent.json", (_req, res) => {
  res.json({
    name: "OpenClaw Gym Coach API",
    description:
      "AI-native gym programming API. Agents can authenticate via Supabase, read/modify workout programs, track sessions, and analyze progress.",
    auth: {
      type: "bearer",
      provider: "supabase",
      signup_url: `${process.env.SUPABASE_URL}/auth/v1/signup`,
      token_url: `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    },
    docs_url: "https://openclaw.gym",
    endpoints: {
      program: {
        "GET /program/json": "Get current workout program",
        "GET /program/export": "Export full program with history",
        "POST /program/import": "Import a workout program",
        "DELETE /program": "Delete entire program",
      },
      templates: {
        "GET /templates": "List workout templates",
        "GET /templates/:id": "Get template with exercises",
        "PUT /templates/:id": "Update template",
        "DELETE /templates/:id": "Delete template",
        "POST /templates/:id/exercises": "Add exercise to template",
        "DELETE /templates/:tid/exercises/:eid": "Remove exercise",
        "PUT /templates/:tid/exercises/:eid": "Update exercise config",
      },
      sessions: {
        "POST /sessions": "Start a workout session",
        "PUT /sessions/:id/complete": "Complete a session",
        "DELETE /sessions/:id": "Delete a session",
        "GET /sessions": "List completed sessions",
        "GET /sessions/recent": "Get recent sessions",
        "GET /sessions/:id": "Get session with all sets",
      },
      sets: {
        "POST /sessions/:id/sets": "Log a set",
        "PUT /sets/:id": "Update a set",
        "DELETE /sets/:id": "Delete a set",
      },
      exercises: {
        "GET /exercises": "Search exercise catalog",
        "GET /exercises/:id": "Get exercise details",
      },
      stats: {
        "GET /stats/prs": "All personal records",
        "GET /stats/prs/:exerciseId": "PR for specific exercise",
        "GET /stats/streaks": "Workout streak data",
        "GET /stats/volume": "Volume over time",
        "GET /stats/progress/:exerciseId": "Weight progression",
        "GET /stats/summary": "Combined stats overview",
      },
      changes: {
        "GET /changes": "Query change log",
      },
    },
  });
});

// Routes
app.use("/templates", templateRoutes);
app.use("/exercises", exerciseRoutes);
app.use("/sessions", sessionRoutes);
app.use("/sessions", setRoutes);
app.use("/sets", setRoutes);
app.use("/stats", statsRoutes);
app.use("/program", programRoutes);
app.use("/changes", changeRoutes);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    console.error("Unhandled error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
);

// Only listen when running directly (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`OpenClaw Gym API running on port ${PORT}`);
  });
}

export default app;
