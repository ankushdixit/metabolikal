import { renderHook } from "@testing-library/react";
import {
  useCalculator,
  calculateBmrMifflinStJeor,
  calculateBmrKatchMcArdle,
  calculateProteinRecommendation,
  calculateHealthScore,
  calculateHealthScoreWithPhysical,
  calculatePhysicalScore,
  calculateBmi,
  calculateLifestyleMultiplier,
  getActivityMultiplierFromSettings,
  getGoalAdjustmentFromSettings,
  getProteinRatioFromSettings,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  CalculatorInputs,
} from "../use-calculator";
import { DEFAULT_CALCULATOR_SETTINGS } from "../use-calculator-settings";
import type { CalculatorSettingsRow } from "@/lib/database.types";

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

  it("handles very young age", () => {
    const bmr = calculateBmrMifflinStJeor("male", 70, 170, 18);
    // = (10 × 70) + (6.25 × 170) - (5 × 18) + 5
    // = 700 + 1062.5 - 90 + 5 = 1677.5
    expect(bmr).toBeCloseTo(1677.5);
  });

  it("handles very old age", () => {
    const bmr = calculateBmrMifflinStJeor("female", 55, 155, 80);
    // = (10 × 55) + (6.25 × 155) - (5 × 80) - 161
    // = 550 + 968.75 - 400 - 161 = 957.75
    expect(bmr).toBeCloseTo(957.75);
  });

  it("handles zero weight", () => {
    const bmr = calculateBmrMifflinStJeor("male", 0, 180, 30);
    // = (10 × 0) + (6.25 × 180) - (5 × 30) + 5
    // = 0 + 1125 - 150 + 5 = 980
    expect(bmr).toBe(980);
  });

  it("handles zero height", () => {
    const bmr = calculateBmrMifflinStJeor("male", 80, 0, 30);
    // = (10 × 80) + (6.25 × 0) - (5 × 30) + 5
    // = 800 + 0 - 150 + 5 = 655
    expect(bmr).toBe(655);
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

  it("handles 0% body fat", () => {
    // Lean Mass = 80 × (1 - 0) = 80
    // BMR = 370 + (21.6 × 80) = 370 + 1728 = 2098
    const bmr = calculateBmrKatchMcArdle(80, 0);
    expect(bmr).toBe(2098);
  });

  it("handles very high body fat percentage", () => {
    // Lean Mass = 120 × (1 - 0.5) = 60
    // BMR = 370 + (21.6 × 60) = 370 + 1296 = 1666
    const bmr = calculateBmrKatchMcArdle(120, 50);
    expect(bmr).toBe(1666);
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

  it("uses settings-based ratios when settings are provided", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      protein_fat_loss: 2.5,
      protein_maintain: 2.0,
      protein_muscle_gain: 2.8,
    };

    // 80kg × 2.5 = 200
    expect(calculateProteinRecommendation(80, "fat_loss", customSettings)).toBe(200);
    // 80kg × 2.0 = 160
    expect(calculateProteinRecommendation(80, "maintain", customSettings)).toBe(160);
    // 80kg × 2.8 = 224
    expect(calculateProteinRecommendation(80, "muscle_gain", customSettings)).toBe(224);
  });

  it("rounds correctly when settings produce fractional values", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      protein_fat_loss: 2.3,
    };
    // 75kg × 2.3 = 172.5 → rounds to 173
    expect(calculateProteinRecommendation(75, "fat_loss", customSettings)).toBe(173);
  });
});

