import { describe, it, expect } from "vitest";
import { extractInput } from "@/lib/hooks/useFactCheck";

describe("extractInput", () => {
  it("extracts text for text mode", () => {
    expect(extractInput("text", { text: "hello" })).toBe("hello");
  });

  it("extracts url for url mode", () => {
    expect(extractInput("url", { url: "https://example.com" })).toBe(
      "https://example.com"
    );
  });

  it("extracts imageUrl for image mode", () => {
    expect(extractInput("image", { imageUrl: "https://img.com/a.png" })).toBe(
      "https://img.com/a.png"
    );
  });

  it("extracts pdfUrl for pdf mode", () => {
    expect(extractInput("pdf", { pdfUrl: "https://doc.com/a.pdf" })).toBe(
      "https://doc.com/a.pdf"
    );
  });

  it("returns empty string when property is missing", () => {
    expect(extractInput("text", {})).toBe("");
    expect(extractInput("url", {})).toBe("");
    expect(extractInput("image", {})).toBe("");
    expect(extractInput("pdf", {})).toBe("");
  });
});
