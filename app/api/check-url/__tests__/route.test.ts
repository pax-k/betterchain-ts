import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/stream", () => ({
  createSSEStream: vi.fn(() => new Response("stream", { status: 200 })),
}));
vi.mock("@/lib/anthropic", () => ({
  extractClaims: vi.fn(),
  synthesizeVerdict: vi.fn(),
}));
vi.mock("@/lib/firecrawl", () => ({
  scrapeUrl: vi.fn(),
}));
vi.mock("@/lib/tavily", () => ({
  searchClaim: vi.fn(),
}));
vi.mock("@/lib/google-factcheck", () => ({
  searchFactChecks: vi.fn(),
}));
vi.mock("@/lib/author", () => ({
  verifyAuthor: vi.fn(),
}));
vi.mock("@/lib/domain-authority", () => ({
  analyzeDomain: vi.fn(),
}));
vi.mock("@/lib/tracker-analysis", () => ({
  analyzeTrackers: vi.fn(),
}));

import { POST } from "@/app/api/check-url/route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/check-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/check-url", () => {
  it("returns 400 when url is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("URL is required");
  });

  it("returns 400 when url is not a string", async () => {
    const res = await POST(createRequest({ url: 42 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid URL format", async () => {
    const res = await POST(createRequest({ url: "not-a-url" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid URL format");
  });

  it("returns 200 for valid URL", async () => {
    const res = await POST(
      createRequest({ url: "https://example.com/article" })
    );
    expect(res.status).toBe(200);
  });
});
