/**
 * Tests for useTemplateData hook
 *
 * This hook fetches template metadata and all template items,
 * transforming them into a unified TimelineItem format for display.
 */

import { renderHook } from "@testing-library/react";
import { useTemplateData } from "../use-template-data";
import type {
  TemplateDietItemWithFood,
  TemplateSupplementItemWithSupplement,
  TemplateWorkoutItemWithExercise,
  TemplateLifestyleItemWithType,
} from "../use-template-data";
import type { PlanTemplate } from "@/lib/database.types";

// Mock Refine hooks
const mockUseOne = jest.fn();
const mockUseList = jest.fn();
const mockUseInvalidate = jest.fn();
jest.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
  useInvalidate: () => mockUseInvalidate,
}));

describe("useTemplateData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockUseOne.mockReturnValue({
      query: {
        data: null,
        isLoading: false,
        isError: false,
      },
    });
    mockUseList.mockReturnValue({
      query: {
        data: { data: [] },
        isLoading: false,
        isError: false,
      },
    });
  });

  // Helper to create mock template
  const createTemplate = (id: string, name: string): PlanTemplate => ({
    id,
    name,
    description: "Test template",
    category: "cutting",
    is_active: true,
    created_by: "admin-1",
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  });

  // Helper to create mock diet item
  const createDietItem = (
    id: string,
    templateId: string,
    foodName: string,
    mealCategory: string
  ): TemplateDietItemWithFood => ({
    id,
    template_id: templateId,
    food_item_id: `food-${id}`,
    meal_category: mealCategory,
    serving_multiplier: 1,
    time_type: "period",
    time_start: null,
    time_end: null,
    time_period: "morning",
    relative_anchor: null,
    relative_offset_minutes: null,
    notes: null,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
    food_items: {
      id: `food-${id}`,
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

  // Helper to create mock supplement item
  const createSupplementItem = (
    id: string,
    templateId: string,
    supplementName: string
  ): TemplateSupplementItemWithSupplement => ({
    id,
    template_id: templateId,
    supplement_id: `supp-${id}`,
    dosage: 1000,
    time_type: "period",
    time_start: null,
    time_end: null,
    time_period: "morning",
    relative_anchor: null,
    relative_offset_minutes: null,
    notes: null,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
    supplements: {
      id: `supp-${id}`,
      name: supplementName,
      category: "vitamin",
      default_dosage: 1000,
      dosage_unit: "mg",
      instructions: null,
      notes: null,
      is_active: true,
      display_order: 1,
      created_at: "2026-01-26T00:00:00Z",
      updated_at: "2026-01-26T00:00:00Z",
    },
  });

  // Helper to create mock workout item
  const createWorkoutItem = (
    id: string,
    templateId: string,
    exerciseName: string
  ): TemplateWorkoutItemWithExercise => ({
    id,
    template_id: templateId,
    exercise_id: `ex-${id}`,
    exercise_name: exerciseName,
    section: "main",
    sets: 3,
    reps: 10,
    notes: null,
    scheduled_duration_minutes: 5,
    duration_minutes: null,
    rest_seconds: 60,
    time_type: "period",
    time_start: null,
    time_end: null,
    time_period: "afternoon",
    relative_anchor: null,
    relative_offset_minutes: null,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
    exercises: {
      id: `ex-${id}`,
      name: exerciseName,
      category: "strength",
      muscle_group: "chest",
      equipment: "barbell",
      default_sets: 3,
      default_reps: 10,
      default_duration_seconds: null,
      rest_seconds: 60,
      instructions: null,
      video_url: null,
      thumbnail_url: null,
      difficulty_level: 2,
      is_active: true,
      display_order: 1,
      created_at: "2026-01-26T00:00:00Z",
      updated_at: "2026-01-26T00:00:00Z",
    },
  });

  // Helper to create mock lifestyle item
  const createLifestyleItem = (
    id: string,
    templateId: string,
    activityName: string
  ): TemplateLifestyleItemWithType => ({
    id,
    template_id: templateId,
    lifestyle_activity_type_id: `lat-${id}`,
    target_value: 8000,
    time_type: "all_day",
    time_start: null,
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: null,
    notes: null,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
    lifestyle_activity_types: {
      id: `lat-${id}`,
      name: activityName,
      category: "movement",
      icon: "activity",
      target_unit: "steps",
      default_target_value: 10000,
      description: null,
      rationale: null,
      is_active: true,
      display_order: 1,
      created_at: "2026-01-26T00:00:00Z",
      updated_at: "2026-01-26T00:00:00Z",
    },
  });

  describe("when templateId is null", () => {
    it("returns null template and empty items", () => {
      const { result } = renderHook(() => useTemplateData({ templateId: null }));

      expect(result.current.template).toBeNull();
      expect(result.current.timelineItems).toHaveLength(0);
      expect(result.current.packingItems).toHaveLength(0);
    });
  });

  describe("when template exists", () => {
    it("returns the template metadata", () => {
      const template = createTemplate("tpl-1", "High Protein Day");
      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.template).toEqual(template);
    });

    it("transforms diet items to timeline items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem = createDietItem("di-1", "tpl-1", "Eggs", "breakfast");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return {
            query: {
              data: { data: [dietItem] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
      expect(result.current.dietItems[0].title).toBe("Breakfast");
      expect(result.current.dietItems[0].isGrouped).toBe(true);
    });

    it("transforms supplement items to timeline items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supplementItem = createSupplementItem("si-1", "tpl-1", "Vitamin D");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return {
            query: {
              data: { data: [supplementItem] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems).toHaveLength(1);
      expect(result.current.supplementItems[0].title).toBe("Supplements");
      expect(result.current.supplementItems[0].isGrouped).toBe(true);
    });

    it("transforms workout items to timeline items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const workoutItem = createWorkoutItem("wi-1", "tpl-1", "Bench Press");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return {
            query: {
              data: { data: [workoutItem] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.workoutItems).toHaveLength(1);
      expect(result.current.workoutItems[0].title).toBe("Workout Session");
      expect(result.current.workoutItems[0].isGrouped).toBe(true);
    });

    it("transforms lifestyle items to timeline items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const lifestyleItem = createLifestyleItem("li-1", "tpl-1", "Steps");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return {
            query: {
              data: { data: [lifestyleItem] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      expect(result.current.lifestyleItems[0].title).toBe("Lifestyle Activities");
      expect(result.current.lifestyleItems[0].isGrouped).toBe(true);
    });
  });

  describe("grouping items", () => {
    it("groups diet items by meal category and time", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem1 = createDietItem("di-1", "tpl-1", "Eggs", "breakfast");
      const dietItem2 = createDietItem("di-2", "tpl-1", "Oatmeal", "breakfast");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return {
            query: {
              data: { data: [dietItem1, dietItem2] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      // Two items with same meal category should be grouped
      expect(result.current.dietItems).toHaveLength(1);
      expect(result.current.dietItems[0].itemCount).toBe(2);
      expect(result.current.dietItems[0].itemNames).toContain("Eggs");
      expect(result.current.dietItems[0].itemNames).toContain("Oatmeal");
    });

    it("groups workout items by time slot", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const workoutItem1 = createWorkoutItem("wi-1", "tpl-1", "Bench Press");
      const workoutItem2 = createWorkoutItem("wi-2", "tpl-1", "Incline Press");

      mockUseOne.mockReturnValue({
        query: {
          data: { data: template },
          isLoading: false,
          isError: false,
        },
      });

      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return {
            query: {
              data: { data: [workoutItem1, workoutItem2] },
              isLoading: false,
              isError: false,
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            isError: false,
          },
        };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      // Two items with same time should be grouped
      expect(result.current.workoutItems).toHaveLength(1);
      expect(result.current.workoutItems[0].itemCount).toBe(2);
      expect(result.current.workoutItems[0].subtitle).toBe("2 exercises");
    });
  });

  describe("loading state", () => {
    it("returns isLoading true when any query is loading", () => {
      mockUseOne.mockReturnValue({
        query: {
          data: null,
          isLoading: true,
          isError: false,
        },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.isLoading).toBe(true);
    });

    it("returns isLoading false when all queries are done", () => {
      mockUseOne.mockReturnValue({
        query: {
          data: { data: createTemplate("tpl-1", "Test") },
          isLoading: false,
          isError: false,
        },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error state", () => {
    it("returns isError true when any query has error", () => {
      mockUseOne.mockReturnValue({
        query: {
          data: null,
          isLoading: false,
          isError: true,
        },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("refetchAll", () => {
    it("calls invalidate for all template resources", () => {
      mockUseOne.mockReturnValue({
        query: {
          data: { data: createTemplate("tpl-1", "Test") },
          isLoading: false,
          isError: false,
        },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      result.current.refetchAll();

      expect(mockUseInvalidate).toHaveBeenCalledWith({
        resource: "plan_templates",
        invalidates: ["detail"],
      });
      expect(mockUseInvalidate).toHaveBeenCalledWith({
        resource: "template_diet_items",
        invalidates: ["list"],
      });
      expect(mockUseInvalidate).toHaveBeenCalledWith({
        resource: "template_supplement_items",
        invalidates: ["list"],
      });
      expect(mockUseInvalidate).toHaveBeenCalledWith({
        resource: "template_workout_items",
        invalidates: ["list"],
      });
      expect(mockUseInvalidate).toHaveBeenCalledWith({
        resource: "template_lifestyle_items",
        invalidates: ["list"],
      });
    });
  });

  describe("disabled state", () => {
    it("does not fetch when enabled is false", () => {
      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1", enabled: false }));

      // Check that queries were called with enabled: false
      expect(mockUseOne).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: { enabled: false },
        })
      );

      expect(result.current.template).toBeNull();
    });
  });
});
