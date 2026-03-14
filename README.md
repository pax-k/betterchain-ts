# FactCheck — AI-Powered Fact Checking

A full-stack web application that verifies claims, articles, images, and PDFs using Claude AI, cross-referenced against multiple search engines and fact-checking databases. Results stream in real-time with source credibility analysis, tracker detection, and author verification.

## Features

- **Multi-input fact-checking** — paste text, submit a URL, upload an image, or upload a PDF
- **Real-time streaming** — claims, evidence, and verdicts arrive via Server-Sent Events as they're generated
- **Source credibility analysis** — domain authority scoring, author verification, tracker/ad detection
- **Multiple verification sources** — Claude web search, Tavily, Google Fact Check API, SerpAPI reverse image search
- **Structured verdicts** — TRUE / FALSE / MISLEADING / PARTIALLY_TRUE / UNVERIFIED with confidence scores
- **Searchable history** — filterable, sortable, paginated archive of all past fact-checks with view counting
- **File uploads** — images and PDFs stored via Vercel Blob

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| AI | Anthropic Claude Sonnet 4.5 (`@anthropic-ai/sdk`) |
| Search | Tavily (`@tavily/core`), Google Fact Check API (REST) |
| Scraping | Firecrawl (`@mendable/firecrawl-js`) |
| Image search | SerpAPI (`serpapi`) |
| PDF | pdf-parse v2 |
| Storage | Vercel Blob (`@vercel/blob`), in-memory Map (history) |
| Validation | Zod 4 |
| Testing | Vitest 4, jsdom |

## Project Structure

```
app/
  api/
    check-text/route.ts        Text claim fact-checking endpoint
    check-url/route.ts         URL article analysis endpoint
    check-image/route.ts       Image analysis + reverse search endpoint
    check-pdf/route.ts         PDF extraction + fact-checking endpoint
    fact-check-db/route.ts     History CRUD with filtering/sorting/pagination
    upload/route.ts            Vercel Blob file upload handler
  history/
    page.tsx                   History list with search, filters, sorting
    [id]/page.tsx              Single fact-check detail view
  page.tsx                     Main fact-checking page
  layout.tsx                   Root layout with navigation

components/
  FactCheckForm.tsx            4-tab input form (text/url/image/pdf)
  VerdictCard.tsx              Rating badge, confidence bar, sources
  EvidenceList.tsx             Per-claim evidence breakdown
  ClaimTimeline.tsx            Real-time claim extraction timeline
  DomainCard.tsx               Domain authority + trust indicators
  AuthorCard.tsx               Author credibility scoring
  TrackerCard.tsx              Tracker/ad network detection display
  HistoryTable.tsx             Paginated results table
  NavHeader.tsx                Top navigation bar
  ui/                          Base UI components (badge, button, card, etc.)

lib/
  anthropic.ts                 Claude API: claim extraction, image analysis,
                               web search, author assessment, verdict synthesis
  firecrawl.ts                 URL scraping (markdown + raw HTML)
  tavily.ts                    Web search for claim verification
  google-factcheck.ts          Google Fact Check Tools API
  serpapi.ts                   Reverse image search
  domain-authority.ts          Domain trust scoring (40+ known sources, RDAP)
  author.ts                    Author credential verification
  tracker-analysis.ts          80+ tracker/ad domain detection from HTML
  pdf.ts                       PDF text extraction
  stream.ts                    SSE streaming utility
  types.ts                     All TypeScript types + Zod schemas
  utils.ts                     Tailwind class merging utility
  hooks/
    useFactCheck.ts            Streaming fact-check submission hook
    useHistory.ts              History filtering/sorting/pagination hook
```

## Data Flow

```
User Input (text / URL / image / PDF)
    |
    v
/api/check-{mode}
    |
    +---> Extract claims (Claude)
    +---> Scrape content (Firecrawl, for URLs)
    +---> Analyze domain (known DB + RDAP + reputation search)
    +---> Verify author (Tavily + Claude)
    +---> Detect trackers (HTML regex matching)
    |
    v
Per-claim verification (parallel)
    +---> Web search (Claude web_search tool)
    +---> Tavily advanced search
    +---> Google Fact Check API
    |
    v
Synthesize verdict (Claude structured output)
    |
    v
Stream results via SSE --> Client renders progressively
    |
    v
Auto-save to /api/fact-check-db
```

## External Providers

