"use client";

import { DomainAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const trustColors: Record<DomainAnalysis["overallTrustLevel"], string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
};

export function DomainCard({ domain }: { domain: DomainAnalysis }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            {domain.hasHttps ? (
              <span className="text-green-600" title="HTTPS">
                🔒
              </span>
            ) : (
              <span className="text-red-600" title="No HTTPS">
                ⚠
              </span>
            )}
            {domain.domain}
          </CardTitle>
          <Badge className={trustColors[domain.overallTrustLevel]}>
            {domain.overallTrustLevel} trust
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--muted-foreground)]">
            Authority Score
          </span>
          <span>{domain.authorityScore}/100</span>
        </div>
        <Progress value={domain.authorityScore} className="h-2" />

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {domain.domainAge && (
            <div>
              <span className="text-[var(--muted-foreground)]">Age: </span>
              {domain.domainAge}
            </div>
          )}
          {domain.country && (
            <div>
              <span className="text-[var(--muted-foreground)]">Country: </span>
              {domain.country}
            </div>
          )}
          <div>
            <span className="text-[var(--muted-foreground)]">Privacy: </span>
            {domain.hasPrivacyPolicy ? "Yes" : "No"}
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">About: </span>
            {domain.hasAboutPage ? "Yes" : "No"}
          </div>
        </div>

        {domain.knownBiasRating && (
          <div className="text-xs">
            <span className="text-[var(--muted-foreground)]">Bias: </span>
            <span className="font-medium">{domain.knownBiasRating}</span>
          </div>
        )}

        {domain.trustIndicators.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {domain.trustIndicators.map((t, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {domain.riskIndicators.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {domain.riskIndicators.map((r, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
