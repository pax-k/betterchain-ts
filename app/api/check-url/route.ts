import { createSSEStream } from "@/lib/stream";
import {
  extractClaims,
  groupByPerspective,
  synthesizeVerdict,
} from "@/lib/anthropic";
import { scrapeUrl } from "@/lib/firecrawl";
import { searchClaim } from "@/lib/tavily";
import { searchFactChecks } from "@/lib/google-factcheck";
import { verifyAuthor } from "@/lib/author";
import { analyzeDomain, getDomainLeanings } from "@/lib/domain-authority";
import { analyzeTrackers } from "@/lib/tracker-analysis";
import { Evidence, EvidenceResult, StreamEvent } from "@/lib/types";

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL format" }, { status: 400 });
  }

  return createSSEStream(async function* (): AsyncGenerator<StreamEvent> {
    yield { type: "progress", step: "Scraping article..." };

    const { markdown, title, author, rawHtml } = await scrapeUrl(url);

    if (!markdown) {
      yield { type: "error", message: "Could not extract content from URL." };
      return;
    }

    yield {
      type: "progress",
      step: "Analyzing source...",
      detail: title || undefined,
    };

    // Run domain analysis, author verification, tracker analysis, and claim extraction in parallel
    const [domainResult, authorResult, claims] = await Promise.all([
      analyzeDomain(url).catch(() => null),
      verifyAuthor(author, title || "general news").catch(() => null),
      extractClaims(markdown),
    ]);

    // Tracker analysis is synchronous
    const trackerResult = rawHtml ? analyzeTrackers(rawHtml) : null;

    // Yield domain, author, and tracker events
    if (domainResult) {
      yield { type: "domain", data: domainResult };
    }

    if (authorResult) {
      yield { type: "author", data: authorResult };
    }

    if (trackerResult) {
      yield { type: "trackers", data: trackerResult };
    }

    if (claims.length === 0) {
      yield {
        type: "error",
        message: "No verifiable claims found in the article.",
      };
      return;
    }

    for (let i = 0; i < claims.length; i++) {
      yield { type: "claim", data: { text: claims[i], index: i } };
    }

    yield {
      type: "progress",
      step: "Verifying claims...",
      detail: `Checking ${claims.length} claims against multiple sources`,
    };

    // Research all claims in parallel
    const evidenceResults = await Promise.all(
      claims.map(async (claim) => {
        const [tavilyResults, factChecks] = await Promise.all([
          searchClaim(claim),
          searchFactChecks(claim),
        ]);
        return { claim, tavilyResults, factChecks };
      })
    );

    const evidenceList: Evidence[] = [];

    // Prepend domain/author/tracker context as evidence entries
    if (domainResult) {
      evidenceList.push({
        claim: "Source domain credibility assessment",
        searchResults: [
          {
            title: `Domain: ${domainResult.domain}`,
            url,
            snippet: `Trust level: ${domainResult.overallTrustLevel}. Authority score: ${domainResult.authorityScore}/100. ${domainResult.trustIndicators.join(", ")}`,
          },
        ],
        factCheckResults: [],
      });
    }

    if (authorResult) {
      evidenceList.push({
        claim: "Author credibility assessment",
        searchResults: [
          {
            title: `Author: ${authorResult.name ?? "Unknown"}`,
            url: "",
            snippet: `Credibility: ${authorResult.credibilityScore}/100. ${authorResult.credibilityAssessment}`,
          },
        ],
        factCheckResults: [],
      });
    }

    if (trackerResult && trackerResult.totalTrackers > 0) {
      evidenceList.push({
        claim: "Source website tracker/ad analysis",
        searchResults: [
          {
            title: "Tracker Analysis",
            url,
            snippet: trackerResult.summary,
          },
        ],
        factCheckResults: [],
      });
    }

    for (let i = 0; i < evidenceResults.length; i++) {
      const { claim, tavilyResults, factChecks } = evidenceResults[i];

      for (const result of tavilyResults) {
        yield {
          type: "evidence",
          data: { claimIndex: i, source: result.title },
        };
      }

      evidenceList.push({
        claim,
        searchResults: tavilyResults,
        factCheckResults: factChecks,
      });
    }

    // Group evidence by political perspective
    const allSearchResults: EvidenceResult[] = evidenceList.flatMap(
      (e) => e.searchResults
    );
    const perspectives = groupByPerspective(
      allSearchResults,
      getDomainLeanings()
    );
    if (perspectives.some((p) => p.sources.length > 0)) {
      yield { type: "perspectives", data: perspectives };
    }

    yield { type: "progress", step: "Synthesizing verdict..." };

    const verdict = await synthesizeVerdict(evidenceList);
    yield { type: "verdict", data: verdict };
  });
}
