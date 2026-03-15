"use client";

import { useFactCheck } from "@/lib/hooks/useFactCheck";
import { FactCheckForm } from "@/components/FactCheckForm";
import { VerdictCard } from "@/components/VerdictCard";
import { EvidenceList } from "@/components/EvidenceList";
import { ClaimTimeline } from "@/components/ClaimTimeline";
import { AuthorCard } from "@/components/AuthorCard";
import { DomainCard } from "@/components/DomainCard";
import { TrackerCard } from "@/components/TrackerCard";
import { ImageHistoryCard } from "@/components/ImageHistoryCard";
import { AITextDetectionCard } from "@/components/AITextDetectionCard";
import { PerspectiveCard } from "@/components/PerspectiveCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const {
    isLoading,
    progress,
    progressDetail,
    claims,
    verdict,
    error,
    authorInfo,
    domainAnalysis,
    trackerAnalysis,
    imageHistory,
    aiTextDetection,
    perspectives,
    submit,
  } = useFactCheck();

  const hasResults =
    isLoading ||
    claims.length > 0 ||
    verdict ||
    error ||
    domainAnalysis ||
    authorInfo ||
    trackerAnalysis ||
    imageHistory ||
    aiTextDetection ||
    perspectives;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">FactCheck</h1>
          <p className="text-[var(--muted-foreground)] text-sm max-w-lg mx-auto">
            AI-powered fact checking. Verify claims, articles, images, and PDFs
            using multiple sources and advanced analysis.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FactCheckForm onSubmit={submit} isLoading={isLoading} />
      </div>

      {/* Results */}
      {hasResults && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          {/* Progress */}
          {isLoading && progress && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted)] rounded-full">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                <span className="text-sm font-medium">{progress}</span>
              </div>
              {progressDetail && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {progressDetail}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Source Analysis Cards */}
          {(domainAnalysis ||
            authorInfo ||
            trackerAnalysis ||
            imageHistory ||
            aiTextDetection) && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
                Source Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domainAnalysis && <DomainCard domain={domainAnalysis} />}
                {authorInfo && <AuthorCard author={authorInfo} />}
                {imageHistory && <ImageHistoryCard history={imageHistory} />}
                {aiTextDetection && (
                  <AITextDetectionCard detection={aiTextDetection} />
                )}
              </div>
              {trackerAnalysis && <TrackerCard trackers={trackerAnalysis} />}
            </div>
          )}

          {/* Multi-Perspective View */}
          {perspectives && perspectives.length > 0 && (
            <div className="mb-6">
              <PerspectiveCard perspectives={perspectives} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Claims Timeline */}
            <div>
              <ClaimTimeline claims={claims} isLoading={isLoading} />
            </div>

            {/* Right: Verdict */}
            <div>
              {verdict ? (
                <VerdictCard verdict={verdict} />
              ) : (
                isLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Evidence */}
          {verdict && (
            <div className="mt-6">
              <EvidenceList verdict={verdict} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
