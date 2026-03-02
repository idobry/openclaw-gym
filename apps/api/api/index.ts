import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url === "/health") {
    return res.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  // Try importing the full app and see what error we get
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require("../src/index");
    return res.json({ loaded: true, type: typeof app.default });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 5),
    });
  }
}
