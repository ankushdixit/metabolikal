/**
 * useTemplateData Hook
 *
 * Data fetching hook for the plan template editor.
 * Fetches template metadata and all template items (diet, supplements, workouts, lifestyle),
 * transforming them into a unified TimelineItem format for display in the timeline grid.
 *
 * Similar to useTimelineData but for templates instead of client plans.
 */

"use client";

import { useMemo, useCallback } from "react";
import { useList, useOne, useInvalidate } from "@refinedev/core";
import type {
  PlanTemplate,
  TemplateDietItem,
  TemplateSupplementItem,
  TemplateWorkoutItem,
  TemplateLifestyleItem,
  TimelineItem,
  TimelineItemType,
  TimelineScheduling,
  FoodItem,
  Supplement,
  Exercise,
  LifestyleActivityType,
  ClientAnchorTimes,
} from "@/lib/database.types";
import {
  timeToMinutes,
  TIME_PERIOD_RANGES,
  getEffectiveSortTime,
  DEFAULT_ANCHOR_TIMES,
} from "@/lib/utils/timeline";
import type { LanePackingItem } from "@/lib/utils/lane-packing";

// Extended types with joined relations
export interface TemplateDietItemWithFood extends TemplateDietItem {
  food_items?: FoodItem | null;
}

export interface TemplateSupplementItemWithSupplement extends TemplateSupplementItem {
  supplements?: Supplement | null;
}

export interface TemplateWorkoutItemWithExercise extends TemplateWorkoutItem {
  exercises?: Exercise | null;
}

export interface TemplateLifestyleItemWithType extends TemplateLifestyleItem {
  lifestyle_activity_types?: LifestyleActivityType | null;
}

/**
 * Extended timeline item with source data reference for templates
 */
export interface ExtendedTemplateTimelineItem extends TimelineItem {
  sourceType:
    | "template_diet_item"
    | "template_supplement_item"
    | "template_workout_item"
    | "template_lifestyle_item";
  sourceId: string;
  templateId: string;
  // Grouping support
  isGrouped?: boolean;
  groupKey?: string;
  groupedSourceIds?: string[];
  groupedItems?:
    | TemplateDietItemWithFood[]
    | TemplateWorkoutItemWithExercise[]
    | TemplateSupplementItemWithSupplement[]
    | TemplateLifestyleItemWithType[];
  itemCount?: number;
  itemNames?: string[];
}

// Default duration in minutes for items without explicit end times
const DEFAULT_ITEM_DURATION = 30;
const DEFAULT_WORKOUT_GROUP_DURATION = 45;

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
 * Convert a template item to LanePackingItem format
 */
