"use client";

import { useMemo } from "react";
import type { CalculatorSettingsRow } from "@/lib/database.types";
import { DEFAULT_CALCULATOR_SETTINGS } from "./use-calculator-settings";

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";
export type Goal = "fat_loss" | "maintain" | "muscle_gain";

/**
 * Activity level multipliers for TDEE calculation.
 * Default values - can be overridden by admin-configured settings.
 * @deprecated Use getActivityMultiplier() from useCalculatorSettings instead
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; multiplier: number }> = {
  sedentary: { label: "Sedentary (little or no exercise)", multiplier: 1.2 },
  lightly_active: { label: "Lightly Active (light exercise 1-3 days/week)", multiplier: 1.375 },
  moderately_active: {
    label: "Moderately Active (moderate exercise 3-5 days/week)",
    multiplier: 1.55,
  },
  very_active: { label: "Very Active (hard exercise 6-7 days/week)", multiplier: 1.725 },
  extremely_active: {
    label: "Extremely Active (very hard exercise, physical job)",
    multiplier: 1.9,
  },
};

/**
 * Goal calorie adjustments relative to TDEE.
 * Default values - can be overridden by admin-configured settings.
 * @deprecated Use getGoalAdjustment() from useCalculatorSettings instead
 */
export const GOAL_ADJUSTMENTS: Record<Goal, { label: string; adjustment: number }> = {
  fat_loss: { label: "Fat Loss", adjustment: -550 },
  maintain: { label: "Maintain Weight", adjustment: 0 },
  muscle_gain: { label: "Muscle Gain", adjustment: 475 },
};

/**
 * Get activity multiplier from settings
 */
export function getActivityMultiplierFromSettings(
  level: ActivityLevel,
  settings: CalculatorSettingsRow
): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: Number(settings.activity_sedentary),
    lightly_active: Number(settings.activity_lightly_active),
    moderately_active: Number(settings.activity_moderately_active),
    very_active: Number(settings.activity_very_active),
    extremely_active: Number(settings.activity_extremely_active),
  };
  return multipliers[level];
}

/**
 * Get goal adjustment from settings
 */
export function getGoalAdjustmentFromSettings(goal: Goal, settings: CalculatorSettingsRow): number {
  const adjustments: Record<Goal, number> = {
    fat_loss: settings.goal_fat_loss_adjustment,
    maintain: settings.goal_maintain_adjustment,
    muscle_gain: settings.goal_muscle_gain_adjustment,
  };
  return adjustments[goal];
}

/**
 * Get protein ratio from settings
 */
export function getProteinRatioFromSettings(goal: Goal, settings: CalculatorSettingsRow): number {
  const ratios: Record<Goal, number> = {
    fat_loss: Number(settings.protein_fat_loss),
    maintain: Number(settings.protein_maintain),
    muscle_gain: Number(settings.protein_muscle_gain),
  };
  return ratios[goal];
}

/**
 * Calculate lifestyle multiplier for TDEE
 * Per documentation: 1 + ((lifestyleScore - 50) / divisor)
 */
export function calculateLifestyleMultiplier(
  lifestyleScore: number,
  settings: CalculatorSettingsRow
): number {
  if (!settings.lifestyle_multiplier_enabled) {
    return 1;
  }
  return 1 + (lifestyleScore - 50) / settings.lifestyle_multiplier_divisor;
}

export interface CalculatorInputs {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  bodyFatPercent?: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  goalWeightKg: number;
  /**
   * Pre-calculated metabolic impact percentage from medical conditions.
   * Use calculateMetabolicImpactFromConditions() from use-medical-conditions.ts
   * to calculate this from database conditions.
   */
  metabolicImpactPercent: number;
  /**
   * Optional lifestyle score from assessment (0-100).
   * Used for lifestyle multiplier calculation when enabled.
   */
  lifestyleScore?: number;
  /**
   * Optional admin-configured settings.
   * If not provided, default settings are used.
   */
  settings?: CalculatorSettingsRow;
}

export interface CalculatorResults {
  bmr: number;
  tdee: number;
  adjustedTdee: number;
  targetCalories: number;
  proteinGrams: number;
  metabolicImpactPercent: number;
}

