import { type NextRequest } from "next/server";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import app from "../../../../server/index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function expressToResponse(
  req: NextRequest
): Promise<Response> {
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

  return new Promise<Response>((resolve, reject) => {
    const nodeRes = new ServerResponse(nodeReq);
    const chunks: Buffer[] = [];

    // Capture written data
    const origWrite = nodeRes.write;
    nodeRes.write = function (chunk: any, ...args: any[]) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true;
    } as any;

    const origEnd = nodeRes.end;
    nodeRes.end = function (chunk?: any, ...args: any[]) {
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

      resolve(
        new Response(Buffer.concat(chunks), {
          status: nodeRes.statusCode,
          headers,
        })
      );

      // Clean up the socket
      socket.destroy();
      return nodeRes;
    } as any;

    // Let Express handle it
    app(nodeReq as any, nodeRes as any);
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