describe("calculateLifestyleMultiplier", () => {
  it("returns 1 when lifestyle multiplier is disabled", () => {
    const disabledSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      lifestyle_multiplier_enabled: false,
    };
    expect(calculateLifestyleMultiplier(80, disabledSettings)).toBe(1);
    expect(calculateLifestyleMultiplier(20, disabledSettings)).toBe(1);
    expect(calculateLifestyleMultiplier(50, disabledSettings)).toBe(1);
  });

  it("returns 1 for neutral score (50) when enabled", () => {
    const result = calculateLifestyleMultiplier(50, DEFAULT_CALCULATOR_SETTINGS);
    expect(result).toBe(1);
  });

  it("returns > 1 for above-average lifestyle score", () => {
    // 1 + (80 - 50) / 500 = 1 + 30/500 = 1.06
    const result = calculateLifestyleMultiplier(80, DEFAULT_CALCULATOR_SETTINGS);
    expect(result).toBeCloseTo(1.06);
  });

  it("returns < 1 for below-average lifestyle score", () => {
    // 1 + (30 - 50) / 500 = 1 + (-20/500) = 0.96
    const result = calculateLifestyleMultiplier(30, DEFAULT_CALCULATOR_SETTINGS);
    expect(result).toBeCloseTo(0.96);
  });

  it("handles extreme high lifestyle score", () => {
    // 1 + (100 - 50) / 500 = 1 + 50/500 = 1.10
    const result = calculateLifestyleMultiplier(100, DEFAULT_CALCULATOR_SETTINGS);
    expect(result).toBeCloseTo(1.1);
  });

  it("handles extreme low lifestyle score", () => {
    // 1 + (0 - 50) / 500 = 1 + (-50/500) = 0.90
    const result = calculateLifestyleMultiplier(0, DEFAULT_CALCULATOR_SETTINGS);
    expect(result).toBeCloseTo(0.9);
  });
});

describe("getActivityMultiplierFromSettings", () => {
  it("returns correct multipliers for all activity levels", () => {
    expect(getActivityMultiplierFromSettings("sedentary", DEFAULT_CALCULATOR_SETTINGS)).toBe(1.2);
    expect(getActivityMultiplierFromSettings("lightly_active", DEFAULT_CALCULATOR_SETTINGS)).toBe(
      1.375
    );
    expect(
      getActivityMultiplierFromSettings("moderately_active", DEFAULT_CALCULATOR_SETTINGS)
    ).toBe(1.55);
    expect(getActivityMultiplierFromSettings("very_active", DEFAULT_CALCULATOR_SETTINGS)).toBe(
      1.725
    );
    expect(getActivityMultiplierFromSettings("extremely_active", DEFAULT_CALCULATOR_SETTINGS)).toBe(
      1.9
    );
  });
});

describe("getGoalAdjustmentFromSettings", () => {
  it("returns correct adjustments for all goals", () => {
    expect(getGoalAdjustmentFromSettings("fat_loss", DEFAULT_CALCULATOR_SETTINGS)).toBe(-550);
    expect(getGoalAdjustmentFromSettings("maintain", DEFAULT_CALCULATOR_SETTINGS)).toBe(0);
    expect(getGoalAdjustmentFromSettings("muscle_gain", DEFAULT_CALCULATOR_SETTINGS)).toBe(475);
  });
});

describe("getProteinRatioFromSettings", () => {
  it("returns correct protein ratios for all goals", () => {
    expect(getProteinRatioFromSettings("fat_loss", DEFAULT_CALCULATOR_SETTINGS)).toBe(2.0);
    expect(getProteinRatioFromSettings("maintain", DEFAULT_CALCULATOR_SETTINGS)).toBe(1.8);
    expect(getProteinRatioFromSettings("muscle_gain", DEFAULT_CALCULATOR_SETTINGS)).toBe(2.2);
  });
});

describe("calculateBmi", () => {
  it("calculates BMI correctly for normal weight", () => {
    // 70kg, 175cm -> BMI = 70 / (1.75)^2 = 70 / 3.0625 = 22.857
    const bmi = calculateBmi(70, 175);
    expect(bmi).toBeCloseTo(22.857, 2);
  });

  it("calculates BMI correctly for overweight", () => {
    // 90kg, 170cm -> BMI = 90 / (1.7)^2 = 90 / 2.89 = 31.14
    const bmi = calculateBmi(90, 170);
    expect(bmi).toBeCloseTo(31.14, 1);
  });

  it("calculates BMI correctly for underweight", () => {
    // 45kg, 170cm -> BMI = 45 / (1.7)^2 = 45 / 2.89 = 15.57
    const bmi = calculateBmi(45, 170);
    expect(bmi).toBeCloseTo(15.57, 1);
  });

  it("handles tall individuals", () => {
    // 80kg, 200cm -> BMI = 80 / (2.0)^2 = 80 / 4 = 20
    const bmi = calculateBmi(80, 200);
    expect(bmi).toBe(20);
  });
});

