import { renderHook } from "@testing-library/react";
import {
  useCalculator,
  calculateBmrMifflinStJeor,
  calculateBmrKatchMcArdle,
  calculateProteinRecommendation,
  calculateHealthScore,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  CalculatorInputs,
} from "../use-calculator";

describe("calculateBmrMifflinStJeor", () => {
  it("calculates BMR correctly for males", () => {
    // Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
    // 80kg, 180cm, 30 years
    // = (10 × 80) + (6.25 × 180) - (5 × 30) + 5
    // = 800 + 1125 - 150 + 5 = 1780
    const bmr = calculateBmrMifflinStJeor("male", 80, 180, 30);
    expect(bmr).toBe(1780);
  });

  it("calculates BMR correctly for females", () => {
    // Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
    // 60kg, 165cm, 25 years
    // = (10 × 60) + (6.25 × 165) - (5 × 25) - 161
    // = 600 + 1031.25 - 125 - 161 = 1345.25
    const bmr = calculateBmrMifflinStJeor("female", 60, 165, 25);
    expect(bmr).toBeCloseTo(1345.25);
  });
});

describe("calculateBmrKatchMcArdle", () => {
  it("calculates BMR correctly with body fat percentage", () => {
    // Lean Mass = weight × (1 - bodyFat/100)
    // BMR = 370 + (21.6 × leanMass)
    // 80kg, 20% body fat
    // Lean Mass = 80 × (1 - 0.2) = 64
    // BMR = 370 + (21.6 × 64) = 370 + 1382.4 = 1752.4
    const bmr = calculateBmrKatchMcArdle(80, 20);
    expect(bmr).toBeCloseTo(1752.4);
  });

  it("calculates higher BMR for lower body fat percentage", () => {
    const bmr10Percent = calculateBmrKatchMcArdle(80, 10);
    const bmr20Percent = calculateBmrKatchMcArdle(80, 20);
    expect(bmr10Percent).toBeGreaterThan(bmr20Percent);
  });
});

describe("calculateProteinRecommendation", () => {
  it("calculates protein for fat loss (2.0g/kg)", () => {
    expect(calculateProteinRecommendation(80, "fat_loss")).toBe(160);
  });

  it("calculates protein for maintenance (1.8g/kg)", () => {
    expect(calculateProteinRecommendation(80, "maintain")).toBe(144);
  });

  it("calculates protein for muscle gain (2.2g/kg)", () => {
    expect(calculateProteinRecommendation(80, "muscle_gain")).toBe(176);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProteinRecommendation(75, "fat_loss")).toBe(150);
    expect(calculateProteinRecommendation(75, "maintain")).toBe(135);
  });
});

