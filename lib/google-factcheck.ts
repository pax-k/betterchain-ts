import { FactCheckResult } from "./types";

const BASE_URL =
  "https://factchecktools.googleapis.com/v1alpha1/claims:search";

export async function searchFactChecks(
  query: string
): Promise<FactCheckResult[]> {
  const params = new URLSearchParams({
    query,
    key: process.env.GOOGLE_FACTCHECK_API_KEY!,
    pageSize: "5",
    languageCode: "en-US",
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  if (!data.claims) return [];

  return data.claims.map(
    (claim: {
      text: string;
      claimant?: string;
      claimReview?: Array<{
        textualRating?: string;
        publisher?: { name?: string };
        url?: string;
        reviewDate?: string;
      }>;
    }) => ({
      claim: claim.text,
      claimant: claim.claimant,
      rating: claim.claimReview?.[0]?.textualRating ?? "Unknown",
      publisher: claim.claimReview?.[0]?.publisher?.name ?? "Unknown",
      url: claim.claimReview?.[0]?.url ?? "",
      reviewDate: claim.claimReview?.[0]?.reviewDate ?? "",
    })
  );
}
