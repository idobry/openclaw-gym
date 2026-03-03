import express from "express";
import cors from "cors";
import "dotenv/config";
import { AppError } from "./lib/errors";
import { LLMS_TXT } from "./content/llms";
import { LLMS_FULL_TXT } from "./content/llms-full";

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

// Agent discovery endpoints (no auth required)
app.get("/llms.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(LLMS_TXT);
});

app.get("/llms-full.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(LLMS_FULL_TXT);
});

app.get("/.well-known/agent.json", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json({
    schema_version: "1.0",
    name: "OpenClaw Gym API",
    description:
      "Agent-native gym tracking API -- your agent IS the coach. Manage workout programs, templates, sessions, sets, and stats.",
    documentation: {
      llms_txt: "https://openclaw-gym-api.vercel.app/llms.txt",
      llms_full_txt: "https://openclaw-gym-api.vercel.app/llms-full.txt",
      human: "https://openclaw-gym-web.vercel.app",
    },
    auth: {
      type: "bearer",
      description:
        "Register or login to get a JWT. For agents, generate an API key via POST /auth/api-key and use X-API-Key header.",
    },
    capabilities: {
      program: {
        description: "Import/export full workout programs (up to 7 days)",
        endpoints: [
          "POST /program/import",
          "GET /program/export",
          "GET /program/json",
          "DELETE /program",
        ],
      },
      templates: {
        description:
          "CRUD workout templates with exercises, sets, rep ranges, rest timers",
        endpoints: [
          "GET /templates",
          "GET /templates/:id",
          "PUT /templates/:id",
          "DELETE /templates/:id",
          "POST /templates/:id/exercises",
          "PUT /templates/:tid/exercises/:eid",
          "DELETE /templates/:tid/exercises/:eid",
          "POST /templates/:tid/exercises/:eid/replace",
        ],
      },
      sessions: {
        description:
          "Start, complete, and query workout sessions with date filtering",
        endpoints: [
          "POST /sessions",
          "GET /sessions",
          "GET /sessions/dates",
          "GET /sessions/recent",
          "GET /sessions/:id",
          "PUT /sessions/:id/complete",
          "DELETE /sessions/:id",
        ],
      },
      sets: {
        description: "Log individual sets with weight, reps, and warmup flags",
        endpoints: [
          "POST /sessions/:id/sets",
          "PUT /sets/:id",
          "DELETE /sets/:id",
        ],
      },
      exercises: {
        description:
          "Search and browse the exercise catalog by name, muscle group, or equipment",
        endpoints: ["GET /exercises", "GET /exercises/:id"],
      },
      stats: {
        description:
          "Personal records, streaks, volume trends, per-exercise progress",
        endpoints: [
          "GET /stats/prs",
          "GET /stats/prs/:exerciseId",
          "GET /stats/streaks",
          "GET /stats/volume",
          "GET /stats/progress/:exerciseId",
          "GET /stats/summary",
        ],
      },
      audit: {
        description:
          "Every mutation is logged with actor, diff, and optional reason",
        endpoints: ["GET /changes"],
      },
    },
    agent_hints: {
      actor_header:
        "Set X-Actor: agent on every request so mutations are attributed correctly in the audit log.",
      reason_field:
        "Include a 'reason' field on mutation requests to explain the coaching rationale.",
      read_before_write:
        "Always fetch the current program (GET /program/json) and template details (GET /templates/:id) before making changes.",
      exercise_ids:
        "Template exercise IDs (/templates/:tid/exercises/:eid) are NOT catalog exercise IDs. Get template-exercise IDs from GET /templates/:id.",
      import_warning:
        "POST /program/import deletes all existing templates first. Always export (GET /program/export) before importing.",
    },
    endpoints: {
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        refresh: "POST /auth/refresh",
        create_api_key: "POST /auth/api-key",
        delete_api_key: "DELETE /auth/api-key/:id",
      },
      exercises: {
        search: "GET /exercises",
        get: "GET /exercises/:id",
      },
      templates: {
        list: "GET /templates",
        get: "GET /templates/:id",
        update: "PUT /templates/:id",
        delete: "DELETE /templates/:id",
        add_exercise: "POST /templates/:id/exercises",
        update_exercise: "PUT /templates/:tid/exercises/:eid",
        remove_exercise: "DELETE /templates/:tid/exercises/:eid",
        replace_exercise: "POST /templates/:tid/exercises/:eid/replace",
      },
      sessions: {
        create: "POST /sessions",
        list: "GET /sessions",
        dates: "GET /sessions/dates",
        recent: "GET /sessions/recent",
        get: "GET /sessions/:id",
        complete: "PUT /sessions/:id/complete",
        delete: "DELETE /sessions/:id",
      },
      sets: {
        log: "POST /sessions/:sessionId/sets",
        update: "PUT /sets/:id",
        delete: "DELETE /sets/:id",
      },
      stats: {
        prs: "GET /stats/prs",
        exercise_pr: "GET /stats/prs/:exerciseId",
        streaks: "GET /stats/streaks",
        volume: "GET /stats/volume",
        progress: "GET /stats/progress/:exerciseId",
        summary: "GET /stats/summary",
      },
      program: {
        import: "POST /program/import",
        export: "GET /program/export",
        json: "GET /program/json",
        delete: "DELETE /program",
      },
      changes: {
        list: "GET /changes",
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
