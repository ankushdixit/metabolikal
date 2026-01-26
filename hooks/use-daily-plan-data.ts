/**
 * useDailyPlanData Hook
 *
 * Hook for fetching all plan data (diet, supplements, workout, lifestyle)
 * for a specific client and day number. Used by the Daily Plan View component.
 * Also provides limit checking and plan configuration data.
 */

"use client";

import { useMemo, useCallback } from "react";
import { useList, useOne, useInvalidate } from "@refinedev/core";
import type {
  DietPlan,
  SupplementPlan,
  WorkoutPlan,
  LifestyleActivityPlan,
  FoodItem,
  Supplement,
  Exercise,
  LifestyleActivityType,
  ClientPlanLimit,
  Profile,
  MealCategory,
  WorkoutSection,
} from "@/lib/database.types";
import { parsePlanDate, getDayDate, formatPlanDateForStorage } from "@/lib/utils/plan-dates";

// Extended types with joined relations
export interface DietPlanWithFood extends DietPlan {
  food_items?: FoodItem | null;
}

export interface SupplementPlanWithSupplement extends SupplementPlan {
  supplements?: Supplement | null;
}

export interface WorkoutPlanWithExercise extends WorkoutPlan {
  exercises?: Exercise | null;
}

export interface LifestyleActivityPlanWithType extends LifestyleActivityPlan {
  lifestyle_activity_types?: LifestyleActivityType | null;
}

/**
 * Plan configuration from client profile
 */
export interface PlanConfig {
  startDate: Date | null;
  durationDays: number;
}

/**
 * Diet totals for a day
 */
export interface DietTotals {
  totalCalories: number;
  totalProtein: number;
  mealCount: number;
}

/**
 * Workout totals for a day
 */
export interface WorkoutTotals {
  exerciseCount: number;
  totalDuration: number;
}

/**
 * Supplement counts by time period
 */
export interface SupplementCounts {
  morning: number;
  afternoon: number;
  evening: number;
  total: number;
}

export interface UseDailyPlanDataOptions {
  clientId: string;
  dayNumber: number;
  enabled?: boolean;
}

export interface UseDailyPlanDataReturn {
  // Raw plan data
  dietPlans: DietPlanWithFood[];
  supplementPlans: SupplementPlanWithSupplement[];
  workoutPlans: WorkoutPlanWithExercise[];
  lifestylePlans: LifestyleActivityPlanWithType[];

  // Grouped/organized data
  dietByMeal: Map<MealCategory, DietPlanWithFood[]>;
  workoutBySection: Map<WorkoutSection, WorkoutPlanWithExercise[]>;

  // Totals
  dietTotals: DietTotals;
  workoutTotals: WorkoutTotals;
  supplementCounts: SupplementCounts;
  lifestyleCount: number;

  // Plan configuration
  planConfig: PlanConfig;

  // Limits
  limits: ClientPlanLimit[];
  hasLimitsForDay: boolean;
  currentLimit: ClientPlanLimit | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;

  // Actions
  refetchAll: () => void;
}

// Meal order for display
const MEAL_ORDER: MealCategory[] = [
  "pre-workout",
  "breakfast",
  "lunch",
  "evening-snack",
  "post-workout",
  "dinner",
];

// Workout section order
const WORKOUT_SECTION_ORDER: WorkoutSection[] = ["warmup", "main", "cooldown"];

/**
 * Check if a day number has valid limit coverage
 */
function checkLimitsForDay(
  dayNumber: number,
  planStartDate: Date | null,
  limits: ClientPlanLimit[]
): { hasLimits: boolean; currentLimit: ClientPlanLimit | null } {
  if (!planStartDate || limits.length === 0) {
    return { hasLimits: false, currentLimit: null };
  }

  const dayDate = getDayDate(planStartDate, dayNumber);
  const dateStr = formatPlanDateForStorage(dayDate);

  const matchingLimit = limits.find(
    (limit) => dateStr >= limit.start_date && dateStr <= limit.end_date
  );

  return {
    hasLimits: !!matchingLimit,
    currentLimit: matchingLimit || null,
  };
}

/**
 * Calculate the current day number based on plan start date
 * Returns 1 if today is before start, or last day if today is after end
 */
export function calculateCurrentDay(planStartDate: Date, planDurationDays: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(planStartDate);
  start.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dayNumber = diffDays + 1;

  // Clamp to valid range
  if (dayNumber < 1) return 1;
  if (dayNumber > planDurationDays) return planDurationDays;
  return dayNumber;
}

/**
 * Hook for fetching daily plan data
 */