describe("calculatePhysicalScore", () => {
  it("returns base + optimal BMI points when no body fat provided", () => {
    // BMI 22.0 is optimal (18.5-24.9)
    // Score = 75 (base) + 15 (optimal BMI) = 90
    const score = calculatePhysicalScore(22.0, undefined, "male");
    expect(score).toBe(90);
  });

  it("returns base + acceptable BMI points when BMI is in acceptable range", () => {
    // BMI 26.0 is acceptable (17.0-29.9) but not optimal (18.5-24.9)
    // Score = 75 + 10 = 85
    const score = calculatePhysicalScore(26.0, undefined, "male");
    expect(score).toBe(85);
  });

  it("returns base + outside BMI points when BMI is outside acceptable range", () => {
    // BMI 35.0 is outside acceptable range (>29.9)
    // Score = 75 + 5 = 80
    const score = calculatePhysicalScore(35.0, undefined, "female");
    expect(score).toBe(80);
  });

  it("returns base + outside BMI points for very low BMI", () => {
    // BMI 15.0 is below acceptable range (<17.0)
    // Score = 75 + 5 = 80
    const score = calculatePhysicalScore(15.0, undefined, "male");
    expect(score).toBe(80);
  });

  describe("male body fat scoring", () => {
    it("adds optimal body fat points for male in optimal range", () => {
      // BMI 22 (optimal: +15), body fat 15% (male optimal 10-20: +10)
      // Score = 75 + 15 + 10 = 100
      const score = calculatePhysicalScore(22.0, 15, "male");
      expect(score).toBe(100);
    });

    it("adds acceptable body fat points for male in acceptable range", () => {
      // BMI 22 (optimal: +15), body fat 22% (male acceptable 8-24, not optimal 10-20: +7)
      // Score = 75 + 15 + 7 = 97
      const score = calculatePhysicalScore(22.0, 22, "male");
      expect(score).toBe(97);
    });

    it("adds outside body fat points for male outside acceptable range", () => {
      // BMI 22 (optimal: +15), body fat 30% (male outside >24: +3)
      // Score = 75 + 15 + 3 = 93
      const score = calculatePhysicalScore(22.0, 30, "male");
      expect(score).toBe(93);
    });

    it("adds outside body fat points for very low male body fat", () => {
      // BMI 22 (optimal: +15), body fat 5% (male outside <8: +3)
      // Score = 75 + 15 + 3 = 93
      const score = calculatePhysicalScore(22.0, 5, "male");
      expect(score).toBe(93);
    });
  });

  describe("female body fat scoring", () => {
    it("adds optimal body fat points for female in optimal range", () => {
      // BMI 22 (optimal: +15), body fat 22% (female optimal 18-28: +10)
      // Score = 75 + 15 + 10 = 100
      const score = calculatePhysicalScore(22.0, 22, "female");
      expect(score).toBe(100);
    });

    it("adds acceptable body fat points for female in acceptable range", () => {
      // BMI 22 (optimal: +15), body fat 30% (female acceptable 15-32, not optimal 18-28: +7)
      // Score = 75 + 15 + 7 = 97
      const score = calculatePhysicalScore(22.0, 30, "female");
      expect(score).toBe(97);
    });

    it("adds outside body fat points for female outside acceptable range", () => {
      // BMI 22 (optimal: +15), body fat 35% (female outside >32: +3)
      // Score = 75 + 15 + 3 = 93
      const score = calculatePhysicalScore(22.0, 35, "female");
      expect(score).toBe(93);
    });

    it("adds outside body fat points for very low female body fat", () => {
      // BMI 22 (optimal: +15), body fat 10% (female outside <15: +3)
      // Score = 75 + 15 + 3 = 93
      const score = calculatePhysicalScore(22.0, 10, "female");
      expect(score).toBe(93);
    });
  });

  it("caps score at 100", () => {
    // Even with all optimal values, score should not exceed 100
    // 75 + 15 + 10 = 100 exactly
    const score = calculatePhysicalScore(22.0, 15, "male");
    expect(score).toBeLessThanOrEqual(100);
  });

  it("uses custom settings when provided", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      physical_score_base: 50,
      physical_score_bmi_optimal: 30,
    };
    // BMI 22 (optimal), no body fat
    // Score = 50 + 30 = 80
    const score = calculatePhysicalScore(22.0, undefined, "male", customSettings);
    expect(score).toBe(80);
  });

  it("handles boundary BMI values at optimal edges", () => {
    // BMI exactly at optimal min (18.5) -> optimal
    expect(calculatePhysicalScore(18.5, undefined, "male")).toBe(90);
    // BMI exactly at optimal max (24.9) -> optimal
    expect(calculatePhysicalScore(24.9, undefined, "male")).toBe(90);
  });

  it("handles boundary BMI values at acceptable edges", () => {
    // BMI exactly at acceptable min (17.0) -> acceptable
    expect(calculatePhysicalScore(17.0, undefined, "male")).toBe(85);
    // BMI exactly at acceptable max (29.9) -> acceptable
    expect(calculatePhysicalScore(29.9, undefined, "male")).toBe(85);
  });

  it("handles boundary body fat values for males", () => {
    // Male body fat at optimal min (10) -> optimal
    expect(calculatePhysicalScore(22.0, 10, "male")).toBe(100);
    // Male body fat at optimal max (20) -> optimal
    expect(calculatePhysicalScore(22.0, 20, "male")).toBe(100);
    // Male body fat at acceptable min (8) -> acceptable
    expect(calculatePhysicalScore(22.0, 8, "male")).toBe(97);
    // Male body fat at acceptable max (24) -> acceptable
    expect(calculatePhysicalScore(22.0, 24, "male")).toBe(97);
  });

  it("handles boundary body fat values for females", () => {
    // Female body fat at optimal min (18) -> optimal
    expect(calculatePhysicalScore(22.0, 18, "female")).toBe(100);
    // Female body fat at optimal max (28) -> optimal
    expect(calculatePhysicalScore(22.0, 28, "female")).toBe(100);
    // Female body fat at acceptable min (15) -> acceptable
    expect(calculatePhysicalScore(22.0, 15, "female")).toBe(97);
    // Female body fat at acceptable max (32) -> acceptable
    expect(calculatePhysicalScore(22.0, 32, "female")).toBe(97);
  });
});

