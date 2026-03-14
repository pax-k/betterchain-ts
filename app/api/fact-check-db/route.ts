import { NextResponse } from "next/server";
import { StoredFactCheck, HistoryResponse } from "@/lib/types";

// In-memory store for v1 — replace with database in production
const store = new Map<string, StoredFactCheck>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Single item fetch with view count increment
  const id = searchParams.get("id");
  if (id) {
    const entry = store.get(id);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    entry.viewCount++;
    return NextResponse.json(entry);
  }

  // Build filtered results
  let results = Array.from(store.values());

  // Filter by mode
  const modeFilter = searchParams.get("mode");
  if (modeFilter) {
    const modes = modeFilter.split(",");
    results = results.filter((r) => modes.includes(r.mode));
  }

  // Filter by rating
  const ratingFilter = searchParams.get("rating");
  if (ratingFilter) {
    const ratings = ratingFilter.split(",");
    results = results.filter((r) => ratings.includes(r.verdict.rating));
  }

  // Search
  const search = searchParams.get("search");
  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.input.toLowerCase().includes(term) ||
        r.verdict.summary.toLowerCase().includes(term)
    );
  }

  // Date range
  const dateFrom = searchParams.get("dateFrom");
  if (dateFrom) {
    results = results.filter((r) => r.createdAt >= dateFrom);
  }
  const dateTo = searchParams.get("dateTo");
  if (dateTo) {
    results = results.filter((r) => r.createdAt <= dateTo);
  }

  // Sort
  const sort = searchParams.get("sort") ?? "date";
  const order = searchParams.get("order") ?? "desc";
  const multiplier = order === "asc" ? 1 : -1;

  results.sort((a, b) => {
    switch (sort) {
      case "confidence":
        return (a.verdict.confidence - b.verdict.confidence) * multiplier;
      case "rating":
        return a.verdict.rating.localeCompare(b.verdict.rating) * multiplier;
      case "views":
        return (a.viewCount - b.viewCount) * multiplier;
      case "date":
      default:
        return a.createdAt.localeCompare(b.createdAt) * multiplier;
    }
  });

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20"))
  );
  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  const response: HistoryResponse = {
    results: paged,
    total,
    page,
    pageSize,
  };

  return NextResponse.json(response);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    mode,
    input,
    verdict,
    authorInfo,
    domainAnalysis,
    trackerAnalysis,
    imageHistory,
    aiTextDetection,
    perspectives,
  } = body;

  if (!mode || !input || !verdict) {
    return NextResponse.json(
      { error: "mode, input, and verdict are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const entry: StoredFactCheck = {
    id,
    mode,
    input,
    verdict,
    authorInfo: authorInfo ?? null,
    domainAnalysis: domainAnalysis ?? null,
    trackerAnalysis: trackerAnalysis ?? null,
    imageHistory: imageHistory ?? null,
    aiTextDetection: aiTextDetection ?? null,
    perspectives: perspectives ?? null,
    createdAt: new Date().toISOString(),
    viewCount: 0,
  };

  store.set(id, entry);

  return NextResponse.json(entry, { status: 201 });
}
