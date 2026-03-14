import { z } from "zod";

// --- Core Types ---

export type Source = {
  title: string;
  url: string;
  publishedAt: string;
};

export type Verdict = {
  rating: "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED" | "PARTIALLY_TRUE";
  confidence: number;
  summary: string;
  claims: { text: string; status: string; evidence: Source[] }[];
  sources: Source[];
};

// --- Evidence Types ---

export type EvidenceResult = {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
};

export type FactCheckResult = {
  claim: string;
  claimant?: string;
  rating: string;
  publisher: string;
  url: string;
  reviewDate?: string;
};

export type Evidence = {
  claim: string;
  searchResults: EvidenceResult[];
  factCheckResults: FactCheckResult[];
};

export type ImageAnalysis = {
  isLikelyAIGenerated: boolean;
  aiConfidence: number;
  manipulationSigns: string[];
  identifiedContent: string[];
  summary: string;
};

// --- Author Types ---

export type AuthorInfo = {
  name: string | null;
  isVerified: boolean;
  credentials: string[];
  affiliations: string[];
  credibilityAssessment: string;
  credibilityScore: number;
};

// --- Domain Authority Types ---

export type DomainAnalysis = {
  domain: string;
  hasHttps: boolean;
  domainAge: string | null;
  country: string | null;
  authorityScore: number;
  hasPrivacyPolicy: boolean;
  hasAboutPage: boolean;
  knownBiasRating: string | null;
  trustIndicators: string[];
  riskIndicators: string[];
  overallTrustLevel: "high" | "medium" | "low" | "unknown";
};

// --- Image History Types ---

export type ImageHistory = {
  firstSeen: string | null;
  totalResults: number;
  matches: {
    url: string;
    domain: string;
    crawlDate: string | null;
  }[];
};

// --- AI Text Detection Types ---

export type AITextDetection = {
  isLikelyAIGenerated: boolean;
  confidence: number;
  indicators: string[];
  summary: string;
};

// --- Multi-Perspective Types ---

export type PerspectiveGroup = {
  leaning: "left" | "center" | "right" | "unknown";
  sources: { title: string; url: string; snippet: string; domain: string }[];
};

// --- Tracker Analysis Types ---

export type TrackerAnalysis = {
  totalTrackers: number;
  totalAdNetworks: number;
  trackers: { name: string; category: string }[];
  adNetworks: string[];
  riskLevel: "low" | "medium" | "high";
  summary: string;
};

// --- Zod Schemas ---

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  publishedAt: z.string(),
});

export const VerdictSchema = z.object({
  rating: z.enum([
    "TRUE",
    "FALSE",
    "MISLEADING",
    "UNVERIFIED",
    "PARTIALLY_TRUE",
  ]),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  claims: z.array(
    z.object({
      text: z.string(),
      status: z.string(),
      evidence: z.array(SourceSchema),
    })
  ),
  sources: z.array(SourceSchema),
});

// --- Stored Fact-Check Types ---

export type StoredFactCheck = {
  id: string;
  mode: "url" | "image" | "text" | "pdf";
  input: string;
  verdict: Verdict;
  authorInfo?: AuthorInfo | null;
  domainAnalysis?: DomainAnalysis | null;
  trackerAnalysis?: TrackerAnalysis | null;
  imageHistory?: ImageHistory | null;
  aiTextDetection?: AITextDetection | null;
  perspectives?: PerspectiveGroup[] | null;
  createdAt: string;
  viewCount: number;
};

export type HistoryResponse = {
  results: StoredFactCheck[];
  total: number;
  page: number;
  pageSize: number;
};

// --- Stream Event Types ---

export type StreamEvent =
  | { type: "progress"; step: string; detail?: string }
  | { type: "claim"; data: { text: string; index: number } }
  | { type: "evidence"; data: { claimIndex: number; source: string } }
  | { type: "text"; content: string }
  | { type: "verdict"; data: Verdict }
  | { type: "error"; message: string }
  | { type: "author"; data: AuthorInfo }
  | { type: "domain"; data: DomainAnalysis }
  | { type: "trackers"; data: TrackerAnalysis }
  | { type: "imageHistory"; data: ImageHistory }
  | { type: "aiTextDetection"; data: AITextDetection }
  | { type: "perspectives"; data: PerspectiveGroup[] };
