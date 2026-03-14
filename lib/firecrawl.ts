import Firecrawl from "@mendable/firecrawl-js";

function getClient() {
  return new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
}

export async function scrapeUrl(
  url: string
): Promise<{ markdown: string; title: string }> {
  const result = await getClient().scrape(url, {
    formats: ["markdown"],
  });

  return {
    markdown: result.markdown ?? "",
    title: result.metadata?.title ?? "",
  };
}
