import { createSSEStream } from "@/lib/stream";
import { extractClaims, webSearchFactCheck, synthesizeVerdict } from "@/lib/anthropic";
import { searchFactChecks } from "@/lib/google-factcheck";
import { extractTextFromPdf } from "@/lib/pdf";
import { Evidence, StreamEvent } from "@/lib/types";

export async function POST(req: Request) {
  const { pdfUrl } = await req.json();

  if (!pdfUrl || typeof pdfUrl !== "string") {
    return Response.json({ error: "PDF URL is required" }, { status: 400 });
  }

  return createSSEStream(async function* (): AsyncGenerator<StreamEvent> {
    yield { type: "progress", step: "Downloading PDF..." };

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      yield { type: "error", message: "Failed to download PDF." };
      return;
    }

    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    yield { type: "progress", step: "Extracting text from PDF..." };

    let text: string;
    try {
      text = await extractTextFromPdf(buffer);
    } catch (err) {
      yield {
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to extract text from PDF.",
      };
      return;
    }

    if (text.trim().length < 50) {
      yield {
        type: "error",
        message:
          "Very little text was extracted from the PDF. It may be image-based.",
      };
      return;
    }

    yield {
      type: "progress",
      step: "Extracting claims...",
      detail: `Extracted ${text.length} characters from PDF`,
    };

    const claims = await extractClaims(text.slice(0, 15000));

    if (claims.length === 0) {
      yield {
        type: "error",
        message: "No verifiable claims found in the PDF.",
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

    const evidenceResults = await Promise.all(
      claims.map(async (claim) => {
        const [webSearch, factChecks] = await Promise.all([
          webSearchFactCheck(claim),
          searchFactChecks(claim),
        ]);
        return { claim, webSearch, factChecks };
      })
    );

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
