import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set env var before importing
process.env.GOOGLE_FACTCHECK_API_KEY = "test-key";

import { searchFactChecks } from "@/lib/google-factcheck";

function mockResponse(data: unknown, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe("searchFactChecks", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("maps valid response with claims correctly", async () => {
    mockResponse({
      claims: [
        {
          text: "Earth is flat",
          claimant: "Someone",
          claimReview: [
            {
              textualRating: "False",
              publisher: { name: "Snopes" },
              url: "https://snopes.com/flat-earth",
              reviewDate: "2024-01-01",
            },
          ],
        },
      ],
    });

    const results = await searchFactChecks("flat earth");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      claim: "Earth is flat",
      claimant: "Someone",
      rating: "False",
      publisher: "Snopes",
      url: "https://snopes.com/flat-earth",
      reviewDate: "2024-01-01",
    });
  });

  it("defaults to Unknown when claimReview is missing", async () => {
    mockResponse({
      claims: [{ text: "Some claim" }],
    });

    const results = await searchFactChecks("some claim");
    expect(results[0].rating).toBe("Unknown");
    expect(results[0].publisher).toBe("Unknown");
    expect(results[0].url).toBe("");
  });

  it("returns empty array for empty claims", async () => {
    mockResponse({ claims: [] });
    const results = await searchFactChecks("nothing");
    expect(results).toEqual([]);
  });

  it("returns empty array for non-ok response", async () => {
    mockResponse({}, false);
    const results = await searchFactChecks("fail");
    expect(results).toEqual([]);
  });

  it("returns empty array when claims field is missing", async () => {
    mockResponse({});
    const results = await searchFactChecks("no claims");
    expect(results).toEqual([]);
  });

  it("maps multiple claims", async () => {
    mockResponse({
      claims: [
        {
          text: "Claim 1",
          claimReview: [{ textualRating: "True", publisher: { name: "P1" } }],
        },
        {
          text: "Claim 2",
          claimReview: [{ textualRating: "False", publisher: { name: "P2" } }],
        },
      ],
    });

    const results = await searchFactChecks("multi");
    expect(results).toHaveLength(2);
    expect(results[0].claim).toBe("Claim 1");
    expect(results[1].claim).toBe("Claim 2");
  });
});
