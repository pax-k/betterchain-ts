"use client";

import { PerspectiveGroup } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const leaningConfig: Record<
  PerspectiveGroup["leaning"],
  { label: string; color: string }
> = {
  left: { label: "Left-Leaning", color: "bg-blue-100 text-blue-800" },
  center: { label: "Center", color: "bg-gray-100 text-gray-800" },
  right: { label: "Right-Leaning", color: "bg-red-100 text-red-800" },
  unknown: { label: "Unrated", color: "bg-slate-100 text-slate-600" },
};

export function PerspectiveCard({
  perspectives,
}: {
  perspectives: PerspectiveGroup[];
}) {
  // Only show if there's meaningful grouping (at least 2 non-unknown groups)
  const ratedGroups = perspectives.filter((p) => p.leaning !== "unknown");
  if (ratedGroups.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Multi-Perspective View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["left", "center", "right"] as const).map((leaning) => {
            const group = perspectives.find((p) => p.leaning === leaning);
            const config = leaningConfig[leaning];

            return (
              <div
                key={leaning}
                className="border border-[var(--border)] rounded-lg p-3 space-y-2"
              >
                <Badge className={`${config.color} text-[10px]`}>
                  {config.label}
                </Badge>

                {group && group.sources.length > 0 ? (
                  <div className="space-y-1.5">
                    {group.sources.slice(0, 4).map((source, i) => (
                      <div key={i}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--primary)] hover:underline line-clamp-2"
                        >
                          {source.title}
                        </a>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {source.domain}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    No sources from this perspective
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Unknown sources */}
        {perspectives.some(
          (p) => p.leaning === "unknown" && p.sources.length > 0
        ) && (
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
            +{" "}
            {perspectives.find((p) => p.leaning === "unknown")?.sources
              .length ?? 0}{" "}
            sources from unrated domains
          </p>
        )}
      </CardContent>
    </Card>
  );
}
