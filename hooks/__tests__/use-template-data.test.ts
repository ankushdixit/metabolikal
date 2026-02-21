/* eslint-disable @typescript-eslint/no-explicit-any */
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
    quantity_grams: null,
    quantity_type: null,
    quantity_note: null,
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

  // ── Branch coverage: items with null/missing related data ──
  describe("items with missing related data", () => {
    it("handles diet item with null food_items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Eggs", "breakfast"),
        food_items: null,
        serving_multiplier: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
      // Should use "Unknown Food" fallback and 0 calories/protein
      expect(result.current.dietItems[0].metadata?.calories).toBe(0);
      expect(result.current.dietItems[0].metadata?.protein).toBe(0);
    });

    it("handles supplement item with null supplements", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supplementItem: TemplateSupplementItemWithSupplement = {
        ...createSupplementItem("si-1", "tpl-1", "Vitamin D"),
        supplements: null,
        dosage: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return { query: { data: { data: [supplementItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems).toHaveLength(1);
      expect(result.current.supplementItems[0].title).toBe("Supplements");
    });

    it("handles workout item with null exercises and missing fields", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const workoutItem: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-1", "tpl-1", "Bench Press"),
        exercises: null,
        exercise_name: null as any,
        section: null as any,
        sets: null as any,
        reps: null as any,
        scheduled_duration_minutes: null as any,
        duration_minutes: null as any,
        display_order: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return { query: { data: { data: [workoutItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.workoutItems).toHaveLength(1);
      expect(result.current.workoutItems[0].title).toBe("Workout Session");
    });

    it("handles lifestyle item with null lifestyle_activity_types", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const lifestyleItem: TemplateLifestyleItemWithType = {
        ...createLifestyleItem("li-1", "tpl-1", "Steps"),
        lifestyle_activity_types: null,
        target_value: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return { query: { data: { data: [lifestyleItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      expect(result.current.lifestyleItems[0].title).toBe("Lifestyle Activities");
    });
  });

  // ── Branch coverage: different scheduling types ──
  describe("different scheduling types", () => {
    it("handles fixed time scheduling", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Eggs", "breakfast"),
        time_type: "fixed",
        time_start: "08:00",
        time_end: "08:30",
        time_period: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
      // Packing item should use the time_end
      expect(result.current.packingItems).toHaveLength(1);
    });

    it("handles relative anchor scheduling", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supplementItem: TemplateSupplementItemWithSupplement = {
        ...createSupplementItem("si-1", "tpl-1", "Creatine"),
        time_type: "relative",
        time_period: null,
        relative_anchor: "wake" as any,
        relative_offset_minutes: 30,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return { query: { data: { data: [supplementItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems).toHaveLength(1);
      expect(result.current.packingItems).toHaveLength(1);
    });

    it("handles all_day scheduling for lifestyle items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const lifestyleItem: TemplateLifestyleItemWithType = {
        ...createLifestyleItem("li-1", "tpl-1", "Water Intake"),
        time_type: "all_day",
        time_period: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return { query: { data: { data: [lifestyleItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      // all_day packing should span 05:00 to 23:00
      expect(result.current.packingItems).toHaveLength(1);
    });

    it("handles null/unknown time_type by using default scheduling key", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Snack", "snack"),
        time_type: null,
        time_start: null,
        time_end: null,
        time_period: null,
        relative_anchor: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
    });
  });

  // ── Branch coverage: refetchAll with null templateId ──
  describe("refetchAll with null templateId", () => {
    it("does not call invalidate when templateId is null", () => {
      const { result } = renderHook(() => useTemplateData({ templateId: null }));

      result.current.refetchAll();

      expect(mockUseInvalidate).not.toHaveBeenCalled();
    });
  });

  // ── Branch coverage: isError from list queries ──
  describe("error states from list queries", () => {
    it("returns isError true when a list query has error", () => {
      mockUseOne.mockReturnValue({
        query: { data: null, isLoading: false, isError: false },
      });
      let callCount = 0;
      mockUseList.mockImplementation(() => {
        callCount++;
        // Make the second list query return an error (supplement items)
        if (callCount === 2) {
          return { query: { data: { data: [] }, isLoading: false, isError: true } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.isError).toBe(true);
    });
  });

  // ── Branch coverage: isLoading from list queries ──
  describe("loading states from list queries", () => {
    it("returns isLoading true when a list query is still loading", () => {
      mockUseOne.mockReturnValue({
        query: { data: null, isLoading: false, isError: false },
      });
      let callCount = 0;
      mockUseList.mockImplementation(() => {
        callCount++;
        // Make the third list query loading (workout items)
        if (callCount === 3) {
          return { query: { data: { data: [] }, isLoading: true, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.isLoading).toBe(true);
    });
  });

  // ── Branch coverage: grouping subtitle text for single items ──
  describe("group subtitle text variations", () => {
    it("shows '1 supplement' for single supplement group", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supplementItem = createSupplementItem("si-1", "tpl-1", "Omega 3");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return { query: { data: { data: [supplementItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems[0].subtitle).toBe("1 supplement");
    });

    it("shows '1 exercise' for single workout group", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const workoutItem = createWorkoutItem("wi-1", "tpl-1", "Squats");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return { query: { data: { data: [workoutItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.workoutItems[0].subtitle).toBe("1 exercise");
    });

    it("shows '1 activity' for single lifestyle group", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const lifestyleItem = createLifestyleItem("li-1", "tpl-1", "Meditation");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return { query: { data: { data: [lifestyleItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems[0].subtitle).toBe("1 activity");
    });

    it("shows '1 item' for single diet group", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem = createDietItem("di-1", "tpl-1", "Eggs", "breakfast");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems[0].subtitle).toBe("1 item");
    });

    it("shows plural subtitles for multiple grouped items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supp1 = createSupplementItem("si-1", "tpl-1", "Vitamin C");
      const supp2 = createSupplementItem("si-2", "tpl-1", "Vitamin D");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return { query: { data: { data: [supp1, supp2] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems[0].subtitle).toBe("2 supplements");
    });
  });

  // ── Branch coverage: grouping lifestyle items by time slot ──
  describe("grouping lifestyle items by time slot", () => {
    it("groups multiple lifestyle items with same time slot", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const ls1 = createLifestyleItem("li-1", "tpl-1", "Steps");
      const ls2 = createLifestyleItem("li-2", "tpl-1", "Water");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return { query: { data: { data: [ls1, ls2] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      expect(result.current.lifestyleItems[0].itemCount).toBe(2);
      expect(result.current.lifestyleItems[0].subtitle).toBe("2 activities");
    });
  });

  // ── Branch coverage: workout item uses duration_minutes when scheduled_duration_minutes is null ──
  describe("workout item duration fallbacks", () => {
    it("uses duration_minutes when scheduled_duration_minutes is null", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const workoutItem: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-1", "tpl-1", "Plank"),
        scheduled_duration_minutes: null,
        duration_minutes: 2,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return { query: { data: { data: [workoutItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.workoutItems).toHaveLength(1);
    });
  });

  // ── Branch coverage: diet item meal_category null (falls back to "unknown") ──
  describe("diet item missing meal_category", () => {
    it("handles null meal_category", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Rice", "lunch"),
        meal_category: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
      // Falls back to "Meal" when no subtitle
      expect(result.current.dietItems[0].title).toBe("Meal");
    });
  });

  // ── Branch coverage: toPackingItem edge cases ──
  describe("toPackingItem edge cases", () => {
    it("uses time_end for packing item endMinutes when available", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Chicken", "lunch"),
        time_type: "fixed",
        time_start: "12:00",
        time_end: "12:45",
        time_period: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      // The packing item should use time_end (12:45 = 765 minutes)
      expect(result.current.packingItems).toHaveLength(1);
      expect(result.current.packingItems[0].endMinutes).toBe(765);
    });

    it("uses metadata.duration for packing item when no time_end and duration is set", () => {
      const template = createTemplate("tpl-1", "Test Template");
      // Create a workout item with scheduled_duration but no time_end
      const workoutItem: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-1", "tpl-1", "Running"),
        time_type: "fixed",
        time_start: "07:00",
        time_end: null,
        time_period: null,
        scheduled_duration_minutes: 45,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return { query: { data: { data: [workoutItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      // startMinutes should be 420 (07:00), endMinutes should be 420 + 45 = 465
      expect(result.current.packingItems).toHaveLength(1);
      expect(result.current.packingItems[0].startMinutes).toBe(420);
      expect(result.current.packingItems[0].endMinutes).toBe(465);
    });

    it("uses grouped workout metadata.duration (sum of individual durations) for packing", () => {
      const template = createTemplate("tpl-1", "Test Template");
      // Create two workouts at the same fixed time slot so they group
      // Each defaults to 5 min duration (via || 5 fallback), so group total = 10
      const workoutItem1: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-1", "tpl-1", "Bench Press"),
        time_type: "fixed",
        time_start: "16:00",
        time_end: null,
        time_period: null,
        scheduled_duration_minutes: null,
        duration_minutes: null,
      };
      const workoutItem2: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-2", "tpl-1", "Incline Press"),
        time_type: "fixed",
        time_start: "16:00",
        time_end: null,
        time_period: null,
        scheduled_duration_minutes: null,
        duration_minutes: null,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
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
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      // Grouped workout: metadata.duration = 5 + 5 = 10 (each defaults to 5)
      expect(result.current.packingItems).toHaveLength(1);
      expect(result.current.packingItems[0].startMinutes).toBe(960); // 16:00
      expect(result.current.packingItems[0].endMinutes).toBe(970); // 16:00 + 10
    });
  });

  // ── Branch coverage: query data is null/undefined (|| [] fallbacks) ──
  describe("null query data fallbacks", () => {
    it("handles undefined data in query results gracefully", () => {
      // Return query result where data is null (not { data: [] })
      mockUseOne.mockReturnValue({
        query: { data: null, isLoading: false, isError: false },
      });
      mockUseList.mockReturnValue({
        query: { data: null, isLoading: false, isError: false },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.template).toBeNull();
      expect(result.current.rawDietItems).toEqual([]);
      expect(result.current.rawSupplementItems).toEqual([]);
      expect(result.current.rawWorkoutItems).toEqual([]);
      expect(result.current.rawLifestyleItems).toEqual([]);
      expect(result.current.timelineItems).toHaveLength(0);
    });

    it("handles query result with data wrapper but null inner data", () => {
      mockUseOne.mockReturnValue({
        query: { data: { data: undefined }, isLoading: false, isError: false },
      });
      mockUseList.mockReturnValue({
        query: { data: { data: undefined }, isLoading: false, isError: false },
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.template).toBeNull();
      expect(result.current.rawDietItems).toEqual([]);
    });
  });

  // ── Branch coverage: items with display_order null (|| 0 in sort) ──
  describe("items with null display_order in grouping sort", () => {
    it("handles null display_order in grouped diet items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem1: TemplateDietItemWithFood = {
        ...createDietItem("di-1", "tpl-1", "Eggs", "breakfast"),
        display_order: null as any,
      };
      const dietItem2: TemplateDietItemWithFood = {
        ...createDietItem("di-2", "tpl-1", "Toast", "breakfast"),
        display_order: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return {
            query: { data: { data: [dietItem1, dietItem2] }, isLoading: false, isError: false },
          };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.dietItems).toHaveLength(1);
      expect(result.current.dietItems[0].itemCount).toBe(2);
    });

    it("handles null display_order in grouped workout items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const wi1: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-1", "tpl-1", "Bench"),
        display_order: null as any,
      };
      const wi2: TemplateWorkoutItemWithExercise = {
        ...createWorkoutItem("wi-2", "tpl-1", "Squat"),
        display_order: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_workout_items") {
          return {
            query: { data: { data: [wi1, wi2] }, isLoading: false, isError: false },
          };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.workoutItems).toHaveLength(1);
      expect(result.current.workoutItems[0].itemCount).toBe(2);
    });

    it("handles null display_order in grouped supplement items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const si1: TemplateSupplementItemWithSupplement = {
        ...createSupplementItem("si-1", "tpl-1", "VitC"),
        display_order: null as any,
      };
      const si2: TemplateSupplementItemWithSupplement = {
        ...createSupplementItem("si-2", "tpl-1", "VitD"),
        display_order: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return {
            query: { data: { data: [si1, si2] }, isLoading: false, isError: false },
          };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems).toHaveLength(1);
      expect(result.current.supplementItems[0].itemCount).toBe(2);
    });

    it("handles null display_order in grouped lifestyle items", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const li1: TemplateLifestyleItemWithType = {
        ...createLifestyleItem("li-1", "tpl-1", "Steps"),
        display_order: null as any,
      };
      const li2: TemplateLifestyleItemWithType = {
        ...createLifestyleItem("li-2", "tpl-1", "Water"),
        display_order: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_lifestyle_items") {
          return {
            query: { data: { data: [li1, li2] }, isLoading: false, isError: false },
          };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      expect(result.current.lifestyleItems[0].itemCount).toBe(2);
    });
  });

  // ── Branch coverage: relative scheduling with null offset (|| 0 in scheduling key) ──
  describe("scheduling key edge cases", () => {
    it("handles relative scheduling with null offset_minutes", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const supplementItem: TemplateSupplementItemWithSupplement = {
        ...createSupplementItem("si-1", "tpl-1", "Creatine"),
        time_type: "relative",
        time_period: null,
        relative_anchor: "wake" as any,
        relative_offset_minutes: null as any,
      };

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_supplement_items") {
          return {
            query: { data: { data: [supplementItem] }, isLoading: false, isError: false },
          };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.supplementItems).toHaveLength(1);
    });
  });

  // ── Branch coverage: raw items available ──
  describe("raw items pass-through", () => {
    it("returns raw items for mutations", () => {
      const template = createTemplate("tpl-1", "Test Template");
      const dietItem = createDietItem("di-1", "tpl-1", "Eggs", "breakfast");
      const supplementItem = createSupplementItem("si-1", "tpl-1", "VitD");
      const workoutItem = createWorkoutItem("wi-1", "tpl-1", "Squats");
      const lifestyleItem = createLifestyleItem("li-1", "tpl-1", "Steps");

      mockUseOne.mockReturnValue({
        query: { data: { data: template }, isLoading: false, isError: false },
      });
      mockUseList.mockImplementation((opts: { resource: string }) => {
        if (opts.resource === "template_diet_items") {
          return { query: { data: { data: [dietItem] }, isLoading: false, isError: false } };
        }
        if (opts.resource === "template_supplement_items") {
          return { query: { data: { data: [supplementItem] }, isLoading: false, isError: false } };
        }
        if (opts.resource === "template_workout_items") {
          return { query: { data: { data: [workoutItem] }, isLoading: false, isError: false } };
        }
        if (opts.resource === "template_lifestyle_items") {
          return { query: { data: { data: [lifestyleItem] }, isLoading: false, isError: false } };
        }
        return { query: { data: { data: [] }, isLoading: false, isError: false } };
      });

      const { result } = renderHook(() => useTemplateData({ templateId: "tpl-1" }));

      expect(result.current.rawDietItems).toHaveLength(1);
      expect(result.current.rawSupplementItems).toHaveLength(1);
      expect(result.current.rawWorkoutItems).toHaveLength(1);
      expect(result.current.rawLifestyleItems).toHaveLength(1);
      // timelineItems should contain all 4 grouped items
      expect(result.current.timelineItems).toHaveLength(4);
    });
  });
});
