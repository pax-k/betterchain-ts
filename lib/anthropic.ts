import Anthropic from "@anthropic-ai/sdk";
import { Evidence, ImageAnalysis, Verdict, VerdictSchema } from "./types";

function getClient() {
  return new Anthropic();
}

export async function extractClaims(text: string): Promise<string[]> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Extract all verifiable factual claims from the following text. Return ONLY a JSON array of strings, each being a distinct factual claim that can be verified. Focus on dates, statistics, attributions, and event descriptions. Ignore opinions and subjective statements.

Text:
${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") return [];

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `Analyze this image carefully and return a JSON object with the following fields:
- isLikelyAIGenerated (boolean): whether the image shows signs of AI generation
- aiConfidence (number 0-100): how confident you are in your AI generation assessment
- manipulationSigns (string[]): list of specific signs of AI generation or tampering found
- identifiedContent (string[]): list of people, places, events, text, or objects identified
- summary (string): brief overall assessment

Return ONLY the JSON object, no other text.`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      isLikelyAIGenerated: false,
      aiConfidence: 0,
      manipulationSigns: [],
      identifiedContent: [],
      summary: "Unable to analyze image",
    };
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : defaultImageAnalysis();
  } catch {
    return defaultImageAnalysis();
  }
}

function defaultImageAnalysis(): ImageAnalysis {
  return {
    isLikelyAIGenerated: false,
    aiConfidence: 0,
    manipulationSigns: [],
    identifiedContent: [],
    summary: "Unable to parse analysis results",
  };
}

export async function webSearchFactCheck(
  claim: string
): Promise<{ text: string; citations: Array<{ url: string; title: string }> }> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Fact-check this claim with thorough web research. Provide a detailed analysis with evidence for or against the claim: "${claim}"`,
      },
    ],
  });

  let text = "";
  const citations: Array<{ url: string; title: string }> = [];

  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
      if ("citations" in block && Array.isArray(block.citations)) {
        for (const citation of block.citations) {
          if ("url" in citation && "title" in citation) {
            citations.push({
              url: citation.url as string,
              title: citation.title as string,
            });
          }
        }
      }
    }
  }

  return { text, citations };
}

const VERDICT_SYSTEM_PROMPT = `You are an expert fact-checker. You will be given a set of claims with evidence gathered from multiple sources. Your job is to evaluate each claim, assess the evidence, and deliver a structured verdict.

For each claim, determine its status: "Supported", "Refuted", "Partially Supported", or "Unverified".

Then provide an overall verdict with:
- rating: TRUE, FALSE, MISLEADING, PARTIALLY_TRUE, or UNVERIFIED
- confidence: 0-100 based on evidence quality and agreement
- summary: concise explanation of your findings
- claims: each claim with its status and supporting evidence
- sources: all sources cited

Be objective and thorough. Cite specific evidence for your assessments.`;

export async function synthesizeVerdict(
  evidence: Evidence[]
): Promise<Verdict> {
  const evidencePrompt = evidence
    .map(
      (e, i) =>
        `Claim ${i + 1}: "${e.claim}"
Search Results:
${e.searchResults.map((r) => `- ${r.title}: ${r.snippet} (${r.url})`).join("\n")}
Existing Fact-Checks:
${e.factCheckResults.length > 0 ? e.factCheckResults.map((f) => `- ${f.publisher} rated "${f.rating}": ${f.claim} (${f.url})`).join("\n") : "None found"}`
    )
    .join("\n\n---\n\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: VERDICT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze the following evidence and deliver your verdict as a JSON object matching this schema:
{
  "rating": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED" | "PARTIALLY_TRUE",
  "confidence": number (0-100),
  "summary": string,
  "claims": [{ "text": string, "status": string, "evidence": [{ "title": string, "url": string, "publishedAt": string }] }],
  "sources": [{ "title": string, "url": string, "publishedAt": string }]
}

Evidence:
${evidencePrompt}

Return ONLY the JSON object.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format from verdict synthesis");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract verdict JSON from response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return VerdictSchema.parse(parsed);
}
