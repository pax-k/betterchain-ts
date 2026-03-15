"use client";

import { AITextDetection } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AITextDetectionCard({
  detection,
}: {
  detection: AITextDetection;
}) {
  const color = detection.isLikelyAIGenerated
    ? "bg-orange-100 text-orange-800"
    : "bg-green-100 text-green-800";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">AI Text Detection</CardTitle>
          <Badge className={color}>
            {detection.isLikelyAIGenerated
              ? "Likely AI-Generated"
              : "Likely Human-Written"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--muted-foreground)]">Confidence</span>
          <span>{detection.confidence}%</span>
        </div>
        <Progress value={detection.confidence} className="h-2" />

        <p className="text-xs text-[var(--muted-foreground)] pt-1">
          {detection.summary}
        </p>

        {detection.indicators.length > 0 && (
          <div className="pt-1">
            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Indicators
            </p>
            <div className="flex flex-wrap gap-1">
              {detection.indicators.map((indicator, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] rounded"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
