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
vi.mock("@/lib/pdf", () => ({
  extractTextFromPdf: vi.fn(),
}));

import { POST } from "@/app/api/check-pdf/route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/check-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/check-pdf", () => {
  it("returns 400 when pdfUrl is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("PDF URL is required");
  });

  it("returns 400 when pdfUrl is not a string", async () => {
    const res = await POST(createRequest({ pdfUrl: 42 }));
    expect(res.status).toBe(400);
  });

  it("returns 200 for valid pdfUrl", async () => {
    const res = await POST(
      createRequest({ pdfUrl: "https://example.com/doc.pdf" })
    );
    expect(res.status).toBe(200);
  });
});
