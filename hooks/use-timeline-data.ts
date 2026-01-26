/**
 * useTimelineData Hook
 *
 * Combined data fetching hook for the unified timeline editor.
 * Fetches diet plans, supplement plans, workout plans, and lifestyle activity plans
 * for a specific client and day, transforming them into a unified TimelineItem format.
 *
 * Supports visual grouping of meals (by meal_category + time) and workouts (by time).
 */

"use client";

import { useMemo, useCallback } from "react";
import { useList, useOne, useInvalidate } from "@refinedev/core";
import type {
  DietPlan,
  SupplementPlan,
  WorkoutPlan,
  LifestyleActivityPlan,
  TimelineItem,
  TimelineItemType,
  TimelineScheduling,
  FoodItem,
  Supplement,
  Exercise,
  LifestyleActivityType,
  ClientAnchorTimes,
  MealCategory,
  Profile,
  ClientCondition,
  MedicalConditionRow,
} from "@/lib/database.types";
import {
  timeToMinutes,
  TIME_PERIOD_RANGES,
  getEffectiveSortTime,
  DEFAULT_ANCHOR_TIMES,
} from "@/lib/utils/timeline";
import type { LanePackingItem } from "@/lib/utils/lane-packing";
import { parsePlanDate } from "@/lib/utils/plan-dates";

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

export interface ClientConditionWithDetails extends ClientCondition {
  medical_conditions?: MedicalConditionRow | null;
}

/**
 * Extended timeline item with source data reference
 */
export interface ExtendedTimelineItem extends TimelineItem {
  sourceType: "diet_plan" | "supplement_plan" | "workout_plan" | "lifestyle_activity_plan";
  sourceId: string;
  dayNumber: number | null;
  // Grouping support
  isGrouped?: boolean;
  groupKey?: string;
  groupedSourceIds?: string[];
  groupedItems?:
    | DietPlanWithFood[]
    | WorkoutPlanWithExercise[]
    | SupplementPlanWithSupplement[]
    | LifestyleActivityPlanWithType[];
  itemCount?: number;
  itemNames?: string[];
}

// Default duration in minutes for items without explicit end times
const DEFAULT_ITEM_DURATION = 30;
const DEFAULT_WORKOUT_GROUP_DURATION = 45; // Grouped workouts default to 45 min

/**
 * Map meal categories to relative anchors for computing anchor times
 */
const MEAL_CATEGORY_TO_ANCHOR: Partial<Record<MealCategory, keyof ClientAnchorTimes>> = {
  breakfast: "breakfast",
  lunch: "lunch",
  "evening-snack": "evening_snack",
  dinner: "dinner",
  "pre-workout": "pre_workout",
  "post-workout": "post_workout",
};

/**
 * Generate a grouping key for a scheduling object
 */
function getSchedulingKey(scheduling: TimelineScheduling): string {
  if (scheduling.time_type === "fixed" && scheduling.time_start) {
    return `fixed:${scheduling.time_start}`;
  }
  if (scheduling.time_type === "period" && scheduling.time_period) {
    return `period:${scheduling.time_period}`;
  }
  if (scheduling.time_type === "relative" && scheduling.relative_anchor) {
    return `relative:${scheduling.relative_anchor}:${scheduling.relative_offset_minutes || 0}`;
  }
  if (scheduling.time_type === "all_day") {
    return "all_day";
  }
  return "unknown";
}

/**
 * Convert a plan item to LanePackingItem format
 */
