import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts (later wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles undefined inputs", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("handles false and null inputs", () => {
    expect(cn("foo", false, null, "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "extra")).toBe("base");
    expect(cn("base", true && "extra")).toBe("base extra");
  });
});
