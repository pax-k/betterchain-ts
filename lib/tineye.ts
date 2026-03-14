import { ImageHistory } from "./types";

export async function searchImageHistory(
  imageUrl: string
): Promise<ImageHistory> {
  // TinEye doesn't have a free public API, so we use their search page
  // and parse the metadata via a HEAD-based approach.
  // For production, use TinEye's commercial API: https://services.tineye.com/
  // For now, we use Google Lens via SerpAPI as a proxy for image history.

  try {
    const { getJson } = await import("serpapi");

    const response = await getJson({
      engine: "google_lens",
      api_key: process.env.SERPAPI_API_KEY!,
      url: imageUrl,
    });

    const matches: ImageHistory["matches"] = [];
    const visualMatches = response.visual_matches ?? [];

    for (const match of visualMatches.slice(0, 10)) {
      let domain = "";
      try {
        domain = new URL(match.link ?? "").hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      matches.push({
        url: match.link ?? "",
        domain,
        crawlDate: null,
      });
    }

    // Use knowledge_graph date if available
    const firstSeen = response.knowledge_graph?.[0]?.date ?? null;

    return {
      firstSeen,
      totalResults: visualMatches.length,
      matches,
    };
  } catch {
    return { firstSeen: null, totalResults: 0, matches: [] };
  }
}
