import { describe, it, expect, beforeEach, vi } from "vitest";

function createRequest(path: string, options?: RequestInit): Request {
  return new Request(`http://localhost${path}`, options);
}

const sampleVerdict = {
  rating: "TRUE",
  confidence: 85,
  summary: "Accurate claim about climate change.",
  claims: [],
  sources: [],
};

async function postEntry(
  POST: (req: Request) => Promise<Response>,
  overrides: Record<string, unknown> = {}
) {
  const body = {
    mode: "text",
    input: "Test claim",
    verdict: sampleVerdict,
    ...overrides,
  };
  const res = await POST(
    createRequest("/api/fact-check-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return res.json();
}

describe("fact-check-db API", () => {
  let GET: (req: Request) => Promise<Response>;
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/app/api/fact-check-db/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("POST", () => {
    it("creates an entry with 201 status", async () => {
      const res = await POST(
        createRequest("/api/fact-check-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "text",
            input: "Claim",
            verdict: sampleVerdict,
          }),
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.viewCount).toBe(0);
      expect(data.createdAt).toBeDefined();
    });

    it("returns 400 when mode is missing", async () => {
      const res = await POST(
        createRequest("/api/fact-check-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: "X", verdict: sampleVerdict }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when verdict is missing", async () => {
      const res = await POST(
        createRequest("/api/fact-check-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "text", input: "X" }),
        })
      );
      expect(res.status).toBe(400);
    });

    it("defaults optional fields to null", async () => {
      const data = await postEntry(POST);
      expect(data.authorInfo).toBeNull();
      expect(data.domainAnalysis).toBeNull();
      expect(data.trackerAnalysis).toBeNull();
      expect(data.imageHistory).toBeNull();
      expect(data.aiTextDetection).toBeNull();
      expect(data.perspectives).toBeNull();
    });

    it("stores imageHistory, aiTextDetection, and perspectives when provided", async () => {
      const imageHistory = {
        firstSeen: "2023-01-01",
        totalResults: 5,
        matches: [{ domain: "example.com", url: "https://example.com/img" }],
      };
      const aiTextDetection = {
        isLikelyAIGenerated: true,
        confidence: 85,
        indicators: ["Repetitive phrasing"],
        summary: "Likely AI-generated text.",
      };
      const perspectives = [
        {
          leaning: "left",
          sources: [
            { title: "Left Source", url: "https://left.com", snippet: "s", domain: "left.com" },
          ],
        },
      ];

      const data = await postEntry(POST, {
        imageHistory,
        aiTextDetection,
        perspectives,
      });

      expect(data.imageHistory).toEqual(imageHistory);
      expect(data.aiTextDetection).toEqual(aiTextDetection);
      expect(data.perspectives).toEqual(perspectives);
    });

    it("returns new fields via GET", async () => {
      const aiTextDetection = {
        isLikelyAIGenerated: false,
        confidence: 20,
        indicators: [],
        summary: "Human-written.",
      };
      const entry = await postEntry(POST, { aiTextDetection });

      const res = await GET(
        createRequest(`/api/fact-check-db?id=${entry.id}`)
      );
      const data = await res.json();
      expect(data.aiTextDetection).toEqual(aiTextDetection);
      expect(data.imageHistory).toBeNull();
      expect(data.perspectives).toBeNull();
    });
  });

  describe("GET by id", () => {
    it("returns entry and increments viewCount", async () => {
      const entry = await postEntry(POST);

      const res1 = await GET(
        createRequest(`/api/fact-check-db?id=${entry.id}`)
      );
      const data1 = await res1.json();
      expect(data1.viewCount).toBe(1);

      const res2 = await GET(
        createRequest(`/api/fact-check-db?id=${entry.id}`)
      );
      const data2 = await res2.json();
      expect(data2.viewCount).toBe(2);
    });

    it("returns 404 for unknown id", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?id=nonexistent")
      );
      expect(res.status).toBe(404);
    });
  });

  describe("GET with filters", () => {
    beforeEach(async () => {
      await postEntry(POST, { mode: "text", input: "Alpha text claim" });
      await postEntry(POST, {
        mode: "url",
        input: "https://example.com",
        verdict: { ...sampleVerdict, rating: "FALSE", confidence: 40 },
      });
      await postEntry(POST, {
        mode: "image",
        input: "image.png",
        verdict: {
          ...sampleVerdict,
          rating: "MISLEADING",
          confidence: 60,
          summary: "Misleading image about vaccines.",
        },
      });
    });

    it("returns all entries with no filters", async () => {
      const res = await GET(createRequest("/api/fact-check-db"));
      const data = await res.json();
      expect(data.total).toBe(3);
      expect(data.results.length).toBe(3);
    });

    it("filters by mode", async () => {
      const res = await GET(createRequest("/api/fact-check-db?mode=text"));
      const data = await res.json();
      expect(data.total).toBe(1);
      expect(data.results[0].mode).toBe("text");
    });

    it("filters by multiple modes", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?mode=text,url")
      );
      const data = await res.json();
      expect(data.total).toBe(2);
    });

    it("filters by rating", async () => {
      const res = await GET(createRequest("/api/fact-check-db?rating=FALSE"));
      const data = await res.json();
      expect(data.total).toBe(1);
      expect(data.results[0].verdict.rating).toBe("FALSE");
    });

    it("searches input case-insensitively", async () => {
      const res = await GET(createRequest("/api/fact-check-db?search=alpha"));
      const data = await res.json();
      expect(data.total).toBe(1);
      expect(data.results[0].input).toContain("Alpha");
    });

    it("searches verdict summary", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?search=vaccines")
      );
      const data = await res.json();
      expect(data.total).toBe(1);
    });

    it("sorts by confidence descending", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?sort=confidence&order=desc")
      );
      const data = await res.json();
      const confidences = data.results.map(
        (r: { verdict: { confidence: number } }) => r.verdict.confidence
      );
      expect(confidences).toEqual([...confidences].sort((a, b) => b - a));
    });

    it("sorts by confidence ascending", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?sort=confidence&order=asc")
      );
      const data = await res.json();
      const confidences = data.results.map(
        (r: { verdict: { confidence: number } }) => r.verdict.confidence
      );
      expect(confidences).toEqual([...confidences].sort((a, b) => a - b));
    });

    it("paginates correctly", async () => {
      const res = await GET(
        createRequest("/api/fact-check-db?page=2&pageSize=2")
      );
      const data = await res.json();
      expect(data.total).toBe(3);
      expect(data.page).toBe(2);
      expect(data.pageSize).toBe(2);
      expect(data.results.length).toBe(1);
    });
  });
});