| Provider | Purpose | Used In |
|----------|---------|---------|
| **Anthropic (Claude)** | Claim extraction, image analysis, evidence search (web_search tool), author assessment, verdict synthesis | All modes |
| **Firecrawl** | Web page scraping to markdown + raw HTML | URL mode |
| **Tavily** | Advanced web search for claim evidence + author credential search | URL, text, image, PDF modes |
| **Google Fact Check API** | Professional fact-checker verdicts (Snopes, PolitiFact, etc.) | All modes |
| **SerpAPI** | Google reverse image search | Image mode |
| **Vercel Blob** | Cloud file storage for uploaded images and PDFs | Image, PDF modes |
| **RDAP (rdap.org)** | Domain registration age and country lookup (free, no key) | URL mode |

## Setup

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=...
TAVILY_API_KEY=...
SERPAPI_API_KEY=...
GOOGLE_FACTCHECK_API_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

### Install & Run

```bash
npm install
npm run dev        # http://localhost:3000
```

### Build & Test

```bash
npm run build      # Production build
npm test           # Run 67 unit tests
```

## How Accurate Is This?

Fact-checking automation is inherently imperfect. Here is an honest assessment.

### Arguments For Accuracy

- **Multi-source cross-referencing** — claims are checked against Claude's web search, Tavily results, and Google's dedicated Fact Check API simultaneously, reducing single-source bias
- **Professional fact-checker integration** — Google Fact Check API surfaces verdicts from established organizations (Snopes, PolitiFact, AFP Fact Check, Full Fact) that follow editorial standards
- **Source credibility signals** — domain authority, author verification, and tracker analysis provide context that pure text analysis misses; a claim from Reuters is weighted differently than one from an unknown blog
- **Structured reasoning** — Claude is prompted as an expert fact-checker with explicit instructions to consider evidence quality, source reliability, and claim specificity before rendering a verdict
- **Transparency** — every verdict includes confidence scores, cited sources, and per-claim breakdowns so users can evaluate the reasoning themselves
- **Confidence scoring** — the system explicitly signals uncertainty rather than forcing binary true/false on ambiguous claims

### Arguments Against Accuracy

- **LLM hallucination risk** — Claude can generate plausible-sounding but incorrect evidence assessments; the web search tool mitigates this but doesn't eliminate it
- **Training data cutoff** — Claude's knowledge has a cutoff date; very recent events may lack context even with web search augmentation
- **Search quality dependency** — verdict quality is directly bounded by what Tavily and Claude's web search return; if the relevant counter-evidence doesn't appear in search results, it won't factor into the verdict
- **No primary source verification** — the system cannot contact original sources, verify documents, or conduct interviews; it only synthesizes existing web content
- **Prompt sensitivity** — different phrasings of the same claim can produce different verdicts, especially for nuanced or context-dependent statements
- **Domain database limitations** — the known-domain trust database covers ~40 major sources; thousands of legitimate (and illegitimate) sources are scored heuristically rather than from curated data
- **No image forensics** — image analysis relies on Claude's vision model for AI-generation detection, not forensic tools like ELA (Error Level Analysis) or metadata inspection
- **In-memory persistence** — the history store resets on server restart; no durable storage means no long-term data for accuracy auditing

### Bottom Line

This tool is best used as a **research accelerator**, not an oracle. It surfaces relevant evidence, identifies source credibility signals, and provides structured reasoning — but users should treat verdicts as a starting point for their own investigation, particularly for high-stakes claims.

## Future Feature Ideas

- **Database persistence** — replace in-memory Map with PostgreSQL/SQLite for durable history across restarts
- **User accounts** — authentication with personal history, saved searches, and custom watchlists
- **Batch checking** — submit multiple claims at once (CSV upload or bulk paste)
- **API mode** — expose a public REST/GraphQL API for programmatic fact-checking
- **Browser extension** — highlight and right-click to fact-check selected text on any webpage
- **Forensic image analysis** — integrate ELA, metadata extraction (EXIF), and C2PA content credentials
- **Claim monitoring** — watch specific claims or topics and get notified when new evidence appears
- **Multi-language support** — extend claim extraction and evidence search to non-English sources
- **Confidence calibration** — track prediction accuracy over time and adjust confidence scoring
- **Source graph visualization** — interactive network diagram showing how sources reference each other
- **Collaborative fact-checking** — allow users to annotate, dispute, or corroborate verdicts with additional evidence
- **RSS/feed ingestion** — auto-check articles from subscribed news feeds
- **Webhook integrations** — push verdicts to Slack, Discord, or email
- **Caching layer** — cache recent search results to reduce API costs and improve latency for popular claims
- **Rate limiting and abuse prevention** — protect API endpoints from excessive use

## License

MIT