export function useDailyPlanData({
  clientId,
  dayNumber,
  enabled = true,
}: UseDailyPlanDataOptions): UseDailyPlanDataReturn {
  const invalidate = useInvalidate();

  // Fetch client profile for plan configuration
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: clientId,
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Parse plan configuration from profile
  const planConfig = useMemo<PlanConfig>(() => {
    const profile = profileQuery.query.data?.data;
    return {
      startDate: parsePlanDate(profile?.plan_start_date),
      durationDays: profile?.plan_duration_days ?? 7,
    };
  }, [profileQuery.query.data?.data]);

  // Fetch diet plans with food item details
  const dietPlansQuery = useList<DietPlanWithFood>({
    resource: "diet_plans",
    filters: [
      { field: "client_id", operator: "eq", value: clientId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, food_items(*)",
    },
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Fetch supplement plans with supplement details
  const supplementPlansQuery = useList<SupplementPlanWithSupplement>({
    resource: "supplement_plans",
    filters: [
      { field: "client_id", operator: "eq", value: clientId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, supplements(*)",
    },
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Fetch workout plans with exercise details
  const workoutPlansQuery = useList<WorkoutPlanWithExercise>({
    resource: "workout_plans",
    filters: [
      { field: "client_id", operator: "eq", value: clientId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, exercises(*)",
    },
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Fetch lifestyle activity plans with activity type details
  const lifestylePlansQuery = useList<LifestyleActivityPlanWithType>({
    resource: "lifestyle_activity_plans",
    filters: [
      { field: "client_id", operator: "eq", value: clientId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, lifestyle_activity_types(*)",
    },
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Fetch client plan limits
  const limitsQuery = useList<ClientPlanLimit>({
    resource: "client_plan_limits",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    sorters: [{ field: "start_date", order: "asc" }],
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Raw data
  const dietPlans = dietPlansQuery.query.data?.data || [];
  const supplementPlans = supplementPlansQuery.query.data?.data || [];
  const workoutPlans = workoutPlansQuery.query.data?.data || [];
  const lifestylePlans = lifestylePlansQuery.query.data?.data || [];
  const limits = limitsQuery.query.data?.data || [];

  // Group diet plans by meal category
  const dietByMeal = useMemo(() => {
    const grouped = new Map<MealCategory, DietPlanWithFood[]>();

    // Initialize with meal order
    for (const meal of MEAL_ORDER) {
      grouped.set(meal, []);
    }

    // Group items
    for (const plan of dietPlans) {
      const meal = (plan.meal_category || "lunch") as MealCategory;
      const existing = grouped.get(meal) || [];
      existing.push(plan);
      grouped.set(meal, existing);
    }

    // Remove empty meal categories
    for (const [meal, items] of grouped) {
      if (items.length === 0) {
        grouped.delete(meal);
      }
    }

    return grouped;
  }, [dietPlans]);

  // Group workout plans by section
  const workoutBySection = useMemo(() => {
    const grouped = new Map<WorkoutSection, WorkoutPlanWithExercise[]>();

    // Initialize with section order
    for (const section of WORKOUT_SECTION_ORDER) {
      grouped.set(section, []);
    }

    // Group items
    for (const plan of workoutPlans) {
      const section = (plan.section || "main") as WorkoutSection;
      const existing = grouped.get(section) || [];
      existing.push(plan);
      grouped.set(section, existing);
    }

    // Remove empty sections
    for (const [section, items] of grouped) {
      if (items.length === 0) {
        grouped.delete(section);
      }
    }

    return grouped;
  }, [workoutPlans]);

  // Calculate diet totals
  const dietTotals = useMemo<DietTotals>(() => {
    let totalCalories = 0;
    let totalProtein = 0;

    for (const plan of dietPlans) {
      const calories = plan.food_items?.calories || 0;
      const protein = plan.food_items?.protein || 0;
      const multiplier = plan.serving_multiplier || 1;
      totalCalories += calories * multiplier;
      totalProtein += protein * multiplier;
    }

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      mealCount: dietByMeal.size,
    };
  }, [dietPlans, dietByMeal.size]);

  // Calculate workout totals
  const workoutTotals = useMemo<WorkoutTotals>(() => {
    let totalDuration = 0;

    for (const plan of workoutPlans) {
      totalDuration += plan.scheduled_duration_minutes || plan.duration_minutes || 5;
    }

    return {
      exerciseCount: workoutPlans.length,
      totalDuration,
    };
  }, [workoutPlans]);

  // Calculate supplement counts by time of day
  const supplementCounts = useMemo<SupplementCounts>(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    for (const plan of supplementPlans) {
      const period = plan.time_period;
      if (period === "early_morning" || period === "morning") {
        morning++;
      } else if (period === "midday" || period === "afternoon") {
        afternoon++;
      } else if (period === "evening" || period === "night" || period === "before_sleep") {
        evening++;
      } else {
        // Default to morning for unspecified
        morning++;
      }
    }

    return {
      morning,
      afternoon,
      evening,
      total: supplementPlans.length,
    };
  }, [supplementPlans]);

  // Check limits for current day
  const { hasLimits: hasLimitsForDay, currentLimit } = useMemo(
    () => checkLimitsForDay(dayNumber, planConfig.startDate, limits),
    [dayNumber, planConfig.startDate, limits]
  );

  // Loading state
  const isLoading =
    profileQuery.query.isLoading ||
    dietPlansQuery.query.isLoading ||
    supplementPlansQuery.query.isLoading ||
    workoutPlansQuery.query.isLoading ||
    lifestylePlansQuery.query.isLoading ||
    limitsQuery.query.isLoading;

  // Error state
  const isError =
    profileQuery.query.isError ||
    dietPlansQuery.query.isError ||
    supplementPlansQuery.query.isError ||
    workoutPlansQuery.query.isError ||
    lifestylePlansQuery.query.isError ||
    limitsQuery.query.isError;

  // Refetch all data
  const refetchAll = useCallback(() => {
    invalidate({ resource: "profiles", invalidates: ["detail"] });
    invalidate({ resource: "diet_plans", invalidates: ["list"] });
    invalidate({ resource: "supplement_plans", invalidates: ["list"] });
    invalidate({ resource: "workout_plans", invalidates: ["list"] });
    invalidate({ resource: "lifestyle_activity_plans", invalidates: ["list"] });
    invalidate({ resource: "client_plan_limits", invalidates: ["list"] });
  }, [invalidate]);

  return {
    // Raw data
    dietPlans,
    supplementPlans,
    workoutPlans,
    lifestylePlans,

    // Grouped data
    dietByMeal,
    workoutBySection,

    // Totals
    dietTotals,
    workoutTotals,
    supplementCounts,
    lifestyleCount: lifestylePlans.length,

    // Config
    planConfig,

    // Limits
    limits,
    hasLimitsForDay,
    currentLimit,

    // Loading states
    isLoading,
    isError,

    // Actions
    refetchAll,
  };
}
