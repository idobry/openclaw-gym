import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/(.*)", (_req, res) => {
  res.json({ message: "OpenClaw Gym API - minimal test" });
});

export default app;
