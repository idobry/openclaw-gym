import app from "../../../../server/index";
import { createServerAdapter } from "@whatwg-node/server";

export const dynamic = "force-dynamic";

const adapter = createServerAdapter(app as any);

async function handler(req: Request) {
  // Strip /api prefix so Express routes match (Express expects /health, not /api/health)
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api")) {
    url.pathname = url.pathname.slice(4) || "/";
  }
  const modifiedReq = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.body,
    // @ts-ignore - duplex needed for streaming body
    duplex: "half",
  });
  return adapter.fetch(modifiedReq);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
