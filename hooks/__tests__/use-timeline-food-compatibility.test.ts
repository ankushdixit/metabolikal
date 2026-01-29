/**
 * Tests for useTimelineFoodCompatibility hook
 *
 * This hook batch-checks food compatibility for all diet items on a timeline day.
 * It returns a map of food_item_id -> incompatible condition names.
 */

import { renderHook } from "@testing-library/react";
import { useTimelineFoodCompatibility } from "../use-timeline-food-compatibility";
import type { ClientConditionWithDetails, DietPlanWithFood } from "../use-timeline-data";

// Mock useList from Refine
const mockUseList = jest.fn();
jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

describe("useTimelineFoodCompatibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock diet plan with food
  const createDietPlan = (id: string, foodItemId: string, foodName: string): DietPlanWithFood => ({
    id,
    client_id: "client-1",
    day_number: 1,
    food_item_id: foodItemId,
    meal_category: "breakfast",
    serving_multiplier: 1,
    notes: null,
    time_type: "fixed",
    time_start: "08:00",
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
    food_items: {
      id: foodItemId,
      name: foodName,
      calories: 200,
      protein: 20,
      carbs: 10,
      fats: 5,
      serving_size: "100g",
      is_vegetarian: false,
      meal_types: null,
      raw_quantity: null,
      cooked_quantity: null,
      created_at: "2026-01-26T00:00:00Z",
      updated_at: "2026-01-26T00:00:00Z",
    },
  });

  // Helper to create mock client condition
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

  describe("when no diet plans exist", () => {
    it("returns empty incompatibility data", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Hypothyroidism")];

      const { result } = renderHook(() => useTimelineFoodCompatibility([], clientConditions));

      expect(result.current.incompatibleFoodsMap.size).toBe(0);
      expect(result.current.incompatibleFoodIds.size).toBe(0);
      expect(result.current.incompatibilities).toHaveLength(0);
    });
  });

  describe("when client has no conditions", () => {
    it("returns empty incompatibility data", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const dietPlans = [createDietPlan("dp-1", "food-1", "Eggs")];

      const { result } = renderHook(() => useTimelineFoodCompatibility(dietPlans, []));

      expect(result.current.incompatibleFoodsMap.size).toBe(0);
      expect(result.current.incompatibleFoodIds.size).toBe(0);
      expect(result.current.incompatibilities).toHaveLength(0);
    });
  });

  describe("when foods have no condition restrictions", () => {
    it("returns empty incompatibility data", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] }, // No food_item_conditions in database
          isLoading: false,
        },
      });

      const dietPlans = [createDietPlan("dp-1", "food-1", "Eggs")];
      const clientConditions = [createClientCondition("cc-1", "cond-1", "Hypothyroidism")];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodsMap.size).toBe(0);
      expect(result.current.incompatibleFoodIds.size).toBe(0);
    });
  });

  describe("when food has restrictions matching client conditions", () => {
    it("returns the incompatible food with condition names", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-soy",
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

      const dietPlans = [createDietPlan("dp-1", "food-soy", "Soy Milk")];
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodIds.has("food-soy")).toBe(true);
      expect(result.current.incompatibleFoodsMap.get("food-soy")).toEqual(["Hypothyroidism"]);
      expect(result.current.incompatibilities).toContainEqual({
        foodItemId: "food-soy",
        foodName: "Soy Milk",
        conditions: ["Hypothyroidism"],
      });
    });

    it("returns multiple incompatible foods", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-soy",
                condition_id: "cond-hypothyroidism",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-hypothyroidism",
                  name: "Hypothyroidism",
                },
              },
              {
                id: "fic-2",
                food_item_id: "food-cabbage",
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

      const dietPlans = [
        createDietPlan("dp-1", "food-soy", "Soy Milk"),
        createDietPlan("dp-2", "food-cabbage", "Cabbage"),
      ];
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodIds.size).toBe(2);
      expect(result.current.incompatibleFoodIds.has("food-soy")).toBe(true);
      expect(result.current.incompatibleFoodIds.has("food-cabbage")).toBe(true);
      expect(result.current.incompatibilities).toHaveLength(2);
    });

    it("returns food with multiple incompatible conditions", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-rice",
                condition_id: "cond-diabetes",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-diabetes",
                  name: "Type 2 Diabetes",
                },
              },
              {
                id: "fic-2",
                food_item_id: "food-rice",
                condition_id: "cond-insulin-resistance",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-insulin-resistance",
                  name: "Insulin Resistance",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      const dietPlans = [createDietPlan("dp-1", "food-rice", "White Rice")];
      const clientConditions = [
        createClientCondition("cc-1", "cond-diabetes", "Type 2 Diabetes"),
        createClientCondition("cc-2", "cond-insulin-resistance", "Insulin Resistance"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodsMap.get("food-rice")).toHaveLength(2);
      expect(result.current.incompatibleFoodsMap.get("food-rice")).toContain("Type 2 Diabetes");
      expect(result.current.incompatibleFoodsMap.get("food-rice")).toContain("Insulin Resistance");
    });
  });

  describe("when food has restrictions that don't match client conditions", () => {
    it("returns empty incompatibility data", () => {
      // Food is incompatible with PCOS
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-soy",
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

      const dietPlans = [createDietPlan("dp-1", "food-soy", "Soy Milk")];
      // Client has Hypothyroidism (different condition)
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodsMap.size).toBe(0);
      expect(result.current.incompatibleFoodIds.size).toBe(0);
    });
  });

  describe("loading state", () => {
    it("returns isLoading true while fetching", () => {
      mockUseList.mockReturnValue({
        query: {
          data: null,
          isLoading: true,
        },
      });

      const dietPlans = [createDietPlan("dp-1", "food-1", "Eggs")];
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("returns isLoading false when done", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const dietPlans = [createDietPlan("dp-1", "food-1", "Eggs")];
      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles diet plans without food_item_id", () => {
      mockUseList.mockReturnValue({
        query: {
          data: { data: [] },
          isLoading: false,
        },
      });

      const dietPlan: DietPlanWithFood = {
        ...createDietPlan("dp-1", "food-1", "Eggs"),
        food_item_id: null as unknown as string, // No food item
      };

      const clientConditions = [
        createClientCondition("cc-1", "cond-hypothyroidism", "Hypothyroidism"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility([dietPlan], clientConditions)
      );

      // Should not crash and return empty
      expect(result.current.incompatibleFoodsMap.size).toBe(0);
    });

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

      const dietPlans = [createDietPlan("dp-1", "food-1", "Unknown Food")];
      const clientConditions = [createClientCondition("cc-1", "cond-unknown", "Unknown")];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      expect(result.current.incompatibleFoodsMap.get("food-1")).toEqual(["Unknown condition"]);
    });

    it("handles missing food name gracefully", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-1",
                condition_id: "cond-1",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-1",
                  name: "Test Condition",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      const dietPlan: DietPlanWithFood = {
        ...createDietPlan("dp-1", "food-1", "Test"),
        food_items: null, // No food item joined
      };

      const clientConditions = [createClientCondition("cc-1", "cond-1", "Test Condition")];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility([dietPlan], clientConditions)
      );

      expect(result.current.incompatibilities[0].foodName).toBe("Unknown food");
    });

    it("deduplicates food items when same food appears multiple times", () => {
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "fic-1",
                food_item_id: "food-eggs",
                condition_id: "cond-cholesterol",
                created_at: "2026-01-26T00:00:00Z",
                medical_conditions: {
                  id: "cond-cholesterol",
                  name: "High Cholesterol",
                },
              },
            ],
          },
          isLoading: false,
        },
      });

      // Same food appears in breakfast and lunch
      const lunchPlan = createDietPlan("dp-2", "food-eggs", "Eggs");
      lunchPlan.meal_category = "lunch";
      const dietPlans = [createDietPlan("dp-1", "food-eggs", "Eggs"), lunchPlan];
      const clientConditions = [
        createClientCondition("cc-1", "cond-cholesterol", "High Cholesterol"),
      ];

      const { result } = renderHook(() =>
        useTimelineFoodCompatibility(dietPlans, clientConditions)
      );

      // Should only have one entry for eggs
      expect(result.current.incompatibilities).toHaveLength(1);
      expect(result.current.incompatibilities[0].foodItemId).toBe("food-eggs");
    });
  });
});