/**
 * Calculate BMR using Mifflin-St Jeor equation (when body fat % is unknown).
 * Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
 * Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
 */
export function calculateBmrMifflinStJeor(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? baseBmr + 5 : baseBmr - 161;
}

/**
 * Calculate BMR using Katch-McArdle equation (when body fat % is known).
 * Lean Mass = weight × (1 - bodyFat/100)
 * BMR = 370 + (21.6 × leanMass)
 */
export function calculateBmrKatchMcArdle(weightKg: number, bodyFatPercent: number): number {
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return 370 + 21.6 * leanMass;
}

/**
 * Calculate protein recommendation based on weight and goal.
 * Uses default ratios - for configurable ratios use settings.
 * - Fat Loss: 2.0g per kg body weight
 * - Maintain: 1.8g per kg body weight
 * - Muscle Gain: 2.2g per kg body weight
 * @deprecated Use getProteinRatioFromSettings() with settings instead
 */
export function calculateProteinRecommendation(
  weightKg: number,
  goal: Goal,
  settings?: CalculatorSettingsRow
): number {
  if (settings) {
    return Math.round(weightKg * getProteinRatioFromSettings(goal, settings));
  }
  const proteinPerKg: Record<Goal, number> = {
    fat_loss: 2.0,
    maintain: 1.8,
    muscle_gain: 2.2,
  };
  return Math.round(weightKg * proteinPerKg[goal]);
}

/**
 * Hook to calculate metabolic metrics from user inputs.
 * Uses Mifflin-St Jeor or Katch-McArdle formula based on body fat availability.
 *
 * IMPORTANT: The metabolicImpactPercent must be pre-calculated using
 * calculateMetabolicImpactFromConditions() from use-medical-conditions.ts
 * with conditions fetched from the database.
 *
 * The calculation flow (per COMPLETE-FORMULAE-GUIDE.md):
 * 1. Base BMR (Mifflin-St Jeor or Katch-McArdle)
 * 2. Adjusted BMR = Base BMR × Medical Multiplier
 * 3. TDEE = Adjusted BMR × Activity Multiplier
 * 4. Lifestyle-Adjusted TDEE = TDEE × Lifestyle Multiplier
 * 5. Target = Lifestyle-Adjusted TDEE ± Goal Adjustment
 */
export function useCalculator(inputs: CalculatorInputs | null): CalculatorResults | null {
  return useMemo(() => {
    if (!inputs) return null;

    const {
      gender,
      age,
      weightKg,
      heightCm,
      bodyFatPercent,
      activityLevel,
      goal,
      metabolicImpactPercent,
      lifestyleScore = 50, // Default to neutral
      settings = DEFAULT_CALCULATOR_SETTINGS,
    } = inputs;

    // Step 1: Calculate base BMR using appropriate formula
    const baseBmr =
      bodyFatPercent !== undefined
        ? calculateBmrKatchMcArdle(weightKg, bodyFatPercent)
        : calculateBmrMifflinStJeor(gender, weightKg, heightCm, age);

    // Step 2: Apply medical conditions adjustment to BMR (per documentation)
    const cappedMetabolicImpact = Math.min(metabolicImpactPercent, settings.metabolic_impact_cap);
    const medicalMultiplier = 1 - cappedMetabolicImpact / 100;
    const adjustedBmr = baseBmr * medicalMultiplier;

    // Step 3: Calculate TDEE from adjusted BMR
    const activityMultiplier = getActivityMultiplierFromSettings(activityLevel, settings);
    const tdee = adjustedBmr * activityMultiplier;

    // Step 4: Apply lifestyle multiplier
    const lifestyleMultiplier = calculateLifestyleMultiplier(lifestyleScore, settings);
    const lifestyleAdjustedTdee = tdee * lifestyleMultiplier;

    // Step 5: Calculate target calories
    const goalAdjustment = getGoalAdjustmentFromSettings(goal, settings);
    const targetCalories = Math.round(lifestyleAdjustedTdee + goalAdjustment);

    // Calculate protein recommendation using configurable ratio
    const proteinRatio = getProteinRatioFromSettings(goal, settings);
    const proteinGrams = Math.round(weightKg * proteinRatio);

    return {
      bmr: Math.round(baseBmr),
      tdee: Math.round(lifestyleAdjustedTdee),
      adjustedTdee: Math.round(lifestyleAdjustedTdee),
      targetCalories,
      proteinGrams,
      metabolicImpactPercent: cappedMetabolicImpact,
    };
  }, [inputs]);
}

