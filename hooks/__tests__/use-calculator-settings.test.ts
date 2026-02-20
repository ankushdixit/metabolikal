/**
 * Tests for useCalculatorSettings hook and getDefaultCalculatorSettings utility.
 *
 * Covers:
 * - Loading state with default settings fallback
 * - Settings loaded from database
 * - No settings returned (empty list) -> falls back to defaults
 * - Error state
 * - getActivityMultiplier for all 5 activity levels
 * - getGoalAdjustment for all 3 goals
 * - getProteinRatio for all 3 goals
 * - getHealthScoreTier boundary conditions
 * - calculatePhysicalScore: all BMI and body fat branches (male/female, optimal/acceptable/outside)
 * - calculateLifestyleMultiplier: enabled vs. disabled
 * - getDefaultCalculatorSettings utility
 */

import { renderHook } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock @refinedev/core BEFORE importing module under test
// ---------------------------------------------------------------------------

const mockUseList = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

import {
  useCalculatorSettings,
  DEFAULT_CALCULATOR_SETTINGS,
  getDefaultCalculatorSettings,
} from "../use-calculator-settings";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a mock useList return value that resolves with data. */
function mockListReturn(
  data: unknown[] | undefined,
  opts?: { isLoading?: boolean; error?: Error | null }
) {
  const refetchFn = jest.fn();
  return {
    query: {
      data: data !== undefined ? { data } : undefined,
      isLoading: opts?.isLoading ?? false,
      error: opts?.error ?? null,
      refetch: refetchFn,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCalculatorSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Loading and data states
  // -----------------------------------------------------------------------

  describe("loading and data states", () => {
    it("returns isLoading=true and defaults while loading", () => {
      mockUseList.mockReturnValue(mockListReturn(undefined, { isLoading: true }));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.isLoading).toBe(true);
      // While loading, should still return defaults so calculator is usable
      expect(result.current.settings).toEqual(DEFAULT_CALCULATOR_SETTINGS);
    });

    it("returns fetched settings when data is available", () => {
      const customSettings = {
        ...DEFAULT_CALCULATOR_SETTINGS,
        id: "db-row",
        activity_sedentary: 1.25,
        goal_fat_loss_adjustment: -600,
        protein_muscle_gain: 2.5,
      };

      mockUseList.mockReturnValue(mockListReturn([customSettings]));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.settings.id).toBe("db-row");
      expect(result.current.settings.activity_sedentary).toBe(1.25);
      expect(result.current.settings.goal_fat_loss_adjustment).toBe(-600);
    });

    it("falls back to defaults when data list is empty", () => {
      mockUseList.mockReturnValue(mockListReturn([]));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.settings).toEqual(DEFAULT_CALCULATOR_SETTINGS);
    });

    it("falls back to defaults when data is undefined", () => {
      mockUseList.mockReturnValue(mockListReturn(undefined));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.settings).toEqual(DEFAULT_CALCULATOR_SETTINGS);
    });

    it("returns error when query fails", () => {
      const error = new Error("Settings fetch failed");
      mockUseList.mockReturnValue(mockListReturn(undefined, { error }));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.error).toBe(error);
    });

    it("returns null error on success", () => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.error).toBeNull();
    });

    it("calls useList with correct resource and options", () => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));

      renderHook(() => useCalculatorSettings());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "calculator_settings",
          pagination: { mode: "off" },
          queryOptions: expect.objectContaining({
            retry: 1,
            staleTime: 600000, // 10 minutes
          }),
        })
      );
    });

    it("exposes a refetch function", () => {
      const refetchFn = jest.fn();
      mockUseList.mockReturnValue({
        query: {
          data: { data: [DEFAULT_CALCULATOR_SETTINGS] },
          isLoading: false,
          error: null,
          refetch: refetchFn,
        },
      });

      const { result } = renderHook(() => useCalculatorSettings());

      expect(result.current.refetch).toBe(refetchFn);
    });
  });

  // -----------------------------------------------------------------------
  // getActivityMultiplier
  // -----------------------------------------------------------------------

  describe("getActivityMultiplier", () => {
    beforeEach(() => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));
    });

    it("returns correct multiplier for sedentary", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("sedentary")).toBe(1.2);
    });

    it("returns correct multiplier for lightly_active", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("lightly_active")).toBe(1.375);
    });

    it("returns correct multiplier for moderately_active", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("moderately_active")).toBe(1.55);
    });

    it("returns correct multiplier for very_active", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("very_active")).toBe(1.725);
    });

    it("returns correct multiplier for extremely_active", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("extremely_active")).toBe(1.9);
    });

    it("uses custom settings when available", () => {
      const custom = { ...DEFAULT_CALCULATOR_SETTINGS, activity_sedentary: 1.3 };
      mockUseList.mockReturnValue(mockListReturn([custom]));

      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getActivityMultiplier("sedentary")).toBe(1.3);
    });
  });

  // -----------------------------------------------------------------------
  // getGoalAdjustment
  // -----------------------------------------------------------------------

  describe("getGoalAdjustment", () => {
    beforeEach(() => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));
    });

    it("returns -550 for fat_loss", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getGoalAdjustment("fat_loss")).toBe(-550);
    });

    it("returns 0 for maintain", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getGoalAdjustment("maintain")).toBe(0);
    });

    it("returns 475 for muscle_gain", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getGoalAdjustment("muscle_gain")).toBe(475);
    });

    it("uses custom settings when available", () => {
      const custom = { ...DEFAULT_CALCULATOR_SETTINGS, goal_fat_loss_adjustment: -500 };
      mockUseList.mockReturnValue(mockListReturn([custom]));

      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getGoalAdjustment("fat_loss")).toBe(-500);
    });
  });

  // -----------------------------------------------------------------------
  // getProteinRatio
  // -----------------------------------------------------------------------

  describe("getProteinRatio", () => {
    beforeEach(() => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));
    });

    it("returns 2.0 for fat_loss", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getProteinRatio("fat_loss")).toBe(2.0);
    });

    it("returns 1.8 for maintain", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getProteinRatio("maintain")).toBe(1.8);
    });

    it("returns 2.2 for muscle_gain", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.getProteinRatio("muscle_gain")).toBe(2.2);
    });
  });

  // -----------------------------------------------------------------------
  // getHealthScoreTier
  // -----------------------------------------------------------------------

  describe("getHealthScoreTier", () => {
    beforeEach(() => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));
    });

    it("returns Elite tier for score 86", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(86);
      expect(tier.name).toBe("Elite Metabolic Health");
    });

    it("returns Elite tier for score 100", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(100);
      expect(tier.name).toBe("Elite Metabolic Health");
    });

    it("returns Good tier for score 85", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(85);
      expect(tier.name).toBe("Good Metabolic Health");
    });

    it("returns Good tier for score 71", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(71);
      expect(tier.name).toBe("Good Metabolic Health");
    });

    it("returns Moderate tier for score 70", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(70);
      expect(tier.name).toBe("Moderate Metabolic Health");
    });

    it("returns Moderate tier for score 51", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(51);
      expect(tier.name).toBe("Moderate Metabolic Health");
    });

    it("returns Needs Attention tier for score 50", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(50);
      expect(tier.name).toBe("Needs Attention");
    });

    it("returns Needs Attention tier for score 0", () => {
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(0);
      expect(tier.name).toBe("Needs Attention");
    });

    it("falls back to last tier for score that matches no range", () => {
      // Score -1 won't match any tier (minScore 0 to maxScore 100)
      const { result } = renderHook(() => useCalculatorSettings());
      const tier = result.current.getHealthScoreTier(-1);
      // Fallback is last tier
      expect(tier.name).toBe("Needs Attention");
    });
  });

  // -----------------------------------------------------------------------
  // calculatePhysicalScore
  // -----------------------------------------------------------------------

  describe("calculatePhysicalScore", () => {
    beforeEach(() => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));
    });

    // Default settings:
    // base: 75
    // bmi_optimal: +15 (18.5-24.9)
    // bmi_acceptable: +10 (17.0-29.9)
    // bmi_outside: +5
    // bodyfat_optimal: +10
    // bodyfat_acceptable: +7
    // bodyfat_outside: +3

    describe("BMI scoring", () => {
      it("adds optimal BMI points for BMI 22 (in 18.5-24.9)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, undefined, "male");
        expect(score).toBe(75 + 15); // 90
      });

      it("adds optimal BMI points for BMI at boundary 18.5", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(18.5, undefined, "male");
        expect(score).toBe(75 + 15);
      });

      it("adds optimal BMI points for BMI at boundary 24.9", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(24.9, undefined, "male");
        expect(score).toBe(75 + 15);
      });

      it("adds acceptable BMI points for BMI 17.5 (in 17.0-29.9 but outside optimal)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(17.5, undefined, "male");
        expect(score).toBe(75 + 10); // 85
      });

      it("adds acceptable BMI points for BMI 28 (in acceptable range)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(28, undefined, "male");
        expect(score).toBe(75 + 10);
      });

      it("adds outside BMI points for BMI 16 (below acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(16, undefined, "male");
        expect(score).toBe(75 + 5); // 80
      });

      it("adds outside BMI points for BMI 35 (above acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(35, undefined, "male");
        expect(score).toBe(75 + 5);
      });
    });

    describe("body fat scoring - male", () => {
      // Male optimal: 10-20, acceptable: 8-24

      it("adds optimal body fat points for male with 15% (in 10-20)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 15, "male");
        // 75 (base) + 15 (bmi optimal) + 10 (bf optimal) = 100
        expect(score).toBe(100);
      });

      it("adds optimal body fat points for male at boundary 10%", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 10, "male");
        expect(score).toBe(100);
      });

      it("adds optimal body fat points for male at boundary 20%", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 20, "male");
        expect(score).toBe(100);
      });

      it("adds acceptable body fat points for male with 9% (in 8-24 but outside optimal)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 9, "male");
        // 75 + 15 + 7 = 97
        expect(score).toBe(97);
      });

      it("adds acceptable body fat points for male with 23% (in acceptable, outside optimal)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 23, "male");
        expect(score).toBe(97);
      });

      it("adds outside body fat points for male with 5% (below acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 5, "male");
        // 75 + 15 + 3 = 93
        expect(score).toBe(93);
      });

      it("adds outside body fat points for male with 30% (above acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 30, "male");
        expect(score).toBe(93);
      });
    });

    describe("body fat scoring - female", () => {
      // Female optimal: 18-28, acceptable: 15-32

      it("adds optimal body fat points for female with 22% (in 18-28)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 22, "female");
        // 75 + 15 + 10 = 100
        expect(score).toBe(100);
      });

      it("adds optimal body fat points for female at boundary 18%", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 18, "female");
        expect(score).toBe(100);
      });

      it("adds optimal body fat points for female at boundary 28%", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 28, "female");
        expect(score).toBe(100);
      });

      it("adds acceptable body fat points for female with 16% (in 15-32, outside optimal)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 16, "female");
        // 75 + 15 + 7 = 97
        expect(score).toBe(97);
      });

      it("adds acceptable body fat points for female with 30% (in acceptable, outside optimal)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 30, "female");
        expect(score).toBe(97);
      });

      it("adds outside body fat points for female with 12% (below acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 12, "female");
        // 75 + 15 + 3 = 93
        expect(score).toBe(93);
      });

      it("adds outside body fat points for female with 38% (above acceptable)", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 38, "female");
        expect(score).toBe(93);
      });
    });

    describe("no body fat provided", () => {
      it("does not add body fat points when bodyFatPercent is undefined", () => {
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, undefined, "female");
        // 75 + 15 = 90 (no body fat points)
        expect(score).toBe(90);
      });
    });

    describe("score capping", () => {
      it("caps score at 100", () => {
        // With optimal BMI + optimal body fat = 75 + 15 + 10 = 100
        const { result } = renderHook(() => useCalculatorSettings());
        const score = result.current.calculatePhysicalScore(22, 15, "male");
        expect(score).toBe(100);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  // -----------------------------------------------------------------------
  // calculateLifestyleMultiplier
  // -----------------------------------------------------------------------

  describe("calculateLifestyleMultiplier", () => {
    it("returns 1.0 when lifestyle score is 50 (neutral)", () => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));

      const { result } = renderHook(() => useCalculatorSettings());
      expect(result.current.calculateLifestyleMultiplier(50)).toBe(1.0);
    });

    it("returns boost for score above 50", () => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));

      const { result } = renderHook(() => useCalculatorSettings());
      // 1 + (80 - 50) / 500 = 1 + 30/500 = 1.06
      expect(result.current.calculateLifestyleMultiplier(80)).toBeCloseTo(1.06);
    });

    it("returns reduction for score below 50", () => {
      mockUseList.mockReturnValue(mockListReturn([DEFAULT_CALCULATOR_SETTINGS]));

      const { result } = renderHook(() => useCalculatorSettings());
      // 1 + (30 - 50) / 500 = 1 + (-20)/500 = 0.96
      expect(result.current.calculateLifestyleMultiplier(30)).toBeCloseTo(0.96);
    });

    it("returns 1.0 when lifestyle multiplier is disabled", () => {
      const disabledSettings = {
        ...DEFAULT_CALCULATOR_SETTINGS,
        lifestyle_multiplier_enabled: false,
      };
      mockUseList.mockReturnValue(mockListReturn([disabledSettings]));

      const { result } = renderHook(() => useCalculatorSettings());
      // Should always return 1 regardless of score
      expect(result.current.calculateLifestyleMultiplier(80)).toBe(1);
      expect(result.current.calculateLifestyleMultiplier(30)).toBe(1);
      expect(result.current.calculateLifestyleMultiplier(50)).toBe(1);
    });

    it("uses custom divisor from settings", () => {
      const customSettings = {
        ...DEFAULT_CALCULATOR_SETTINGS,
        lifestyle_multiplier_divisor: 250,
      };
      mockUseList.mockReturnValue(mockListReturn([customSettings]));

      const { result } = renderHook(() => useCalculatorSettings());
      // 1 + (80 - 50) / 250 = 1 + 30/250 = 1.12
      expect(result.current.calculateLifestyleMultiplier(80)).toBeCloseTo(1.12);
    });
  });
});