function toPackingItem(
  item: ExtendedTemplateTimelineItem,
  clientAnchors: ClientAnchorTimes = DEFAULT_ANCHOR_TIMES
): LanePackingItem {
  let startMinutes: number;
  let endMinutes: number;

  if (item.scheduling.time_type === "all_day") {
    return {
      id: item.id,
      startMinutes: timeToMinutes("05:00"),
      endMinutes: timeToMinutes("23:00"),
      type: item.type,
    };
  }

  if (item.scheduling.time_type === "period" && item.scheduling.time_period) {
    const periodRange = TIME_PERIOD_RANGES[item.scheduling.time_period];
    startMinutes = timeToMinutes(periodRange.start);
    endMinutes = timeToMinutes(periodRange.end);
  } else {
    startMinutes = getEffectiveSortTime(item.scheduling, clientAnchors);

    if (item.scheduling.time_end) {
      endMinutes = timeToMinutes(item.scheduling.time_end);
    } else if (item.metadata?.duration) {
      endMinutes = startMinutes + item.metadata.duration;
    } else if (item.isGrouped && item.type === "workout") {
      endMinutes = startMinutes + DEFAULT_WORKOUT_GROUP_DURATION;
    } else {
      endMinutes = startMinutes + DEFAULT_ITEM_DURATION;
    }
  }

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
 * Transform template diet item to timeline item
 */
function transformTemplateDietItem(
  item: TemplateDietItemWithFood,
  templateId: string
): ExtendedTemplateTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: item.time_type || "period",
    time_start: item.time_start,
    time_end: item.time_end,
    time_period: item.time_period,
    relative_anchor: item.relative_anchor,
    relative_offset_minutes: item.relative_offset_minutes || 0,
  };

  const foodName = item.food_items?.name || "Unknown Food";
  const calories = item.food_items?.calories || 0;
  const protein = item.food_items?.protein || 0;
  const multiplier = item.serving_multiplier || 1;

  return {
    id: item.id,
    type: "meal" as TimelineItemType,
    title: foodName,
    subtitle: item.meal_category || undefined,
    scheduling,
    metadata: {
      calories: Math.round(calories * multiplier),
      protein: Math.round(protein * multiplier),
      displayOrder: item.display_order || 0,
    },
    sourceType: "template_diet_item",
    sourceId: item.id,
    templateId,
    groupKey: `meal:${item.meal_category || "unknown"}:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform template supplement item to timeline item
 */
function transformTemplateSupplementItem(
  item: TemplateSupplementItemWithSupplement,
  templateId: string
): ExtendedTemplateTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: item.time_type || "period",
    time_start: item.time_start,
    time_end: item.time_end,
    time_period: item.time_period,
    relative_anchor: item.relative_anchor,
    relative_offset_minutes: item.relative_offset_minutes || 0,
  };

  const supplement = item.supplements;
  const name = supplement?.name || "Unknown Supplement";
  const dosageUnit = supplement?.dosage_unit || "mg";

  return {
    id: item.id,
    type: "supplement" as TimelineItemType,
    title: name,
    subtitle: supplement?.category || undefined,
    scheduling,
    metadata: {
      dosage: item.dosage ?? undefined,
      dosageUnit,
      displayOrder: item.display_order || 0,
    },
    sourceType: "template_supplement_item",
    sourceId: item.id,
    templateId,
    groupKey: `supplement:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform template workout item to timeline item
 */
function transformTemplateWorkoutItem(
  item: TemplateWorkoutItemWithExercise,
  templateId: string
): ExtendedTemplateTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: item.time_type || "period",
    time_start: item.time_start,
    time_end: item.time_end,
    time_period: item.time_period,
    relative_anchor: item.relative_anchor,
    relative_offset_minutes: item.relative_offset_minutes || 0,
  };

  const name = item.exercise_name || item.exercises?.name || "Unknown Exercise";
  const section = item.section || "main";

  return {
    id: item.id,
    type: "workout" as TimelineItemType,
    title: name,
    subtitle: section,
    scheduling,
    metadata: {
      sets: item.sets || undefined,
      reps: item.reps || undefined,
      duration: item.scheduled_duration_minutes || item.duration_minutes || undefined,
      displayOrder: item.display_order || 0,
    },
    sourceType: "template_workout_item",
    sourceId: item.id,
    templateId,
    groupKey: `workout:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Transform template lifestyle item to timeline item
 */
function transformTemplateLifestyleItem(
  item: TemplateLifestyleItemWithType,
  templateId: string
): ExtendedTemplateTimelineItem {
  const scheduling: TimelineScheduling = {
    time_type: item.time_type || "all_day",
    time_start: item.time_start,
    time_end: item.time_end,
    time_period: item.time_period,
    relative_anchor: item.relative_anchor,
    relative_offset_minutes: item.relative_offset_minutes || 0,
  };

  const activityType = item.lifestyle_activity_types;
  const name = activityType?.name || "Activity";
  const targetUnit = activityType?.target_unit || "";

  return {
    id: item.id,
    type: "lifestyle" as TimelineItemType,
    title: name,
    subtitle: activityType?.category || undefined,
    scheduling,
    metadata: {
      targetValue: item.target_value || activityType?.default_target_value || undefined,
      targetUnit: targetUnit || undefined,
      displayOrder: item.display_order || 0,
    },
    sourceType: "template_lifestyle_item",
    sourceId: item.id,
    templateId,
    groupKey: `lifestyle:${getSchedulingKey(scheduling)}`,
  };
}

/**
 * Group diet items by meal_category + time slot
 */
function groupDietItems(
  items: ExtendedTemplateTimelineItem[],
  rawItems: TemplateDietItemWithFood[]
): ExtendedTemplateTimelineItem[] {
  const groups = new Map<string, ExtendedTemplateTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTemplateTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    const firstItem = sortedItems[0];
    const totalCalories = sortedItems.reduce(
      (sum, item) => sum + (item.metadata?.calories || 0),
      0
    );
    const totalProtein = sortedItems.reduce((sum, item) => sum + (item.metadata?.protein || 0), 0);
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    const groupedRawItems = rawItems
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

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
      groupedItems: groupedRawItems,
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
 */
function groupWorkoutItems(
  items: ExtendedTemplateTimelineItem[],
  rawItems: TemplateWorkoutItemWithExercise[]
): ExtendedTemplateTimelineItem[] {
  const groups = new Map<string, ExtendedTemplateTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTemplateTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    const groupedRawItems = rawItems
      .filter((p) => groupedSourceIds.includes(p.id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

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
      groupedItems: groupedRawItems,
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
 */
function groupSupplementItems(
  items: ExtendedTemplateTimelineItem[],
  rawItems: TemplateSupplementItemWithSupplement[]
): ExtendedTemplateTimelineItem[] {
  const groups = new Map<string, ExtendedTemplateTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTemplateTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    const groupedRawItems = rawItems
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
      groupedItems: groupedRawItems,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {},
    });
  }

  return result;
}

/**
 * Group lifestyle activity items by time slot
 */
function groupLifestyleItems(
  items: ExtendedTemplateTimelineItem[],
  rawItems: TemplateLifestyleItemWithType[]
): ExtendedTemplateTimelineItem[] {
  const groups = new Map<string, ExtendedTemplateTimelineItem[]>();

  for (const item of items) {
    const key = item.groupKey || item.id;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  const result: ExtendedTemplateTimelineItem[] = [];

  for (const [groupKey, groupItems] of groups) {
    const sortedItems = [...groupItems].sort(
      (a, b) => (a.metadata?.displayOrder || 0) - (b.metadata?.displayOrder || 0)
    );

    const firstItem = sortedItems[0];
    const itemNames = sortedItems.map((item) => item.title);
    const groupedSourceIds = sortedItems.map((item) => item.sourceId);
    const groupedRawItems = rawItems
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
      groupedItems: groupedRawItems,
      itemCount: sortedItems.length,
      itemNames,
      metadata: {},
    });
  }

  return result;
}

export interface UseTemplateDataOptions {
  templateId: string | null;
  enabled?: boolean;
}

export interface UseTemplateDataReturn {
  template: PlanTemplate | null;
  timelineItems: ExtendedTemplateTimelineItem[];
  packingItems: LanePackingItem[];
  isLoading: boolean;
  isError: boolean;
  refetchAll: () => void;
  // Grouped by type for filtering
  dietItems: ExtendedTemplateTimelineItem[];
  supplementItems: ExtendedTemplateTimelineItem[];
  workoutItems: ExtendedTemplateTimelineItem[];
  lifestyleItems: ExtendedTemplateTimelineItem[];
  // Raw data for mutations
  rawDietItems: TemplateDietItemWithFood[];
  rawSupplementItems: TemplateSupplementItemWithSupplement[];
  rawWorkoutItems: TemplateWorkoutItemWithExercise[];
  rawLifestyleItems: TemplateLifestyleItemWithType[];
}

/**
 * Hook for fetching and transforming template data
 */
export function useTemplateData({
  templateId,
  enabled = true,
}: UseTemplateDataOptions): UseTemplateDataReturn {
  const invalidate = useInvalidate();

  // Fetch template metadata
  const templateQuery = useOne<PlanTemplate>({
    resource: "plan_templates",
    id: templateId || "",
    queryOptions: {
      enabled: enabled && !!templateId,
    },
  });

  // Fetch template diet items with food details
  const dietItemsQuery = useList<TemplateDietItemWithFood>({
    resource: "template_diet_items",
    filters: [{ field: "template_id", operator: "eq", value: templateId }],
    meta: {
      select: "*, food_items(*)",
    },
    queryOptions: {
      enabled: enabled && !!templateId,
    },
  });

  // Fetch template supplement items with supplement details
  const supplementItemsQuery = useList<TemplateSupplementItemWithSupplement>({
    resource: "template_supplement_items",
    filters: [{ field: "template_id", operator: "eq", value: templateId }],
    meta: {
      select: "*, supplements(*)",
    },
    queryOptions: {
      enabled: enabled && !!templateId,
    },
  });

  // Fetch template workout items with exercise details
  const workoutItemsQuery = useList<TemplateWorkoutItemWithExercise>({
    resource: "template_workout_items",
    filters: [{ field: "template_id", operator: "eq", value: templateId }],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, exercises(*)",
    },
    queryOptions: {
      enabled: enabled && !!templateId,
    },
  });

  // Fetch template lifestyle items with activity type details
  const lifestyleItemsQuery = useList<TemplateLifestyleItemWithType>({
    resource: "template_lifestyle_items",
    filters: [{ field: "template_id", operator: "eq", value: templateId }],
    sorters: [{ field: "display_order", order: "asc" }],
    meta: {
      select: "*, lifestyle_activity_types(*)",
    },
    queryOptions: {
      enabled: enabled && !!templateId,
    },
  });

  // Raw data for mutations
  const template = templateQuery.query.data?.data || null;
  const rawDietItems = dietItemsQuery.query.data?.data || [];
  const rawSupplementItems = supplementItemsQuery.query.data?.data || [];
  const rawWorkoutItems = workoutItemsQuery.query.data?.data || [];
  const rawLifestyleItems = lifestyleItemsQuery.query.data?.data || [];

  // Transform to individual timeline items first
  const rawDietTimelineItems = useMemo(
    () =>
      templateId ? rawDietItems.map((item) => transformTemplateDietItem(item, templateId)) : [],
    [rawDietItems, templateId]
  );

  const rawSupplementTimelineItems = useMemo(
    () =>
      templateId
        ? rawSupplementItems.map((item) => transformTemplateSupplementItem(item, templateId))
        : [],
    [rawSupplementItems, templateId]
  );

  const rawWorkoutTimelineItems = useMemo(
    () =>
      templateId
        ? rawWorkoutItems.map((item) => transformTemplateWorkoutItem(item, templateId))
        : [],
    [rawWorkoutItems, templateId]
  );

  const rawLifestyleTimelineItems = useMemo(
    () =>
      templateId
        ? rawLifestyleItems.map((item) => transformTemplateLifestyleItem(item, templateId))
        : [],
    [rawLifestyleItems, templateId]
  );

  // Apply grouping to all item types
  const dietItems = useMemo(
    () => groupDietItems(rawDietTimelineItems, rawDietItems),
    [rawDietTimelineItems, rawDietItems]
  );

  const supplementItems = useMemo(
    () => groupSupplementItems(rawSupplementTimelineItems, rawSupplementItems),
    [rawSupplementTimelineItems, rawSupplementItems]
  );

  const workoutItems = useMemo(
    () => groupWorkoutItems(rawWorkoutTimelineItems, rawWorkoutItems),
    [rawWorkoutTimelineItems, rawWorkoutItems]
  );

  const lifestyleItems = useMemo(
    () => groupLifestyleItems(rawLifestyleTimelineItems, rawLifestyleItems),
    [rawLifestyleTimelineItems, rawLifestyleItems]
  );

  // Combined timeline items (with grouping applied)
  const timelineItems = useMemo(
    () => [...dietItems, ...supplementItems, ...workoutItems, ...lifestyleItems],
    [dietItems, supplementItems, workoutItems, lifestyleItems]
  );

  // Convert to packing items for lane algorithm
  const packingItems = useMemo(
    () => timelineItems.map((item) => toPackingItem(item, DEFAULT_ANCHOR_TIMES)),
    [timelineItems]
  );

  // Loading state
  const isLoading =
    templateQuery.query.isLoading ||
    dietItemsQuery.query.isLoading ||
    supplementItemsQuery.query.isLoading ||
    workoutItemsQuery.query.isLoading ||
    lifestyleItemsQuery.query.isLoading;

  // Error state
  const isError =
    templateQuery.query.isError ||
    dietItemsQuery.query.isError ||
    supplementItemsQuery.query.isError ||
    workoutItemsQuery.query.isError ||
    lifestyleItemsQuery.query.isError;

  // Refetch all data
  const refetchAll = useCallback(() => {
    if (templateId) {
      invalidate({
        resource: "plan_templates",
        invalidates: ["detail"],
      });
      invalidate({
        resource: "template_diet_items",
        invalidates: ["list"],
      });
      invalidate({
        resource: "template_supplement_items",
        invalidates: ["list"],
      });
      invalidate({
        resource: "template_workout_items",
        invalidates: ["list"],
      });
      invalidate({
        resource: "template_lifestyle_items",
        invalidates: ["list"],
      });
    }
  }, [invalidate, templateId]);

  return {
    template,
    timelineItems,
    packingItems,
    isLoading,
    isError,
    refetchAll,
    dietItems,
    supplementItems,
    workoutItems,
    lifestyleItems,
    rawDietItems,
    rawSupplementItems,
    rawWorkoutItems,
    rawLifestyleItems,
  };
}
