import { DomainAnalysis } from "./types";
import { webSearchFactCheck } from "./anthropic";

// Well-known domains with pre-assigned trust levels
const KNOWN_DOMAINS: Record<
  string,
  { trust: DomainAnalysis["overallTrustLevel"]; bias?: string; score: number }
> = {
  "reuters.com": { trust: "high", score: 95 },
  "apnews.com": { trust: "high", score: 95 },
  "bbc.com": { trust: "high", score: 90 },
  "bbc.co.uk": { trust: "high", score: 90 },
  "nytimes.com": { trust: "high", bias: "left-center", score: 88 },
  "washingtonpost.com": { trust: "high", bias: "left-center", score: 85 },
  "wsj.com": { trust: "high", bias: "right-center", score: 88 },
  "theguardian.com": { trust: "high", bias: "left-center", score: 85 },
  "nature.com": { trust: "high", score: 95 },
  "science.org": { trust: "high", score: 95 },
  "who.int": { trust: "high", score: 95 },
  "cdc.gov": { trust: "high", score: 93 },
  "nih.gov": { trust: "high", score: 93 },
  "gov.uk": { trust: "high", score: 90 },
  "economist.com": { trust: "high", score: 88 },
  "npr.org": { trust: "high", bias: "left-center", score: 87 },
  "pbs.org": { trust: "high", score: 88 },
  "snopes.com": { trust: "high", score: 90 },
  "factcheck.org": { trust: "high", score: 92 },
  "politifact.com": { trust: "high", score: 90 },
  "cnn.com": { trust: "medium", bias: "left", score: 70 },
  "foxnews.com": { trust: "medium", bias: "right", score: 65 },
  "msnbc.com": { trust: "medium", bias: "left", score: 65 },
  "dailymail.co.uk": { trust: "medium", bias: "right", score: 50 },
  "nypost.com": { trust: "medium", bias: "right", score: 55 },
  "huffpost.com": { trust: "medium", bias: "left", score: 60 },
  "buzzfeednews.com": { trust: "medium", bias: "left-center", score: 60 },
  "breitbart.com": { trust: "low", bias: "far-right", score: 20 },
  "infowars.com": { trust: "low", bias: "conspiracy", score: 5 },
  "naturalnews.com": { trust: "low", bias: "conspiracy", score: 5 },
  "rt.com": { trust: "low", bias: "state-controlled", score: 15 },
  "sputniknews.com": { trust: "low", bias: "state-controlled", score: 10 },
  "thegatewaypundit.com": { trust: "low", bias: "far-right", score: 15 },
  "beforeitsnews.com": { trust: "low", bias: "conspiracy", score: 5 },
  "zerohedge.com": { trust: "low", bias: "far-right", score: 25 },
  "globalresearch.ca": { trust: "low", bias: "conspiracy", score: 10 },
  "epochtimes.com": { trust: "low", bias: "far-right", score: 20 },
};

export async function analyzeDomain(url: string): Promise<DomainAnalysis> {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const hasHttps = parsedUrl.protocol === "https:";

  // Check known domains first
  const known = KNOWN_DOMAINS[domain];
  if (known) {
    return {
      domain,
      hasHttps,
      domainAge: null,
      country: null,
      authorityScore: known.score,
      hasPrivacyPolicy: true,
      hasAboutPage: true,
      knownBiasRating: known.bias ?? null,
      trustIndicators: [
        "Well-known publication",
        ...(known.trust === "high" ? ["Established editorial standards"] : []),
      ],
      riskIndicators:
        known.trust === "low"
          ? ["Known for publishing misinformation"]
          : known.bias
            ? [`Known ${known.bias} bias`]
            : [],
      overallTrustLevel: known.trust,
    };
  }

  // For unknown domains, gather data in parallel
  const [rdapData, privacyCheck, aboutCheck, reputationSearch] =
    await Promise.all([
      fetchRdapData(domain),
      checkPageExists(`${parsedUrl.origin}/privacy`),
      checkPageExists(`${parsedUrl.origin}/about`),
      searchDomainReputation(domain),
    ]);

  const trustIndicators: string[] = [];
  const riskIndicators: string[] = [];

  if (hasHttps) trustIndicators.push("Uses HTTPS");
  else riskIndicators.push("No HTTPS");

  if (rdapData.age) {
    const years = parseInt(rdapData.age);
    if (years >= 5) trustIndicators.push(`Domain age: ${rdapData.age}`);
    else if (years <= 1)
      riskIndicators.push(`Recently registered: ${rdapData.age}`);
  }

  if (privacyCheck) trustIndicators.push("Has privacy policy");
  else riskIndicators.push("No privacy policy found");

  if (aboutCheck) trustIndicators.push("Has about page");
  else riskIndicators.push("No about page found");

  // Calculate score
  let score = 50;
  score += trustIndicators.length * 8;
  score -= riskIndicators.length * 10;
  score = Math.max(0, Math.min(100, score));

  let overallTrustLevel: DomainAnalysis["overallTrustLevel"] = "unknown";
  if (score >= 70) overallTrustLevel = "high";
  else if (score >= 40) overallTrustLevel = "medium";
  else if (score < 40) overallTrustLevel = "low";

  // Incorporate reputation search results
  if (reputationSearch.biasRating) {
    if (
      reputationSearch.biasRating.toLowerCase().includes("conspiracy") ||
      reputationSearch.biasRating.toLowerCase().includes("pseudoscience")
    ) {
      overallTrustLevel = "low";
      score = Math.min(score, 20);
    }
  }

  return {
    domain,
    hasHttps,
    domainAge: rdapData.age,
    country: rdapData.country,
    authorityScore: score,
    hasPrivacyPolicy: privacyCheck,
    hasAboutPage: aboutCheck,
    knownBiasRating: reputationSearch.biasRating,
    trustIndicators,
    riskIndicators,
    overallTrustLevel,
  };
}

async function fetchRdapData(
  domain: string
): Promise<{ age: string | null; country: string | null }> {
  try {
    // Extract TLD-level domain for RDAP lookup
    const parts = domain.split(".");
    const tld = parts.slice(-2).join(".");

    const response = await fetch(`https://rdap.org/domain/${tld}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { age: null, country: null };

    const data = await response.json();

    let age: string | null = null;
    const registrationEvent = data.events?.find(
      (e: { eventAction: string }) => e.eventAction === "registration"
    );
    if (registrationEvent?.eventDate) {
      const regDate = new Date(registrationEvent.eventDate);
      const years = Math.floor(
        (Date.now() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      age = `${years} years`;
    }

    const country =
      data.entities?.[0]?.vcardArray?.[1]?.find(
        (v: string[]) => v[0] === "adr"
      )?.[3]?.country ?? null;

    return { age, country };
  } catch {
    return { age: null, country: null };
  }
}

async function checkPageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function searchDomainReputation(
  domain: string
): Promise<{ biasRating: string | null }> {
  try {
    const result = await webSearchFactCheck(
      `${domain} media bias fact check reliability rating`
    );

    const biasMatch = result.text.match(
      /(?:rated|classified|categorized|bias[: ]+)[\s]*(?:as[\s]+)?["']?([^"'\n.]+)["']?/i
    );

    return { biasRating: biasMatch ? biasMatch[1].trim() : null };
  } catch {
    return { biasRating: null };
  }
}
