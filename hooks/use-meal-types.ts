"use client";

import { useList } from "@refinedev/core";
import type { MealTypeRow } from "@/lib/database.types";

interface UseMealTypesOptions {
  includeInactive?: boolean;
}

/**
 * Hook for fetching meal types from the database.
 * Returns active meal types sorted by display_order by default.
 */
export function useMealTypes(options: UseMealTypesOptions = {}) {
  const { includeInactive = false } = options;

  const listResult = useList<MealTypeRow>({
    resource: "meal_types",
    filters: includeInactive ? [] : [{ field: "is_active", operator: "eq", value: true }],
    sorters: [{ field: "display_order", order: "asc" }],
    queryOptions: {
      retry: false, // Don't retry if table doesn't exist
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

/**
 * Default meal types to use as fallback if database fetch fails.
 * These match the hardcoded values from validations.ts
 */
export const DEFAULT_MEAL_TYPES: Pick<MealTypeRow, "name" | "slug">[] = [
  { name: "Breakfast", slug: "breakfast" },
  { name: "Lunch", slug: "lunch" },
  { name: "Dinner", slug: "dinner" },
  { name: "Snack", slug: "snack" },
  { name: "Pre-Workout", slug: "pre-workout" },
  { name: "Post-Workout", slug: "post-workout" },
];
