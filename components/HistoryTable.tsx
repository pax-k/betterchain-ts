"use client";

import Link from "next/link";
import { StoredFactCheck } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const ratingColors: Record<string, string> = {
  TRUE: "bg-green-100 text-green-800",
  FALSE: "bg-red-100 text-red-800",
  MISLEADING: "bg-orange-100 text-orange-800",
  UNVERIFIED: "bg-gray-100 text-gray-800",
  PARTIALLY_TRUE: "bg-yellow-100 text-yellow-800",
};

const modeColors: Record<string, string> = {
  text: "bg-blue-100 text-blue-800",
  url: "bg-purple-100 text-purple-800",
  image: "bg-pink-100 text-pink-800",
  pdf: "bg-amber-100 text-amber-800",
};

export function HistoryTable({
  results,
}: {
  results: StoredFactCheck[];
}) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)] text-sm">
        No fact-checks found. Try adjusting your filters or run a fact-check
        first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header (hidden on mobile) */}
      <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_80px_100px_60px] gap-3 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] border-b border-[var(--border)]">
        <span>Input</span>
        <span>Mode</span>
        <span>Rating</span>
        <span>Conf.</span>
        <span>Date</span>
        <span>Views</span>
      </div>

      {results.map((result) => (
        <Link
          key={result.id}
          href={`/history/${result.id}`}
          className="block rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_100px_80px_100px_60px] gap-3 px-4 py-3 items-center">
            <p className="text-sm truncate">{result.input}</p>

            <Badge className={`${modeColors[result.mode]} text-[10px] w-fit`}>
              {result.mode}
            </Badge>

            <Badge
              className={`${ratingColors[result.verdict.rating]} text-[10px] w-fit`}
            >
              {result.verdict.rating.replace("_", " ")}
            </Badge>

            <span className="hidden md:block text-xs text-[var(--muted-foreground)]">
              {result.verdict.confidence}%
            </span>

            <span className="hidden md:block text-xs text-[var(--muted-foreground)]">
              {new Date(result.createdAt).toLocaleDateString()}
            </span>

            <span className="hidden md:block text-xs text-[var(--muted-foreground)]">
              {result.viewCount}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
