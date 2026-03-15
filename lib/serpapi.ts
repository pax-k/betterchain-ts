import { getJson } from "serpapi";

export type ReverseImageResult = {
  matchingPages: Array<{
    title: string;
    link: string;
    snippet?: string;
    source?: string;
  }>;
  similarImages: Array<{
    link: string;
    thumbnail?: string;
  }>;
};

export async function reverseImageSearch(
  imageUrl: string
): Promise<ReverseImageResult> {
  const response = await getJson({
    engine: "google_reverse_image",
    api_key: process.env.SERPAPI_API_KEY!,
    image_url: imageUrl,
  });

  return {
    matchingPages: (response.image_results ?? []).map(
      (r: Record<string, string>) => ({
        title: r.title ?? "",
        link: r.link ?? "",
        snippet: r.snippet ?? "",
        source: r.source ?? "",
      })
    ),
    similarImages: (response.inline_images ?? []).map(
      (r: Record<string, string>) => ({
        link: r.link ?? "",
        thumbnail: r.thumbnail ?? "",
      })
    ),
  };
}
