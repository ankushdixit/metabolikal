"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { MedicalConditionRow, Gender, CalculatorSettingsRow } from "@/lib/database.types";
import { DEFAULT_CALCULATOR_SETTINGS } from "./use-calculator-settings";

interface UseMedicalConditionsOptions {
  includeInactive?: boolean;
  gender?: Gender | null;
}

/**
 * Hook for fetching medical conditions from the database.
 * Returns active conditions sorted by display_order by default.
 * Can filter by gender restriction.
 *
 * IMPORTANT: This hook expects medical conditions to exist in the database.
 * Run supabase/seed.sql to populate the medical_conditions table.
 * There is NO fallback - if the database fetch fails, an error will be returned.
 */
export function useMedicalConditions(options: UseMedicalConditionsOptions = {}) {
  const { includeInactive = false, gender = null } = options;

  const listResult = useList<MedicalConditionRow>({
    resource: "medical_conditions",
    filters: includeInactive ? [] : [{ field: "is_active", operator: "eq", value: true }],
    sorters: [{ field: "display_order", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      retry: 1, // Retry once
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
 * Returns the sum of impacts, capped at the configurable maximum (default 25%).
 *
 * @param selectedSlugs - Array of condition slugs selected by the user
 * @param conditions - Array of MedicalConditionRow from the database
 * @param settings - Optional calculator settings for configurable cap
 */
export function calculateMetabolicImpactFromConditions(
  selectedSlugs: string[],
  conditions: MedicalConditionRow[],
  settings?: CalculatorSettingsRow
): number {
  // If "none" is selected or no conditions selected, return 0
  if (selectedSlugs.includes("none") || selectedSlugs.length === 0) {
    return 0;
  }

  const totalImpact = selectedSlugs.reduce((sum, slug) => {
    const condition = conditions.find((c) => c.slug === slug);
    return sum + (condition?.impact_percent ?? 0);
  }, 0);

  // Cap at configurable maximum (default 25% per documentation)
  const impactCap =
    settings?.metabolic_impact_cap ?? DEFAULT_CALCULATOR_SETTINGS.metabolic_impact_cap;
  return Math.min(totalImpact, impactCap);
}
