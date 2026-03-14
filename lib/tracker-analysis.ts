import { TrackerAnalysis } from "./types";

type TrackerEntry = { name: string; category: string };

const TRACKER_DOMAINS: Record<string, TrackerEntry> = {
  // --- Analytics ---
  "google-analytics.com": { name: "Google Analytics", category: "analytics" },
  "googletagmanager.com": {
    name: "Google Tag Manager",
    category: "analytics",
  },
  "analytics.google.com": { name: "Google Analytics", category: "analytics" },
  "hotjar.com": { name: "Hotjar", category: "analytics" },
  "fullstory.com": { name: "FullStory", category: "analytics" },
  "mixpanel.com": { name: "Mixpanel", category: "analytics" },
  "segment.io": { name: "Segment", category: "analytics" },
  "segment.com": { name: "Segment", category: "analytics" },
  "amplitude.com": { name: "Amplitude", category: "analytics" },
  "heapanalytics.com": { name: "Heap", category: "analytics" },
  "mouseflow.com": { name: "Mouseflow", category: "analytics" },
  "crazyegg.com": { name: "Crazy Egg", category: "analytics" },
  "optimizely.com": { name: "Optimizely", category: "analytics" },
  "newrelic.com": { name: "New Relic", category: "analytics" },
  "nr-data.net": { name: "New Relic", category: "analytics" },
  "chartbeat.com": { name: "Chartbeat", category: "analytics" },
  "parsely.com": { name: "Parse.ly", category: "analytics" },
  "quantserve.com": { name: "Quantcast", category: "analytics" },
  "scorecardresearch.com": {
    name: "Scorecard Research",
    category: "analytics",
  },
  "comscore.com": { name: "comScore", category: "analytics" },
  "matomo.cloud": { name: "Matomo", category: "analytics" },
  "plausible.io": { name: "Plausible", category: "analytics" },

  // --- Advertising ---
  "doubleclick.net": { name: "Google DoubleClick", category: "advertising" },
  "googlesyndication.com": { name: "Google Ads", category: "advertising" },
  "googleadservices.com": { name: "Google Ads", category: "advertising" },
  "googleads.g.doubleclick.net": {
    name: "Google Ads",
    category: "advertising",
  },
  "adnxs.com": { name: "AppNexus/Xandr", category: "advertising" },
  "amazon-adsystem.com": { name: "Amazon Ads", category: "advertising" },
  "facebook.net": { name: "Meta Pixel", category: "advertising" },
  "facebook.com/tr": { name: "Meta Pixel", category: "advertising" },
  "ads-twitter.com": { name: "Twitter/X Ads", category: "advertising" },
  "tiktok.com/i18n/pixel": { name: "TikTok Pixel", category: "advertising" },
  "criteo.com": { name: "Criteo", category: "advertising" },
  "criteo.net": { name: "Criteo", category: "advertising" },
  "outbrain.com": { name: "Outbrain", category: "advertising" },
  "taboola.com": { name: "Taboola", category: "advertising" },
  "mgid.com": { name: "MGID", category: "advertising" },
  "revcontent.com": { name: "RevContent", category: "advertising" },
  "content.ad": { name: "Content.ad", category: "advertising" },
  "medianet.com": { name: "Media.net", category: "advertising" },
  "rubiconproject.com": { name: "Rubicon Project", category: "advertising" },
  "pubmatic.com": { name: "PubMatic", category: "advertising" },
  "openx.net": { name: "OpenX", category: "advertising" },
  "indexexchange.com": { name: "Index Exchange", category: "advertising" },
  "casalemedia.com": { name: "Casale Media", category: "advertising" },
  "moatads.com": { name: "Moat", category: "advertising" },
  "adsrvr.org": { name: "The Trade Desk", category: "advertising" },
  "demdex.net": { name: "Adobe Audience Manager", category: "advertising" },
  "bidswitch.net": { name: "Bidswitch", category: "advertising" },
  "sharethrough.com": { name: "Sharethrough", category: "advertising" },

  // --- Social Tracking ---
  "connect.facebook.net": { name: "Facebook SDK", category: "social" },
  "platform.twitter.com": { name: "Twitter Widgets", category: "social" },
  "platform.linkedin.com": { name: "LinkedIn Tracking", category: "social" },
  "snap.licdn.com": { name: "LinkedIn Insight", category: "social" },
  "pinterest.com/ct.html": { name: "Pinterest Tag", category: "social" },
  "static.addtoany.com": { name: "AddToAny", category: "social" },

  // --- Fingerprinting ---
  "cdn.jsdelivr.net/npm/fingerprintjs": {
    name: "FingerprintJS",
    category: "fingerprinting",
  },
  "fpjs.io": { name: "FingerprintJS", category: "fingerprinting" },
  "api.fpjs.io": { name: "FingerprintJS", category: "fingerprinting" },
  "bounceexchange.com": {
    name: "Bounce Exchange",
    category: "fingerprinting",
  },

  // --- Consent/Data Management ---
  "cookiebot.com": { name: "Cookiebot", category: "analytics" },
  "onetrust.com": { name: "OneTrust", category: "analytics" },
  "trustarc.com": { name: "TrustArc", category: "analytics" },
};

