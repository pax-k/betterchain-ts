import { tavily } from "@tavily/core";
import { EvidenceResult } from "./types";

function getClient() {
  return tavily({ apiKey: process.env.TAVILY_API_KEY! });
}

export async function searchClaim(query: string): Promise<EvidenceResult[]> {
  const client = getClient();
  const response = await client.search(query, {
    searchDepth: "advanced",
    maxResults: 5,
    includeAnswer: true,
  });

  return response.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    publishedAt: r.publishedDate ?? "",
  }));
}