// ---------------------------------------------------------------------------
// getDefaultCalculatorSettings
// ---------------------------------------------------------------------------

describe("getDefaultCalculatorSettings", () => {
  it("returns the DEFAULT_CALCULATOR_SETTINGS object", () => {
    const settings = getDefaultCalculatorSettings();
    expect(settings).toEqual(DEFAULT_CALCULATOR_SETTINGS);
  });

  it("includes all required fields", () => {
    const settings = getDefaultCalculatorSettings();

    // Activity multipliers
    expect(settings.activity_sedentary).toBeDefined();
    expect(settings.activity_extremely_active).toBeDefined();

    // Goal adjustments
    expect(settings.goal_fat_loss_adjustment).toBeDefined();
    expect(settings.goal_maintain_adjustment).toBeDefined();
    expect(settings.goal_muscle_gain_adjustment).toBeDefined();

    // Protein ratios
    expect(settings.protein_fat_loss).toBeDefined();
    expect(settings.protein_maintain).toBeDefined();
    expect(settings.protein_muscle_gain).toBeDefined();

    // Health score tiers
    expect(settings.health_score_tiers).toHaveLength(4);

    // Physical score config
    expect(settings.physical_score_base).toBe(75);

    // Lifestyle multiplier
    expect(settings.lifestyle_multiplier_enabled).toBe(true);
    expect(settings.lifestyle_multiplier_divisor).toBe(500);
  });
});
