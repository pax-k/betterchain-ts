import Firecrawl from "@mendable/firecrawl-js";

function getClient() {
  return new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
}

export async function scrapeUrl(url: string): Promise<{
  markdown: string;
  title: string;
  author: string | null;
  rawHtml: string;
}> {
  const result = await getClient().scrape(url, {
    formats: ["markdown", "rawHtml"],
  });

  const metadata = result.metadata as Record<string, string> | undefined;

  return {
    markdown: result.markdown ?? "",
    title: metadata?.title ?? "",
    author:
      metadata?.author ??
      metadata?.["og:author"] ??
      metadata?.["article:author"] ??
      null,
    rawHtml: result.rawHtml ?? "",
  };
}
