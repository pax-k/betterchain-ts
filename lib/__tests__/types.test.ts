import { describe, it, expect } from "vitest";
import { SourceSchema, VerdictSchema } from "@/lib/types";

const validSource = {
  title: "Example",
  url: "https://example.com",
  publishedAt: "2024-01-01",
};

const validVerdict = {
  rating: "TRUE" as const,
  confidence: 85,
  summary: "The claim is accurate.",
  claims: [
    {
      text: "Claim text",
      status: "Supported",
      evidence: [validSource],
    },
  ],
  sources: [validSource],
};

describe("SourceSchema", () => {
  it("accepts a valid source", () => {
    expect(() => SourceSchema.parse(validSource)).not.toThrow();
  });

  it("rejects missing title", () => {
    expect(() =>
      SourceSchema.parse({ url: "https://x.com", publishedAt: "2024" })
    ).toThrow();
  });

  it("rejects missing url", () => {
    expect(() =>
      SourceSchema.parse({ title: "T", publishedAt: "2024" })
    ).toThrow();
  });

  it("rejects missing publishedAt", () => {
    expect(() =>
      SourceSchema.parse({ title: "T", url: "https://x.com" })
    ).toThrow();
  });
});

describe("VerdictSchema", () => {
  it("accepts a valid verdict", () => {
    expect(() => VerdictSchema.parse(validVerdict)).not.toThrow();
  });

  it.each(["TRUE", "FALSE", "MISLEADING", "UNVERIFIED", "PARTIALLY_TRUE"])(
    "accepts rating %s",
    (rating) => {
      expect(() =>
        VerdictSchema.parse({ ...validVerdict, rating })
      ).not.toThrow();
    }
  );

  it("rejects invalid rating", () => {
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, rating: "MAYBE" })
    ).toThrow();
  });

  it("rejects confidence below 0", () => {
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, confidence: -1 })
    ).toThrow();
  });

  it("rejects confidence above 100", () => {
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, confidence: 101 })
    ).toThrow();
  });

  it("accepts boundary confidence values", () => {
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, confidence: 0 })
    ).not.toThrow();
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, confidence: 100 })
    ).not.toThrow();
  });

  it("accepts empty claims array", () => {
    expect(() =>
      VerdictSchema.parse({ ...validVerdict, claims: [] })
    ).not.toThrow();
  });

  it("rejects missing summary", () => {
    const { summary: _, ...rest } = validVerdict;
    expect(() => VerdictSchema.parse(rest)).toThrow();
  });

  it("rejects missing sources", () => {
    const { sources: _, ...rest } = validVerdict;
    expect(() => VerdictSchema.parse(rest)).toThrow();
  });
});
