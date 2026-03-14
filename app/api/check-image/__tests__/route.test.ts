import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/stream", () => ({
  createSSEStream: vi.fn(() => new Response("stream", { status: 200 })),
}));
vi.mock("@/lib/anthropic", () => ({
  analyzeImage: vi.fn(),
  synthesizeVerdict: vi.fn(),
}));
vi.mock("@/lib/serpapi", () => ({
  reverseImageSearch: vi.fn(),
}));
vi.mock("@/lib/tineye", () => ({
  searchImageHistory: vi.fn(),
}));
vi.mock("@/lib/tavily", () => ({
  searchClaim: vi.fn(),
}));
vi.mock("@/lib/google-factcheck", () => ({
  searchFactChecks: vi.fn(),
}));

import { POST } from "@/app/api/check-image/route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/check-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/check-image", () => {
  it("returns 400 when imageUrl is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Image URL is required");
  });

  it("returns 400 when imageUrl is not a string", async () => {
    const res = await POST(createRequest({ imageUrl: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 200 for valid imageUrl", async () => {
    const res = await POST(
      createRequest({ imageUrl: "https://example.com/img.jpg" })
    );
    expect(res.status).toBe(200);
  });
});
