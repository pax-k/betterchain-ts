"use client";

import { useState } from "react";
import { TrackerAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const riskColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function TrackerCard({ trackers }: { trackers: TrackerAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  // Group trackers by category
  const grouped = new Map<string, string[]>();
  for (const t of trackers.trackers) {
    const list = grouped.get(t.category) ?? [];
    list.push(t.name);
    grouped.set(t.category, list);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Trackers & Ads</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">
              {trackers.totalTrackers} trackers ·{" "}
              {trackers.totalAdNetworks} ad networks
            </span>
            <Badge className={riskColors[trackers.riskLevel]}>
              {trackers.riskLevel} risk
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-[var(--muted-foreground)]">
          {trackers.summary}
        </p>

        {trackers.trackers.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}

        {expanded && (
          <div className="space-y-2 pt-1">
            {Array.from(grouped.entries()).map(([category, names]) => (
              <div key={category}>
                <p className="text-[10px] font-medium uppercase text-[var(--muted-foreground)] mb-1">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {names.map((name, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] rounded"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {trackers.adNetworks.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase text-[var(--muted-foreground)] mb-1">
                  Ad Networks
                </p>
                <div className="flex flex-wrap gap-1">
                  {trackers.adNetworks.map((name, i) => (
                    <span
                      key={i}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        name.includes("misinformation")
                          ? "bg-red-50 text-red-700"
                          : "bg-[var(--muted)]"
                      }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