describe("calculateHealthScore", () => {
  it("returns maximum score for optimal inputs", () => {
    // 100 lifestyle, 100 physical score, reasonable calories
    const score = calculateHealthScore(100, 100, 2000);
    expect(score).toBe(100);
  });

  it("returns lower score for lower physical score", () => {
    const scoreHighPhysical = calculateHealthScore(70, 90, 2000);
    const scoreLowPhysical = calculateHealthScore(70, 60, 2000);
    expect(scoreHighPhysical).toBeGreaterThan(scoreLowPhysical);
  });

  it("expects physical score (0-100) as second parameter, NOT metabolic impact", () => {
    const scoreHighPhysical = calculateHealthScore(50, 100, 2000);
    const scoreLowPhysical = calculateHealthScore(50, 25, 2000);
    expect(scoreHighPhysical).toBeGreaterThan(scoreLowPhysical);
  });

  it("weights lifestyle at 60% by default", () => {
    // 50 lifestyle, 100 physical, reasonable calories = 50 * 0.6 + 100 * 0.4 + 5 = 30 + 40 + 5 = 75
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

  it("gives no calorie bonus for calories below min", () => {
    // 1199 is below default min (1200)
    const score = calculateHealthScore(50, 50, 1199);
    // = 50 * 0.6 + 50 * 0.4 + 0 = 30 + 20 = 50
    expect(score).toBe(50);
  });

  it("gives no calorie bonus for calories above max", () => {
    // 3501 is above default max (3500)
    const score = calculateHealthScore(50, 50, 3501);
    // = 50 * 0.6 + 50 * 0.4 + 0 = 30 + 20 = 50
    expect(score).toBe(50);
  });

  it("gives calorie bonus at exact boundary values", () => {
    // 1200 is exactly at min -> should get bonus
    const scoreAtMin = calculateHealthScore(50, 50, 1200);
    expect(scoreAtMin).toBe(55); // 30 + 20 + 5

    // 3500 is exactly at max -> should get bonus
    const scoreAtMax = calculateHealthScore(50, 50, 3500);
    expect(scoreAtMax).toBe(55); // 30 + 20 + 5
  });

  it("uses custom settings weights", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      health_score_lifestyle_weight: 80,
      health_score_physical_weight: 20,
      health_score_calorie_bonus: 10,
    };
    // 50 lifestyle, 50 physical, reasonable calories
    // = 50 * 0.8 + 50 * 0.2 + 10 = 40 + 10 + 10 = 60
    const score = calculateHealthScore(50, 50, 2000, customSettings);
    expect(score).toBe(60);
  });

  it("handles zero lifestyle and physical scores", () => {
    const score = calculateHealthScore(0, 0, 2000);
    // = 0 * 0.6 + 0 * 0.4 + 5 = 5
    expect(score).toBe(5);
  });
});

