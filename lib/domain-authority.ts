import { DomainAnalysis } from "./types";
import { webSearchFactCheck } from "./anthropic";

// Well-known domains with pre-assigned trust levels
type DomainEntry = {
  trust: DomainAnalysis["overallTrustLevel"];
  bias?: string;
  score: number;
};

const KNOWN_DOMAINS: Record<string, DomainEntry> = {
  // === HIGH TRUST — Wire services & fact-checkers ===
  "reuters.com": { trust: "high", score: 95 },
  "apnews.com": { trust: "high", score: 95 },
  "afp.com": { trust: "high", score: 94 },
  "snopes.com": { trust: "high", score: 90 },
  "factcheck.org": { trust: "high", score: 92 },
  "politifact.com": { trust: "high", score: 90 },
  "fullfact.org": { trust: "high", score: 90 },
  "factual.ro": { trust: "high", score: 85 },
  "checkyourfact.com": { trust: "high", score: 82 },
  "leadstories.com": { trust: "high", score: 82 },
  "africacheck.org": { trust: "high", score: 85 },
  "altnews.in": { trust: "high", score: 82 },

  // === HIGH TRUST — Science & government ===
  "nature.com": { trust: "high", score: 95 },
  "science.org": { trust: "high", score: 95 },
  "who.int": { trust: "high", score: 95 },
  "cdc.gov": { trust: "high", score: 93 },
  "nih.gov": { trust: "high", score: 93 },
  "gov.uk": { trust: "high", score: 90 },
  "europa.eu": { trust: "high", score: 90 },
  "un.org": { trust: "high", score: 90 },
  "nasa.gov": { trust: "high", score: 95 },
  "nejm.org": { trust: "high", score: 95 },
  "thelancet.com": { trust: "high", score: 95 },
  "bmj.com": { trust: "high", score: 93 },
  "pubmed.ncbi.nlm.nih.gov": { trust: "high", score: 95 },
  "arxiv.org": { trust: "high", score: 88 },
  "scholar.google.com": { trust: "high", score: 85 },

  // === HIGH TRUST — Major newspapers (least-biased / left-center) ===
  "bbc.com": { trust: "high", bias: "center", score: 90 },
  "bbc.co.uk": { trust: "high", bias: "center", score: 90 },
  "nytimes.com": { trust: "high", bias: "left-center", score: 88 },
  "washingtonpost.com": { trust: "high", bias: "left-center", score: 85 },
  "wsj.com": { trust: "high", bias: "right-center", score: 88 },
  "theguardian.com": { trust: "high", bias: "left-center", score: 85 },
  "economist.com": { trust: "high", bias: "least-biased", score: 88 },
  "npr.org": { trust: "high", bias: "left-center", score: 87 },
  "pbs.org": { trust: "high", bias: "center", score: 88 },
  "csmonitor.com": { trust: "high", bias: "least-biased", score: 88 },
  "ft.com": { trust: "high", bias: "least-biased", score: 88 },
  "bloomberg.com": { trust: "high", bias: "least-biased", score: 86 },
  "time.com": { trust: "high", bias: "left-center", score: 82 },
  "usatoday.com": { trust: "high", bias: "left-center", score: 80 },
  "latimes.com": { trust: "high", bias: "left-center", score: 82 },
  "politico.com": { trust: "high", bias: "left-center", score: 82 },
  "thehill.com": { trust: "high", bias: "center", score: 80 },
  "axios.com": { trust: "high", bias: "least-biased", score: 83 },
  "propublica.org": { trust: "high", bias: "left-center", score: 88 },

  // === HIGH TRUST — International quality press ===
  "dw.com": { trust: "high", bias: "least-biased", score: 85 },
  "france24.com": { trust: "high", bias: "least-biased", score: 85 },
  "aljazeera.com": { trust: "high", bias: "left-center", score: 78 },
  "abc.net.au": { trust: "high", bias: "center", score: 88 },
  "cbc.ca": { trust: "high", bias: "left-center", score: 85 },
  "smh.com.au": { trust: "high", bias: "left-center", score: 82 },
  "scmp.com": { trust: "high", bias: "least-biased", score: 80 },
  "japantimes.co.jp": { trust: "high", bias: "least-biased", score: 82 },
  "thelocal.se": { trust: "high", bias: "least-biased", score: 78 },
  "swissinfo.ch": { trust: "high", bias: "center", score: 85 },
  "elpais.com": { trust: "high", bias: "left-center", score: 82 },
  "lemonde.fr": { trust: "high", bias: "left-center", score: 82 },
  "spiegel.de": { trust: "high", bias: "left-center", score: 82 },
  "corriere.it": { trust: "high", bias: "center", score: 80 },

  // === HIGH TRUST — Tech & business ===
  "arstechnica.com": { trust: "high", bias: "left-center", score: 82 },
  "wired.com": { trust: "high", bias: "left-center", score: 80 },
  "techcrunch.com": { trust: "high", bias: "least-biased", score: 78 },
  "theverge.com": { trust: "high", bias: "left-center", score: 78 },

  // === MEDIUM TRUST — Cable news & major outlets with known bias ===
  "cnn.com": { trust: "medium", bias: "left", score: 70 },
  "foxnews.com": { trust: "medium", bias: "right", score: 65 },
  "msnbc.com": { trust: "medium", bias: "left", score: 65 },
  "abcnews.go.com": { trust: "medium", bias: "left-center", score: 75 },
  "cbsnews.com": { trust: "medium", bias: "left-center", score: 75 },
  "nbcnews.com": { trust: "medium", bias: "left-center", score: 75 },
  "newsweek.com": { trust: "medium", bias: "left-center", score: 68 },
  "businessinsider.com": { trust: "medium", bias: "left-center", score: 68 },
  "thedailybeast.com": { trust: "medium", bias: "left", score: 60 },
  "vox.com": { trust: "medium", bias: "left", score: 65 },
  "theatlantic.com": { trust: "medium", bias: "left-center", score: 78 },
  "newyorker.com": { trust: "medium", bias: "left", score: 78 },
  "slate.com": { trust: "medium", bias: "left", score: 62 },
  "salon.com": { trust: "medium", bias: "left", score: 55 },
  "motherjones.com": { trust: "medium", bias: "left", score: 60 },
  "thenation.com": { trust: "medium", bias: "left", score: 60 },
  "jacobin.com": { trust: "medium", bias: "far-left", score: 55 },
  "huffpost.com": { trust: "medium", bias: "left", score: 60 },
  "buzzfeednews.com": { trust: "medium", bias: "left-center", score: 60 },

  // === MEDIUM TRUST — Right-leaning outlets ===
  "nypost.com": { trust: "medium", bias: "right", score: 55 },
  "dailymail.co.uk": { trust: "medium", bias: "right", score: 50 },
  "washingtontimes.com": { trust: "medium", bias: "right", score: 55 },
  "nationalreview.com": { trust: "medium", bias: "right", score: 65 },
  "weeklystandard.com": { trust: "medium", bias: "right-center", score: 65 },
  "reason.com": { trust: "medium", bias: "right-center", score: 72 },
  "freebeacon.com": { trust: "medium", bias: "right", score: 50 },
  "dailycaller.com": { trust: "medium", bias: "right", score: 50 },
  "dailywire.com": { trust: "medium", bias: "right", score: 55 },
  "thefederalist.com": { trust: "medium", bias: "right", score: 48 },
  "washingtonexaminer.com": { trust: "medium", bias: "right", score: 55 },
  "townhall.com": { trust: "medium", bias: "right", score: 48 },
  "spectator.co.uk": { trust: "medium", bias: "right-center", score: 68 },
  "telegraph.co.uk": { trust: "medium", bias: "right-center", score: 72 },
  "express.co.uk": { trust: "medium", bias: "right", score: 50 },
  "thesun.co.uk": { trust: "medium", bias: "right", score: 45 },
  "foxbusiness.com": { trust: "medium", bias: "right", score: 60 },

  // === MEDIUM TRUST — International mixed ===
  "skynews.com.au": { trust: "medium", bias: "right", score: 55 },
  "news.com.au": { trust: "medium", bias: "right-center", score: 60 },
  "theaustralian.com.au": { trust: "medium", bias: "right-center", score: 68 },
  "independent.co.uk": { trust: "medium", bias: "left-center", score: 68 },
  "mirror.co.uk": { trust: "medium", bias: "left", score: 50 },
  "euronews.com": { trust: "medium", bias: "least-biased", score: 72 },
  "timesofisrael.com": { trust: "medium", bias: "right-center", score: 68 },
  "haaretz.com": { trust: "medium", bias: "left-center", score: 72 },
  "digi24.ro": { trust: "medium", bias: "center", score: 68 },
  "g4media.ro": { trust: "medium", bias: "center", score: 72 },
  "hotnews.ro": { trust: "medium", bias: "center", score: 68 },
  "mediafax.ro": { trust: "medium", bias: "center", score: 65 },
  "stirileprotv.ro": { trust: "medium", bias: "center", score: 65 },

  // === LOW TRUST — Misinformation & conspiracy ===
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
  "oann.com": { trust: "low", bias: "far-right", score: 20 },
  "newsmax.com": { trust: "low", bias: "far-right", score: 30 },
  "thebabylonbee.com": { trust: "low", bias: "right", score: 15 },
  "occupydemocrats.com": { trust: "low", bias: "far-left", score: 20 },
  "bipartisanreport.com": { trust: "low", bias: "far-left", score: 15 },
  "addictinginfo.com": { trust: "low", bias: "far-left", score: 15 },
  "yournewswire.com": { trust: "low", bias: "conspiracy", score: 5 },
  "worldnewsdailyreport.com": { trust: "low", bias: "conspiracy", score: 5 },
  "neonnettle.com": { trust: "low", bias: "conspiracy", score: 5 },
  "thegoldwater.com": { trust: "low", bias: "far-right", score: 10 },
  "activistpost.com": { trust: "low", bias: "conspiracy", score: 10 },
  "collective-evolution.com": { trust: "low", bias: "conspiracy", score: 5 },
  "davidicke.com": { trust: "low", bias: "conspiracy", score: 5 },
  "greenmedinfo.com": { trust: "low", bias: "conspiracy", score: 5 },
  "mercola.com": { trust: "low", bias: "conspiracy", score: 10 },
  "thedailysheeple.com": { trust: "low", bias: "conspiracy", score: 5 },
  "dcclothesline.com": { trust: "low", bias: "conspiracy", score: 5 },
  "realfarmacy.com": { trust: "low", bias: "conspiracy", score: 5 },
  "healthnutnews.com": { trust: "low", bias: "conspiracy", score: 5 },
  "stfrancismagazine.info": { trust: "low", bias: "conspiracy", score: 5 },
  "antena3.ro": { trust: "medium", bias: "right-center", score: 55 },
  "romaniatv.net": { trust: "low", bias: "right", score: 30 },
  "activenews.ro": { trust: "low", bias: "far-right", score: 15 },
  "luju.ro": { trust: "low", bias: "right", score: 20 },
};

// Export for use in perspective grouping
export function getDomainBias(url: string): string | null {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_DOMAINS[domain]?.bias ?? null;
  } catch {
    return null;
  }
}

export function getDomainLeanings(): Record<string, string> {
  const leanings: Record<string, string> = {};
  for (const [domain, entry] of Object.entries(KNOWN_DOMAINS)) {
    if (entry.bias) leanings[domain] = entry.bias;
  }
  return leanings;
}

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