function toPackingItem(
  item: ExtendedTimelineItem,
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): LanePackingItem {
  // Calculate end time based on scheduling type
  let startMinutes: number;
  let endMinutes: number;

  if (item.scheduling.time_type === "all_day") {
    // All-day items span the entire visible timeline (5 AM to 11 PM)
    return {
      id: item.id,
      startMinutes: timeToMinutes("05:00"),
      endMinutes: timeToMinutes("23:00"),
      type: item.type,
    };
  }

  if (item.scheduling.time_type === "period" && item.scheduling.time_period) {
    // Period-based items span the entire period
    const periodRange = TIME_PERIOD_RANGES[item.scheduling.time_period];
    startMinutes = timeToMinutes(periodRange.start);
    endMinutes = timeToMinutes(periodRange.end);
  } else {
    // Fixed or relative time - use calculated sort time
    startMinutes = getEffectiveSortTime(item.scheduling, clientAnchors);

    if (item.scheduling.time_end) {
      endMinutes = timeToMinutes(item.scheduling.time_end);
    } else if (item.metadata?.duration) {
      // Use specified duration
      endMinutes = startMinutes + item.metadata.duration;
    } else if (item.isGrouped && item.type === "workout") {
      // Grouped workouts get longer default duration
      endMinutes = startMinutes + DEFAULT_WORKOUT_GROUP_DURATION;
    } else {
      // Default duration
      endMinutes = startMinutes + DEFAULT_ITEM_DURATION;
    }
  }

  // Ensure end is after start
  if (endMinutes <= startMinutes) {
    endMinutes = startMinutes + DEFAULT_ITEM_DURATION;
  }

  return {
    id: item.id,
    startMinutes,
    endMinutes,
    type: item.type,
  };
}

/**
 * Transform diet plan to timeline item
 */
function transformDietPlan(plan: DietPlanWithFood): ExtendedTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: plan.time_type || "period",
    time_start: plan.time_start,
    time_end: plan.time_end,
    time_period: plan.time_period,
    relative_anchor: plan.relative_anchor,
    relative_offset_minutes: plan.relative_offset_minutes || 0,
  };

  const foodName = plan.food_items?.name || "Unknown Food";
  const calories = plan.food_items?.calories || 0;
  const protein = plan.food_items?.protein || 0;
  const multiplier = plan.serving_multiplier || 1;

  return {
    id: plan.id,
    type: "meal" as TimelineItemType,
    title: foodName,
    subtitle: plan.meal_category || undefined,
    scheduling,
    metadata: {
      calories: Math.round(calories * multiplier),
      protein: Math.round(protein * multiplier),
      displayOrder: plan.display_order || 0,
    },
    sourceType: "diet_plan",
    sourceId: plan.id,
    dayNumber: plan.day_number,
    groupKey: `meal:${plan.meal_category || "unknown"}:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform supplement plan to timeline item
 */
function transformSupplementPlan(plan: SupplementPlanWithSupplement): ExtendedTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: plan.time_type || "period",
    time_start: plan.time_start,
    time_end: plan.time_end,
    time_period: plan.time_period,
    relative_anchor: plan.relative_anchor,
    relative_offset_minutes: plan.relative_offset_minutes || 0,
  };

  const supplement = plan.supplements;
  const name = supplement?.name || "Unknown Supplement";
  const dosageUnit = supplement?.dosage_unit || "mg";

  return {
    id: plan.id,
    type: "supplement" as TimelineItemType,
    title: name,
    subtitle: supplement?.category || undefined,
    scheduling,
    metadata: {
      dosage: plan.dosage,
      dosageUnit,
      displayOrder: plan.display_order || 0,
    },
    sourceType: "supplement_plan",
    sourceId: plan.id,
    dayNumber: plan.day_number,
    groupKey: `supplement:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform workout plan to timeline item
 */
function transformWorkoutPlan(plan: WorkoutPlanWithExercise): ExtendedTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: plan.time_type || "period",
    time_start: plan.time_start,
    time_end: plan.time_end,
    time_period: plan.time_period,
    relative_anchor: plan.relative_anchor,
    relative_offset_minutes: plan.relative_offset_minutes || 0,
  };

  // Use exercise name from plan or linked exercise
  const name = plan.exercise_name || plan.exercises?.name || "Unknown Exercise";
  const section = plan.section || "main";

  return {
    id: plan.id,
    type: "workout" as TimelineItemType,
    title: name,
    subtitle: section,
    scheduling,
    metadata: {
      sets: plan.sets || undefined,
      reps: plan.reps || undefined,
      duration: plan.scheduled_duration_minutes || plan.duration_minutes || undefined,
      displayOrder: plan.display_order || 0,
    },
    sourceType: "workout_plan",
    sourceId: plan.id,
    dayNumber: plan.day_number,
    groupKey: `workout:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform lifestyle activity plan to timeline item
 */
function transformLifestyleActivityPlan(plan: LifestyleActivityPlanWithType): ExtendedTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: plan.time_type || "all_day",
    time_start: plan.time_start,
    time_end: plan.time_end,
    time_period: plan.time_period,
    relative_anchor: plan.relative_anchor,
    relative_offset_minutes: plan.relative_offset_minutes || 0,
  };

  const activityType = plan.lifestyle_activity_types;
  const name = activityType?.name || "Activity";
  const targetUnit = activityType?.target_unit || "";

  return {
    id: plan.id,
    type: "lifestyle" as TimelineItemType,
    title: name,
    subtitle: activityType?.category || undefined,
    scheduling,
    metadata: {
      targetValue: plan.target_value || activityType?.default_target_value || undefined,
      targetUnit: targetUnit || undefined,
      displayOrder: plan.display_order || 0,
    },
    sourceType: "lifestyle_activity_plan",
    sourceId: plan.id,
    dayNumber: plan.day_number,
    groupKey: `lifestyle:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Group diet items by meal_category + time slot
 * Always creates a grouped view (even for single items) so users can easily add more items
 */
function groupDietItems(
  items: ExtendedTimelineItem[],
  rawPlans: DietPlanWithFood[]
): ExtendedTimelineItem[] {
  const groups = new Map<string, ExtendedTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    // Sort by displayOrder
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    // Always create a grouped item (even for single items)
    // This allows users to click and add more items to the meal
    const firstItem = sortedItems[0];
    const totalCalories = sortedItems.reduce(
      (sum, item) => sum + (item.metadata?.calories || 0),
      0
    );
    const totalProtein = sortedItems.reduce((sum, item) => sum + (item.metadata?.protein || 0), 0);
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    // Sort raw plans by display_order too
    const groupedRawPlans = rawPlans
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Format meal category for display
    const mealCategory = firstItem.subtitle || "Meal";
    const formattedCategory =
      mealCategory.charAt(0).toUpperCase() + mealCategory.slice(1).replace("-", " ");

    result.push({
      ...firstItem,
      id: `group:${groupKey}`,
      title: formattedCategory,
      subtitle: sortedItems.length === 1 ? "1 item" : `${sortedItems.length} items`,
      isGrouped: true,
      groupKey,
      groupedSourceIds,
      groupedItems: groupedRawPlans,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {
        calories: totalCalories,
        protein: totalProtein,
      },
    });
  }

  return result;
}

