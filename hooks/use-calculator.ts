"use client";

import { useMemo } from "react";

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
 * These are scientific constants, not configuration data.
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
 * These are standard adjustments, not configuration data.
 */
export const GOAL_ADJUSTMENTS: Record<Goal, { label: string; adjustment: number }> = {
  fat_loss: { label: "Fat Loss", adjustment: -500 },
  maintain: { label: "Maintain Weight", adjustment: 0 },
  muscle_gain: { label: "Muscle Gain", adjustment: 300 },
};

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
 * - Fat Loss: 2.0g per kg body weight
 * - Maintain: 1.8g per kg body weight
 * - Muscle Gain: 2.2g per kg body weight
 */
export function calculateProteinRecommendation(weightKg: number, goal: Goal): number {
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
    } = inputs;

    // Calculate BMR using appropriate formula
    const bmr =
      bodyFatPercent !== undefined
        ? calculateBmrKatchMcArdle(weightKg, bodyFatPercent)
        : calculateBmrMifflinStJeor(gender, weightKg, heightCm, age);

    // Calculate TDEE
    const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel].multiplier;
    const tdee = bmr * activityMultiplier;

    // Apply metabolic impact adjustment
    const adjustedTdee = tdee * (1 - metabolicImpactPercent / 100);

    // Calculate target calories based on goal
    const goalAdjustment = GOAL_ADJUSTMENTS[goal].adjustment;
    const targetCalories = Math.round(adjustedTdee + goalAdjustment);

    // Calculate protein recommendation
    const proteinGrams = calculateProteinRecommendation(weightKg, goal);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedTdee: Math.round(adjustedTdee),
      targetCalories,
      proteinGrams,
      metabolicImpactPercent,
    };
  }, [inputs]);
}

/**
 * Calculate a combined health score (0-100) from lifestyle and metabolic factors.
 * Weighted: 60% lifestyle score, 40% metabolic optimization.
 */
export function calculateHealthScore(
  lifestyleScore: number,
  metabolicImpactPercent: number,
  targetCalories: number
): number {
  // Lifestyle contributes 60% of the score
  const lifestyleComponent = lifestyleScore * 0.6;

  // Metabolic health (inverse of impact, normalized to 0-100)
  // 0% impact = 100, 30% impact = 0
  const metabolicComponent = ((30 - metabolicImpactPercent) / 30) * 40;

  // Bonus for reasonable calorie targets (not too extreme)
  const calorieBonus = targetCalories >= 1200 && targetCalories <= 3500 ? 5 : 0;

  return Math.min(100, Math.round(lifestyleComponent + metabolicComponent + calorieBonus));
}
