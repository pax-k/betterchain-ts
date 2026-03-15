"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { StoredFactCheck } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VerdictCard } from "@/components/VerdictCard";
import { EvidenceList } from "@/components/EvidenceList";
import { DomainCard } from "@/components/DomainCard";
import { AuthorCard } from "@/components/AuthorCard";
import { TrackerCard } from "@/components/TrackerCard";
import { ImageHistoryCard } from "@/components/ImageHistoryCard";
import { AITextDetectionCard } from "@/components/AITextDetectionCard";
import { PerspectiveCard } from "@/components/PerspectiveCard";

const modeColors: Record<string, string> = {
  text: "bg-blue-100 text-blue-800",
  url: "bg-purple-100 text-purple-800",
  image: "bg-pink-100 text-pink-800",
  pdf: "bg-amber-100 text-amber-800",
};

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<StoredFactCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fact-check-db?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          setError("Not found");
          return;
        }
        setResult(await res.json());
      } catch {
        setError("Failed to load");
      }
    }
    load();
  }, [id]);

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/history"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          ← Back to History
        </Link>
        <p className="mt-8 text-center text-[var(--muted-foreground)]">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/history"
        className="text-sm text-[var(--primary)] hover:underline"
      >
        ← Back to History
      </Link>

      {/* Meta */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={modeColors[result.mode]}>{result.mode}</Badge>
        <span className="text-xs text-[var(--muted-foreground)]">
          {new Date(result.createdAt).toLocaleString()}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {result.viewCount} view{result.viewCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-1 text-[var(--muted-foreground)]">
            Input
          </p>
          <p className="text-sm whitespace-pre-wrap break-words">
            {result.input}
          </p>
        </CardContent>
      </Card>

      {/* Source analysis cards */}
      {result.domainAnalysis && <DomainCard domain={result.domainAnalysis} />}
      {result.authorInfo && <AuthorCard author={result.authorInfo} />}
      {result.imageHistory && (
        <ImageHistoryCard history={result.imageHistory} />
      )}
      {result.aiTextDetection && (
        <AITextDetectionCard detection={result.aiTextDetection} />
      )}
      {result.trackerAnalysis && (
        <TrackerCard trackers={result.trackerAnalysis} />
      )}
      {result.perspectives && result.perspectives.length > 0 && (
        <PerspectiveCard perspectives={result.perspectives} />
      )}

      {/* Verdict + Evidence */}
      <VerdictCard verdict={result.verdict} />
      <EvidenceList verdict={result.verdict} />
    </main>
  );
}