describe("calculateHealthScoreWithPhysical", () => {
  it("uses provided physicalScore directly", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      physicalScore: 80,
    });
    // = 50 * 0.6 + 80 * 0.4 + 5 = 30 + 32 + 5 = 67
    expect(score).toBe(67);
  });

  it("calculates physical score from BMI and gender when physicalScore not provided", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      bmi: 22.0,
      gender: "male",
    });
    // Physical score = 75 + 15 (optimal BMI) = 90
    // Health score = 50 * 0.6 + 90 * 0.4 + 5 = 30 + 36 + 5 = 71
    expect(score).toBe(71);
  });

  it("calculates physical score from BMI, body fat, and gender", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      bmi: 22.0,
      bodyFatPercent: 15,
      gender: "male",
    });
    // Physical score = 75 + 15 (optimal BMI) + 10 (optimal body fat) = 100
    // Health score = 50 * 0.6 + 100 * 0.4 + 5 = 30 + 40 + 5 = 75
    expect(score).toBe(75);
  });

  it("defaults to physicalScore of 75 when no physical data provided", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
    });
    // Physical score defaults to 75
    // Health score = 50 * 0.6 + 75 * 0.4 + 5 = 30 + 30 + 5 = 65
    expect(score).toBe(65);
  });

  it("defaults to 75 when only bmi is provided without gender", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      bmi: 22.0,
      // No gender provided
    });
    // Missing gender, so falls through to default 75
    // Health score = 50 * 0.6 + 75 * 0.4 + 5 = 30 + 30 + 5 = 65
    expect(score).toBe(65);
  });

  it("prefers physicalScore over bmi/gender when both provided", () => {
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      physicalScore: 60,
      bmi: 22.0,
      gender: "male",
    });
    // physicalScore takes precedence: 60
    // Health score = 50 * 0.6 + 60 * 0.4 + 5 = 30 + 24 + 5 = 59
    expect(score).toBe(59);
  });

  it("uses custom settings when provided", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      health_score_lifestyle_weight: 70,
      health_score_physical_weight: 30,
    };
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      physicalScore: 80,
      settings: customSettings,
    });
    // = 50 * 0.7 + 80 * 0.3 + 5 = 35 + 24 + 5 = 64
    expect(score).toBe(64);
  });

  it("passes settings to calculatePhysicalScore when computing from bmi", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      physical_score_base: 50,
      physical_score_bmi_optimal: 30,
    };
    const score = calculateHealthScoreWithPhysical({
      lifestyleScore: 50,
      targetCalories: 2000,
      bmi: 22.0,
      gender: "female",
      settings: customSettings,
    });
    // Physical score with custom settings = 50 + 30 = 80
    // Health score = 50 * 0.6 + 80 * 0.4 + 5 = 30 + 32 + 5 = 67
    expect(score).toBe(67);
  });
});