/**
 * Calculate physical score based on BMI and body fat percentage.
 * Per documentation: Physical Score = Base + BMI Points + Body Fat Points
 */
export function calculatePhysicalScore(
  bmi: number,
  bodyFatPercent: number | undefined,
  gender: Gender,
  settings: CalculatorSettingsRow = DEFAULT_CALCULATOR_SETTINGS
): number {
  let score = settings.physical_score_base;

  // BMI Points
  if (bmi >= Number(settings.bmi_optimal_min) && bmi <= Number(settings.bmi_optimal_max)) {
    score += settings.physical_score_bmi_optimal;
  } else if (
    bmi >= Number(settings.bmi_acceptable_min) &&
    bmi <= Number(settings.bmi_acceptable_max)
  ) {
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
}

/**
 * Calculate BMI from weight and height
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export interface CalculateHealthScoreParams {
  lifestyleScore: number;
  targetCalories: number;
  // Physical metrics for Physical Score calculation
  bmi?: number;
  bodyFatPercent?: number;
  gender?: Gender;
  // Legacy support - if physical score already calculated
  physicalScore?: number;
  // Optional settings
  settings?: CalculatorSettingsRow;
}

/**
 * Calculate a combined health score (0-100) from lifestyle and physical factors.
 * Per documentation: Weighted by configurable percentages (default 60% lifestyle, 40% physical).
 *
 * IMPORTANT: physicalScore must be calculated from BMI and body fat using calculatePhysicalScore().
 * Do NOT pass metabolic impact percentage - that affects TDEE, not health score.
 *
 * @param lifestyleScore - Assessment-derived lifestyle score (0-100)
 * @param physicalScore - BMI/body fat derived score (0-100) from calculatePhysicalScore()
 * @param targetCalories - Target daily calories
 * @param settings - Calculator settings for weights and bonus thresholds
 */
export function calculateHealthScore(
  lifestyleScore: number,
  physicalScore: number,
  targetCalories: number,
  settings: CalculatorSettingsRow = DEFAULT_CALCULATOR_SETTINGS
): number {
  // Lifestyle component (configurable weight, default 60%)
  const lifestyleWeight = settings.health_score_lifestyle_weight / 100;
  const lifestyleComponent = lifestyleScore * lifestyleWeight;

  // Physical component (configurable weight, default 40%)
  // Physical score should be from calculatePhysicalScore(bmi, bodyFat, gender, settings)
  const physicalWeight = settings.health_score_physical_weight / 100;
  const physicalComponent = physicalScore * physicalWeight;

  // Bonus for reasonable calorie targets (configurable range)
  const calorieBonus =
    targetCalories >= settings.health_score_calorie_min &&
    targetCalories <= settings.health_score_calorie_max
      ? settings.health_score_calorie_bonus
      : 0;

  return Math.min(100, Math.round(lifestyleComponent + physicalComponent + calorieBonus));
}

/**
 * Calculate health score with explicit physical metrics.
 * This is the preferred method as it properly uses BMI and body fat.
 */
export function calculateHealthScoreWithPhysical(params: CalculateHealthScoreParams): number {
  const settings = params.settings || DEFAULT_CALCULATOR_SETTINGS;

  // Calculate or use provided physical score
  let physicalScore: number;
  if (params.physicalScore !== undefined) {
    physicalScore = params.physicalScore;
  } else if (params.bmi !== undefined && params.gender !== undefined) {
    physicalScore = calculatePhysicalScore(
      params.bmi,
      params.bodyFatPercent,
      params.gender,
      settings
    );
  } else {
    // Default to middle score if no physical data
    physicalScore = 75;
  }

  return calculateHealthScore(
    params.lifestyleScore,
    physicalScore,
    params.targetCalories,
    settings
  );
}
