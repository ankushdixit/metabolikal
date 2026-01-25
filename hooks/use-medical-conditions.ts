"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { MedicalConditionRow, Gender } from "@/lib/database.types";

interface UseMedicalConditionsOptions {
  includeInactive?: boolean;
  gender?: Gender | null;
}

/**
 * Hook for fetching medical conditions from the database.
 * Returns active conditions sorted by display_order by default.
 * Can filter by gender restriction.
 */
export function useMedicalConditions(options: UseMedicalConditionsOptions = {}) {
  const { includeInactive = false, gender = null } = options;

  const listResult = useList<MedicalConditionRow>({
    resource: "medical_conditions",
    filters: includeInactive ? [] : [{ field: "is_active", operator: "eq", value: true }],
    sorters: [{ field: "display_order", order: "asc" }],
    queryOptions: {
      retry: false, // Don't retry if table doesn't exist
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  });

  const allConditions = listResult.query.data?.data ?? [];

  // Filter by gender restriction client-side for simpler API
  const filteredConditions = useMemo(() => {
    if (!gender) return allConditions;

    return allConditions.filter(
      (c: MedicalConditionRow) => c.gender_restriction === null || c.gender_restriction === gender
    );
  }, [allConditions, gender]);

  return {
    conditions: filteredConditions,
    allConditions,
    isLoading: listResult.query.isLoading,
    error: listResult.query.error,
    refetch: listResult.query.refetch,
  };
}

/**
 * Calculate total metabolic impact from selected condition slugs.
 * Returns the sum of impacts, capped at 30% to prevent unrealistic reductions.
 */
export function calculateMetabolicImpactFromConditions(
  selectedSlugs: string[],
  conditions: MedicalConditionRow[]
): number {
  // If "none" is selected, return 0
  if (selectedSlugs.includes("none")) {
    return 0;
  }

  const totalImpact = selectedSlugs.reduce((sum, slug) => {
    const condition = conditions.find((c) => c.slug === slug);
    return sum + (condition?.impact_percent ?? 0);
  }, 0);

  // Cap at 30% to prevent unrealistic metabolic reductions
  return Math.min(totalImpact, 30);
}

/**
 * Default medical conditions to use as fallback if database fetch fails.
 * These match the hardcoded values from use-calculator.ts
 */
export const DEFAULT_MEDICAL_CONDITIONS: Pick<
  MedicalConditionRow,
  "name" | "slug" | "impact_percent" | "gender_restriction"
>[] = [
  { name: "Hypothyroidism", slug: "hypothyroidism", impact_percent: 8, gender_restriction: null },
  { name: "PCOS", slug: "pcos", impact_percent: 10, gender_restriction: "female" },
  { name: "Type 2 Diabetes", slug: "type2-diabetes", impact_percent: 12, gender_restriction: null },
  {
    name: "Insulin Resistance",
    slug: "insulin-resistance",
    impact_percent: 10,
    gender_restriction: null,
  },
  { name: "Sleep Apnea", slug: "sleep-apnea", impact_percent: 7, gender_restriction: null },
  {
    name: "Metabolic Syndrome",
    slug: "metabolic-syndrome",
    impact_percent: 15,
    gender_restriction: null,
  },
  {
    name: "Thyroid Medication Managed",
    slug: "thyroid-managed",
    impact_percent: 3,
    gender_restriction: null,
  },
  {
    name: "Chronic Fatigue Syndrome",
    slug: "chronic-fatigue",
    impact_percent: 8,
    gender_restriction: null,
  },
  { name: "None of the above", slug: "none", impact_percent: 0, gender_restriction: null },
];
