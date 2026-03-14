import { searchClaim } from "./tavily";
import { assessAuthorCredibility } from "./anthropic";
import { AuthorInfo } from "./types";

export async function verifyAuthor(
  authorName: string | null,
  articleTopic: string
): Promise<AuthorInfo> {
  if (!authorName) {
    return {
      name: null,
      isVerified: false,
      credentials: [],
      affiliations: [],
      credibilityAssessment:
        "No author attribution found. Anonymous or unattributed articles may lack accountability.",
      credibilityScore: 20,
    };
  }

  const searchResults = await searchClaim(
    `${authorName} journalist author credentials biography`
  ).catch(() => []);

  return assessAuthorCredibility(authorName, searchResults, articleTopic);
}
