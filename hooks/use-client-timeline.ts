/**
 * useClientTimeline Hook
 *
 * Client-facing timeline hook that extends useTimelineData with:
 * - Plan completion tracking (mark items complete/uncomplete)
 * - Macro limits from client_plan_limits
 * - Day number calculation based on plan_start_date
 * - Consumed totals calculation from completed items
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useList, useOne, useCreate, useDelete, useInvalidate } from "@refinedev/core";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { useTimelineData, type ExtendedTimelineItem } from "./use-timeline-data";
import type {
  Profile,
  ClientPlanLimit,
  PlanCompletion,
  PlanCompletionType,
} from "@/lib/database.types";
import {
  parsePlanDate,
  getDayNumber,
  getTodaysDayNumber,
  formatDayLabel,
} from "@/lib/utils/plan-dates";

// =============================================================================
// TYPES
// =============================================================================

export interface MacroTargets {
  calories: number | null;
  proteinMin: number | null;
  proteinMax: number | null;
  carbsMin: number | null;
  carbsMax: number | null;
  fatsMin: number | null;
  fatsMax: number | null;
  hasLimits: boolean;
}

export interface ConsumedTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface PlanProgress {
  dayNumber: number;
  totalDays: number;
  progressPercent: number;
  daysRemaining: number;
  weekNumber: number;
  isExtended: boolean;
}

export interface UseClientTimelineOptions {
  selectedDate?: Date;
  dayNumberOverride?: number;
}

export interface UseClientTimelineReturn {
  // User
  userId: string | null;

  // Timeline items
  timelineItems: ExtendedTimelineItem[];
  packingItems: ReturnType<typeof useTimelineData>["packingItems"];

  // Filtered items
  dietItems: ExtendedTimelineItem[];
  supplementItems: ExtendedTimelineItem[];
  workoutItems: ExtendedTimelineItem[];
  lifestyleItems: ExtendedTimelineItem[];

  // Plan info
  planProgress: PlanProgress | null;
  planStartDate: Date | null;
  isPlanConfigured: boolean;
  isBeforePlanStart: boolean;
  dayLabel: string;

  // Targets from coach-set limits
  targets: MacroTargets;

  // Consumed totals from plan items
  consumed: ConsumedTotals;

  // Completions
  completions: PlanCompletion[];
  completedCount: number;
  totalCount: number;
  isItemCompleted: (itemId: string) => boolean;
  isSourceItemCompleted: (sourceId: string) => boolean;
  getItemCompletionStatus: (itemId: string) => { completed: number; total: number };
  markComplete: (item: ExtendedTimelineItem) => Promise<void>;
  markUncomplete: (item: ExtendedTimelineItem) => Promise<void>;
  markSourceItemComplete: (sourceId: string, planType: PlanCompletionType) => Promise<void>;
  markSourceItemUncomplete: (sourceId: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;

  // Date info
  selectedDate: Date;
  dateStr: string;
  formattedDate: string;
  dayNumber: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate consumed totals from completed diet items
 */
function calculateConsumedFromItems(
  dietItems: ExtendedTimelineItem[],
  completions: PlanCompletion[]
): ConsumedTotals {
  const completedItemIds = new Set(
    completions.filter((c) => c.plan_type === "diet").map((c) => c.plan_item_id)
  );

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;

  for (const item of dietItems) {
    // For grouped items, check if any grouped source IDs are completed
    const isCompleted = item.groupedSourceIds
      ? item.groupedSourceIds.some((id) => completedItemIds.has(id))
      : completedItemIds.has(item.sourceId);

    if (isCompleted) {
      calories += item.metadata?.calories || 0;
      protein += item.metadata?.protein || 0;
      // Note: carbs and fats would need to be added to timeline items if needed
    }
  }

  return { calories, protein, carbs, fats };
}

/**
 * Calculate plan progress from start date and duration
 */
