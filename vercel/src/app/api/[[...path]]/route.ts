import { type NextRequest } from "next/server";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import app from "../../../../server/index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 25;

const ADAPTER_TIMEOUT_MS = 20_000;

async function expressToResponse(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  // Strip /api prefix so Express routes match (Express expects /health not /api/health)
  const path = url.pathname.replace(/^\/api/, "") || "/";

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? Buffer.from(await req.arrayBuffer())
      : undefined;

  // Build Node.js IncomingMessage
  const socket = new Socket();
  const nodeReq = new IncomingMessage(socket);
  nodeReq.url = path + url.search;
  nodeReq.method = req.method;
  nodeReq.headers = Object.fromEntries(req.headers);
  if (body && body.length > 0) {
    nodeReq.push(body);
  }
  nodeReq.push(null);

  return new Promise<Response>((resolve) => {
    let resolved = false;

    function sendResponse(status: number, headers: Headers, body: Buffer) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(new Response(body, { status, headers }));
    }

    // Safety timeout: always respond even if Express hangs
    const timer = setTimeout(() => {
      console.error(`[adapter] Express did not respond within ${ADAPTER_TIMEOUT_MS}ms for ${req.method} ${path}`);
      sendResponse(
        504,
        new Headers({ "content-type": "application/json" }),
        Buffer.from(JSON.stringify({ error: { code: "GATEWAY_TIMEOUT", message: "Request timed out" } })),
      );
    }, ADAPTER_TIMEOUT_MS);

    const nodeRes = new ServerResponse(nodeReq);
    const chunks: Buffer[] = [];

    nodeRes.write = function (chunk: any) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true;
    } as any;

    nodeRes.end = function (chunk?: any) {
      if (chunk && chunk.length > 0) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const headers = new Headers();
      const raw = nodeRes.getHeaders();
      for (const [key, val] of Object.entries(raw)) {
        if (val === undefined) continue;
        if (Array.isArray(val)) {
          val.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, String(val));
        }
      }

      sendResponse(nodeRes.statusCode, headers, Buffer.concat(chunks));
      return nodeRes;
    } as any;

    // Let Express handle it
    try {
      app(nodeReq as any, nodeRes as any);
    } catch (err) {
      console.error("[adapter] Express threw synchronously:", err);
      sendResponse(
        500,
        new Headers({ "content-type": "application/json" }),
        Buffer.from(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } })),
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return expressToResponse(req);
}
export async function POST(req: NextRequest) {
  return expressToResponse(req);
}
export async function PUT(req: NextRequest) {
  return expressToResponse(req);
}
export async function DELETE(req: NextRequest) {
  return expressToResponse(req);
}
export async function PATCH(req: NextRequest) {
  return expressToResponse(req);
}
