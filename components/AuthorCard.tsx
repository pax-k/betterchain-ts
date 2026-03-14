"use client";

import { AuthorInfo } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AuthorCard({ author }: { author: AuthorInfo }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Author</CardTitle>
          {author.name ? (
            <Badge
              className={
                author.isVerified
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {author.isVerified ? "Verified" : "Unverified"}
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              No Attribution
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">
          {author.name ?? "Anonymous / Unattributed"}
        </p>

        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--muted-foreground)]">Credibility</span>
          <span>{author.credibilityScore}/100</span>
        </div>
        <Progress value={author.credibilityScore} className="h-2" />

        {author.credentials.length > 0 && (
          <div className="pt-1">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">
              Credentials
            </p>
            <div className="flex flex-wrap gap-1">
              {author.credentials.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {author.affiliations.length > 0 && (
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">
              Affiliations
            </p>
            <div className="flex flex-wrap gap-1">
              {author.affiliations.map((a, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] rounded"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)] pt-1">
          {author.credibilityAssessment}
        </p>
      </CardContent>
    </Card>
  );
}
