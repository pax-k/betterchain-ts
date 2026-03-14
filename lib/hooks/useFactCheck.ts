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
                  setVerdict(event.data);
                  break;
                case "error":
                  setError(event.message);
                  break;
                case "author":
                  setAuthorInfo(event.data);
                  break;
                case "domain":
                  setDomainAnalysis(event.data);
                  break;
                case "trackers":
                  setTrackerAnalysis(event.data);
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
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
