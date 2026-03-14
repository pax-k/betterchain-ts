import { createSSEStream } from "@/lib/stream";
import { analyzeImage, synthesizeVerdict } from "@/lib/anthropic";
import { reverseImageSearch } from "@/lib/serpapi";
import { searchClaim } from "@/lib/tavily";
import { searchFactChecks } from "@/lib/google-factcheck";
import { Evidence, StreamEvent } from "@/lib/types";

export async function POST(req: Request) {
  const { imageUrl } = await req.json();

  if (!imageUrl || typeof imageUrl !== "string") {
    return Response.json({ error: "Image URL is required" }, { status: 400 });
  }

  return createSSEStream(async function* (): AsyncGenerator<StreamEvent> {
    yield { type: "progress", step: "Analyzing image..." };

    // Run all three tracks in parallel
    const [imageAnalysis, reverseResults] = await Promise.all([
      analyzeImage(imageUrl),
      reverseImageSearch(imageUrl).catch(() => ({
        matchingPages: [],
        similarImages: [],
      })),
    ]);

    // Report AI detection results
    yield {
      type: "progress",
      step: "AI detection complete",
      detail: imageAnalysis.isLikelyAIGenerated
        ? `Likely AI-generated (${imageAnalysis.aiConfidence}% confidence)`
        : `No strong AI generation indicators (${imageAnalysis.aiConfidence}% confidence)`,
    };

    // Report reverse image search results
    if (reverseResults.matchingPages.length > 0) {
      yield {
        type: "progress",
        step: "Reverse image search complete",
        detail: `Found ${reverseResults.matchingPages.length} matching pages`,
      };
    }

    // Build claims from identified content and reverse search results
    const claimsToVerify: string[] = [];

    for (const content of imageAnalysis.identifiedContent) {
      claimsToVerify.push(content);
    }

    // Add claims from reverse image search page titles
    for (const page of reverseResults.matchingPages.slice(0, 3)) {
      if (page.title) {
        claimsToVerify.push(page.title);
      }
    }

    for (let i = 0; i < claimsToVerify.length; i++) {
      yield { type: "claim", data: { text: claimsToVerify[i], index: i } };
    }

    // Verify identified claims
    const evidenceList: Evidence[] = [];

    if (claimsToVerify.length > 0) {
      yield { type: "progress", step: "Verifying context..." };

      const evidenceResults = await Promise.all(
        claimsToVerify.map(async (claim) => {
          const [searchResults, factChecks] = await Promise.all([
            searchClaim(claim).catch(() => []),
            searchFactChecks(claim),
          ]);
          return { claim, searchResults, factChecks };
        })
      );

      for (let i = 0; i < evidenceResults.length; i++) {
        const { claim, searchResults, factChecks } = evidenceResults[i];

        for (const result of searchResults) {
          yield {
            type: "evidence",
            data: { claimIndex: i, source: result.title },
          };
        }

        evidenceList.push({ claim, searchResults, factCheckResults: factChecks });
      }
    }

    // Add image analysis as evidence
    evidenceList.unshift({
      claim: "Image authenticity assessment",
      searchResults: [
        {
          title: "AI Detection Analysis",
          url: imageUrl,
          snippet: imageAnalysis.summary,
          publishedAt: "",
        },
        ...reverseResults.matchingPages.slice(0, 5).map((p) => ({
          title: p.title,
          url: p.link,
          snippet: p.snippet ?? "",
          publishedAt: "",
        })),
      ],
      factCheckResults: [],
    });

    yield { type: "progress", step: "Synthesizing verdict..." };

    const verdict = await synthesizeVerdict(evidenceList);
    yield { type: "verdict", data: verdict };
  });
}
