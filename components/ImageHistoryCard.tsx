"use client";

import { ImageHistory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ImageHistoryCard({ history }: { history: ImageHistory }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Image History</CardTitle>
          <Badge className="bg-purple-100 text-purple-800">
            {history.totalResults} match{history.totalResults !== 1 ? "es" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.firstSeen && (
          <p className="text-xs text-[var(--muted-foreground)]">
            First seen: <span className="font-medium">{history.firstSeen}</span>
          </p>
        )}

        {history.matches.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Found on:
            </p>
            {history.matches.slice(0, 8).map((match, i) => (
              <a
                key={i}
                href={match.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[var(--primary)] hover:underline truncate"
              >
                {match.domain}
              </a>
            ))}
          </div>
        )}

        {history.totalResults === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            No prior appearances found online. This may be an original or
            recently created image.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
