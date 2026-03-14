import { describe, it, expect } from "vitest";
import { groupByPerspective } from "@/lib/anthropic";
import { EvidenceResult } from "@/lib/types";

function makeResult(url: string, title = "Title"): EvidenceResult {
  return { title, url, snippet: "snippet" };
}

describe("groupByPerspective", () => {
  it("returns empty array for empty results", () => {
    expect(groupByPerspective([], {})).toEqual([]);
  });

  it("maps left, left-center, far-left to 'left' group", () => {
    const results = [
      makeResult("https://a.com"),
      makeResult("https://b.com"),
      makeResult("https://c.com"),
    ];
    const leanings = {
      "a.com": "left",
      "b.com": "left-center",
      "c.com": "far-left",
    };
    const groups = groupByPerspective(results, leanings);
    const left = groups.find((g) => g.leaning === "left");
    expect(left).toBeDefined();
    expect(left!.sources.length).toBe(3);
  });

  it("maps center, least-biased, pro-science to 'center' group", () => {
    const results = [
      makeResult("https://a.com"),
      makeResult("https://b.com"),
      makeResult("https://c.com"),
    ];
    const leanings = {
      "a.com": "center",
      "b.com": "least-biased",
      "c.com": "pro-science",
    };
    const groups = groupByPerspective(results, leanings);
    const center = groups.find((g) => g.leaning === "center");
    expect(center).toBeDefined();
    expect(center!.sources.length).toBe(3);
  });

  it("maps right, right-center, far-right to 'right' group", () => {
    const results = [
      makeResult("https://a.com"),
      makeResult("https://b.com"),
      makeResult("https://c.com"),
    ];
    const leanings = {
      "a.com": "right",
      "b.com": "right-center",
      "c.com": "far-right",
    };
    const groups = groupByPerspective(results, leanings);
    const right = groups.find((g) => g.leaning === "right");
    expect(right).toBeDefined();
    expect(right!.sources.length).toBe(3);
  });

  it("puts unknown domains in 'unknown' group", () => {
    const results = [makeResult("https://random-site.com")];
    const groups = groupByPerspective(results, {});
    expect(groups).toEqual([
      {
        leaning: "unknown",
        sources: [
          {
            title: "Title",
            url: "https://random-site.com",
            snippet: "snippet",
            domain: "random-site.com",
          },
        ],
      },
    ]);
  });

  it("distributes mixed sources across all groups", () => {
    const results = [
      makeResult("https://left.com"),
      makeResult("https://center.com"),
      makeResult("https://right.com"),
      makeResult("https://unknown.com"),
    ];
    const leanings = {
      "left.com": "left",
      "center.com": "center",
      "right.com": "right",
    };
    const groups = groupByPerspective(results, leanings);
    expect(groups.length).toBe(4);
    expect(groups.map((g) => g.leaning)).toEqual([
      "left",
      "center",
      "right",
      "unknown",
    ]);
  });

  it("skips malformed URLs without crashing", () => {
    const results = [makeResult("not-a-url"), makeResult("https://ok.com")];
    const groups = groupByPerspective(results, {});
    expect(groups.length).toBe(1);
    expect(groups[0].sources[0].domain).toBe("ok.com");
  });

  it("strips www. prefix from hostname for lookup", () => {
    const results = [makeResult("https://www.nytimes.com/article")];
    const leanings = { "nytimes.com": "left-center" };
    const groups = groupByPerspective(results, leanings);
    const left = groups.find((g) => g.leaning === "left");
    expect(left).toBeDefined();
    expect(left!.sources[0].domain).toBe("nytimes.com");
  });

  it("omits empty groups from output", () => {
    const results = [makeResult("https://a.com")];
    const leanings = { "a.com": "center" };
    const groups = groupByPerspective(results, leanings);
    expect(groups.length).toBe(1);
    expect(groups[0].leaning).toBe("center");
  });
});
