"use client";

import { useState, useCallback } from "react";
import type {
  Verdict,
  StreamEvent,
  AuthorInfo,
  DomainAnalysis,
  TrackerAnalysis,
} from "@/lib/types";

type FactCheckMode = "url" | "image" | "text" | "pdf";

type ClaimInfo = {
  text: string;
  index: number;
  evidenceSources: string[];
};

function extractInput(
  mode: FactCheckMode,
  payload: Record<string, unknown>
): string {
  switch (mode) {
    case "text":
      return (payload.text as string) ?? "";
    case "url":
      return (payload.url as string) ?? "";
    case "image":
      return (payload.imageUrl as string) ?? "";
    case "pdf":
      return (payload.pdfUrl as string) ?? "";
  }
}

export function useFactCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressDetail, setProgressDetail] = useState("");
  const [claims, setClaims] = useState<ClaimInfo[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null);
  const [domainAnalysis, setDomainAnalysis] =
    useState<DomainAnalysis | null>(null);
  const [trackerAnalysis, setTrackerAnalysis] =
    useState<TrackerAnalysis | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress("");
    setProgressDetail("");
    setClaims([]);
    setVerdict(null);
    setError(null);
    setAuthorInfo(null);
    setDomainAnalysis(null);
    setTrackerAnalysis(null);
  }, []);

  const submit = useCallback(
    async (mode: FactCheckMode, payload: Record<string, unknown>) => {
      setIsLoading(true);
      setVerdict(null);
      setError(null);
      setClaims([]);
      setProgress("");
      setProgressDetail("");
      setAuthorInfo(null);
      setDomainAnalysis(null);
      setTrackerAnalysis(null);

      // Local accumulators for auto-save (state setters are async)
      let receivedVerdict: Verdict | null = null;
      let receivedAuthor: AuthorInfo | null = null;
      let receivedDomain: DomainAnalysis | null = null;
      let receivedTrackers: TrackerAnalysis | null = null;

      try {
        const response = await fetch(`/api/check-${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          throw new Error(
            errBody?.error || `Request failed with status ${response.status}`
          );
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]")
              continue;

            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case "progress":
                  setProgress(event.step);
                  setProgressDetail(event.detail ?? "");
                  break;
                case "claim":
                  setClaims((prev) => [
                    ...prev,
                    {
                      text: event.data.text,
                      index: event.data.index,
                      evidenceSources: [],
                    },
                  ]);
                  break;
                case "evidence":
                  setClaims((prev) =>
                    prev.map((c) =>
                      c.index === event.data.claimIndex
                        ? {
                            ...c,
                            evidenceSources: [
                              ...c.evidenceSources,
                              event.data.source,
                            ],
                          }
                        : c
                    )
                  );
                  break;
                case "verdict":
                  receivedVerdict = event.data;
                  setVerdict(event.data);
                  break;
                case "error":
                  setError(event.message);
                  break;
                case "author":
                  receivedAuthor = event.data;
                  setAuthorInfo(event.data);
                  break;
                case "domain":
                  receivedDomain = event.data;
                  setDomainAnalysis(event.data);
                  break;
                case "trackers":
                  receivedTrackers = event.data;
                  setTrackerAnalysis(event.data);
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Auto-save result to history (fire-and-forget)
        if (receivedVerdict) {
          fetch("/api/fact-check-db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode,
              input: extractInput(mode, payload),
              verdict: receivedVerdict,
              authorInfo: receivedAuthor,
              domainAnalysis: receivedDomain,
              trackerAnalysis: receivedTrackers,
            }),
          }).catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    progress,
    progressDetail,
    claims,
    verdict,
    error,
    authorInfo,
    domainAnalysis,
    trackerAnalysis,
    submit,
    reset,
  };
}
