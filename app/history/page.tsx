"use client";

import { useHistory, HistorySort } from "@/lib/hooks/useHistory";
import { HistoryTable } from "@/components/HistoryTable";
import { Badge } from "@/components/ui/badge";

const modes = ["text", "url", "image", "pdf"] as const;
const ratings = [
  "TRUE",
  "FALSE",
  "MISLEADING",
  "UNVERIFIED",
  "PARTIALLY_TRUE",
] as const;

const sortOptions: { label: string; field: HistorySort["field"] }[] = [
  { label: "Date", field: "date" },
  { label: "Confidence", field: "confidence" },
  { label: "Rating", field: "rating" },
  { label: "Views", field: "views" },
];

export default function HistoryPage() {
  const { data, isLoading, filters, setFilters, sort, setSort, page, setPage } =
    useHistory();

  const toggleFilter = (
    key: "mode" | "rating",
    value: string
  ) => {
    const current = filters[key];
    setFilters({
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold">Fact-Check History</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by keyword..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)] w-12">
            Mode
          </span>
          {modes.map((m) => (
            <button key={m} onClick={() => toggleFilter("mode", m)}>
              <Badge
                className={
                  filters.mode.includes(m)
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }
              >
                {m}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)] w-12">
            Rating
          </span>
          {ratings.map((r) => (
            <button key={r} onClick={() => toggleFilter("rating", r)}>
              <Badge
                className={
                  filters.rating.includes(r)
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }
              >
                {r.replace("_", " ")}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-[var(--muted-foreground)] w-12">
            Date
          </span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="rounded border border-[var(--border)] px-2 py-1 text-xs"
          />
          <span className="text-xs text-[var(--muted-foreground)]">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="rounded border border-[var(--border)] px-2 py-1 text-xs"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          Sort by
        </span>
        {sortOptions.map((opt) => (
          <button
            key={opt.field}
            onClick={() =>
              setSort(
                sort.field === opt.field
                  ? { order: sort.order === "asc" ? "desc" : "asc" }
                  : { field: opt.field, order: "desc" }
              )
            }
            className={`text-xs px-2 py-1 rounded border ${
              sort.field === opt.field
                ? "border-[var(--foreground)] font-medium"
                : "border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            {opt.label}
            {sort.field === opt.field && (sort.order === "asc" ? " ↑" : " ↓")}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : (
        <>
          <HistoryTable results={data?.results ?? []} />

          {/* Pagination */}
          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="text-sm px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">
                Page {data.page} of {Math.ceil(data.total / data.pageSize)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.total / data.pageSize)}
                className="text-sm px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
