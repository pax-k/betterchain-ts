import Anthropic from "@anthropic-ai/sdk";
import {
  AITextDetection,
  AuthorInfo,
  Evidence,
  EvidenceResult,
  ImageAnalysis,
  PerspectiveGroup,
  Verdict,
  VerdictSchema,
} from "./types";

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

export async function assessAuthorCredibility(
  authorName: string,
  searchResults: EvidenceResult[],
  articleTopic: string
): Promise<AuthorInfo> {
  const searchContext = searchResults
    .map((r) => `- ${r.title}: ${r.snippet} (${r.url})`)
    .join("\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Assess the credibility of the author "${authorName}" for writing about "${articleTopic}".

Based on these search results about the author:
${searchContext || "No search results found."}

Return a JSON object with:
- isVerified (boolean): whether the author appears to be a real, credentialed person
- credentials (string[]): known credentials, degrees, positions
- affiliations (string[]): known organizations, publications they work for
- credibilityAssessment (string): brief assessment of their expertise and reliability
- credibilityScore (number 0-100): overall credibility score

Return ONLY the JSON object.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      name: authorName,
      isVerified: false,
      credentials: [],
      affiliations: [],
      credibilityAssessment: "Unable to assess author credibility.",
      credibilityScore: 30,
    };
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return { name: authorName, ...parsed };
  } catch {
    return {
      name: authorName,
      isVerified: false,
      credentials: [],
      affiliations: [],
      credibilityAssessment: "Unable to parse author credibility assessment.",
      credibilityScore: 30,
    };
  }
}

export async function detectAIText(
  text: string
): Promise<AITextDetection> {
  const sample = text.slice(0, 3000);
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this text for signs of AI generation. Consider:
- Repetitive sentence structures or overly uniform paragraph lengths
- Unusual hedging language ("It's important to note", "It's worth mentioning")
- Lack of personal voice, anecdotes, or specific expertise
- Overly balanced "on one hand / on the other hand" structures
- Generic transitions and filler phrases
- Unusually consistent tone without natural variation
- Excessive use of bullet points or numbered lists in prose

Text to analyze:
"""
${sample}
"""

Return a JSON object:
{
  "isLikelyAIGenerated": boolean,
  "confidence": number (0-100),
  "indicators": string[] (specific signs found),
  "summary": string (brief assessment)
}

Return ONLY the JSON object.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      isLikelyAIGenerated: false,
      confidence: 0,
      indicators: [],
      summary: "Unable to analyze text.",
    };
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { isLikelyAIGenerated: false, confidence: 0, indicators: [], summary: "Unable to parse." };
  } catch {
    return {
      isLikelyAIGenerated: false,
      confidence: 0,
      indicators: [],
      summary: "Unable to parse analysis.",
    };
  }
}

export function groupByPerspective(
  searchResults: EvidenceResult[],
  domainLeanings: Record<string, string>
): PerspectiveGroup[] {
  const groups: Record<string, PerspectiveGroup["sources"]> = {
    left: [],
    center: [],
    right: [],
    unknown: [],
  };

  for (const result of searchResults) {
    let domain = "";
    try {
      domain = new URL(result.url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    const bias = domainLeanings[domain] ?? "unknown";
    let leaning: PerspectiveGroup["leaning"] = "unknown";

    if (
      bias === "left" ||
      bias === "left-center" ||
      bias === "far-left"
    ) {
      leaning = "left";
    } else if (
      bias === "center" ||
      bias === "least-biased" ||
      bias === "pro-science"
    ) {
      leaning = "center";
    } else if (
      bias === "right" ||
      bias === "right-center" ||
      bias === "far-right"
    ) {
      leaning = "right";
    }

    groups[leaning].push({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      domain,
    });
  }

  return (["left", "center", "right", "unknown"] as const)
    .filter((l) => groups[l].length > 0)
    .map((l) => ({ leaning: l, sources: groups[l] }));
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
