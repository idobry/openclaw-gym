import type { VercelRequest, VercelResponse } from "@vercel/node";

let app: any = null;
let loadError: any = null;

try {
  app = require("../src/index").default;
} catch (err: any) {
  loadError = { message: err.message, stack: err.stack?.split("\n").slice(0, 10) };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (loadError) {
    return res.status(500).json({ loadError });
  }
  app(req, res);
}
