"use client";

import { Verdict } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EvidenceList({ verdict }: { verdict: Verdict }) {
  if (!verdict.claims || verdict.claims.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Claim Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {verdict.claims.map((claim, i) => (
          <div
            key={i}
            className="border border-[var(--border)] rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium flex-1">{claim.text}</p>
              <Badge
                variant="outline"
                className={`shrink-0 ${statusColor(claim.status)}`}
              >
                {claim.status}
              </Badge>
            </div>

            {claim.evidence.length > 0 && (
              <ul className="space-y-1 pt-2 border-t border-[var(--border)]">
                {claim.evidence.map((source, j) => (
                  <li key={j} className="text-xs flex items-start gap-1">
                    <span className="text-[var(--muted-foreground)]">•</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("support")) return "text-green-700 border-green-300";
  if (s.includes("refute")) return "text-red-700 border-red-300";
  if (s.includes("partial")) return "text-yellow-700 border-yellow-300";
  return "text-gray-700 border-gray-300";
}
