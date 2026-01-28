"use client";

import { useList } from "@refinedev/core";
import type { MealTypeRow } from "@/lib/database.types";

interface UseMealTypesOptions {
  includeInactive?: boolean;
}

/**
 * Hook for fetching meal types from the database.
 * Returns active meal types sorted by display_order by default.
 *
 * IMPORTANT: This hook expects meal types to exist in the database.
 * Run supabase/seed.sql to populate the meal_types table.
 * There is NO fallback - if the database fetch fails, an error will be returned.
 */
export function useMealTypes(options: UseMealTypesOptions = {}) {
  const { includeInactive = false } = options;

  const listResult = useList<MealTypeRow>({
    resource: "meal_types",
    filters: includeInactive ? [] : [{ field: "is_active", operator: "eq", value: true }],
    sorters: [{ field: "display_order", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      retry: 1, // Retry once
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  });

  return {
    mealTypes: listResult.query.data?.data ?? [],
    isLoading: listResult.query.isLoading,
    error: listResult.query.error,
    refetch: listResult.query.refetch,
  };
}
