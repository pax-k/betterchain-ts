"use client";

type ClaimInfo = {
  text: string;
  index: number;
  evidenceSources: string[];
};

export function ClaimTimeline({
  claims,
  isLoading,
}: {
  claims: ClaimInfo[];
  isLoading: boolean;
}) {
  if (claims.length === 0) return null;

  return (
    <div className="space-y-0">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
        Claims Found
      </h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]" />

        <div className="space-y-3">
          {claims.map((claim, i) => {
            const hasEvidence = claim.evidenceSources.length > 0;
            const isChecking = isLoading && !hasEvidence;

            return (
              <div key={i} className="relative pl-8">
                {/* Node dot */}
                <div
                  className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                    isChecking
                      ? "border-blue-400 bg-blue-100 animate-pulse"
                      : hasEvidence
                        ? "border-green-400 bg-green-100"
                        : "border-gray-300 bg-gray-100"
                  }`}
                />

                <div className="bg-[var(--muted)] rounded-md p-3">
                  <p className="text-sm">{claim.text}</p>
                  {hasEvidence && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {claim.evidenceSources.slice(0, 3).map((source, j) => (
                        <span
                          key={j}
                          className="text-[10px] px-1.5 py-0.5 bg-white rounded text-[var(--muted-foreground)] truncate max-w-[200px]"
                        >
                          {source}
                        </span>
                      ))}
                      {claim.evidenceSources.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-[var(--muted-foreground)]">
                          +{claim.evidenceSources.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
