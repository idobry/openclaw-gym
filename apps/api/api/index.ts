import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: Object.keys(process.env).filter(k => k.startsWith("SUPABASE") || k === "DATABASE_URL" || k === "VERCEL").sort() });
}