// Ad networks associated with misinformation sites
const MISINFO_AD_NETWORKS = new Set([
  "revcontent.com",
  "mgid.com",
  "content.ad",
]);

export function analyzeTrackers(rawHtml: string): TrackerAnalysis {
  // Extract URLs from script src, iframe src, and img src attributes
  const urlPattern =
    /(?:src|href|data-src)=["']([^"']+)["']/gi;
  const extractedUrls: string[] = [];
  let match;

  while ((match = urlPattern.exec(rawHtml)) !== null) {
    extractedUrls.push(match[1]);
  }

  const foundTrackers = new Map<string, TrackerEntry>();
  const foundAdNetworks = new Set<string>();

  for (const url of extractedUrls) {
    try {
      // Handle protocol-relative URLs
      const fullUrl = url.startsWith("//") ? `https:${url}` : url;
      if (!fullUrl.startsWith("http")) continue;

      const hostname = new URL(fullUrl).hostname;

      // Check against tracker database
      for (const [trackerDomain, entry] of Object.entries(TRACKER_DOMAINS)) {
        if (hostname.includes(trackerDomain) || url.includes(trackerDomain)) {
          foundTrackers.set(trackerDomain, entry);

          if (entry.category === "advertising") {
            foundAdNetworks.add(entry.name);
          }

          if (MISINFO_AD_NETWORKS.has(trackerDomain)) {
            foundAdNetworks.add(`${entry.name} (misinformation-linked)`);
          }
        }
      }
    } catch {
      // Skip malformed URLs
    }
  }

  const trackers = Array.from(foundTrackers.values());
  const adNetworks = Array.from(foundAdNetworks);
  const totalTrackers = trackers.length;
  const totalAdNetworks = adNetworks.length;

  let riskLevel: TrackerAnalysis["riskLevel"] = "low";
  if (totalTrackers >= 9) riskLevel = "high";
  else if (totalTrackers >= 4) riskLevel = "medium";

  // Generate summary
  const categories = new Map<string, number>();
  for (const t of trackers) {
    categories.set(t.category, (categories.get(t.category) ?? 0) + 1);
  }

  const categoryBreakdown = Array.from(categories.entries())
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");

  const summary =
    totalTrackers === 0
      ? "No third-party trackers detected."
      : `Found ${totalTrackers} trackers (${categoryBreakdown}) and ${totalAdNetworks} ad networks. Risk level: ${riskLevel}.`;

  return {
    totalTrackers,
    totalAdNetworks,
    trackers,
    adNetworks,
    riskLevel,
    summary,
  };
}
