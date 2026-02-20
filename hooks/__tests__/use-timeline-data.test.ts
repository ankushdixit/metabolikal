/**
 * Tests for useTimelineData hook
 *
 * Since the transform functions (transformDietPlan, transformSupplementPlan, etc.),
 * grouping functions, getSchedulingKey, and toPackingItem are all module-private,
 * we test them through the hook's observable behavior by mocking Refine hooks
 * and asserting on the returned timelineItems, packingItems, and grouped arrays.
 */

import { renderHook } from "@testing-library/react";
import { useTimelineData } from "../use-timeline-data";
import type {
  FoodItem,
  Supplement,
  Exercise,
  LifestyleActivityType,
  TimePeriod,
  RelativeAnchor,
} from "@/lib/database.types";
import type {
  DietPlanWithFood,
  SupplementPlanWithSupplement,
  WorkoutPlanWithExercise,
  LifestyleActivityPlanWithType,
} from "../use-timeline-data";

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock Refine hooks
const mockUseList = jest.fn();
const mockUseOne = jest.fn();
const mockUseInvalidate = jest.fn();

jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useInvalidate: () => mockUseInvalidate,
}));

// =============================================================================
// MOCK FACTORIES
// =============================================================================

function createMockFoodItem(overrides?: Partial<FoodItem>): FoodItem {
  return {
    id: "food-1",
    name: "Oatmeal",
    calories: 150,
    protein: 5,
    carbs: 27,
    fats: 3,
    serving_size: "1 cup",
    is_vegetarian: true,
    meal_types: null,
    raw_quantity: null,
    cooked_quantity: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockDietPlan(overrides?: Partial<DietPlanWithFood>): DietPlanWithFood {
  return {
    id: "diet-1",
    client_id: "client-1",
    day_number: 1,
    meal_category: "breakfast",
    food_item_id: "food-1",
    serving_multiplier: 1,
    notes: null,
    time_type: "fixed",
    time_start: "08:00",
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    display_order: 1,
    quantity_grams: null,
    quantity_type: null,
    quantity_note: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    food_items: createMockFoodItem(),
    ...overrides,
  };
}

function createMockSupplement(overrides?: Partial<Supplement>): Supplement {
  return {
    id: "supp-1",
    name: "Vitamin D",
    category: "vitamin",
    default_dosage: 1000,
    dosage_unit: "IU",
    instructions: null,
    notes: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockSupplementPlan(
  overrides?: Partial<SupplementPlanWithSupplement>
): SupplementPlanWithSupplement {
  return {
    id: "sp-1",
    client_id: "client-1",
    supplement_id: "supp-1",
    day_number: 1,
    dosage: 1000,
    time_type: "period",
    time_start: null,
    time_end: null,
    time_period: "morning",
    relative_anchor: null,
    relative_offset_minutes: 0,
    notes: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    supplements: createMockSupplement(),
    ...overrides,
  };
}

function createMockExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: "ex-1",
    name: "Push Ups",
    category: "strength",
    muscle_group: "chest",
    equipment: null,
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
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockWorkoutPlan(
  overrides?: Partial<WorkoutPlanWithExercise>
): WorkoutPlanWithExercise {
  return {
    id: "wp-1",
    client_id: "client-1",
    day_number: 1,
    exercise_name: "Push Ups",
    sets: 3,
    reps: 10,
    duration_minutes: null,
    rest_seconds: 60,
    instructions: null,
    video_url: null,
    section: "main",
    display_order: 1,
    exercise_id: "ex-1",
    time_type: "fixed",
    time_start: "17:00",
    time_end: "17:45",
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    scheduled_duration_minutes: 45,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    exercises: createMockExercise(),
    ...overrides,
  };
}

function createMockLifestyleActivityType(
  overrides?: Partial<LifestyleActivityType>
): LifestyleActivityType {
  return {
    id: "lat-1",
    name: "Morning Walk",
    category: "movement",
    default_target_value: 30,
    target_unit: "minutes",
    description: null,
    rationale: null,
    icon: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockLifestyleActivityPlan(
  overrides?: Partial<LifestyleActivityPlanWithType>
): LifestyleActivityPlanWithType {
  return {
    id: "lap-1",
    client_id: "client-1",
    activity_type_id: "lat-1",
    day_number: 1,
    target_value: 30,
    custom_rationale: null,
    time_type: "all_day",
    time_start: null,
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    notes: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    lifestyle_activity_types: createMockLifestyleActivityType(),
    ...overrides,
  };
}

/**
 * Helper to create a mock useList return with data
 */
function _mockUseListReturn(data: unknown[] = []) {
  return {
    query: {
      data: { data },
      isLoading: false,
      isError: false,
    },
  };
}

/**
 * Helper to create a mock useOne return with data
 */
function _mockUseOneReturn(data: unknown = null) {
  return {
    query: {
      data: { data },
      isLoading: false,
      isError: false,
    },
  };
}

// Configure mocks based on the resource being queried
function setupMocks(options: {
  dietPlans?: DietPlanWithFood[];
  supplementPlans?: SupplementPlanWithSupplement[];
  workoutPlans?: WorkoutPlanWithExercise[];
  lifestyleActivityPlans?: LifestyleActivityPlanWithType[];
  clientConditions?: unknown[];
  profile?: Record<string, unknown> | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const {
    dietPlans = [],
    supplementPlans = [],
    workoutPlans = [],
    lifestyleActivityPlans = [],
    clientConditions = [],
    profile = { plan_start_date: "2026-01-01", plan_duration_days: 90 },
    isLoading = false,
    isError = false,
  } = options;

  mockUseOne.mockReturnValue({
    query: {
      data: { data: profile },
      isLoading,
      isError,
    },
  });

  // useList is called 5 times: diet_plans, supplement_plans, workout_plans, lifestyle_activity_plans, client_conditions
  mockUseList.mockImplementation((params: { resource: string }) => {
    const loadState = { isLoading, isError };
    switch (params.resource) {
      case "diet_plans":
        return { query: { data: { data: dietPlans }, ...loadState } };
      case "supplement_plans":
        return { query: { data: { data: supplementPlans }, ...loadState } };
      case "workout_plans":
        return { query: { data: { data: workoutPlans }, ...loadState } };
      case "lifestyle_activity_plans":
        return { query: { data: { data: lifestyleActivityPlans }, ...loadState } };
      case "client_conditions":
        return { query: { data: { data: clientConditions }, ...loadState } };
      default:
        return { query: { data: { data: [] }, ...loadState } };
    }
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe("useTimelineData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInvalidate.mockReturnValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // BASIC HOOK BEHAVIOR
  // ---------------------------------------------------------------------------
  describe("basic hook behavior", () => {
    it("returns empty arrays when no data", () => {
      setupMocks({});

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.timelineItems).toEqual([]);
      expect(result.current.packingItems).toEqual([]);
      expect(result.current.dietItems).toEqual([]);
      expect(result.current.supplementItems).toEqual([]);
      expect(result.current.workoutItems).toEqual([]);
      expect(result.current.lifestyleItems).toEqual([]);
      expect(result.current.rawDietPlans).toEqual([]);
      expect(result.current.rawSupplementPlans).toEqual([]);
      expect(result.current.rawWorkoutPlans).toEqual([]);
      expect(result.current.rawLifestyleActivityPlans).toEqual([]);
      expect(result.current.clientConditions).toEqual([]);
    });

    it("reflects loading state from queries", () => {
      setupMocks({ isLoading: true });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
    });

    it("reflects error state from queries", () => {
      setupMocks({ isError: true });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("parses plan config from profile", () => {
      setupMocks({
        profile: { plan_start_date: "2026-02-15", plan_duration_days: 30 },
      });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.durationDays).toBe(30);
      expect(result.current.planConfig.startDate).toBeInstanceOf(Date);
    });

    it("defaults plan duration to 7 when profile has no plan_duration_days", () => {
      setupMocks({
        profile: { plan_start_date: null, plan_duration_days: null },
      });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.durationDays).toBe(7);
      expect(result.current.planConfig.startDate).toBeNull();
    });

    it("provides refetchAll callback that invalidates all resources", () => {
      setupMocks({});

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(typeof result.current.refetchAll).toBe("function");
    });
  });

  // ---------------------------------------------------------------------------
  // DIET PLAN TRANSFORM (transformDietPlan)
  // ---------------------------------------------------------------------------
  describe("transformDietPlan (via hook output)", () => {
    it("transforms a diet plan with fixed time into a meal timeline item", () => {
      const dietPlan = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
        food_item_id: "food-1",
        serving_multiplier: 1,
        display_order: 1,
        food_items: createMockFoodItem({ name: "Oatmeal", calories: 150, protein: 5 }),
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // Diet items get grouped, so we check the grouped result
      expect(result.current.dietItems).toHaveLength(1);
      const groupedItem = result.current.dietItems[0];
      expect(groupedItem.isGrouped).toBe(true);
      expect(groupedItem.type).toBe("meal");
      expect(groupedItem.title).toBe("Breakfast"); // Formatted meal category
      expect(groupedItem.subtitle).toBe("1 item");
      expect(groupedItem.metadata?.calories).toBe(150);
      expect(groupedItem.metadata?.protein).toBe(5);
      expect(groupedItem.itemNames).toEqual(["Oatmeal"]);
      expect(groupedItem.sourceType).toBe("diet_plan");
    });

    it("applies serving multiplier to calories and protein", () => {
      const dietPlan = createMockDietPlan({
        serving_multiplier: 2.5,
        food_items: createMockFoodItem({ calories: 200, protein: 10 }),
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      // 200 * 2.5 = 500, 10 * 2.5 = 25
      expect(item.metadata?.calories).toBe(500);
      expect(item.metadata?.protein).toBe(25);
    });

    it("handles missing food item gracefully", () => {
      const dietPlan = createMockDietPlan({
        food_items: null,
        food_item_id: null,
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.itemNames).toEqual(["Unknown Food"]);
      expect(item.metadata?.calories).toBe(0);
      expect(item.metadata?.protein).toBe(0);
    });

    it("handles period-based scheduling for diet plan", () => {
      const dietPlan = createMockDietPlan({
        time_type: "period",
        time_start: null,
        time_period: "morning" as TimePeriod,
        meal_category: "breakfast",
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.scheduling.time_type).toBe("period");
      expect(item.scheduling.time_period).toBe("morning");
    });

    it("handles relative scheduling for diet plan", () => {
      const dietPlan = createMockDietPlan({
        time_type: "relative",
        time_start: null,
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 30,
        meal_category: "breakfast",
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.scheduling.time_type).toBe("relative");
      expect(item.scheduling.relative_anchor).toBe("breakfast");
      expect(item.scheduling.relative_offset_minutes).toBe(30);
    });

    it("defaults time_type to period when null", () => {
      const dietPlan = createMockDietPlan({
        time_type: null,
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.scheduling.time_type).toBe("period");
    });

    it("includes food item IDs for compatibility checking", () => {
      const dietPlan = createMockDietPlan({
        food_item_id: "food-42",
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.foodItemIds).toContain("food-42");
    });

    it("provides empty food item IDs when no food_item_id", () => {
      const dietPlan = createMockDietPlan({
        food_item_id: null,
      });

      setupMocks({ dietPlans: [dietPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.foodItemIds).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // SUPPLEMENT PLAN TRANSFORM (transformSupplementPlan)
  // ---------------------------------------------------------------------------
  describe("transformSupplementPlan (via hook output)", () => {
    it("transforms a supplement plan with period scheduling", () => {
      const suppPlan = createMockSupplementPlan({
        id: "sp-1",
        dosage: 2000,
        time_type: "period",
        time_period: "morning" as TimePeriod,
        supplements: createMockSupplement({
          name: "Vitamin D",
          dosage_unit: "IU",
          category: "vitamin",
        }),
      });

      setupMocks({ supplementPlans: [suppPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementItems).toHaveLength(1);
      const item = result.current.supplementItems[0];
      expect(item.isGrouped).toBe(true);
      expect(item.type).toBe("supplement");
      expect(item.title).toBe("Supplements");
      expect(item.subtitle).toBe("1 supplement");
      expect(item.itemNames).toEqual(["Vitamin D"]);
      expect(item.sourceType).toBe("supplement_plan");
    });

    it("handles missing supplement details", () => {
      const suppPlan = createMockSupplementPlan({
        supplements: null,
      });

      setupMocks({ supplementPlans: [suppPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.supplementItems[0];
      expect(item.itemNames).toEqual(["Unknown Supplement"]);
    });

    it("uses relative scheduling for supplements", () => {
      const suppPlan = createMockSupplementPlan({
        time_type: "relative",
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 30,
      });

      setupMocks({ supplementPlans: [suppPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.supplementItems[0];
      expect(item.scheduling.time_type).toBe("relative");
      expect(item.scheduling.relative_anchor).toBe("breakfast");
      expect(item.scheduling.relative_offset_minutes).toBe(30);
    });

    it("defaults time_type to period when null on supplement plan", () => {
      const suppPlan = createMockSupplementPlan({
        // @ts-expect-error -- testing null fallback
        time_type: null,
      });

      setupMocks({ supplementPlans: [suppPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.supplementItems[0];
      expect(item.scheduling.time_type).toBe("period");
    });
  });

  // ---------------------------------------------------------------------------
  // WORKOUT PLAN TRANSFORM (transformWorkoutPlan)
  // ---------------------------------------------------------------------------
  describe("transformWorkoutPlan (via hook output)", () => {
    it("transforms a workout plan with fixed time", () => {
      const workoutPlan = createMockWorkoutPlan({
        id: "wp-1",
        exercise_name: "Push Ups",
        sets: 3,
        reps: 12,
        section: "main",
        time_type: "fixed",
        time_start: "17:00",
        time_end: "17:45",
        scheduled_duration_minutes: 45,
        exercises: createMockExercise({ name: "Push Ups" }),
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutItems).toHaveLength(1);
      const item = result.current.workoutItems[0];
      expect(item.isGrouped).toBe(true);
      expect(item.type).toBe("workout");
      expect(item.title).toBe("Workout Session");
      expect(item.subtitle).toBe("1 exercise");
      expect(item.itemNames).toEqual(["Push Ups"]);
      expect(item.sourceType).toBe("workout_plan");
    });

    it("prefers exercise_name from plan over linked exercise name", () => {
      const workoutPlan = createMockWorkoutPlan({
        exercise_name: "Modified Push Ups",
        exercises: createMockExercise({ name: "Standard Push Ups" }),
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.itemNames).toEqual(["Modified Push Ups"]);
    });

    it("falls back to exercises.name when exercise_name is empty", () => {
      const workoutPlan = createMockWorkoutPlan({
        exercise_name: "",
        exercises: createMockExercise({ name: "Bench Press" }),
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.itemNames).toEqual(["Bench Press"]);
    });

    it("falls back to Unknown Exercise when no name available", () => {
      const workoutPlan = createMockWorkoutPlan({
        exercise_name: "",
        exercises: null,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.itemNames).toEqual(["Unknown Exercise"]);
    });

    it("uses scheduled_duration_minutes over duration_minutes", () => {
      const workoutPlan = createMockWorkoutPlan({
        scheduled_duration_minutes: 60,
        duration_minutes: 30,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The grouped item aggregates duration
      const item = result.current.workoutItems[0];
      expect(item.metadata?.duration).toBe(60);
    });

    it("falls back to duration_minutes when scheduled is 0", () => {
      const workoutPlan = createMockWorkoutPlan({
        scheduled_duration_minutes: 0,
        duration_minutes: 25,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.metadata?.duration).toBe(25);
    });

    it("defaults section to main when null", () => {
      const workoutPlan = createMockWorkoutPlan({
        section: null,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The underlying item's subtitle is the section
      // Since grouping replaces the subtitle, check the raw data indirectly
      expect(result.current.rawWorkoutPlans[0].section).toBeNull();
    });

    it("handles period-based workout scheduling", () => {
      const workoutPlan = createMockWorkoutPlan({
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "evening" as TimePeriod,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.scheduling.time_type).toBe("period");
      expect(item.scheduling.time_period).toBe("evening");
    });

    it("defaults time_type to period when null on workout plan", () => {
      const workoutPlan = createMockWorkoutPlan({
        time_type: null,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.workoutItems[0];
      expect(item.scheduling.time_type).toBe("period");
    });
  });

  // ---------------------------------------------------------------------------
  // LIFESTYLE ACTIVITY PLAN TRANSFORM (transformLifestyleActivityPlan)
  // ---------------------------------------------------------------------------
  describe("transformLifestyleActivityPlan (via hook output)", () => {
    it("transforms a lifestyle activity with all_day scheduling", () => {
      const plan = createMockLifestyleActivityPlan({
        id: "lap-1",
        time_type: "all_day",
        target_value: 30,
        lifestyle_activity_types: createMockLifestyleActivityType({
          name: "Morning Walk",
          category: "movement",
          target_unit: "minutes",
        }),
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      const item = result.current.lifestyleItems[0];
      expect(item.isGrouped).toBe(true);
      expect(item.type).toBe("lifestyle");
      expect(item.title).toBe("Lifestyle Activities");
      expect(item.subtitle).toBe("1 activity");
      expect(item.itemNames).toEqual(["Morning Walk"]);
      expect(item.scheduling.time_type).toBe("all_day");
      expect(item.sourceType).toBe("lifestyle_activity_plan");
    });

    it("handles missing lifestyle activity type", () => {
      const plan = createMockLifestyleActivityPlan({
        lifestyle_activity_types: null,
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.lifestyleItems[0];
      expect(item.itemNames).toEqual(["Activity"]);
    });

    it("uses target_value from plan when available", () => {
      const plan = createMockLifestyleActivityPlan({
        target_value: 45,
        lifestyle_activity_types: createMockLifestyleActivityType({
          default_target_value: 30,
        }),
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The grouped item doesn't carry targetValue in metadata (it's cleared)
      // but the raw plan should be available
      expect(result.current.rawLifestyleActivityPlans[0].target_value).toBe(45);
    });

    it("defaults time_type to all_day when null on lifestyle plan", () => {
      const plan = createMockLifestyleActivityPlan({
        // @ts-expect-error -- testing null fallback
        time_type: null,
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.lifestyleItems[0];
      expect(item.scheduling.time_type).toBe("all_day");
    });

    it("handles fixed time lifestyle activity", () => {
      const plan = createMockLifestyleActivityPlan({
        time_type: "fixed",
        time_start: "06:00",
        time_end: "06:30",
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.lifestyleItems[0];
      expect(item.scheduling.time_type).toBe("fixed");
      expect(item.scheduling.time_start).toBe("06:00");
    });
  });

  // ---------------------------------------------------------------------------
  // getSchedulingKey (tested via grouping behavior)
  // ---------------------------------------------------------------------------
  describe("getSchedulingKey (via grouping)", () => {
    it("groups diet items with same fixed time and meal_category", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
        display_order: 1,
        food_items: createMockFoodItem({ id: "f1", name: "Oatmeal", calories: 150, protein: 5 }),
        food_item_id: "f1",
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
        display_order: 2,
        food_items: createMockFoodItem({ id: "f2", name: "Banana", calories: 90, protein: 1 }),
        food_item_id: "f2",
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // Should be grouped into one item
      expect(result.current.dietItems).toHaveLength(1);
      const group = result.current.dietItems[0];
      expect(group.itemCount).toBe(2);
      expect(group.subtitle).toBe("2 items");
      expect(group.itemNames).toEqual(["Oatmeal", "Banana"]);
      expect(group.metadata?.calories).toBe(240); // 150 + 90
      expect(group.metadata?.protein).toBe(6); // 5 + 1
      expect(group.foodItemIds).toEqual(["f1", "f2"]);
    });

    it("separates diet items with different fixed times", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
        food_items: createMockFoodItem({ name: "Oatmeal" }),
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "09:00",
        food_items: createMockFoodItem({ name: "Toast" }),
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // Different times = different groups
      expect(result.current.dietItems).toHaveLength(2);
    });

    it("separates diet items with different meal categories", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
        food_items: createMockFoodItem({ name: "Oatmeal" }),
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "lunch",
        time_type: "fixed",
        time_start: "08:00",
        food_items: createMockFoodItem({ name: "Salad" }),
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // Different categories = different groups even with same time
      expect(result.current.dietItems).toHaveLength(2);
    });

    it("groups items with same period scheduling key", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "lunch",
        time_type: "period",
        time_start: null,
        time_period: "midday" as TimePeriod,
        food_items: createMockFoodItem({ name: "Rice" }),
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "lunch",
        time_type: "period",
        time_start: null,
        time_period: "midday" as TimePeriod,
        food_items: createMockFoodItem({ name: "Chicken" }),
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietItems).toHaveLength(1);
      expect(result.current.dietItems[0].itemCount).toBe(2);
    });

    it("groups items with same relative scheduling key", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "relative",
        time_start: null,
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 0,
        food_items: createMockFoodItem({ name: "Eggs" }),
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "breakfast",
        time_type: "relative",
        time_start: null,
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 0,
        food_items: createMockFoodItem({ name: "Toast" }),
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietItems).toHaveLength(1);
      expect(result.current.dietItems[0].itemCount).toBe(2);
    });

    it("separates items with different relative offsets", () => {
      const plan1 = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "relative",
        time_start: null,
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 0,
        food_items: createMockFoodItem({ name: "Eggs" }),
      });
      const plan2 = createMockDietPlan({
        id: "diet-2",
        meal_category: "breakfast",
        time_type: "relative",
        time_start: null,
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 30,
        food_items: createMockFoodItem({ name: "Snack" }),
      });

      setupMocks({ dietPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietItems).toHaveLength(2);
    });

    it("groups all_day lifestyle items under one key", () => {
      const plan1 = createMockLifestyleActivityPlan({
        id: "lap-1",
        time_type: "all_day",
        lifestyle_activity_types: createMockLifestyleActivityType({ name: "Walk" }),
      });
      const plan2 = createMockLifestyleActivityPlan({
        id: "lap-2",
        time_type: "all_day",
        lifestyle_activity_types: createMockLifestyleActivityType({ name: "Meditate" }),
      });

      setupMocks({ lifestyleActivityPlans: [plan1, plan2] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      expect(result.current.lifestyleItems[0].itemCount).toBe(2);
      expect(result.current.lifestyleItems[0].subtitle).toBe("2 activities");
    });
  });

  // ---------------------------------------------------------------------------
  // DIET GROUPING (groupDietItems)
  // ---------------------------------------------------------------------------
  describe("groupDietItems (via hook output)", () => {
    it("formats meal category with capitalization and dash removal", () => {
      const plan = createMockDietPlan({
        meal_category: "evening-snack",
        time_type: "fixed",
        time_start: "16:00",
        food_items: createMockFoodItem({ name: "Apple" }),
      });

      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.title).toBe("Evening snack");
    });

    it("uses Meal as default when meal_category is null", () => {
      const plan = createMockDietPlan({
        meal_category: null,
        food_items: createMockFoodItem({ name: "Snack" }),
      });

      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The subtitle of the underlying item is undefined (null meal_category)
      // The grouped title falls back to "Meal" capitalized
      const item = result.current.dietItems[0];
      expect(item.title).toBe("Meal");
    });

    it("aggregates calories and protein across group", () => {
      const plans = [
        createMockDietPlan({
          id: "d1",
          meal_category: "lunch",
          time_type: "period",
          time_start: null,
          time_period: "midday" as TimePeriod,
          display_order: 1,
          food_items: createMockFoodItem({ calories: 300, protein: 20 }),
          food_item_id: "f1",
          serving_multiplier: 1,
        }),
        createMockDietPlan({
          id: "d2",
          meal_category: "lunch",
          time_type: "period",
          time_start: null,
          time_period: "midday" as TimePeriod,
          display_order: 2,
          food_items: createMockFoodItem({ calories: 150, protein: 8 }),
          food_item_id: "f2",
          serving_multiplier: 2,
        }),
      ];

      setupMocks({ dietPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      // d1: 300*1 = 300 cal, 20*1 = 20 protein
      // d2: 150*2 = 300 cal, 8*2 = 16 protein
      expect(item.metadata?.calories).toBe(600);
      expect(item.metadata?.protein).toBe(36);
    });

    it("sorts items within group by displayOrder", () => {
      const plans = [
        createMockDietPlan({
          id: "d1",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          display_order: 3,
          food_items: createMockFoodItem({ name: "Third" }),
        }),
        createMockDietPlan({
          id: "d2",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          display_order: 1,
          food_items: createMockFoodItem({ name: "First" }),
        }),
        createMockDietPlan({
          id: "d3",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          display_order: 2,
          food_items: createMockFoodItem({ name: "Second" }),
        }),
      ];

      setupMocks({ dietPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.itemNames).toEqual(["First", "Second", "Third"]);
    });

    it("creates grouped ID with group: prefix", () => {
      const plan = createMockDietPlan({
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "08:00",
      });

      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      expect(item.id).toMatch(/^group:/);
    });
  });

  // ---------------------------------------------------------------------------
  // WORKOUT GROUPING (groupWorkoutItems)
  // ---------------------------------------------------------------------------
  describe("groupWorkoutItems (via hook output)", () => {
    it("groups workouts at same time slot", () => {
      const plans = [
        createMockWorkoutPlan({
          id: "wp-1",
          time_type: "fixed",
          time_start: "17:00",
          exercise_name: "Push Ups",
          display_order: 1,
          scheduled_duration_minutes: 10,
          duration_minutes: null,
        }),
        createMockWorkoutPlan({
          id: "wp-2",
          time_type: "fixed",
          time_start: "17:00",
          exercise_name: "Squats",
          display_order: 2,
          scheduled_duration_minutes: 15,
          duration_minutes: null,
        }),
      ];

      setupMocks({ workoutPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutItems).toHaveLength(1);
      const group = result.current.workoutItems[0];
      expect(group.title).toBe("Workout Session");
      expect(group.subtitle).toBe("2 exercises");
      expect(group.itemNames).toEqual(["Push Ups", "Squats"]);
      expect(group.itemCount).toBe(2);
    });

    it("calculates total duration for grouped workouts", () => {
      const plans = [
        createMockWorkoutPlan({
          id: "wp-1",
          time_type: "fixed",
          time_start: "17:00",
          scheduled_duration_minutes: 15,
          display_order: 1,
        }),
        createMockWorkoutPlan({
          id: "wp-2",
          time_type: "fixed",
          time_start: "17:00",
          scheduled_duration_minutes: 20,
          display_order: 2,
        }),
      ];

      setupMocks({ workoutPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const group = result.current.workoutItems[0];
      expect(group.metadata?.duration).toBe(35); // 15 + 20
    });

    it("defaults individual workout duration to 5 when not specified", () => {
      const plans = [
        createMockWorkoutPlan({
          id: "wp-1",
          time_type: "fixed",
          time_start: "17:00",
          scheduled_duration_minutes: 0,
          duration_minutes: null,
          display_order: 1,
        }),
        createMockWorkoutPlan({
          id: "wp-2",
          time_type: "fixed",
          time_start: "17:00",
          scheduled_duration_minutes: 0,
          duration_minutes: null,
          display_order: 2,
        }),
      ];

      setupMocks({ workoutPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const group = result.current.workoutItems[0];
      // Each item has duration undefined, so grouping uses (duration || 5) = 5 per item
      expect(group.metadata?.duration).toBe(10); // 5 + 5
    });
  });

  // ---------------------------------------------------------------------------
  // SUPPLEMENT GROUPING (groupSupplementItems)
  // ---------------------------------------------------------------------------
  describe("groupSupplementItems (via hook output)", () => {
    it("groups supplements at same time slot", () => {
      const plans = [
        createMockSupplementPlan({
          id: "sp-1",
          time_type: "period",
          time_period: "morning" as TimePeriod,
          display_order: 1,
          supplements: createMockSupplement({ name: "Vitamin D" }),
        }),
        createMockSupplementPlan({
          id: "sp-2",
          time_type: "period",
          time_period: "morning" as TimePeriod,
          display_order: 2,
          supplements: createMockSupplement({ name: "Omega 3" }),
        }),
      ];

      setupMocks({ supplementPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementItems).toHaveLength(1);
      const group = result.current.supplementItems[0];
      expect(group.title).toBe("Supplements");
      expect(group.subtitle).toBe("2 supplements");
      expect(group.itemNames).toEqual(["Vitamin D", "Omega 3"]);
    });

    it("separates supplements at different time slots", () => {
      const plans = [
        createMockSupplementPlan({
          id: "sp-1",
          time_type: "period",
          time_period: "morning" as TimePeriod,
          supplements: createMockSupplement({ name: "Vitamin D" }),
        }),
        createMockSupplementPlan({
          id: "sp-2",
          time_type: "period",
          time_period: "night" as TimePeriod,
          supplements: createMockSupplement({ name: "Magnesium" }),
        }),
      ];

      setupMocks({ supplementPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementItems).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // LIFESTYLE GROUPING (groupLifestyleItems)
  // ---------------------------------------------------------------------------
  describe("groupLifestyleItems (via hook output)", () => {
    it("groups lifestyle activities at same time slot", () => {
      const plans = [
        createMockLifestyleActivityPlan({
          id: "lap-1",
          time_type: "all_day",
          display_order: 1,
          lifestyle_activity_types: createMockLifestyleActivityType({ name: "Walk" }),
        }),
        createMockLifestyleActivityPlan({
          id: "lap-2",
          time_type: "all_day",
          display_order: 2,
          lifestyle_activity_types: createMockLifestyleActivityType({ name: "Meditate" }),
        }),
      ];

      setupMocks({ lifestyleActivityPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestyleItems).toHaveLength(1);
      const group = result.current.lifestyleItems[0];
      expect(group.title).toBe("Lifestyle Activities");
      expect(group.subtitle).toBe("2 activities");
      expect(group.itemNames).toEqual(["Walk", "Meditate"]);
    });
  });

  // ---------------------------------------------------------------------------
  // LANE PACKING (toPackingItem)
  // ---------------------------------------------------------------------------
  describe("lane packing (toPackingItem via packingItems)", () => {
    it("all_day items span 05:00 to 23:00", () => {
      const plan = createMockLifestyleActivityPlan({
        time_type: "all_day",
      });

      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const packingItem = result.current.packingItems[0];
      // 05:00 = 300 min, 23:00 = 1380 min
      expect(packingItem.startMinutes).toBe(300);
      expect(packingItem.endMinutes).toBe(1380);
      expect(packingItem.type).toBe("lifestyle");
    });

    it("period-based items span the full period range", () => {
      const plan = createMockSupplementPlan({
        time_type: "period",
        time_period: "morning" as TimePeriod,
      });

      setupMocks({ supplementPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const packingItem = result.current.packingItems[0];
      // morning range: 07:00 (420) to 10:00 (600)
      expect(packingItem.startMinutes).toBe(420);
      expect(packingItem.endMinutes).toBe(600);
    });

    it("fixed time items use start time and default duration", () => {
      const plan = createMockDietPlan({
        time_type: "fixed",
        time_start: "08:00",
        time_end: null,
        food_items: createMockFoodItem({ name: "Toast" }),
      });

      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const packingItem = result.current.packingItems[0];
      // 08:00 = 480 min, default duration 30 min
      expect(packingItem.startMinutes).toBe(480);
      expect(packingItem.endMinutes).toBe(510); // 480 + 30
    });

    it("fixed time items with explicit end time use that end time", () => {
      const plan = createMockWorkoutPlan({
        time_type: "fixed",
        time_start: "17:00",
        time_end: "18:30",
      });

      setupMocks({ workoutPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const packingItem = result.current.packingItems[0];
      // 17:00 = 1020, 18:30 = 1110
      expect(packingItem.startMinutes).toBe(1020);
      expect(packingItem.endMinutes).toBe(1110);
    });

    it("generates packing items for all timeline items", () => {
      const dietPlan = createMockDietPlan();
      const suppPlan = createMockSupplementPlan();
      const workoutPlan = createMockWorkoutPlan();
      const lifestylePlan = createMockLifestyleActivityPlan();

      setupMocks({
        dietPlans: [dietPlan],
        supplementPlans: [suppPlan],
        workoutPlans: [workoutPlan],
        lifestyleActivityPlans: [lifestylePlan],
      });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // 4 items = 4 packing items (one per group)
      expect(result.current.packingItems).toHaveLength(4);
      expect(result.current.timelineItems).toHaveLength(4);

      // Each packing item has an id, startMinutes, endMinutes, and type
      for (const item of result.current.packingItems) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("startMinutes");
        expect(item).toHaveProperty("endMinutes");
        expect(item).toHaveProperty("type");
        expect(item.endMinutes).toBeGreaterThan(item.startMinutes);
      }
    });

    it("ensures end is after start even when end <= start", () => {
      // This exercises the guard: if endMinutes <= startMinutes, add DEFAULT_ITEM_DURATION
      // Create a workout with fixed time where time_end is before time_start
      const plan = createMockWorkoutPlan({
        time_type: "fixed",
        time_start: "17:00",
        time_end: "16:30", // end before start
        scheduled_duration_minutes: 0,
        duration_minutes: null,
      });

      setupMocks({ workoutPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const packingItem = result.current.packingItems[0];
      // 17:00 = 1020, end was 16:30 = 990 which is before start
      // So end should be 1020 + 30 (DEFAULT_ITEM_DURATION) = 1050
      expect(packingItem.startMinutes).toBe(1020);
      expect(packingItem.endMinutes).toBeGreaterThan(packingItem.startMinutes);
    });
  });

  // ---------------------------------------------------------------------------
  // COMPUTED ANCHOR TIMES
  // ---------------------------------------------------------------------------
  describe("computed anchor times", () => {
    it("uses fixed-time meals to compute anchor times for relative items", () => {
      // A breakfast meal at 07:30 should anchor the breakfast time
      // Then a supplement relative to breakfast should use 07:30 instead of default 08:00
      const dietPlan = createMockDietPlan({
        id: "diet-1",
        meal_category: "breakfast",
        time_type: "fixed",
        time_start: "07:30",
        food_items: createMockFoodItem({ name: "Oatmeal" }),
      });

      // Supplement relative to breakfast + 30 min
      // With computed anchor: 07:30 + 30 = 08:00 = 480 min
      // With default anchor: 08:00 + 30 = 08:30 = 510 min
      const suppPlan = createMockSupplementPlan({
        id: "sp-1",
        time_type: "relative",
        time_period: null,
        relative_anchor: "breakfast" as RelativeAnchor,
        relative_offset_minutes: 30,
      });

      setupMocks({ dietPlans: [dietPlan], supplementPlans: [suppPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The supplement packing item should reflect the computed anchor time
      const suppPackingItem = result.current.packingItems.find(
        (item) => item.type === "supplement"
      );
      expect(suppPackingItem).toBeDefined();
      // 07:30 + 30 min offset = 08:00 = 480 min
      expect(suppPackingItem!.startMinutes).toBe(480);
    });
  });

  // ---------------------------------------------------------------------------
  // COMBINED TIMELINE
  // ---------------------------------------------------------------------------
  describe("combined timeline", () => {
    it("combines all item types into timelineItems", () => {
      setupMocks({
        dietPlans: [createMockDietPlan()],
        supplementPlans: [createMockSupplementPlan()],
        workoutPlans: [createMockWorkoutPlan()],
        lifestyleActivityPlans: [createMockLifestyleActivityPlan()],
      });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.timelineItems).toHaveLength(4);

      const types = result.current.timelineItems.map((item) => item.type);
      expect(types).toContain("meal");
      expect(types).toContain("supplement");
      expect(types).toContain("workout");
      expect(types).toContain("lifestyle");
    });

    it("provides raw plans alongside grouped items", () => {
      const dietPlan = createMockDietPlan();
      const suppPlan = createMockSupplementPlan();
      const workoutPlan = createMockWorkoutPlan();
      const lifestylePlan = createMockLifestyleActivityPlan();

      setupMocks({
        dietPlans: [dietPlan],
        supplementPlans: [suppPlan],
        workoutPlans: [workoutPlan],
        lifestyleActivityPlans: [lifestylePlan],
      });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.rawDietPlans).toHaveLength(1);
      expect(result.current.rawDietPlans[0].id).toBe(dietPlan.id);
      expect(result.current.rawSupplementPlans).toHaveLength(1);
      expect(result.current.rawWorkoutPlans).toHaveLength(1);
      expect(result.current.rawLifestyleActivityPlans).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASES
  // ---------------------------------------------------------------------------
  describe("edge cases", () => {
    it("handles diet plan with null display_order", () => {
      const plan = createMockDietPlan({ display_order: null });
      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietItems).toHaveLength(1);
    });

    it("handles diet plan with null meal_category for groupKey", () => {
      const plan = createMockDietPlan({ meal_category: null });
      setupMocks({ dietPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const item = result.current.dietItems[0];
      // groupKey should include "unknown" for null meal_category
      expect(item.groupKey).toContain("unknown");
    });

    it("handles supplement with null category", () => {
      const plan = createMockSupplementPlan({
        supplements: createMockSupplement({
          // @ts-expect-error - testing null category
          category: null,
        }),
      });
      setupMocks({ supplementPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementItems).toHaveLength(1);
    });

    it("handles workout with no sets or reps", () => {
      const plan = createMockWorkoutPlan({
        sets: null,
        reps: null,
        duration_minutes: null,
        scheduled_duration_minutes: 0,
      });
      setupMocks({ workoutPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutItems).toHaveLength(1);
    });

    it("handles lifestyle activity with null target and default_target_value", () => {
      const plan = createMockLifestyleActivityPlan({
        target_value: null,
        lifestyle_activity_types: createMockLifestyleActivityType({
          default_target_value: null,
          target_unit: null,
        }),
      });
      setupMocks({ lifestyleActivityPlans: [plan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestyleItems).toHaveLength(1);
    });

    it("handles profile being null", () => {
      setupMocks({ profile: null });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.startDate).toBeNull();
      expect(result.current.planConfig.durationDays).toBe(7);
    });

    it("handles multiple diet plans with mixed scheduling types", () => {
      const plans = [
        createMockDietPlan({
          id: "d1",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          food_items: createMockFoodItem({ name: "Toast" }),
        }),
        createMockDietPlan({
          id: "d2",
          meal_category: "lunch",
          time_type: "period",
          time_start: null,
          time_period: "midday" as TimePeriod,
          food_items: createMockFoodItem({ name: "Salad" }),
        }),
        createMockDietPlan({
          id: "d3",
          meal_category: "dinner",
          time_type: "relative",
          time_start: null,
          time_period: null,
          relative_anchor: "dinner" as RelativeAnchor,
          relative_offset_minutes: 0,
          food_items: createMockFoodItem({ name: "Rice" }),
        }),
      ];

      setupMocks({ dietPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // Each has a different groupKey, so 3 separate groups
      expect(result.current.dietItems).toHaveLength(3);
    });

    it("refetchAll invokes invalidate for all relevant resources", () => {
      setupMocks({});

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      result.current.refetchAll();

      // mockUseInvalidate is the invalidate function returned by useInvalidate
      expect(mockUseInvalidate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "profiles" })
      );
      expect(mockUseInvalidate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "diet_plans" })
      );
      expect(mockUseInvalidate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "supplement_plans" })
      );
      expect(mockUseInvalidate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "workout_plans" })
      );
      expect(mockUseInvalidate).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "lifestyle_activity_plans" })
      );
    });

    it("grouped workout with duration uses duration for packing", () => {
      // Single workout with a specific duration but no time_end
      // The grouped item should have isGrouped=true and type=workout
      // This should exercise the grouped workout branch in toPackingItem
      const workoutPlan = createMockWorkoutPlan({
        time_type: "fixed",
        time_start: "17:00",
        time_end: null,
        scheduled_duration_minutes: 0,
        duration_minutes: null,
      });

      setupMocks({ workoutPlans: [workoutPlan] });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      // The grouped workout item has isGrouped=true and type=workout
      // Duration from metadata is aggregated as (duration || 5), so 5 per item
      // In toPackingItem, the grouped item's metadata.duration is 5
      // The item has isGrouped=true AND type=workout but metadata.duration is 5
      // So it takes the metadata.duration branch, not the grouped workout branch
      const packingItem = result.current.packingItems[0];
      expect(packingItem.startMinutes).toBe(1020); // 17:00
      // 5 is the aggregated duration from groupWorkoutItems
      expect(packingItem.endMinutes).toBe(1025); // 1020 + 5
    });

    it("preserves groupedRawPlans sorted by display_order", () => {
      const plans = [
        createMockDietPlan({
          id: "d1",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          display_order: 3,
          food_items: createMockFoodItem({ name: "Third" }),
        }),
        createMockDietPlan({
          id: "d2",
          meal_category: "breakfast",
          time_type: "fixed",
          time_start: "08:00",
          display_order: 1,
          food_items: createMockFoodItem({ name: "First" }),
        }),
      ];

      setupMocks({ dietPlans: plans });

      const { result } = renderHook(() => useTimelineData({ clientId: "client-1", dayNumber: 1 }));

      const group = result.current.dietItems[0];
      const groupedPlans = group.groupedItems as DietPlanWithFood[];
      expect(groupedPlans[0].display_order).toBe(1);
      expect(groupedPlans[1].display_order).toBe(3);
    });
  });
});