describe("useCalculator", () => {
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
    // BMR = (10 x 80) + (6.25 x 180) - (5 x 30) + 5 = 1780
    expect(result.current?.bmr).toBe(1780);
  });

  it("calculates BMR using Katch-McArdle with body fat", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      bodyFatPercent: 20,
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // Katch-McArdle: 370 + (21.6 x 64) = 1752.4 -> 1752
    expect(result.current?.bmr).toBe(1752);
  });

  it("calculates TDEE correctly with activity multiplier", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // TDEE = 1780 x 1.55 = 2759
    expect(result.current?.tdee).toBe(2759);
  });

  it("applies metabolic impact to TDEE", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      metabolicImpactPercent: 8,
    };
    const { result } = renderHook(() => useCalculator(inputs));
    expect(result.current?.adjustedTdee).toBe(2538);
    expect(result.current?.metabolicImpactPercent).toBe(8);
  });

  it("caps metabolic impact at settings cap", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      metabolicImpactPercent: 50, // Exceeds default cap of 25
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // Should be capped at 25% (default cap)
    expect(result.current?.metabolicImpactPercent).toBe(25);
  });

  it("calculates target calories for fat loss (TDEE - 550)", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
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
    expect(result.current?.targetCalories).toBe(3234);
  });

  it("calculates protein recommendation correctly", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // Fat loss: 80 x 2.0 = 160g
    expect(result.current?.proteinGrams).toBe(160);
  });

  it("applies lifestyle score to TDEE", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      lifestyleScore: 80,
      goal: "maintain",
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // BMR = 1780
    // TDEE = 1780 * 1.55 = 2759
    // Lifestyle multiplier = 1 + (80-50)/500 = 1.06
    // Lifestyle adjusted TDEE = 2759 * 1.06 = 2924.54 -> 2925
    expect(result.current?.tdee).toBe(2925);
    expect(result.current?.targetCalories).toBe(2925);
  });

  it("uses default lifestyle score of 50 when not provided", () => {
    const { result } = renderHook(() => useCalculator(defaultInputs));
    // With lifestyle score 50, multiplier = 1.0 (no change)
    // TDEE = 1780 * 1.55 * 1.0 = 2759
    expect(result.current?.tdee).toBe(2759);
  });

  it("uses custom settings when provided", () => {
    const customSettings: CalculatorSettingsRow = {
      ...DEFAULT_CALCULATOR_SETTINGS,
      activity_moderately_active: 1.6,
      goal_fat_loss_adjustment: -500,
      protein_fat_loss: 2.5,
    };
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      settings: customSettings,
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // BMR = 1780
    // TDEE = 1780 * 1.6 = 2848
    // Target = 2848 - 500 = 2348
    expect(result.current?.targetCalories).toBe(2348);
    // Protein = 80 * 2.5 = 200
    expect(result.current?.proteinGrams).toBe(200);
  });

  it("handles all activity levels", () => {
    const levels: Array<{ level: CalculatorInputs["activityLevel"]; multiplier: number }> = [
      { level: "sedentary", multiplier: 1.2 },
      { level: "lightly_active", multiplier: 1.375 },
      { level: "moderately_active", multiplier: 1.55 },
      { level: "very_active", multiplier: 1.725 },
      { level: "extremely_active", multiplier: 1.9 },
    ];

    for (const { level, multiplier } of levels) {
      const inputs: CalculatorInputs = {
        ...defaultInputs,
        activityLevel: level,
        goal: "maintain",
      };
      const { result } = renderHook(() => useCalculator(inputs));
      // BMR = 1780, lifestyle multiplier = 1.0
      const expectedTdee = Math.round(1780 * multiplier);
      expect(result.current?.tdee).toBe(expectedTdee);
    }
  });

  it("calculates for female with Mifflin-St Jeor", () => {
    const inputs: CalculatorInputs = {
      ...defaultInputs,
      gender: "female",
      weightKg: 60,
      heightCm: 165,
      age: 25,
      goal: "maintain",
    };
    const { result } = renderHook(() => useCalculator(inputs));
    // BMR = (10*60) + (6.25*165) - (5*25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    expect(result.current?.bmr).toBe(1345);
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
    expect(GOAL_ADJUSTMENTS.fat_loss.adjustment).toBe(-550);
    expect(GOAL_ADJUSTMENTS.maintain.adjustment).toBe(0);
    expect(GOAL_ADJUSTMENTS.muscle_gain.adjustment).toBe(475);
  });
});
