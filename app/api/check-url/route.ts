import { createSSEStream } from "@/lib/stream";
import { extractClaims, synthesizeVerdict } from "@/lib/anthropic";
import { scrapeUrl } from "@/lib/firecrawl";
import { searchClaim } from "@/lib/tavily";
import { searchFactChecks } from "@/lib/google-factcheck";
import { Evidence, StreamEvent } from "@/lib/types";

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

    const { markdown, title } = await scrapeUrl(url);

    if (!markdown) {
      yield { type: "error", message: "Could not extract content from URL." };
      return;
    }

    yield {
      type: "progress",
      step: "Extracting claims...",
      detail: title || undefined,
    };

    const claims = await extractClaims(markdown);

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

    yield { type: "progress", step: "Synthesizing verdict..." };

    const verdict = await synthesizeVerdict(evidenceList);
    yield { type: "verdict", data: verdict };
  });
}
