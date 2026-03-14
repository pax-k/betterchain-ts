import { describe, it, expect } from "vitest";
import { getDomainBias, getDomainLeanings } from "@/lib/domain-authority";

describe("getDomainBias", () => {
  it("returns left-center for nytimes.com", () => {
    expect(getDomainBias("https://nytimes.com/article")).toBe("left-center");
  });

  it("returns right for foxnews.com", () => {
    expect(getDomainBias("https://foxnews.com/story")).toBe("right");
  });

  it("returns null for reuters.com (no bias field)", () => {
    expect(getDomainBias("https://reuters.com/article")).toBeNull();
  });

  it("returns null for unknown domain", () => {
    expect(getDomainBias("https://totally-unknown-site.xyz")).toBeNull();
  });

  it("handles www. prefix", () => {
    expect(getDomainBias("https://www.foxnews.com/politics")).toBe("right");
  });

  it("returns null for invalid URL", () => {
    expect(getDomainBias("not-a-url")).toBeNull();
  });
});

describe("getDomainLeanings", () => {
  it("returns an object with string values", () => {
    const leanings = getDomainLeanings();
    expect(typeof leanings).toBe("object");
    for (const val of Object.values(leanings)) {
      expect(typeof val).toBe("string");
    }
  });

  it("includes known biased domains", () => {
    const leanings = getDomainLeanings();
    expect(leanings["cnn.com"]).toBe("left");
    expect(leanings["foxnews.com"]).toBe("right");
    expect(leanings["bbc.com"]).toBe("center");
  });

  it("excludes domains without bias", () => {
    const leanings = getDomainLeanings();
    expect(leanings["reuters.com"]).toBeUndefined();
    expect(leanings["apnews.com"]).toBeUndefined();
  });

  it("has at least 50 entries", () => {
    const leanings = getDomainLeanings();
    expect(Object.keys(leanings).length).toBeGreaterThanOrEqual(50);
  });
});
