import { createSSEStream } from "@/lib/stream";
import {
  extractClaims,
  webSearchFactCheck,
  synthesizeVerdict,
} from "@/lib/anthropic";
import { searchFactChecks } from "@/lib/google-factcheck";
import { Evidence, StreamEvent } from "@/lib/types";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 10000) {
    return Response.json(
      { error: "Text must be under 10,000 characters" },
      { status: 400 }
    );
  }

  return createSSEStream(async function* (): AsyncGenerator<StreamEvent> {
    yield { type: "progress", step: "Extracting claims from text..." };

    const claims = await extractClaims(text);

    if (claims.length === 0) {
      yield {
        type: "error",
        message: "No verifiable claims found in the provided text.",
      };
      return;
    }

    for (let i = 0; i < claims.length; i++) {
      yield { type: "claim", data: { text: claims[i], index: i } };
    }

    yield {
      type: "progress",
      step: "Researching claims...",
      detail: `Found ${claims.length} claims to verify`,
    };

    // Research all claims in parallel
    const evidenceResults = await Promise.all(
      claims.map(async (claim) => {
        const [webSearch, factChecks] = await Promise.all([
          webSearchFactCheck(claim),
          searchFactChecks(claim),
        ]);
        return { claim, webSearch, factChecks };
      })
    );

    // Yield evidence events and build evidence list
    const evidenceList: Evidence[] = [];
    for (let i = 0; i < evidenceResults.length; i++) {
      const { claim, webSearch, factChecks } = evidenceResults[i];

      for (const citation of webSearch.citations) {
        yield {
          type: "evidence",
          data: { claimIndex: i, source: citation.title },
        };
      }

      evidenceList.push({
        claim,
        searchResults: webSearch.citations.map((c) => ({
          title: c.title,
          url: c.url,
          snippet: "",
          publishedAt: "",
        })),
        factCheckResults: factChecks,
      });
    }

    yield { type: "progress", step: "Synthesizing verdict..." };

    const verdict = await synthesizeVerdict(evidenceList);
    yield { type: "verdict", data: verdict };
  });
}