/**
 * Group workout items by time slot
 * Always creates grouped view for consistency
 */
function groupWorkoutItems(
  items: ExtendedTimelineItem[],
  rawPlans: WorkoutPlanWithExercise[]
): ExtendedTimelineItem[] {
  const groups = new Map<string, ExtendedTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    // Sort by displayOrder
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    // Always create a grouped item (even for single items)
    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    // Sort raw plans by display_order too
    const groupedRawPlans = rawPlans
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Calculate total duration
    const totalDuration = sortedItems.reduce(
      (sum, item) => sum + (item.metadata?.duration || 5),
      0
    );

    result.push({
      ...firstItem,
      id: `group:${groupKey}`,
      title: "Workout Session",
      subtitle: sortedItems.length === 1 ? "1 exercise" : `${sortedItems.length} exercises`,
      isGrouped: true,
      groupKey,
      groupedSourceIds,
      groupedItems: groupedRawPlans,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {
        duration: totalDuration,
      },
    });
  }

  return result;
}

/**
 * Group supplement items by time slot
 * Always creates grouped view for consistency
 */
function groupSupplementItems(
  items: ExtendedTimelineItem[],
  rawPlans: SupplementPlanWithSupplement[]
): ExtendedTimelineItem[] {
  const groups = new Map<string, ExtendedTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    // Sort by displayOrder
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    // Always create a grouped item (even for single items)
    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    // Sort raw plans by display_order too
    const groupedRawPlans = rawPlans
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    result.push({
      ...firstItem,
      id: `group:${groupKey}`,
      title: "Supplements",
      subtitle: sortedItems.length === 1 ? "1 supplement" : `${sortedItems.length} supplements`,
      isGrouped: true,
      groupKey,
      groupedSourceIds,
      groupedItems: groupedRawPlans,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {},
    });
  }

  return result;
}

