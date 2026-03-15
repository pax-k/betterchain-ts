"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { HistoryResponse } from "@/lib/types";

export type HistoryFilters = {
  mode: string[];
  rating: string[];
  search: string;
  dateFrom: string;
  dateTo: string;
};

export type HistorySort = {
  field: "date" | "confidence" | "rating" | "views";
  order: "asc" | "desc";
};

export function useHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({
    mode: [],
    rating: [],
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [sort, setSort] = useState<HistorySort>({
    field: "date",
    order: "desc",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(filters.search);

  const fetchHistory = useCallback(
    async (currentSearch: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.mode.length > 0)
          params.set("mode", filters.mode.join(","));
        if (filters.rating.length > 0)
          params.set("rating", filters.rating.join(","));
        if (currentSearch) params.set("search", currentSearch);
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        params.set("sort", sort.field);
        params.set("order", sort.order);
        params.set("page", String(page));
        params.set("pageSize", "20");

        const response = await fetch(`/api/fact-check-db?${params}`);
        if (response.ok) {
          setData(await response.json());
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    },
    [filters.mode, filters.rating, filters.dateFrom, filters.dateTo, sort, page]
  );

  // Debounce search, immediate fetch for other changes
  useEffect(() => {
    if (searchRef.current !== filters.search) {
      searchRef.current = filters.search;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchHistory(filters.search);
      }, 300);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }
    fetchHistory(filters.search);
  }, [fetchHistory, filters.search]);

  // Reset to page 1 when filters or sort change
  const updateFilters = useCallback(
    (update: Partial<HistoryFilters>) => {
      setFilters((prev) => ({ ...prev, ...update }));
      setPage(1);
    },
    []
  );

  const updateSort = useCallback((update: Partial<HistorySort>) => {
    setSort((prev) => ({ ...prev, ...update }));
    setPage(1);
  }, []);

  return {
    data,
    isLoading,
    filters,
    setFilters: updateFilters,
    sort,
    setSort: updateSort,
    page,
    setPage,
  };
}
