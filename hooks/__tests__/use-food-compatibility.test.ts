/**
 * Tests for useFoodCompatibility hook
 *
 * These tests verify the food-condition compatibility checking logic.
 * The hook cross-references food_item_conditions with client_conditions
 * to determine if any incompatibilities exist.
 */

import { renderHook } from "@testing-library/react";
import { useFoodCompatibility } from "../use-food-compatibility";
import type { ClientConditionWithDetails } from "../use-timeline-data";

// Mock useList from Refine
const mockUseList = jest.fn();
jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

describe("useFoodCompatibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock client conditions
  const createClientCondition = (
    id: string,
    conditionId: string,
    conditionName: string
  ): ClientConditionWithDetails => ({
    id,
    client_id: "client-1",
    condition_id: conditionId,
    diagnosed_at: null,
    notes: null,
    created_at: "2026-01-26T00:00:00Z",
    created_by: null,
    medical_conditions: {
      id: conditionId,
      name: conditionName,
      slug: conditionName.toLowerCase().replace(/ /g, "-"),
      impact_percent: 10,
      gender_restriction: null,
      description: null,
      is_active: true,
      display_order: 1,
      created_at: "2026-01-26T00:00:00Z",
      updated_at: "2026-01-26T00:00:00Z",
    },
  });

  describe("when no food item is selected", () => {
    it("returns no incompatibilities", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Hypothyroidism")];

      const { result } = renderHook(() => useFoodCompatibility(null, clientConditions));

      expect(result.current.incompatibleConditions).toEqual([]);
      expect(result.current.hasIncompatibility).toBe(false);
    });
  });

  describe("when client has no conditions", () => {
    it("returns no incompatibilities", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const { result } = renderHook(() => useFoodCompatibility("food-1", []));

      expect(result.current.incompatibleConditions).toEqual([]);
      expect(result.current.hasIncompatibility).toBe(false);
    });
  });

  describe("when food has no condition restrictions", () => {
    it("returns no incompatibilities", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] }, // No food_item_conditions for this food
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Hypothyroidism")];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toEqual([]);
      expect(result.current.hasIncompatibility).toBe(false);
    });
  });

  describe("when food has restrictions that match client conditions", () => {
    it("returns the matching incompatible conditions", () => {
      // Food is incompatible with Hypothyroidism
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-hypothyroidism",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-hypothyroidism",
                  name: "Hypothyroidism",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      // Client has Hypothyroidism
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toEqual([
        { id: "cond-hypothyroidism", name: "Hypothyroidism" },
      ]);
      expect(result.current.hasIncompatibility).toBe(true);
    });

    it("returns multiple matching conditions", () => {
      // Food is incompatible with both Hypothyroidism and Type 2 Diabetes
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-hypothyroidism",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-hypothyroidism",
                  name: "Hypothyroidism",
                },
              },
              {
                id: "fic-2",
                food_item_id: "food-1",
                condition_id: "cond-diabetes",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-diabetes",
                  name: "Type 2 Diabetes",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      // Client has both conditions
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
        createClientCondition("cc-2", "cond-diabetes", "Type 2 Diabetes"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toHaveLength(2);
      expect(result.current.incompatibleConditions).toContainEqual({
        id: "cond-hypothyroidism",
        name: "Hypothyroidism",
      });
      expect(result.current.incompatibleConditions).toContainEqual({
        id: "cond-diabetes",
        name: "Type 2 Diabetes",
      });
      expect(result.current.hasIncompatibility).toBe(true);
    });
  });

  describe("when food has restrictions that don't match client conditions", () => {
    it("returns no incompatibilities", () => {
      // Food is incompatible with PCOS
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-pcos",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-pcos",
                  name: "PCOS",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      // Client has Hypothyroidism (different condition)
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toEqual([]);
      expect(result.current.hasIncompatibility).toBe(false);
    });
  });

  describe("when some food restrictions match and some don't", () => {
    it("returns only the matching conditions", () => {
      // Food is incompatible with Hypothyroidism and PCOS
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-hypothyroidism",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-hypothyroidism",
                  name: "Hypothyroidism",
                },
              },
              {
                id: "fic-2",
                food_item_id: "food-1",
                condition_id: "cond-pcos",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-pcos",
                  name: "PCOS",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      // Client only has Hypothyroidism
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toEqual([
        { id: "cond-hypothyroidism", name: "Hypothyroidism" },
      ]);
      expect(result.current.hasIncompatibility).toBe(true);
    });
  });

  describe("loading state", () => {
    it("returns isChecking true while loading", () => {
      mockUseList.mockReturnValue({
        query: {
          data: null,
          isLoading: true,
        },
      });

      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.isChecking).toBe(true);
    });

    it("returns isChecking false when done loading", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.isChecking).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles missing medical_conditions name gracefully", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-unknown",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: null, // No joined data
              },
            ],
          },
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-unknown", "Unknown")];

      const { result } = renderHook(() => useFoodCompatibility("food-1", clientConditions));

      expect(result.current.incompatibleConditions).toEqual([
        { id: "cond-unknown", name: "Unknown condition" },
      ]);
    });

    it("uses correct query filters", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Test")];

      renderHook(() => useFoodCompatibility("test-food-id", clientConditions));

      // Verify useList was called with correct parameters
      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "food_item_conditions",
          filters: [{ field: "food_item_id", operator: "eq", value: "test-food-id" }],
          meta: {
            select: "*, medical_conditions(id, name)",
          },
        })
      );
    });

    it("disables query when foodItemId is null", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Test")];

      renderHook(() => useFoodCompatibility(null, clientConditions));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: {
            enabled: false,
          },
        })
      );
    });

    it("disables query when clientConditions is empty", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      renderHook(() => useFoodCompatibility("food-1", []));

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: {
            enabled: false,
          },
        })
      );
    });
  });
});