describe("calculateHealthScore", () => {
  // Note: calculateHealthScore now uses physical score (0-100) instead of metabolic impact
  // When passed a value <= 50, it's treated as metabolic impact % and converted
  // When passed a value > 50, it's treated as a physical score directly

  it("returns maximum score for optimal inputs", () => {
    // 100 lifestyle, 100 physical score (not metabolic impact), reasonable calories
    const score = calculateHealthScore(100, 100, 2000);
    expect(score).toBe(100);
  });

  it("returns lower score for lower physical score", () => {
    const scoreHighPhysical = calculateHealthScore(70, 90, 2000);
    const scoreLowPhysical = calculateHealthScore(70, 60, 2000);
    expect(scoreHighPhysical).toBeGreaterThan(scoreLowPhysical);
  });

  it("expects physical score (0-100) as second parameter, NOT metabolic impact", () => {
    // Physical score should come from calculatePhysicalScore(bmi, bodyFat, gender, settings)
    // NOT from metabolic impact. A higher physical score = better health score.
    const scoreHighPhysical = calculateHealthScore(50, 100, 2000);
    const scoreLowPhysical = calculateHealthScore(50, 25, 2000);
    expect(scoreHighPhysical).toBeGreaterThan(scoreLowPhysical);
  });

  it("weights lifestyle at 60% by default", () => {
    // 50 lifestyle, 100 physical, reasonable calories = 50 × 0.6 + 100 × 0.4 + 5 = 30 + 40 + 5 = 75
    const score = calculateHealthScore(50, 100, 2000);
    expect(score).toBe(75);
  });

  it("includes calorie bonus for reasonable targets", () => {
    const goodCalories = calculateHealthScore(50, 100, 2000);
    const lowCalories = calculateHealthScore(50, 100, 1000);
    expect(goodCalories).toBeGreaterThan(lowCalories);
  });

  it("does not exceed 100", () => {
    const score = calculateHealthScore(100, 100, 2500);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("useCalculator", () => {
  // Note: metabolicImpactPercent is now pre-calculated from database conditions
  // using calculateMetabolicImpactFromConditions() from use-medical-conditions.ts
  const defaultInputs: CalculatorInputs = {
    gender: "male",
    age: 30,
    weightKg: 80,
    heightCm: 180,
    activityLevel: "moderately_active",
    goal: "fat_loss",
    goalWeightKg: 75,
    metabolicImpactPercent: 0,
  };

  it("returns null for null inputs", () => {
    const { result } = renderHook(() => useCalculator(null));
    expect(result.current).toBeNull();
  });

  it("calculates BMR using Mifflin-St Jeor without body fat", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // BMR = (10 × 80) + (6.25 × 180) - (5 × 30) + 5 = 1780
    expect(result.current?.bmr).toBe(1780);
  });

  it("calculates BMR using Katch-McArdle with body fat", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      bodyFatPercent: 20,
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // Katch-McArdle: 370 + (21.6 × 64) = 1752.4 → 1752
    expect(result.current?.bmr).toBe(1752);
  });

  it("calculates TDEE correctly with activity multiplier", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // TDEE = 1780 × 1.55 = 2759
    expect(result.current?.tdee).toBe(2759);
  });

  it("applies metabolic impact to TDEE", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      metabolicImpactPercent: 8, // Pre-calculated, e.g., hypothyroidism = 8%
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // TDEE = 2759 × (1 - 0.08) = 2538.28 → 2538
    expect(result.current?.adjustedTdee).toBe(2538);
    expect(result.current?.metabolicImpactPercent).toBe(8);
  });

  it("calculates target calories for fat loss (TDEE - 550)", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // Target = 2759 - 550 = 2209 (with default lifestyle score of 50, no lifestyle adjustment)
    expect(result.current?.targetCalories).toBe(2209);
  });

  it("calculates target calories for maintenance (TDEE + 0)", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      goal: "maintain",
    };
    const { result } = renderHook(() => useCalculator(inputs));
    expect(result.current?.targetCalories).toBe(2759);
  });

  it("calculates target calories for muscle gain (TDEE + 475)", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      goal: "muscle_gain",
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // Target = 2759 + 475 = 3234 (with default lifestyle score of 50, no lifestyle adjustment)
    expect(result.current?.targetCalories).toBe(3234);
  });

  it("calculates protein recommendation correctly", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // Fat loss: 80 × 2.0 = 160g
    expect(result.current?.proteinGrams).toBe(160);
  });
});

describe("ACTIVITY_MULTIPLIERS", () => {
  it("has all 5 activity levels", () => {
    expect(Object.keys(ACTIVITY_MULTIPLIERS)).toHaveLength(5);
  });

  it("has correct multiplier values", () => {
    expect(ACTIVITY_MULTIPLIERS.sedentary.multiplier).toBe(1.2);
    expect(ACTIVITY_MULTIPLIERS.lightly_active.multiplier).toBe(1.375);
    expect(ACTIVITY_MULTIPLIERS.moderately_active.multiplier).toBe(1.55);
    expect(ACTIVITY_MULTIPLIERS.very_active.multiplier).toBe(1.725);
    expect(ACTIVITY_MULTIPLIERS.extremely_active.multiplier).toBe(1.9);
  });
});

describe("GOAL_ADJUSTMENTS", () => {
  it("has all 3 goals", () => {
    expect(Object.keys(GOAL_ADJUSTMENTS)).toHaveLength(3);
  });

  it("has correct adjustment values", () => {
    // Updated per documentation: -550 for fat loss, +475 for muscle gain
    expect(GOAL_ADJUSTMENTS.fat_loss.adjustment).toBe(-550);
    expect(GOAL_ADJUSTMENTS.maintain.adjustment).toBe(0);
    expect(GOAL_ADJUSTMENTS.muscle_gain.adjustment).toBe(475);
  });
});