function calculatePlanProgress(
  startDate: Date,
  durationDays: number,
  currentDate: Date
): PlanProgress {
  const dayNumber = getDayNumber(startDate, currentDate);
  const clampedDayNumber = Math.max(1, dayNumber);
  const progressPercent = Math.min(100, Math.max(0, (clampedDayNumber / durationDays) * 100));
  const daysRemaining = Math.max(0, durationDays - clampedDayNumber + 1);
  const weekNumber = Math.ceil(clampedDayNumber / 7);
  const isExtended = dayNumber > durationDays;

  return {
    dayNumber: clampedDayNumber,
    totalDays: durationDays,
    progressPercent,
    daysRemaining,
    weekNumber,
    isExtended,
  };
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useClientTimeline({
  selectedDate,
  dayNumberOverride,
}: UseClientTimelineOptions = {}): UseClientTimelineReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const invalidate = useInvalidate();

  // Get current user ID from Supabase auth
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch user profile for plan configuration
  const profileQuery = useOne<Profile>({
    resource: "profiles",
    id: userId || "",
    queryOptions: {
      enabled: !!userId,
    },
  });

  const profile = profileQuery.query.data?.data;
  const planStartDate = parsePlanDate(profile?.plan_start_date);
  const planDurationDays = profile?.plan_duration_days ?? 7;

  // Calculate current date based on dayNumberOverride or selectedDate
  const currentDate = useMemo(() => {
    if (dayNumberOverride && planStartDate) {
      // Calculate date from day number override
      const date = new Date(planStartDate);
      date.setDate(date.getDate() + dayNumberOverride - 1);
      return date;
    }
    return selectedDate || new Date();
  }, [dayNumberOverride, planStartDate, selectedDate]);

  const dateStr = currentDate.toISOString().split("T")[0];
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate plan progress (always based on today for progress display)
  const planProgress = useMemo<PlanProgress | null>(() => {
    if (!planStartDate) return null;
    return calculatePlanProgress(planStartDate, planDurationDays, new Date());
  }, [planStartDate, planDurationDays]);

  // Calculate day number for timeline data fetch
  const dayNumber = useMemo(() => {
    // If day number override provided, use it
    if (dayNumberOverride) {
      return dayNumberOverride;
    }

    if (!planStartDate) {
      // Fallback to cycling through 7 days if no plan start date
      const today = new Date();
      const profileCreated = profile?.created_at ? new Date(profile.created_at) : today;
      const totalDays =
        Math.floor((currentDate.getTime() - profileCreated.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return ((totalDays - 1) % 7) + 1;
    }

    const todaysDayNumber = getTodaysDayNumber(planStartDate);
    if (todaysDayNumber === null) {
      // Before plan start - show day 1
      return 1;
    }

    // If viewing a different date, calculate its day number
    if (selectedDate) {
      return getDayNumber(planStartDate, selectedDate);
    }

    // Cycle through plan duration if extended
    return ((todaysDayNumber - 1) % planDurationDays) + 1;
  }, [
    planStartDate,
    planDurationDays,
    currentDate,
    selectedDate,
    dayNumberOverride,
    profile?.created_at,
  ]);

  // Day label for display
  const dayLabel = useMemo(() => {
    return formatDayLabel(planStartDate, dayNumber);
  }, [planStartDate, dayNumber]);

  // Is plan configured?
  const isPlanConfigured = !!planStartDate;
  // Only consider "before plan start" when viewing today
  const isBeforePlanStart =
    planStartDate && !dayNumberOverride && !selectedDate ? new Date() < planStartDate : false;

  // Fetch timeline data using existing hook
  const timelineData = useTimelineData({
    clientId: userId || "",
    dayNumber,
    enabled: !!userId,
  });

  // Fetch current day's macro limits
  const limitsQuery = useList<ClientPlanLimit>({
    resource: "client_plan_limits",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "start_date", operator: "lte", value: dateStr },
      { field: "end_date", operator: "gte", value: dateStr },
    ],
    pagination: { pageSize: 1 },
    queryOptions: {
      enabled: !!userId,
    },
  });

  const currentLimits = limitsQuery.query.data?.data?.[0] || null;

  // Macro targets from limits
  const targets = useMemo<MacroTargets>(() => {
    if (!currentLimits) {
      return {
        calories: null,
        proteinMin: null,
        proteinMax: null,
        carbsMin: null,
        carbsMax: null,
        fatsMin: null,
        fatsMax: null,
        hasLimits: false,
      };
    }

    return {
      calories: currentLimits.max_calories_per_day,
      proteinMin: currentLimits.min_protein_per_day,
      proteinMax: currentLimits.max_protein_per_day,
      carbsMin: currentLimits.min_carbs_per_day,
      carbsMax: currentLimits.max_carbs_per_day,
      fatsMin: currentLimits.min_fats_per_day,
      fatsMax: currentLimits.max_fats_per_day,
      hasLimits: true,
    };
  }, [currentLimits]);

  // Fetch completions for the date
  const completionsQuery = useList<PlanCompletion>({
    resource: "plan_completions",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "completed_date", operator: "eq", value: dateStr },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  const completions = completionsQuery.query.data?.data || [];

  // Calculate consumed totals from completed items
  const consumed = useMemo<ConsumedTotals>(() => {
    return calculateConsumedFromItems(timelineData.dietItems, completions);
  }, [timelineData.dietItems, completions]);

  // Completion mutations
  const { mutateAsync: createCompletion } = useCreate<PlanCompletion>();
  const { mutateAsync: deleteCompletion } = useDelete<PlanCompletion>();

  // Check if a specific source item is completed
  const isSourceItemCompleted = useCallback(
    (sourceId: string): boolean => {
      return completions.some((c) => c.plan_item_id === sourceId);
    },
    [completions]
  );

  // Check if an item is completed (all source items for grouped items)
  const isItemCompleted = useCallback(
    (itemId: string): boolean => {
      // For grouped items, extract the source IDs from the item ID
      // Grouped items have IDs like "group:meal:breakfast:fixed:08:00"
      // We need to check the actual source items
      const item = timelineData.timelineItems.find((i) => i.id === itemId);
      if (!item) return false;

      if (item.groupedSourceIds) {
        // For grouped items, check if ALL source items are completed
        return item.groupedSourceIds.every((sourceId) =>
          completions.some((c) => c.plan_item_id === sourceId)
        );
      }

      return completions.some((c) => c.plan_item_id === item.sourceId);
    },
    [timelineData.timelineItems, completions]
  );

  // Get completion status for a grouped item (completed/total)
  const getItemCompletionStatus = useCallback(
    (itemId: string): { completed: number; total: number } => {
      const item = timelineData.timelineItems.find((i) => i.id === itemId);
      if (!item) return { completed: 0, total: 0 };

      if (item.groupedSourceIds) {
        const total = item.groupedSourceIds.length;
        const completed = item.groupedSourceIds.filter((sourceId) =>
          completions.some((c) => c.plan_item_id === sourceId)
        ).length;
        return { completed, total };
      }

      const isCompleted = completions.some((c) => c.plan_item_id === item.sourceId);
      return { completed: isCompleted ? 1 : 0, total: 1 };
    },
    [timelineData.timelineItems, completions]
  );

  // Mark item as complete
  const markComplete = useCallback(
    async (item: ExtendedTimelineItem): Promise<void> => {
      if (!userId) return;

      // Map timeline item type to plan type
      const planTypeMap: Record<string, PlanCompletionType> = {
        meal: "diet",
        supplement: "supplement",
        workout: "workout",
        lifestyle: "lifestyle",
      };

      const planType = planTypeMap[item.type];
      if (!planType) return;

      // For grouped items, mark all source items as complete
      const sourceIds = item.groupedSourceIds || [item.sourceId];

      for (const sourceId of sourceIds) {
        // Skip if already completed
        if (completions.some((c) => c.plan_item_id === sourceId)) continue;

        await createCompletion({
          resource: "plan_completions",
          values: {
            client_id: userId,
            plan_type: planType,
            plan_item_id: sourceId,
            completed_date: dateStr,
          },
        });
      }

      // Invalidate completions query to refresh
      invalidate({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    },
    [userId, dateStr, completions, createCompletion, invalidate]
  );

  // Mark item as uncomplete
  const markUncomplete = useCallback(
    async (item: ExtendedTimelineItem): Promise<void> => {
      if (!userId) return;

      // For grouped items, uncomplete all source items
      const sourceIds = item.groupedSourceIds || [item.sourceId];

      for (const sourceId of sourceIds) {
        const completion = completions.find((c) => c.plan_item_id === sourceId);
        if (completion) {
          await deleteCompletion({
            resource: "plan_completions",
            id: completion.id,
          });
        }
      }

      // Invalidate completions query to refresh
      invalidate({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    },
    [userId, completions, deleteCompletion, invalidate]
  );

  // Mark a single source item as complete
  const markSourceItemComplete = useCallback(
    async (sourceId: string, planType: PlanCompletionType): Promise<void> => {
      if (!userId) return;

      // Skip if already completed
      if (completions.some((c) => c.plan_item_id === sourceId)) return;

      await createCompletion({
        resource: "plan_completions",
        values: {
          client_id: userId,
          plan_type: planType,
          plan_item_id: sourceId,
          completed_date: dateStr,
        },
      });

      // Invalidate completions query to refresh
      invalidate({
        resource: "plan_completions",
        invalidates: ["list"],
      });
    },
    [userId, dateStr, completions, createCompletion, invalidate]
  );

  // Mark a single source item as uncomplete
  const markSourceItemUncomplete = useCallback(
    async (sourceId: string): Promise<void> => {
      if (!userId) return;

      const completion = completions.find((c) => c.plan_item_id === sourceId);
      if (completion) {
        await deleteCompletion({
          resource: "plan_completions",
          id: completion.id,
        });

        // Invalidate completions query to refresh
        invalidate({
          resource: "plan_completions",
          invalidates: ["list"],
        });
      }
    },
    [userId, completions, deleteCompletion, invalidate]
  );

  // Completed count
  const completedCount = useMemo(() => {
    return timelineData.timelineItems.filter((item) => isItemCompleted(item.id)).length;
  }, [timelineData.timelineItems, isItemCompleted]);

  // Loading state - includes initial states before queries can start
  // This prevents flashing "Plan Not Configured" before data loads
  const isLoading =
    !userId || // Still fetching user ID from auth
    !profileQuery.query.isFetched || // Profile hasn't been fetched yet
    profileQuery.query.isLoading ||
    timelineData.isLoading ||
    limitsQuery.query.isLoading ||
    completionsQuery.query.isLoading;

  // Error state
  const isError =
    profileQuery.query.isError ||
    timelineData.isError ||
    limitsQuery.query.isError ||
    completionsQuery.query.isError;

  // Refetch all data
  const refetch = useCallback(() => {
    timelineData.refetchAll();
    invalidate({
      resource: "client_plan_limits",
      invalidates: ["list"],
    });
    invalidate({
      resource: "plan_completions",
      invalidates: ["list"],
    });
  }, [timelineData, invalidate]);

  return {
    // User
    userId,

    // Timeline items
    timelineItems: timelineData.timelineItems,
    packingItems: timelineData.packingItems,

    // Filtered items
    dietItems: timelineData.dietItems,
    supplementItems: timelineData.supplementItems,
    workoutItems: timelineData.workoutItems,
    lifestyleItems: timelineData.lifestyleItems,

    // Plan info
    planProgress,
    planStartDate,
    isPlanConfigured,
    isBeforePlanStart,
    dayLabel,

    // Targets from coach-set limits
    targets,

    // Consumed totals
    consumed,

    // Completions
    completions,
    completedCount,
    totalCount: timelineData.timelineItems.length,
    isItemCompleted,
    isSourceItemCompleted,
    getItemCompletionStatus,
    markComplete,
    markUncomplete,
    markSourceItemComplete,
    markSourceItemUncomplete,

    // Loading states
    isLoading,
    isError,
    refetch,

    // Date info
    selectedDate: currentDate,
    dateStr,
    formattedDate,
    dayNumber,
  };
}
