/**
 * Tests for useDailyPlanData hook
 *
 * Tests cover:
 * - calculateCurrentDay pure function
 * - checkLimitsForDay internal function (via hook behavior)
 * - Hook integration with mocked Refine hooks (useList, useOne, useInvalidate)
 * - Data aggregation: diet totals, workout totals, supplement counts
 * - Grouping: dietByMeal, workoutBySection
 * - Empty / partial / complete plan scenarios
 * - Limit checking logic
 * - Loading and error states
 */

import { renderHook, act } from "@testing-library/react";
import { calculateCurrentDay } from "../use-daily-plan-data";

// ---------------------------------------------------------------------------
// Pure function tests (existing + new)
// ---------------------------------------------------------------------------

describe("calculateCurrentDay", () => {
  it("returns 1 when today is the start date", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = calculateCurrentDay(today, 30);
    expect(result).toBe(1);
  });

  it("returns correct day when today is after start date", () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 5); // 5 days ago
    const result = calculateCurrentDay(startDate, 30);
    expect(result).toBe(6); // Day 6 (0 + 5 + 1)
  });

  it("returns 0 when today is before start date", () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + 5); // 5 days in future
    const result = calculateCurrentDay(startDate, 30);
    expect(result).toBe(0);
  });

  it("returns last day when today is after plan end", () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 50); // 50 days ago
    const result = calculateCurrentDay(startDate, 30);
    expect(result).toBe(30); // Max day
  });

  it("handles exact day boundary correctly", () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 29); // Exactly at day 30
    const result = calculateCurrentDay(startDate, 30);
    expect(result).toBe(30);
  });

  it("returns 1 for single day plan on start date", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = calculateCurrentDay(today, 1);
    expect(result).toBe(1);
  });

  it("clamps to duration when far in future", () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 100); // 100 days ago
    const result = calculateCurrentDay(startDate, 7);
    expect(result).toBe(7);
  });

  it("returns 0 for tomorrow start date", () => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = calculateCurrentDay(tomorrow, 30);
    expect(result).toBe(0);
  });

  it("returns 2 for yesterday start date", () => {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = calculateCurrentDay(yesterday, 30);
    expect(result).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Hook integration tests with mocked Refine hooks
// ---------------------------------------------------------------------------

// Mock Refine core hooks
const mockUseOne = jest.fn();
const mockUseList = jest.fn();
const mockInvalidate = jest.fn();

jest.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
  useInvalidate: () => mockInvalidate,
}));

// Mock plan-dates utilities
jest.mock("@/lib/utils/plan-dates", () => ({
  parsePlanDate: jest.fn((dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }),
  getDayDate: jest.fn((startDate: Date, dayNumber: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayNumber - 1);
    return d;
  }),
  formatPlanDateForStorage: jest.fn((date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }),
}));

// Mock challenge-utils
jest.mock("@/lib/challenge-utils", () => ({
  getDaysSinceStart: jest.fn((startDate: string, totalDays: number) => {
    const start = new Date(startDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diffDays + 1, 0), totalDays);
  }),
}));

// Import hook after mocks are set up
import { useDailyPlanData } from "../use-daily-plan-data";

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

function createMockProfileQuery(overrides?: {
  data?: Record<string, unknown> | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  return {
    query: {
      data: overrides?.data !== undefined ? { data: overrides.data } : { data: null },
      isLoading: overrides?.isLoading ?? false,
      isError: overrides?.isError ?? false,
    },
  };
}

function createMockListQuery(overrides?: {
  data?: unknown[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  return {
    query: {
      data: overrides?.data !== undefined ? { data: overrides.data } : { data: [] },
      isLoading: overrides?.isLoading ?? false,
      isError: overrides?.isError ?? false,
    },
  };
}

function createMockDietPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "diet-1",
    client_id: "client-1",
    day_number: 1,
    meal_category: "lunch",
    food_item_id: "food-1",
    serving_multiplier: 1,
    notes: null,
    time_type: null,
    time_start: null,
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
    food_items: {
      id: "food-1",
      name: "Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 3.6,
      fiber: 0,
      serving_size_grams: 100,
      category: "protein",
      created_at: "2026-01-01T00:00:00Z",
    },
    ...overrides,
  };
}

function createMockWorkoutPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "workout-1",
    client_id: "client-1",
    day_number: 1,
    exercise_name: "Push-ups",
    sets: 3,
    reps: 15,
    duration_minutes: 5,
    rest_seconds: 60,
    instructions: null,
    video_url: null,
    section: "main",
    display_order: 1,
    exercise_id: null,
    time_type: null,
    time_start: null,
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    scheduled_duration_minutes: 10,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    exercises: null,
    ...overrides,
  };
}

function createMockSupplementPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "supp-1",
    client_id: "client-1",
    supplement_id: "supplement-1",
    day_number: 1,
    dosage: 1,
    time_type: "fixed",
    time_start: "08:00",
    time_end: null,
    time_period: "morning",
    relative_anchor: null,
    relative_offset_minutes: 0,
    notes: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    supplements: {
      id: "supplement-1",
      name: "Vitamin D",
      brand: "NatureMade",
      category: "vitamin",
      unit: "IU",
      default_dosage: 1000,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    ...overrides,
  };
}

function createMockLifestylePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "lifestyle-1",
    client_id: "client-1",
    activity_type_id: "activity-1",
    day_number: 1,
    target_value: 30,
    custom_rationale: null,
    time_type: "fixed",
    time_start: "06:00",
    time_end: "06:30",
    time_period: "morning",
    relative_anchor: null,
    relative_offset_minutes: 0,
    notes: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    lifestyle_activity_types: {
      id: "activity-1",
      name: "Meditation",
      category: "mindfulness",
      unit: "minutes",
      icon: "brain",
      created_at: "2026-01-01T00:00:00Z",
    },
    ...overrides,
  };
}

function createMockLimit(overrides: Record<string, unknown> = {}) {
  return {
    id: "limit-1",
    client_id: "client-1",
    start_date: "2026-01-01",
    end_date: "2026-01-31",
    max_calories_per_day: 2000,
    min_protein_per_day: 100,
    max_protein_per_day: 150,
    min_carbs_per_day: null,
    max_carbs_per_day: null,
    min_fats_per_day: null,
    max_fats_per_day: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup for useOne / useList mock calls
// ---------------------------------------------------------------------------

/**
 * Configure mock return values for the 6 Refine queries the hook makes.
 * useOne is called once (profiles), useList is called 5 times
 * (diet_plans, supplement_plans, workout_plans, lifestyle_activity_plans, client_plan_limits).
 *
 * The hook calls useOne first, then useList x5 in order.
 */
function setupRefineHookMocks(options: {
  profile?: Record<string, unknown> | null;
  profileLoading?: boolean;
  profileError?: boolean;
  dietPlans?: unknown[];
  dietLoading?: boolean;
  dietError?: boolean;
  supplementPlans?: unknown[];
  supplementLoading?: boolean;
  supplementError?: boolean;
  workoutPlans?: unknown[];
  workoutLoading?: boolean;
  workoutError?: boolean;
  lifestylePlans?: unknown[];
  lifestyleLoading?: boolean;
  lifestyleError?: boolean;
  limits?: unknown[];
  limitsLoading?: boolean;
  limitsError?: boolean;
}) {
  mockUseOne.mockReturnValue(
    createMockProfileQuery({
      data: options.profile ?? null,
      isLoading: options.profileLoading ?? false,
      isError: options.profileError ?? false,
    })
  );

  // useList is called 5 times in order: diet, supplement, workout, lifestyle, limits
  mockUseList
    .mockReturnValueOnce(
      createMockListQuery({
        data: options.dietPlans ?? [],
        isLoading: options.dietLoading ?? false,
        isError: options.dietError ?? false,
      })
    )
    .mockReturnValueOnce(
      createMockListQuery({
        data: options.supplementPlans ?? [],
        isLoading: options.supplementLoading ?? false,
        isError: options.supplementError ?? false,
      })
    )
    .mockReturnValueOnce(
      createMockListQuery({
        data: options.workoutPlans ?? [],
        isLoading: options.workoutLoading ?? false,
        isError: options.workoutError ?? false,
      })
    )
    .mockReturnValueOnce(
      createMockListQuery({
        data: options.lifestylePlans ?? [],
        isLoading: options.lifestyleLoading ?? false,
        isError: options.lifestyleError ?? false,
      })
    )
    .mockReturnValueOnce(
      createMockListQuery({
        data: options.limits ?? [],
        isLoading: options.limitsLoading ?? false,
        isError: options.limitsError ?? false,
      })
    );
}

// ---------------------------------------------------------------------------
// Hook Tests
// ---------------------------------------------------------------------------

describe("useDailyPlanData hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty plan scenario", () => {
    it("returns empty arrays and zero totals when no data exists", () => {
      setupRefineHookMocks({});

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietPlans).toEqual([]);
      expect(result.current.supplementPlans).toEqual([]);
      expect(result.current.workoutPlans).toEqual([]);
      expect(result.current.lifestylePlans).toEqual([]);
      expect(result.current.limits).toEqual([]);

      expect(result.current.dietTotals).toEqual({
        totalCalories: 0,
        totalProtein: 0,
        mealCount: 0,
      });
      expect(result.current.workoutTotals).toEqual({
        exerciseCount: 0,
        totalDuration: 0,
      });
      expect(result.current.supplementCounts).toEqual({
        morning: 0,
        afternoon: 0,
        evening: 0,
        total: 0,
      });
      expect(result.current.lifestyleCount).toBe(0);
      expect(result.current.hasLimitsForDay).toBe(false);
      expect(result.current.currentLimit).toBeNull();
    });

    it("returns correct loading state when queries are loading", () => {
      setupRefineHookMocks({ profileLoading: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    it("returns correct error state when a query errors", () => {
      setupRefineHookMocks({ dietError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });
  });

  describe("plan configuration from profile", () => {
    it("parses plan config from profile with plan_start_date", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-15",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.startDate).toBeTruthy();
      expect(result.current.planConfig.durationDays).toBe(90);
    });

    it("falls back to created_at when plan_start_date is null", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: null,
          plan_duration_days: 30,
          created_at: "2026-02-01T12:00:00Z",
        },
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.startDate).toBeTruthy();
      expect(result.current.planConfig.durationDays).toBe(30);
    });

    it("defaults to 7 days duration when plan_duration_days is null", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: null,
          created_at: "2026-01-01T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.durationDays).toBe(7);
    });

    it("returns null startDate when profile has no dates", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: null,
          plan_duration_days: null,
          created_at: null,
        },
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.startDate).toBeNull();
    });

    it("returns null startDate when no profile data exists", () => {
      setupRefineHookMocks({
        profile: null,
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.planConfig.startDate).toBeNull();
      expect(result.current.planConfig.durationDays).toBe(7);
    });
  });

  describe("diet plan aggregation", () => {
    it("groups diet plans by meal category", () => {
      const breakfastItem = createMockDietPlan({
        id: "diet-breakfast",
        meal_category: "breakfast",
        food_items: { calories: 200, protein: 15 },
      });
      const lunchItem1 = createMockDietPlan({
        id: "diet-lunch-1",
        meal_category: "lunch",
        food_items: { calories: 400, protein: 30 },
      });
      const lunchItem2 = createMockDietPlan({
        id: "diet-lunch-2",
        meal_category: "lunch",
        food_items: { calories: 300, protein: 25 },
      });
      const dinnerItem = createMockDietPlan({
        id: "diet-dinner",
        meal_category: "dinner",
        food_items: { calories: 500, protein: 40 },
      });

      setupRefineHookMocks({
        dietPlans: [breakfastItem, lunchItem1, lunchItem2, dinnerItem],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      const dietByMeal = result.current.dietByMeal;
      expect(dietByMeal.get("breakfast")).toHaveLength(1);
      expect(dietByMeal.get("lunch")).toHaveLength(2);
      expect(dietByMeal.get("dinner")).toHaveLength(1);
      expect(dietByMeal.size).toBe(3);
    });

    it("defaults to lunch when meal_category is null", () => {
      const noCategory = createMockDietPlan({
        id: "diet-no-cat",
        meal_category: null,
        food_items: { calories: 200, protein: 15 },
      });

      setupRefineHookMocks({
        dietPlans: [noCategory],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietByMeal.get("lunch")).toHaveLength(1);
    });

    it("calculates diet totals with serving multipliers", () => {
      const item1 = createMockDietPlan({
        id: "diet-1",
        serving_multiplier: 2,
        food_items: { calories: 200, protein: 20 },
      });
      const item2 = createMockDietPlan({
        id: "diet-2",
        serving_multiplier: 1.5,
        food_items: { calories: 300, protein: 25 },
      });

      setupRefineHookMocks({
        dietPlans: [item1, item2],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // Item1: 200 * 2 = 400 cal, 20 * 2 = 40 protein
      // Item2: 300 * 1.5 = 450 cal, 25 * 1.5 = 37.5 protein
      expect(result.current.dietTotals.totalCalories).toBe(850);
      expect(result.current.dietTotals.totalProtein).toBe(78); // Math.round(77.5)
    });

    it("handles food_items being null", () => {
      const noFood = createMockDietPlan({
        id: "diet-no-food",
        food_items: null,
        serving_multiplier: 1,
      });

      setupRefineHookMocks({
        dietPlans: [noFood],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietTotals.totalCalories).toBe(0);
      expect(result.current.dietTotals.totalProtein).toBe(0);
    });

    it("handles null serving_multiplier (defaults to 1)", () => {
      const item = createMockDietPlan({
        id: "diet-null-mult",
        serving_multiplier: null,
        food_items: { calories: 100, protein: 10 },
      });

      setupRefineHookMocks({
        dietPlans: [item],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // serving_multiplier || 1 => 1 when null
      expect(result.current.dietTotals.totalCalories).toBe(100);
      expect(result.current.dietTotals.totalProtein).toBe(10);
    });

    it("counts distinct meal categories for mealCount", () => {
      setupRefineHookMocks({
        dietPlans: [
          createMockDietPlan({ id: "d1", meal_category: "breakfast" }),
          createMockDietPlan({ id: "d2", meal_category: "breakfast" }),
          createMockDietPlan({ id: "d3", meal_category: "lunch" }),
          createMockDietPlan({ id: "d4", meal_category: "dinner" }),
          createMockDietPlan({ id: "d5", meal_category: "snack" }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // 4 distinct categories: breakfast, lunch, dinner, snack
      expect(result.current.dietTotals.mealCount).toBe(4);
    });
  });

  describe("workout plan aggregation", () => {
    it("groups workout plans by section with correct order", () => {
      const warmup = createMockWorkoutPlan({
        id: "w-warmup",
        section: "warmup",
        exercise_name: "Stretching",
        scheduled_duration_minutes: 5,
      });
      const main1 = createMockWorkoutPlan({
        id: "w-main-1",
        section: "main",
        exercise_name: "Squats",
        scheduled_duration_minutes: 15,
      });
      const main2 = createMockWorkoutPlan({
        id: "w-main-2",
        section: "main",
        exercise_name: "Deadlift",
        scheduled_duration_minutes: 15,
      });
      const cooldown = createMockWorkoutPlan({
        id: "w-cooldown",
        section: "cooldown",
        exercise_name: "Cool-down Walk",
        scheduled_duration_minutes: 10,
      });

      setupRefineHookMocks({
        workoutPlans: [warmup, main1, main2, cooldown],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      const workoutBySection = result.current.workoutBySection;
      expect(workoutBySection.get("warmup")).toHaveLength(1);
      expect(workoutBySection.get("main")).toHaveLength(2);
      expect(workoutBySection.get("cooldown")).toHaveLength(1);
    });

    it("defaults to main section when section is null", () => {
      const noSection = createMockWorkoutPlan({
        id: "w-no-section",
        section: null,
        exercise_name: "Planks",
      });

      setupRefineHookMocks({
        workoutPlans: [noSection],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutBySection.get("main")).toHaveLength(1);
    });

    it("removes empty sections from the map", () => {
      // Only main section exercises, no warmup or cooldown
      const main = createMockWorkoutPlan({
        id: "w-main",
        section: "main",
        exercise_name: "Bench Press",
      });

      setupRefineHookMocks({
        workoutPlans: [main],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutBySection.has("warmup")).toBe(false);
      expect(result.current.workoutBySection.has("main")).toBe(true);
      expect(result.current.workoutBySection.has("cooldown")).toBe(false);
    });

    it("calculates workout totals using scheduled_duration_minutes with fallback", () => {
      const ex1 = createMockWorkoutPlan({
        id: "w1",
        scheduled_duration_minutes: 20,
        duration_minutes: 15,
      });
      const ex2 = createMockWorkoutPlan({
        id: "w2",
        scheduled_duration_minutes: 0, // falsy, falls back to duration_minutes
        duration_minutes: 10,
      });
      const ex3 = createMockWorkoutPlan({
        id: "w3",
        scheduled_duration_minutes: 0,
        duration_minutes: 0, // both falsy, defaults to 5
      });

      setupRefineHookMocks({
        workoutPlans: [ex1, ex2, ex3],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // ex1: 20 (scheduled_duration_minutes)
      // ex2: 10 (duration_minutes fallback since scheduled is 0)
      // ex3: 5 (default fallback since both are 0)
      expect(result.current.workoutTotals.exerciseCount).toBe(3);
      expect(result.current.workoutTotals.totalDuration).toBe(35);
    });

    it("returns empty map when no workout plans exist", () => {
      setupRefineHookMocks({
        workoutPlans: [],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.workoutBySection.size).toBe(0);
      expect(result.current.workoutTotals.exerciseCount).toBe(0);
      expect(result.current.workoutTotals.totalDuration).toBe(0);
    });
  });

  describe("supplement plan aggregation", () => {
    it("categorizes supplements into morning, afternoon, evening", () => {
      setupRefineHookMocks({
        supplementPlans: [
          createMockSupplementPlan({ id: "s1", time_period: "early_morning" }),
          createMockSupplementPlan({ id: "s2", time_period: "morning" }),
          createMockSupplementPlan({ id: "s3", time_period: "midday" }),
          createMockSupplementPlan({ id: "s4", time_period: "afternoon" }),
          createMockSupplementPlan({ id: "s5", time_period: "evening" }),
          createMockSupplementPlan({ id: "s6", time_period: "night" }),
          createMockSupplementPlan({ id: "s7", time_period: "before_sleep" }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementCounts.morning).toBe(2); // early_morning + morning
      expect(result.current.supplementCounts.afternoon).toBe(2); // midday + afternoon
      expect(result.current.supplementCounts.evening).toBe(3); // evening + night + before_sleep
      expect(result.current.supplementCounts.total).toBe(7);
    });

    it("defaults unspecified time periods to morning", () => {
      setupRefineHookMocks({
        supplementPlans: [
          createMockSupplementPlan({ id: "s1", time_period: null }),
          createMockSupplementPlan({ id: "s2", time_period: "unknown_period" }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // Both null and unknown should default to morning
      expect(result.current.supplementCounts.morning).toBe(2);
      expect(result.current.supplementCounts.total).toBe(2);
    });

    it("returns zero counts with no supplements", () => {
      setupRefineHookMocks({
        supplementPlans: [],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementCounts).toEqual({
        morning: 0,
        afternoon: 0,
        evening: 0,
        total: 0,
      });
    });
  });

  describe("lifestyle activity plans", () => {
    it("returns lifestyle plans and count", () => {
      setupRefineHookMocks({
        lifestylePlans: [
          createMockLifestylePlan({ id: "l1" }),
          createMockLifestylePlan({ id: "l2" }),
          createMockLifestylePlan({ id: "l3" }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestylePlans).toHaveLength(3);
      expect(result.current.lifestyleCount).toBe(3);
    });

    it("returns zero count with no lifestyle plans", () => {
      setupRefineHookMocks({
        lifestylePlans: [],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.lifestyleCount).toBe(0);
    });
  });

  describe("limits checking", () => {
    it("finds matching limit for the day", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
        limits: [
          createMockLimit({
            start_date: "2026-01-01",
            end_date: "2026-01-31",
            max_calories_per_day: 2000,
          }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 5 }));

      // Day 5 of plan starting 2026-01-01 = 2026-01-05, within limit range
      expect(result.current.hasLimitsForDay).toBe(true);
      expect(result.current.currentLimit).not.toBeNull();
      expect(result.current.currentLimit?.max_calories_per_day).toBe(2000);
    });

    it("returns no limit when day is outside limit range", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
        limits: [
          createMockLimit({
            start_date: "2026-02-01",
            end_date: "2026-02-28",
          }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 5 }));

      // Day 5 = 2026-01-05, limit starts 2026-02-01
      expect(result.current.hasLimitsForDay).toBe(false);
      expect(result.current.currentLimit).toBeNull();
    });

    it("returns no limit when no limits exist", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
        limits: [],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 5 }));

      expect(result.current.hasLimitsForDay).toBe(false);
      expect(result.current.currentLimit).toBeNull();
    });

    it("returns no limit when planStartDate is null", () => {
      setupRefineHookMocks({
        profile: null,
        limits: [createMockLimit()],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 5 }));

      expect(result.current.hasLimitsForDay).toBe(false);
      expect(result.current.currentLimit).toBeNull();
    });

    it("handles multiple limits and selects the matching one", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
        limits: [
          createMockLimit({
            id: "limit-jan",
            start_date: "2026-01-01",
            end_date: "2026-01-31",
            max_calories_per_day: 1800,
          }),
          createMockLimit({
            id: "limit-feb",
            start_date: "2026-02-01",
            end_date: "2026-02-28",
            max_calories_per_day: 2200,
          }),
        ],
      });

      const { result } = renderHook(() =>
        useDailyPlanData({ clientId: "client-1", dayNumber: 35 })
      );

      // Day 35 of plan starting 2026-01-01 = 2026-02-04, should match Feb limit
      expect(result.current.hasLimitsForDay).toBe(true);
      expect(result.current.currentLimit?.max_calories_per_day).toBe(2200);
    });
  });

  describe("complete plan scenario", () => {
    it("returns all plan data with correct aggregations", () => {
      setupRefineHookMocks({
        profile: {
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          created_at: "2026-01-01T00:00:00Z",
        },
        dietPlans: [
          createMockDietPlan({
            id: "d1",
            meal_category: "breakfast",
            serving_multiplier: 1,
            food_items: { calories: 300, protein: 20 },
          }),
          createMockDietPlan({
            id: "d2",
            meal_category: "lunch",
            serving_multiplier: 1.5,
            food_items: { calories: 500, protein: 35 },
          }),
          createMockDietPlan({
            id: "d3",
            meal_category: "dinner",
            serving_multiplier: 1,
            food_items: { calories: 600, protein: 40 },
          }),
        ],
        supplementPlans: [
          createMockSupplementPlan({ id: "s1", time_period: "morning" }),
          createMockSupplementPlan({ id: "s2", time_period: "evening" }),
        ],
        workoutPlans: [
          createMockWorkoutPlan({
            id: "w1",
            section: "warmup",
            scheduled_duration_minutes: 5,
          }),
          createMockWorkoutPlan({
            id: "w2",
            section: "main",
            scheduled_duration_minutes: 30,
          }),
          createMockWorkoutPlan({
            id: "w3",
            section: "cooldown",
            scheduled_duration_minutes: 5,
          }),
        ],
        lifestylePlans: [createMockLifestylePlan({ id: "l1" })],
        limits: [
          createMockLimit({
            start_date: "2026-01-01",
            end_date: "2026-03-31",
            max_calories_per_day: 2000,
          }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      // Diet
      expect(result.current.dietPlans).toHaveLength(3);
      // 300*1 + 500*1.5 + 600*1 = 300 + 750 + 600 = 1650
      expect(result.current.dietTotals.totalCalories).toBe(1650);
      // 20*1 + 35*1.5 + 40*1 = 20 + 52.5 + 40 = 112.5 => 113
      expect(result.current.dietTotals.totalProtein).toBe(113);
      expect(result.current.dietTotals.mealCount).toBe(3);

      // Supplements
      expect(result.current.supplementPlans).toHaveLength(2);
      expect(result.current.supplementCounts.morning).toBe(1);
      expect(result.current.supplementCounts.evening).toBe(1);
      expect(result.current.supplementCounts.total).toBe(2);

      // Workout
      expect(result.current.workoutPlans).toHaveLength(3);
      expect(result.current.workoutTotals.exerciseCount).toBe(3);
      expect(result.current.workoutTotals.totalDuration).toBe(40);
      expect(result.current.workoutBySection.get("warmup")).toHaveLength(1);
      expect(result.current.workoutBySection.get("main")).toHaveLength(1);
      expect(result.current.workoutBySection.get("cooldown")).toHaveLength(1);

      // Lifestyle
      expect(result.current.lifestylePlans).toHaveLength(1);
      expect(result.current.lifestyleCount).toBe(1);

      // Limits
      expect(result.current.hasLimitsForDay).toBe(true);
      expect(result.current.currentLimit?.max_calories_per_day).toBe(2000);

      // Loading state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("loading and error states", () => {
    it("is loading when any query is loading", () => {
      setupRefineHookMocks({ supplementLoading: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
    });

    it("is loading when workout query is loading", () => {
      setupRefineHookMocks({ workoutLoading: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
    });

    it("is loading when lifestyle query is loading", () => {
      setupRefineHookMocks({ lifestyleLoading: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
    });

    it("is loading when limits query is loading", () => {
      setupRefineHookMocks({ limitsLoading: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(true);
    });

    it("is error when profile query errors", () => {
      setupRefineHookMocks({ profileError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("is error when supplement query errors", () => {
      setupRefineHookMocks({ supplementError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("is error when workout query errors", () => {
      setupRefineHookMocks({ workoutError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("is error when lifestyle query errors", () => {
      setupRefineHookMocks({ lifestyleError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("is error when limits query errors", () => {
      setupRefineHookMocks({ limitsError: true });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isError).toBe(true);
    });

    it("is not loading or error when all queries succeed", () => {
      setupRefineHookMocks({});

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("refetchAll", () => {
    it("calls invalidate for all 6 resources", () => {
      setupRefineHookMocks({});

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      act(() => {
        result.current.refetchAll();
      });

      expect(mockInvalidate).toHaveBeenCalledTimes(6);
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "profiles",
        invalidates: ["detail"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "diet_plans",
        invalidates: ["list"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "supplement_plans",
        invalidates: ["list"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "workout_plans",
        invalidates: ["list"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "lifestyle_activity_plans",
        invalidates: ["list"],
      });
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "client_plan_limits",
        invalidates: ["list"],
      });
    });
  });

  describe("partial plan scenarios", () => {
    it("handles diet-only plan", () => {
      setupRefineHookMocks({
        dietPlans: [
          createMockDietPlan({
            id: "d1",
            meal_category: "breakfast",
            food_items: { calories: 400, protein: 30 },
          }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietPlans).toHaveLength(1);
      expect(result.current.supplementPlans).toHaveLength(0);
      expect(result.current.workoutPlans).toHaveLength(0);
      expect(result.current.lifestylePlans).toHaveLength(0);
    });

    it("handles workout-only plan", () => {
      setupRefineHookMocks({
        workoutPlans: [createMockWorkoutPlan({ id: "w1", section: "main" })],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.dietPlans).toHaveLength(0);
      expect(result.current.workoutPlans).toHaveLength(1);
      expect(result.current.dietTotals.totalCalories).toBe(0);
    });

    it("handles supplements-only plan", () => {
      setupRefineHookMocks({
        supplementPlans: [
          createMockSupplementPlan({ id: "s1", time_period: "morning" }),
          createMockSupplementPlan({ id: "s2", time_period: "afternoon" }),
        ],
      });

      const { result } = renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1 }));

      expect(result.current.supplementPlans).toHaveLength(2);
      expect(result.current.supplementCounts.total).toBe(2);
      expect(result.current.dietPlans).toHaveLength(0);
    });
  });

  describe("query parameters", () => {
    it("passes correct resource names to useOne and useList", () => {
      setupRefineHookMocks({});

      renderHook(() => useDailyPlanData({ clientId: "client-123", dayNumber: 5 }));

      // useOne should be called for profiles
      expect(mockUseOne).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "profiles",
          id: "client-123",
        })
      );

      // useList should be called 5 times for the 5 list resources
      expect(mockUseList).toHaveBeenCalledTimes(5);

      // Check that diet_plans was called with correct filters
      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "diet_plans",
          filters: expect.arrayContaining([
            expect.objectContaining({ field: "client_id", value: "client-123" }),
            expect.objectContaining({ field: "day_number", value: 5 }),
          ]),
        })
      );
    });

    it("disables queries when enabled is false", () => {
      setupRefineHookMocks({});

      renderHook(() => useDailyPlanData({ clientId: "client-1", dayNumber: 1, enabled: false }));

      // Check that queries are passed enabled: false
      expect(mockUseOne).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({ enabled: false }),
        })
      );
    });

    it("disables queries when clientId is empty", () => {
      setupRefineHookMocks({});

      renderHook(() => useDailyPlanData({ clientId: "", dayNumber: 1 }));

      // When clientId is empty string (falsy), enabled becomes false
      expect(mockUseOne).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({ enabled: false }),
        })
      );
    });
  });
});