/**
 * Group lifestyle activity items by time slot
 * Always creates grouped view for consistency
 */
function groupLifestyleItems(
  items: ExtendedTimelineItem[],
  rawPlans: LifestyleActivityPlanWithType[]
): ExtendedTimelineItem[] {
  const groups = new Map<string, ExtendedTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    // Sort by displayOrder
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    // Always create a grouped item (even for single items)
    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    // Sort raw plans by display_order too
    const groupedRawPlans = rawPlans
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    result.push({
      ...firstItem,
      id: `group:${groupKey}`,
      title: "Lifestyle Activities",
      subtitle: sortedItems.length === 1 ? "1 activity" : `${sortedItems.length} activities`,
      isGrouped: true,
      groupKey,
      groupedSourceIds,
      groupedItems: groupedRawPlans,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {},
    });
  }

  return result;
}

/**
 * Plan configuration from client profile
 */
export interface PlanConfig {
  startDate: Date | null;
  durationDays: number;
}

export interface UseTimelineDataOptions {
  clientId: string;
  dayNumber: number;
  enabled?: boolean;
}

export interface UseTimelineDataReturn {
  timelineItems: ExtendedTimelineItem[];
  packingItems: LanePackingItem[];
  isLoading: boolean;
  isError: boolean;
  refetchAll: () => void;
  // Grouped by type for filtering
  dietItems: ExtendedTimelineItem[];
  supplementItems: ExtendedTimelineItem[];
  workoutItems: ExtendedTimelineItem[];
  lifestyleItems: ExtendedTimelineItem[];
  // Raw data for mutations
  rawDietPlans: DietPlanWithFood[];
  rawSupplementPlans: SupplementPlanWithSupplement[];
  rawWorkoutPlans: WorkoutPlanWithExercise[];
  rawLifestyleActivityPlans: LifestyleActivityPlanWithType[];
  // Plan configuration from client profile
  planConfig: PlanConfig;
  // Client's medical conditions for food compatibility checks
  clientConditions: ClientConditionWithDetails[];
}

/**
 * Hook for fetching and transforming timeline data
 */
