import { describe, it, expect } from "vitest";
import { analyzeTrackers } from "@/lib/tracker-analysis";

function html(scripts: string[]): string {
  return `<html><head>${scripts.join("")}</head><body></body></html>`;
}

function script(url: string): string {
  return `<script src="${url}"></script>`;
}

describe("analyzeTrackers", () => {
  it("returns zero trackers for empty HTML", () => {
    const result = analyzeTrackers("");
    expect(result.totalTrackers).toBe(0);
    expect(result.totalAdNetworks).toBe(0);
    expect(result.riskLevel).toBe("low");
    expect(result.summary).toBe("No third-party trackers detected.");
  });

  it("returns zero trackers for HTML with no tracker URLs", () => {
    const result = analyzeTrackers(
      html([script("https://example.com/app.js")])
    );
    expect(result.totalTrackers).toBe(0);
  });

  it("detects a single Google Analytics tracker", () => {
    const result = analyzeTrackers(
      html([script("https://www.google-analytics.com/analytics.js")])
    );
    expect(result.totalTrackers).toBeGreaterThanOrEqual(1);
    expect(result.trackers.some((t) => t.category === "analytics")).toBe(true);
  });

  it("categorizes trackers across multiple categories", () => {
    const result = analyzeTrackers(
      html([
        script("https://www.google-analytics.com/analytics.js"),
        script("https://securepubads.g.doubleclick.net/tag/js/gpt.js"),
        script("https://connect.facebook.net/en_US/sdk.js"),
      ])
    );
    const categories = new Set(result.trackers.map((t) => t.category));
    expect(categories.has("analytics")).toBe(true);
    expect(categories.has("advertising")).toBe(true);
    expect(categories.has("social")).toBe(true);
  });

  it("returns low risk for 3 trackers", () => {
    const result = analyzeTrackers(
      html([
        script("https://www.google-analytics.com/analytics.js"),
        script("https://hotjar.com/hj.js"),
        script("https://mixpanel.com/mp.js"),
      ])
    );
    expect(result.riskLevel).toBe("low");
  });

  it("returns medium risk at 4 trackers (boundary)", () => {
    const result = analyzeTrackers(
      html([
        script("https://www.google-analytics.com/analytics.js"),
        script("https://hotjar.com/hj.js"),
        script("https://mixpanel.com/mp.js"),
        script("https://amplitude.com/a.js"),
      ])
    );
    expect(result.riskLevel).toBe("medium");
  });

  it("returns high risk at 9 trackers (boundary)", () => {
    const trackerUrls = [
      "https://www.google-analytics.com/analytics.js",
      "https://hotjar.com/hj.js",
      "https://mixpanel.com/mp.js",
      "https://amplitude.com/a.js",
      "https://heapanalytics.com/h.js",
      "https://mouseflow.com/m.js",
      "https://crazyegg.com/c.js",
      "https://optimizely.com/o.js",
      "https://newrelic.com/n.js",
    ];
    const result = analyzeTrackers(html(trackerUrls.map(script)));
    expect(result.riskLevel).toBe("high");
  });

  it("flags misinformation ad networks", () => {
    const result = analyzeTrackers(
      html([script("https://cdn.revcontent.com/widget.js")])
    );
    expect(
      result.adNetworks.some((n) => n.includes("misinformation-linked"))
    ).toBe(true);
  });

  it("handles protocol-relative URLs", () => {
    const result = analyzeTrackers(
      html([script("//www.google-analytics.com/analytics.js")])
    );
    expect(result.totalTrackers).toBeGreaterThanOrEqual(1);
  });

  it("does not throw on malformed URLs", () => {
    expect(() =>
      analyzeTrackers(html([script("not a valid url at all")]))
    ).not.toThrow();
  });

  it("deduplicates tracker domains", () => {
    const result = analyzeTrackers(
      html([
        script("https://www.google-analytics.com/analytics.js"),
        script("https://www.google-analytics.com/ga.js"),
      ])
    );
    const gaTrackers = result.trackers.filter(
      (t) => t.name === "Google Analytics"
    );
    expect(gaTrackers.length).toBe(1);
  });

  it("populates adNetworks from advertising category", () => {
    const result = analyzeTrackers(
      html([script("https://securepubads.g.doubleclick.net/tag/js/gpt.js")])
    );
    expect(result.totalAdNetworks).toBeGreaterThanOrEqual(1);
    expect(result.adNetworks.length).toBeGreaterThanOrEqual(1);
  });
});
