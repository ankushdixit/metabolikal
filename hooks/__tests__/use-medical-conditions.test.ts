/**
 * Tests for useMedicalConditions hook and calculateMetabolicImpactFromConditions
 *
 * Covers:
 * - useMedicalConditions hook (conditions list, loading, error, refetch)
 * - Gender filtering logic
 * - includeInactive option
 * - calculateMetabolicImpactFromConditions (empty, none, single, multiple, cap, unknown, settings)
 */

import { renderHook } from "@testing-library/react";
import {
  useMedicalConditions,
  calculateMetabolicImpactFromConditions,
} from "../use-medical-conditions";
import type { MedicalConditionRow, CalculatorSettingsRow } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

const mockUseList = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

jest.mock("../use-calculator-settings", () => ({
  DEFAULT_CALCULATOR_SETTINGS: {
    metabolic_impact_cap: 25,
  },
}));

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockConditions: MedicalConditionRow[] = [
  {
    id: "1",
    name: "Hypothyroidism",
    slug: "hypothyroidism",
    impact_percent: 8,
    gender_restriction: null,
    description: "Underactive thyroid gland",
    is_active: true,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "2",
    name: "PCOS",
    slug: "pcos",
    impact_percent: 10,
    gender_restriction: "female",
    description: "Polycystic ovary syndrome",
    is_active: true,
    display_order: 2,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "3",
    name: "Type 2 Diabetes",
    slug: "type2-diabetes",
    impact_percent: 12,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 3,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "4",
    name: "Metabolic Syndrome",
    slug: "metabolic-syndrome",
    impact_percent: 15,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 4,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "5",
    name: "None of the above",
    slug: "none",
    impact_percent: 0,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 100,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "6",
    name: "Low Testosterone",
    slug: "low-testosterone",
    impact_percent: 7,
    gender_restriction: "male",
    description: "Male-specific condition",
    is_active: true,
    display_order: 5,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "7",
    name: "Deprecated Condition",
    slug: "deprecated",
    impact_percent: 5,
    gender_restriction: null,
    description: null,
    is_active: false,
    display_order: 99,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMock(
  data: MedicalConditionRow[] = mockConditions,
  opts?: {
    isLoading?: boolean;
    error?: Error | null;
  }
) {
  mockUseList.mockReturnValue({
    query: {
      isLoading: opts?.isLoading ?? false,
      error: opts?.error ?? null,
      data: { data },
      refetch: mockRefetch,
    },
  });
}

// ---------------------------------------------------------------------------
// Tests: useMedicalConditions hook
// ---------------------------------------------------------------------------

describe("useMedicalConditions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("basic data fetching", () => {
    it("should return all active conditions by default", () => {
      setupMock(mockConditions.filter((c) => c.is_active));

      const { result } = renderHook(() => useMedicalConditions());

      // Without gender filter, should return all active conditions
      expect(result.current.conditions.length).toBeGreaterThan(0);
      expect(result.current.allConditions.length).toBeGreaterThan(0);
    });

    it("should return conditions and allConditions", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual(activeConditions);
      expect(result.current.allConditions).toEqual(activeConditions);
    });

    it("should return empty array when no conditions exist", () => {
      setupMock([]);

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual([]);
      expect(result.current.allConditions).toEqual([]);
    });

    it("should provide loading state", () => {
      setupMock([], { isLoading: true });

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.isLoading).toBe(true);
    });

    it("should provide error state", () => {
      const error = new Error("Failed to fetch");
      setupMock([], { error });

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.error).toBe(error);
    });

    it("should provide refetch function", () => {
      setupMock();

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.refetch).toBe(mockRefetch);
    });

    it("should not be loading when data is fetched", () => {
      setupMock(mockConditions);

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("query configuration", () => {
    it("should filter by is_active by default", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "medical_conditions",
          filters: [{ field: "is_active", operator: "eq", value: true }],
        })
      );
    });

    it("should not filter by is_active when includeInactive is true", () => {
      setupMock();

      renderHook(() => useMedicalConditions({ includeInactive: true }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "medical_conditions",
          filters: [],
        })
      );
    });

    it("should sort by display_order ascending", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          sorters: [{ field: "display_order", order: "asc" }],
        })
      );
    });

    it("should disable pagination", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: { mode: "off" },
        })
      );
    });

    it("should set retry to 1", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({ retry: 1 }),
        })
      );
    });

    it("should set staleTime to 5 minutes", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({ staleTime: 5 * 60 * 1000 }),
        })
      );
    });
  });

  describe("gender filtering", () => {
    it("should return all conditions when gender is null", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions({ gender: null }));

      expect(result.current.conditions).toEqual(activeConditions);
    });

    it("should return all conditions when gender is not provided", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual(activeConditions);
    });

    it("should filter female-restricted conditions for male users", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions({ gender: "male" }));

      // Should include: gender_restriction === null OR gender_restriction === "male"
      // Should exclude: PCOS (gender_restriction === "female")
      const hasPcos = result.current.conditions.some((c) => c.slug === "pcos");
      expect(hasPcos).toBe(false);

      // Should include low-testosterone (male-specific)
      const hasLowT = result.current.conditions.some((c) => c.slug === "low-testosterone");
      expect(hasLowT).toBe(true);

      // Should include conditions with no restriction
      const hasHypo = result.current.conditions.some((c) => c.slug === "hypothyroidism");
      expect(hasHypo).toBe(true);
    });

    it("should filter male-restricted conditions for female users", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions({ gender: "female" }));

      // Should include: gender_restriction === null OR gender_restriction === "female"
      // Should exclude: low-testosterone (gender_restriction === "male")
      const hasLowT = result.current.conditions.some((c) => c.slug === "low-testosterone");
      expect(hasLowT).toBe(false);

      // Should include PCOS (female-specific)
      const hasPcos = result.current.conditions.some((c) => c.slug === "pcos");
      expect(hasPcos).toBe(true);

      // Should include conditions with no restriction
      const hasHypo = result.current.conditions.some((c) => c.slug === "hypothyroidism");
      expect(hasHypo).toBe(true);
    });

    it("should still return allConditions unfiltered by gender", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result } = renderHook(() => useMedicalConditions({ gender: "male" }));

      // conditions should be filtered
      expect(result.current.conditions.length).toBeLessThan(result.current.allConditions.length);

      // allConditions should still have all items from the query
      expect(result.current.allConditions).toEqual(activeConditions);
    });

    it("should include conditions with null gender_restriction for any gender", () => {
      const activeConditions = mockConditions.filter((c) => c.is_active);
      setupMock(activeConditions);

      const { result: maleResult } = renderHook(() => useMedicalConditions({ gender: "male" }));
      const { result: femaleResult } = renderHook(() => useMedicalConditions({ gender: "female" }));

      // Both should include hypothyroidism (gender_restriction === null)
      expect(maleResult.current.conditions.some((c) => c.slug === "hypothyroidism")).toBe(true);
      expect(femaleResult.current.conditions.some((c) => c.slug === "hypothyroidism")).toBe(true);
    });
  });

  describe("includeInactive option", () => {
    it("should use is_active filter by default (includeInactive = false)", () => {
      setupMock();

      renderHook(() => useMedicalConditions());

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{ field: "is_active", operator: "eq", value: true }],
        })
      );
    });

    it("should not use is_active filter when includeInactive is true", () => {
      setupMock();

      renderHook(() => useMedicalConditions({ includeInactive: true }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [],
        })
      );
    });

    it("should use is_active filter when includeInactive is explicitly false", () => {
      setupMock();

      renderHook(() => useMedicalConditions({ includeInactive: false }));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{ field: "is_active", operator: "eq", value: true }],
        })
      );
    });
  });

  describe("empty options", () => {
    it("should work with default empty options object", () => {
      setupMock([]);

      const { result } = renderHook(() => useMedicalConditions({}));

      expect(result.current.conditions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should work with no arguments", () => {
      setupMock([]);

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual([]);
    });
  });

  describe("data fallback", () => {
    it("should return empty array when query data is undefined", () => {
      mockUseList.mockReturnValue({
        query: {
          isLoading: false,
          error: null,
          data: undefined,
          refetch: mockRefetch,
        },
      });

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual([]);
      expect(result.current.allConditions).toEqual([]);
    });

    it("should return empty array when query data.data is undefined", () => {
      mockUseList.mockReturnValue({
        query: {
          isLoading: false,
          error: null,
          data: { data: undefined },
          refetch: mockRefetch,
        },
      });

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual([]);
      expect(result.current.allConditions).toEqual([]);
    });

    it("should return empty array when query data.data is null", () => {
      mockUseList.mockReturnValue({
        query: {
          isLoading: false,
          error: null,
          data: { data: null },
          refetch: mockRefetch,
        },
      });

      const { result } = renderHook(() => useMedicalConditions());

      expect(result.current.conditions).toEqual([]);
      expect(result.current.allConditions).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: calculateMetabolicImpactFromConditions
// ---------------------------------------------------------------------------

describe("calculateMetabolicImpactFromConditions", () => {
  it("returns 0 for empty conditions array", () => {
    expect(calculateMetabolicImpactFromConditions([], mockConditions)).toBe(0);
  });

  it("returns 0 when 'none' is selected", () => {
    expect(calculateMetabolicImpactFromConditions(["none"], mockConditions)).toBe(0);
  });

  it("returns 0 when 'none' is selected with other conditions", () => {
    // If "none" is in the array, it should override and return 0
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism", "none"], mockConditions)).toBe(
      0
    );
  });

  it("returns 0 when 'none' is the first item with other conditions", () => {
    expect(
      calculateMetabolicImpactFromConditions(["none", "hypothyroidism", "pcos"], mockConditions)
    ).toBe(0);
  });

  it("calculates correct impact for single condition using slug", () => {
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism"], mockConditions)).toBe(8);
    expect(calculateMetabolicImpactFromConditions(["type2-diabetes"], mockConditions)).toBe(12);
    expect(calculateMetabolicImpactFromConditions(["pcos"], mockConditions)).toBe(10);
    expect(calculateMetabolicImpactFromConditions(["metabolic-syndrome"], mockConditions)).toBe(15);
  });

  it("sums multiple conditions correctly", () => {
    // hypothyroidism (8) + pcos (10) = 18
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism", "pcos"], mockConditions)).toBe(
      18
    );
  });

  it("sums three conditions correctly (under cap)", () => {
    // hypothyroidism (8) + pcos (10) + low-testosterone (7) = 25, exactly at cap
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "pcos", "low-testosterone"],
        mockConditions
      )
    ).toBe(25);
  });

  it("caps total impact at default 25%", () => {
    // hypothyroidism (8) + type2-diabetes (12) + metabolic-syndrome (15) = 35 -> capped at 25
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "type2-diabetes", "metabolic-syndrome"],
        mockConditions
      )
    ).toBe(25);
  });

  it("caps at exactly the cap value when sum equals cap", () => {
    // hypothyroidism (8) + pcos (10) + low-testosterone (7) = 25
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "pcos", "low-testosterone"],
        mockConditions
      )
    ).toBe(25);
  });

  it("ignores unknown condition slugs", () => {
    expect(calculateMetabolicImpactFromConditions(["unknown-condition"], mockConditions)).toBe(0);
  });

  it("handles mixed known and unknown conditions", () => {
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "unknown-condition"],
        mockConditions
      )
    ).toBe(8);
  });

  it("handles empty conditions database array", () => {
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism"], [])).toBe(0);
  });

  it("handles all unknown conditions with non-empty database", () => {
    expect(calculateMetabolicImpactFromConditions(["foo", "bar", "baz"], mockConditions)).toBe(0);
  });

  describe("with custom settings", () => {
    it("uses custom metabolic_impact_cap from settings", () => {
      const settings = {
        metabolic_impact_cap: 15,
      } as CalculatorSettingsRow;

      // hypothyroidism (8) + pcos (10) = 18 -> capped at 15
      expect(
        calculateMetabolicImpactFromConditions(["hypothyroidism", "pcos"], mockConditions, settings)
      ).toBe(15);
    });

    it("uses higher custom cap", () => {
      const settings = {
        metabolic_impact_cap: 50,
      } as CalculatorSettingsRow;

      // hypothyroidism (8) + type2-diabetes (12) + metabolic-syndrome (15) = 35 (under 50 cap)
      expect(
        calculateMetabolicImpactFromConditions(
          ["hypothyroidism", "type2-diabetes", "metabolic-syndrome"],
          mockConditions,
          settings
        )
      ).toBe(35);
    });

    it("uses zero cap from settings", () => {
      const settings = {
        metabolic_impact_cap: 0,
      } as CalculatorSettingsRow;

      expect(
        calculateMetabolicImpactFromConditions(["hypothyroidism"], mockConditions, settings)
      ).toBe(0);
    });

    it("falls back to default cap when settings is undefined", () => {
      // Default cap is 25
      // hypothyroidism (8) + type2-diabetes (12) + metabolic-syndrome (15) = 35 -> 25
      expect(
        calculateMetabolicImpactFromConditions(
          ["hypothyroidism", "type2-diabetes", "metabolic-syndrome"],
          mockConditions,
          undefined
        )
      ).toBe(25);
    });

    it("falls back to default when settings has no metabolic_impact_cap", () => {
      const settings = {} as CalculatorSettingsRow;

      // Without metabolic_impact_cap in settings, should fall back to DEFAULT (25)
      // hypothyroidism (8) + type2-diabetes (12) + metabolic-syndrome (15) = 35 -> 25
      expect(
        calculateMetabolicImpactFromConditions(
          ["hypothyroidism", "type2-diabetes", "metabolic-syndrome"],
          mockConditions,
          settings
        )
      ).toBe(25);
    });
  });

  describe("edge cases", () => {
    it("handles condition with 0 impact_percent", () => {
      // "none" slug has impact 0, but it short-circuits before summing
      // Create a non-"none" condition with 0 impact
      const conditionsWithZero: MedicalConditionRow[] = [
        {
          id: "z1",
          name: "Zero Impact",
          slug: "zero-impact",
          impact_percent: 0,
          gender_restriction: null,
          description: null,
          is_active: true,
          display_order: 1,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      expect(calculateMetabolicImpactFromConditions(["zero-impact"], conditionsWithZero)).toBe(0);
    });

    it("handles duplicate slugs in selection", () => {
      // hypothyroidism (8) + hypothyroidism (8) = 16
      expect(
        calculateMetabolicImpactFromConditions(["hypothyroidism", "hypothyroidism"], mockConditions)
      ).toBe(16);
    });

    it("handles single condition exactly at cap", () => {
      const settings = { metabolic_impact_cap: 8 } as CalculatorSettingsRow;

      expect(
        calculateMetabolicImpactFromConditions(
          ["hypothyroidism"], // 8, cap at 8
          mockConditions,
          settings
        )
      ).toBe(8);
    });

    it("handles single condition exceeding cap", () => {
      const settings = { metabolic_impact_cap: 5 } as CalculatorSettingsRow;

      expect(
        calculateMetabolicImpactFromConditions(
          ["hypothyroidism"], // 8, cap at 5
          mockConditions,
          settings
        )
      ).toBe(5);
    });
  });
});