export function useTimelineData({
  clientId,
  dayNumber,
  enabled = true,
}: UseTimelineDataOptions): UseTimelineDataReturn {
  const invalidate = useInvalidate();

  // Fetch client profile for plan configuration
  // Note: Fetching full profile to avoid React Query caching issues with partial selects
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
  const lifestyleActivityPlansQuery = useList<LifestyleActivityPlanWithType>({
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

  // Fetch client conditions with medical condition details (for food compatibility warnings)
  const clientConditionsQuery = useList<ClientConditionWithDetails>({
    resource: "client_conditions",
    filters: [{ field: "client_id", operator: "eq", value: clientId }],
    meta: {
      select: "*, medical_conditions(id, name, slug)",
    },
    queryOptions: {
      enabled: enabled && !!clientId,
    },
  });

  // Raw data for mutations
  const rawDietPlans = dietPlansQuery.query.data?.data || [];
  const rawSupplementPlans = supplementPlansQuery.query.data?.data || [];
  const rawWorkoutPlans = workoutPlansQuery.query.data?.data || [];
  const rawLifestyleActivityPlans = lifestyleActivityPlansQuery.query.data?.data || [];
  const clientConditions = clientConditionsQuery.query.data?.data || [];

  // Compute actual anchor times from meals with fixed times
  // This ensures relative items (supplements, workouts) use the actual meal times
  // rather than the hardcoded DEFAULT_ANCHOR_TIMES
  const computedAnchorTimes = useMemo(() => {
    const anchors: ClientAnchorTimes = { ...DEFAULT_ANCHOR_TIMES };

    for (const plan of rawDietPlans) {
      // Only use fixed-time meals to determine anchor times
      if (plan.meal_category && plan.time_type === "fixed" && plan.time_start) {
        const anchorKey = MEAL_CATEGORY_TO_ANCHOR[plan.meal_category as MealCategory];
        if (anchorKey) {
          anchors[anchorKey] = plan.time_start;
        }
      }
    }

    return anchors;
  }, [rawDietPlans]);

  // Transform to individual timeline items first
  const rawDietItems = useMemo(() => rawDietPlans.map(transformDietPlan), [rawDietPlans]);

  const rawSupplementItems = useMemo(
    () => rawSupplementPlans.map(transformSupplementPlan),
    [rawSupplementPlans]
  );

  const rawWorkoutItems = useMemo(
    () => rawWorkoutPlans.map(transformWorkoutPlan),
    [rawWorkoutPlans]
  );

  const rawLifestyleItems = useMemo(
    () => rawLifestyleActivityPlans.map(transformLifestyleActivityPlan),
    [rawLifestyleActivityPlans]
  );

  // Apply grouping to all item types
  const dietItems = useMemo(
    () => groupDietItems(rawDietItems, rawDietPlans),
    [rawDietItems, rawDietPlans]
  );

  const supplementItems = useMemo(
    () => groupSupplementItems(rawSupplementItems, rawSupplementPlans),
    [rawSupplementItems, rawSupplementPlans]
  );

  const workoutItems = useMemo(
    () => groupWorkoutItems(rawWorkoutItems, rawWorkoutPlans),
    [rawWorkoutItems, rawWorkoutPlans]
  );

  const lifestyleItems = useMemo(
    () => groupLifestyleItems(rawLifestyleItems, rawLifestyleActivityPlans),
    [rawLifestyleItems, rawLifestyleActivityPlans]
  );

  // Combined timeline items (with grouping applied)
  const timelineItems = useMemo(
    () => [...dietItems, ...supplementItems, ...workoutItems, ...lifestyleItems],
    [dietItems, supplementItems, workoutItems, lifestyleItems]
  );

  // Convert to packing items for lane algorithm
  // Pass computed anchor times so relative items use actual meal times
  const packingItems = useMemo(
    () => timelineItems.map((item) => toPackingItem(item, computedAnchorTimes)),
    [timelineItems, computedAnchorTimes]
  );

  // Loading state
  const isLoading =
    profileQuery.query.isLoading ||
    dietPlansQuery.query.isLoading ||
    supplementPlansQuery.query.isLoading ||
    workoutPlansQuery.query.isLoading ||
    lifestyleActivityPlansQuery.query.isLoading ||
    clientConditionsQuery.query.isLoading;

  // Error state
  const isError =
    profileQuery.query.isError ||
    dietPlansQuery.query.isError ||
    supplementPlansQuery.query.isError ||
    workoutPlansQuery.query.isError ||
    lifestyleActivityPlansQuery.query.isError ||
    clientConditionsQuery.query.isError;

  // Refetch all data
  const refetchAll = useCallback(() => {
    invalidate({
      resource: "profiles",
      invalidates: ["detail"],
    });
    invalidate({
      resource: "diet_plans",
      invalidates: ["list"],
    });
    invalidate({
      resource: "supplement_plans",
      invalidates: ["list"],
    });
    invalidate({
      resource: "workout_plans",
      invalidates: ["list"],
    });
    invalidate({
      resource: "lifestyle_activity_plans",
      invalidates: ["list"],
    });
  }, [invalidate]);

  return {
    timelineItems,
    packingItems,
    isLoading,
    isError,
    refetchAll,
    dietItems,
    supplementItems,
    workoutItems,
    lifestyleItems,
    rawDietPlans,
    rawSupplementPlans,
    rawWorkoutPlans,
    rawLifestyleActivityPlans,
    planConfig,
    clientConditions,
  };
}
