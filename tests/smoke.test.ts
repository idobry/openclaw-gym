import { describe, it, expect } from "vitest";

const WEB_URL =
  process.env.WEB_URL || "https://openclaw-gym-web.vercel.app";
const API_URL =
  process.env.API_URL || "https://openclaw-gym-api.vercel.app";
const TOKEN = process.env.TEST_SUPABASE_TOKEN;

const authHeaders = TOKEN
  ? { Authorization: `Bearer ${TOKEN}` }
  : undefined;

describe("Landing Page (Web)", () => {
  it("GET / returns 200 with OpenClaw in body", async () => {
    const res = await fetch(WEB_URL);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("OpenClaw");
  });

  it("includes key section markers", async () => {
    const res = await fetch(WEB_URL);
    const html = await res.text();
    expect(html).toContain("Discovery");
    expect(html).toContain("API");
  });
});

describe("Agentic Discovery (API)", () => {
  it("GET /health returns { status: ok }", async () => {
    const res = await fetch(`${API_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("GET /llms.txt returns markdown with OpenClaw Gym API", async () => {
    const res = await fetch(`${API_URL}/llms.txt`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const text = await res.text();
    expect(text).toContain("OpenClaw Gym API");
  });

  it("GET /llms-full.txt returns markdown with endpoint docs", async () => {
    const res = await fetch(`${API_URL}/llms-full.txt`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const text = await res.text();
    expect(text).toContain("OpenClaw Gym API");
    expect(text).toMatch(/GET|POST|PUT|DELETE/);
  });

  it("GET /.well-known/agent.json returns valid agent descriptor", async () => {
    const res = await fetch(`${API_URL}/.well-known/agent.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body).toHaveProperty("schema_version");
    expect(body).toHaveProperty("capabilities");
    expect(body).toHaveProperty("endpoints");
    expect(body).toHaveProperty("documentation");
  });
});

describe("API Logic (unauthenticated)", () => {
  it("GET /templates without auth returns 401", async () => {
    const res = await fetch(`${API_URL}/templates`);
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!TOKEN)("API Logic (authenticated)", () => {
  it("GET /exercises returns 200 with data array", async () => {
    const res = await fetch(`${API_URL}/exercises`, { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /templates returns 200", async () => {
    const res = await fetch(`${API_URL}/templates`, { headers: authHeaders });
    expect(res.status).toBe(200);
  });

  it("GET /stats/summary returns 200", async () => {
    const res = await fetch(`${API_URL}/stats/summary`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
  });

  it("GET /sessions/recent returns 200", async () => {
    const res = await fetch(`${API_URL}/sessions/recent`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
  });

  it("GET /program/json returns 200", async () => {
    const res = await fetch(`${API_URL}/program/json`, {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
  });
});
