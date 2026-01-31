"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { CalculatorSettingsRow, HealthScoreTier, Gender } from "@/lib/database.types";
import type { ActivityLevel, Goal } from "./use-calculator";

/**
 * Default calculator settings (used while loading or if fetch fails)
 * These match the database defaults from the migration
 */
export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettingsRow = {
  id: "default",

  // Activity Multipliers
  activity_sedentary: 1.2,
  activity_lightly_active: 1.375,
  activity_moderately_active: 1.55,
  activity_very_active: 1.725,
  activity_extremely_active: 1.9,

  // Goal Adjustments (per documentation)
  goal_fat_loss_adjustment: -550,
  goal_maintain_adjustment: 0,
  goal_muscle_gain_adjustment: 475,

  // Protein Ratios
  protein_fat_loss: 2.0,
  protein_maintain: 1.8,
  protein_muscle_gain: 2.2,

  // Health Score Configuration
  health_score_lifestyle_weight: 60,
  health_score_physical_weight: 40,
  health_score_calorie_bonus: 5,
  health_score_calorie_min: 1200,
  health_score_calorie_max: 3500,

  // Metabolic Impact Cap (per documentation: 25%)
  metabolic_impact_cap: 25,

  // Lifestyle Multiplier
  lifestyle_multiplier_enabled: true,
  lifestyle_multiplier_divisor: 500,

  // Physical Score Configuration
  physical_score_base: 75,
  physical_score_bmi_optimal: 15,
  physical_score_bmi_acceptable: 10,
  physical_score_bmi_outside: 5,
  physical_score_bodyfat_optimal: 10,
  physical_score_bodyfat_acceptable: 7,
  physical_score_bodyfat_outside: 3,

  // BMI Range Definitions
  bmi_optimal_min: 18.5,
  bmi_optimal_max: 24.9,
  bmi_acceptable_min: 17.0,
  bmi_acceptable_max: 29.9,

  // Body Fat Range Definitions - Male
  bodyfat_male_optimal_min: 10,
  bodyfat_male_optimal_max: 20,
  bodyfat_male_acceptable_min: 8,
  bodyfat_male_acceptable_max: 24,

  // Body Fat Range Definitions - Female
  bodyfat_female_optimal_min: 18,
  bodyfat_female_optimal_max: 28,
  bodyfat_female_acceptable_min: 15,
  bodyfat_female_acceptable_max: 32,

  // Health Score Tiers
  health_score_tiers: [
    {
      name: "Elite Metabolic Health",
      description: "Outstanding foundation with peak performance potential",
      minScore: 86,
      maxScore: 100,
    },
    {
      name: "Good Metabolic Health",
      description: "Solid foundation with room for optimization",
      minScore: 71,
      maxScore: 85,
    },
    {
      name: "Moderate Metabolic Health",
      description: "Functional baseline with clear improvement opportunities",
      minScore: 51,
      maxScore: 70,
    },
    {
      name: "Needs Attention",
      description: "Significant optimization potential to unlock your metabolism",
      minScore: 0,
      maxScore: 50,
    },
  ],

  // Audit
  updated_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Hook return type with settings and helper functions
 */
export interface UseCalculatorSettingsResult {
  settings: CalculatorSettingsRow;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  // Helper functions
  getActivityMultiplier: (level: ActivityLevel) => number;
  getGoalAdjustment: (goal: Goal) => number;
  getProteinRatio: (goal: Goal) => number;
  getHealthScoreTier: (score: number) => HealthScoreTier;
  calculatePhysicalScore: (
    bmi: number,
    bodyFatPercent: number | undefined,
    gender: Gender
  ) => number;
  calculateLifestyleMultiplier: (lifestyleScore: number) => number;
}

/**
 * Hook for fetching and using calculator settings.
 * Provides settings with caching and helper functions for calculations.
 *
 * Settings are fetched from the singleton calculator_settings table.
 * Uses defaults while loading to ensure calculator works immediately.
 */
export function useCalculatorSettings(): UseCalculatorSettingsResult {
  // Fetch the singleton settings row using useList (singleton table has only one row)
  const settingsQuery = useList<CalculatorSettingsRow>({
    resource: "calculator_settings",
    pagination: { mode: "off" },
    queryOptions: {
      retry: 1,
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    },
  });

  const data = settingsQuery.query.data;
  const isLoading = settingsQuery.query.isLoading;
  const error = settingsQuery.query.error;
  const refetch = settingsQuery.query.refetch;

  // Use fetched settings (first row) or fall back to defaults
  const settings = useMemo(() => {
    if (data?.data && data.data.length > 0) {
      return data.data[0];
    }
    return DEFAULT_CALCULATOR_SETTINGS;
  }, [data]);

  /**
   * Get activity level multiplier for TDEE calculation
   */
  const getActivityMultiplier = useMemo(() => {
    return (level: ActivityLevel): number => {
      const multipliers: Record<ActivityLevel, number> = {
        sedentary: settings.activity_sedentary,
        lightly_active: settings.activity_lightly_active,
        moderately_active: settings.activity_moderately_active,
        very_active: settings.activity_very_active,
        extremely_active: settings.activity_extremely_active,
      };
      return multipliers[level];
    };
  }, [settings]);

  /**
   * Get calorie adjustment for goal
   */
  const getGoalAdjustment = useMemo(() => {
    return (goal: Goal): number => {
      const adjustments: Record<Goal, number> = {
        fat_loss: settings.goal_fat_loss_adjustment,
        maintain: settings.goal_maintain_adjustment,
        muscle_gain: settings.goal_muscle_gain_adjustment,
      };
      return adjustments[goal];
    };
  }, [settings]);

  /**
   * Get protein ratio (g per kg) for goal
   */
  const getProteinRatio = useMemo(() => {
    return (goal: Goal): number => {
      const ratios: Record<Goal, number> = {
        fat_loss: settings.protein_fat_loss,
        maintain: settings.protein_maintain,
        muscle_gain: settings.protein_muscle_gain,
      };
      return ratios[goal];
    };
  }, [settings]);

  /**
   * Get health score tier based on score value
   */
  const getHealthScoreTier = useMemo(() => {
    return (score: number): HealthScoreTier => {
      const tier = settings.health_score_tiers.find(
        (t: HealthScoreTier) => score >= t.minScore && score <= t.maxScore
      );
      return tier || settings.health_score_tiers[settings.health_score_tiers.length - 1];
    };
  }, [settings]);

  /**
   * Calculate physical score based on BMI and body fat percentage
   * Per documentation:
   * Physical Score = Base (75) + BMI Points + Body Fat Points
   */
  const calculatePhysicalScore = useMemo(() => {
    return (bmi: number, bodyFatPercent: number | undefined, gender: Gender): number => {
      let score = settings.physical_score_base;

      // BMI Points
      if (bmi >= settings.bmi_optimal_min && bmi <= settings.bmi_optimal_max) {
        score += settings.physical_score_bmi_optimal;
      } else if (bmi >= settings.bmi_acceptable_min && bmi <= settings.bmi_acceptable_max) {
        score += settings.physical_score_bmi_acceptable;
      } else {
        score += settings.physical_score_bmi_outside;
      }

      // Body Fat Points (if provided)
      if (bodyFatPercent !== undefined) {
        if (gender === "male") {
          if (
            bodyFatPercent >= settings.bodyfat_male_optimal_min &&
            bodyFatPercent <= settings.bodyfat_male_optimal_max
          ) {
            score += settings.physical_score_bodyfat_optimal;
          } else if (
            bodyFatPercent >= settings.bodyfat_male_acceptable_min &&
            bodyFatPercent <= settings.bodyfat_male_acceptable_max
          ) {
            score += settings.physical_score_bodyfat_acceptable;
          } else {
            score += settings.physical_score_bodyfat_outside;
          }
        } else {
          // Female
          if (
            bodyFatPercent >= settings.bodyfat_female_optimal_min &&
            bodyFatPercent <= settings.bodyfat_female_optimal_max
          ) {
            score += settings.physical_score_bodyfat_optimal;
          } else if (
            bodyFatPercent >= settings.bodyfat_female_acceptable_min &&
            bodyFatPercent <= settings.bodyfat_female_acceptable_max
          ) {
            score += settings.physical_score_bodyfat_acceptable;
          } else {
            score += settings.physical_score_bodyfat_outside;
          }
        }
      }

      return Math.min(100, score);
    };
  }, [settings]);

  /**
   * Calculate lifestyle multiplier for TDEE
   * Per documentation: 1 + ((lifestyleScore - 50) / divisor)
   * - Score 80: 1.06 (+6% boost)
   * - Score 50: 1.00 (no change)
   * - Score 30: 0.96 (-4% reduction)
   */
  const calculateLifestyleMultiplier = useMemo(() => {
    return (lifestyleScore: number): number => {
      if (!settings.lifestyle_multiplier_enabled) {
        return 1;
      }
      return 1 + (lifestyleScore - 50) / settings.lifestyle_multiplier_divisor;
    };
  }, [settings]);

  return {
    settings,
    isLoading,
    error: error as Error | null,
    refetch,
    getActivityMultiplier,
    getGoalAdjustment,
    getProteinRatio,
    getHealthScoreTier,
    calculatePhysicalScore,
    calculateLifestyleMultiplier,
  };
}

/**
 * Non-hook utility to get default settings for server-side or build-time use
 */
export function getDefaultCalculatorSettings(): CalculatorSettingsRow {
  return DEFAULT_CALCULATOR_SETTINGS;
}
