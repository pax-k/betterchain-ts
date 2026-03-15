"use client";

import { Verdict } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ratingConfig: Record<
  Verdict["rating"],
  { label: string; color: string; bg: string }
> = {
  TRUE: { label: "True", color: "text-green-800", bg: "bg-green-100" },
  FALSE: { label: "False", color: "text-red-800", bg: "bg-red-100" },
  MISLEADING: {
    label: "Misleading",
    color: "text-orange-800",
    bg: "bg-orange-100",
  },
  UNVERIFIED: {
    label: "Unverified",
    color: "text-gray-800",
    bg: "bg-gray-100",
  },
  PARTIALLY_TRUE: {
    label: "Partially True",
    color: "text-yellow-800",
    bg: "bg-yellow-100",
  },
};

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const config = ratingConfig[verdict.rating];

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Verdict</CardTitle>
          <Badge
            className={`${config.bg} ${config.color} text-sm px-3 py-1 font-bold`}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[var(--muted-foreground)]">Confidence</span>
            <span className="font-medium">{verdict.confidence}%</span>
          </div>
          <Progress value={verdict.confidence} />
        </div>

        <p className="text-sm leading-relaxed">{verdict.summary}</p>

        {verdict.sources.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Sources</h4>
            <ul className="space-y-1">
              {verdict.sources.map((source, i) => (
                <li key={i} className="text-xs">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline"
                  >
                    {source.title}
                  </a>
                  {source.publishedAt && (
                    <span className="text-[var(--muted-foreground)] ml-2">
                      {source.publishedAt}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
