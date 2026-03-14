import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/stream", () => ({
  createSSEStream: vi.fn(() => new Response("stream", { status: 200 })),
}));
vi.mock("@/lib/anthropic", () => ({
  extractClaims: vi.fn(),
  webSearchFactCheck: vi.fn(),
  synthesizeVerdict: vi.fn(),
}));
vi.mock("@/lib/google-factcheck", () => ({
  searchFactChecks: vi.fn(),
}));

import { POST } from "@/app/api/check-text/route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/check-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/check-text", () => {
  it("returns 400 when text is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Text is required");
  });

  it("returns 400 when text is not a string", async () => {
    const res = await POST(createRequest({ text: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when text exceeds 10000 characters", async () => {
    const res = await POST(createRequest({ text: "x".repeat(10001) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("10,000");
  });

  it("returns 200 for valid text", async () => {
    const res = await POST(createRequest({ text: "A valid claim." }));
    expect(res.status).toBe(200);
  });
});
