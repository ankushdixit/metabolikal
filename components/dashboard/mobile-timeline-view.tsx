/**
 * Mobile Timeline View Component
 *
 * Mobile-optimized timeline experience with:
 * - Single-column stacked layout
 * - Collapsible time periods
 * - Current time indicator
 * - Swipe navigation between days
 * - Pull-to-refresh
 * - Bottom sheet for item details
 * - Offline support
 */

"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  History,
  Utensils,
  Pill,
  Dumbbell,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TimelineMobileHeader } from "./timeline-mobile-header";
import { TimelineSwipeContainer } from "./timeline-swipe-container";
import { TimelineItemSheet } from "./timeline-item-sheet";
import { FoodAlternativesDrawer } from "./food-alternatives-drawer";
import { ScrollToNowButton } from "./scroll-to-now-button";
import { type TypeFilters, type FilterCounts } from "./timeline-filters";
import { useOfflineCompletions } from "@/hooks/use-offline-completions";
import { calculateStats, type TimelineItemWithCompletion } from "@/lib/utils/completion-stats";
import { getEffectiveSortTime, minutesToTime, formatTimeDisplay } from "@/lib/utils/timeline";
import type { ExtendedTimelineItem, DietPlanWithFood } from "@/hooks/use-timeline-data";
import type { UseClientTimelineReturn } from "@/hooks/use-client-timeline";
import type { PlanCompletionType, MealCategory } from "@/lib/database.types";

// =============================================================================
// TYPES
// =============================================================================

interface MobileTimelineViewProps {
  /** Timeline data from useClientTimeline */
  timeline: UseClientTimelineReturn;
  /** Initial filters from URL */
  initialFilters?: TypeFilters;
  /** Callback when day changes */
  onDayChange?: (day: number) => void;
}

interface TimePeriod {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  items: ExtendedTimelineItem[];
  isNow: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIME_PERIODS = [
  { id: "morning", label: "Morning", startHour: 5, endHour: 10 },
  { id: "midday", label: "Midday", startHour: 10, endHour: 14 },
  { id: "afternoon", label: "Afternoon", startHour: 14, endHour: 18 },
  { id: "evening", label: "Evening", startHour: 18, endHour: 22 },
  { id: "night", label: "Night", startHour: 22, endHour: 5 },
];

const TYPE_STYLES: Record<
  string,
  {
    bgColor: string;
    borderColor: string;
    iconColor: string;
    icon: LucideIcon;
  }
> = {
  meal: {
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
    iconColor: "text-orange-400",
    icon: Utensils,
  },
  supplement: {
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    iconColor: "text-green-400",
    icon: Pill,
  },
  workout: {
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    iconColor: "text-blue-400",
    icon: Dumbbell,
  },
  lifestyle: {
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/50",
    iconColor: "text-purple-400",
    icon: Heart,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get hour from item scheduling (works with all time types)
 */
function getHourFromScheduling(item: ExtendedTimelineItem): number {
  const sortMinutes = getEffectiveSortTime(item.scheduling);
  return Math.floor(sortMinutes / 60);
}

/**
 * Get time string from item scheduling (for display)
 */
function getTimeFromScheduling(item: ExtendedTimelineItem): string {
  const sortMinutes = getEffectiveSortTime(item.scheduling);
  return minutesToTime(sortMinutes);
}

/**
 * Group items by time period
 */
function groupItemsByPeriod(items: ExtendedTimelineItem[]): TimePeriod[] {
  const now = new Date();
  const currentHour = now.getHours();

  return TIME_PERIODS.map((period) => {
    const periodItems = items
      .filter((item) => {
        const hour = getHourFromScheduling(item);

        // Handle overnight period (22:00 - 05:00)
        if (period.id === "night") {
          return hour >= 22 || hour < 5;
        }

        return hour >= period.startHour && hour < period.endHour;
      })
      .sort((a, b) => {
        const timeA = getEffectiveSortTime(a.scheduling);
        const timeB = getEffectiveSortTime(b.scheduling);
        return timeA - timeB;
      });

    // Determine if current time falls in this period
    let isNow = false;
    if (period.id === "night") {
      isNow = currentHour >= 22 || currentHour < 5;
    } else {
      isNow = currentHour >= period.startHour && currentHour < period.endHour;
    }

    return {
      id: period.id,
      label: period.label,
      startHour: period.startHour,
      endHour: period.endHour,
      items: periodItems,
      isNow,
    };
  }).filter((period) => period.items.length > 0);
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface TimelineItemCardProps {
  item: ExtendedTimelineItem;
  isCompleted: boolean;
  completionStatus: { completed: number; total: number };
  onClick: () => void;
  onQuickComplete: () => void;
  readOnly: boolean;
  isOfflinePending: boolean;
}

function TimelineItemCard({
  item,
  isCompleted,
  completionStatus,
  onClick,
  onQuickComplete,
  readOnly,
  isOfflinePending,
}: TimelineItemCardProps) {
  const style = TYPE_STYLES[item.type];
  const hasMultipleItems = completionStatus.total > 1;
  const isPartiallyCompleted =
    completionStatus.completed > 0 && completionStatus.completed < completionStatus.total;

  // Format time display using the effective time from scheduling
  const timeString = getTimeFromScheduling(item);
  const timeDisplay = formatTimeDisplay(timeString);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer",
        "min-h-[72px]", // Large touch target
        "active:scale-[0.98]",
        style.bgColor,
        style.borderColor,
        isCompleted && "opacity-70"
      )}
    >
      {/* Completion indicator / Quick complete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly && !hasMultipleItems) {
            onQuickComplete();
          } else {
            onClick();
          }
        }}
        disabled={readOnly}
        className={cn(
          "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
          "min-w-[44px] min-h-[44px]", // Apple HIG touch target
          isCompleted
            ? "bg-green-500 border-green-500"
            : isPartiallyCompleted
              ? "bg-yellow-500/50 border-yellow-500"
              : `${style.bgColor} ${style.borderColor}`,
          isOfflinePending && "animate-pulse"
        )}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-white" />
        ) : isPartiallyCompleted ? (
          <span className="text-xs font-bold text-yellow-500">
            {completionStatus.completed}/{completionStatus.total}
          </span>
        ) : (
          <style.icon className={cn("h-5 w-5", style.iconColor)} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold text-base leading-tight",
                isCompleted && "line-through opacity-70"
              )}
            >
              {item.title}
            </p>
            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold">{timeDisplay}</p>
            {item.type === "meal" && item.metadata?.calories && (
              <p className="text-xs text-muted-foreground">{item.metadata.calories} cal</p>
            )}
          </div>
        </div>

        {/* Quick info row */}
        {hasMultipleItems && !isCompleted && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold">
              {completionStatus.completed}/{completionStatus.total} items
            </span>
            <span>Tap for details</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface CollapsiblePeriodProps {
  period: TimePeriod;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  nowIndicatorRef?: React.RefObject<HTMLDivElement | null>;
}

function CollapsiblePeriod({
  period,
  isExpanded,
  onToggle,
  children,
  nowIndicatorRef,
}: CollapsiblePeriodProps) {
  return (
    <div className="space-y-2">
      {/* Period header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
          "min-h-[44px]",
          period.isNow ? "bg-primary/10" : "bg-secondary/50",
          "active:bg-secondary"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("font-bold", period.isNow && "text-primary")}>{period.label}</span>
          <span className="text-xs text-muted-foreground">
            ({period.items.length} {period.items.length === 1 ? "item" : "items"})
          </span>
          {period.isNow && (
            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              NOW
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Now indicator */}
      {period.isNow && <div ref={nowIndicatorRef} className="h-0" />}

      {/* Period content */}
      {isExpanded && <div className="space-y-2">{children}</div>}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MobileTimelineView({
  timeline,
  initialFilters,
  onDayChange,
}: MobileTimelineViewProps) {
  // Extract timeline data
  const {
    timelineItems,
    dietItems,
    supplementItems,
    workoutItems,
    lifestyleItems,
    planProgress,
    planStartDate,
    isPlanConfigured,
    isBeforePlanStart,
    targets,
    consumed,
    completions,
    completedCount,
    totalCount,
    isItemCompleted,
    isSourceItemCompleted,
    getItemCompletionStatus,
    markComplete,
    markUncomplete,
    markSourceItemComplete,
    markSourceItemUncomplete,
    isLoading,
    isError,
    refetch,
    formattedDate,
    dayNumber,
    dateStr,
  } = timeline;

  // UI State - use dayNumber from timeline as source of truth (synced via URL in parent)
  const [typeFilters, setTypeFilters] = useState<TypeFilters>(
    initialFilters || {
      meal: true,
      supplement: true,
      workout: true,
      lifestyle: true,
    }
  );
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(TIME_PERIODS.map((p) => p.id))
  );
  const [selectedItem, setSelectedItem] = useState<ExtendedTimelineItem | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Food swap state
  const [selectedDietPlanForSwap, setSelectedDietPlanForSwap] = useState<{
    dietPlanId: string;
    foodItemId: string;
    mealCategory: MealCategory;
    currentFoodItem: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      serving_size: string;
      is_vegetarian: boolean;
    } | null;
  } | null>(null);

  // Refs
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Offline support
  const { isOnline, getPendingAction, queueCompletion } = useOfflineCompletions();

  // Query for food alternatives when a diet plan is selected for swap
  // Uses food_item_alternatives table which links food items to their alternatives
  const alternativesQuery = useList<{
    id: string;
    food_item_id: string;
    alternative_food_id: string;
    food_items: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number | null;
      fats: number | null;
      serving_size: string;
      is_vegetarian: boolean;
      raw_quantity: string | null;
      cooked_quantity: string | null;
    };
  }>({
    resource: "food_item_alternatives",
    filters: selectedDietPlanForSwap
      ? [{ field: "food_item_id", operator: "eq", value: selectedDietPlanForSwap.foodItemId }]
      : [],
    meta: {
      // Join with food_items using the alternative_food_id to get the alternative food details
      select:
        "*, food_items!food_item_alternatives_alternative_food_id_fkey(id, name, calories, protein, carbs, fats, serving_size, is_vegetarian, raw_quantity, cooked_quantity)",
    },
    sorters: [{ field: "display_order", order: "asc" }],
    queryOptions: {
      enabled: !!selectedDietPlanForSwap?.foodItemId,
    },
  });

  // Mutation for updating diet plan food item
  const updateMutation = useUpdate();
  const [isUpdatingSwap, setIsUpdatingSwap] = useState(false);

  // Calculate view state
  const isViewingToday = useMemo(() => {
    if (!planProgress) return false;
    return dayNumber === planProgress.dayNumber;
  }, [dayNumber, planProgress]);

  const isViewingPast = useMemo(() => {
    if (!planProgress || !planStartDate) return false;
    if (isBeforePlanStart) return false;
    return dayNumber < planProgress.dayNumber;
  }, [dayNumber, planProgress, planStartDate, isBeforePlanStart]);

  const isViewingFutureDay = useMemo(() => {
    if (!planProgress || !planStartDate) return false;
    if (isBeforePlanStart) return true;
    return dayNumber > planProgress.dayNumber;
  }, [planProgress, planStartDate, isBeforePlanStart, dayNumber]);

  // Filter items
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => typeFilters[item.type as keyof TypeFilters]);
  }, [timelineItems, typeFilters]);

  // Sync selectedItem with latest data when timeline items update (e.g., after food swap)
  useEffect(() => {
    if (selectedItem && timelineItems.length > 0) {
      const updatedItem = timelineItems.find((item) => item.id === selectedItem.id);
      if (updatedItem && updatedItem !== selectedItem) {
        setSelectedItem(updatedItem);
      }
    }
  }, [timelineItems, selectedItem]);

  // Group items by time period
  const periods = useMemo(() => {
    return groupItemsByPeriod(filteredItems);
  }, [filteredItems]);

  // Item counts
  const itemCounts: FilterCounts = useMemo(
    () => ({
      meal: dietItems.length,
      supplement: supplementItems.length,
      workout: workoutItems.length,
      lifestyle: lifestyleItems.length,
      total: timelineItems.length,
    }),
    [dietItems, supplementItems, workoutItems, lifestyleItems, timelineItems]
  );

  // Completion stats
  const itemsForStats: TimelineItemWithCompletion[] = useMemo(() => {
    return timelineItems.map((item) => ({
      id: item.id,
      type: item.type,
      sourceId: item.sourceId,
      groupedSourceIds: item.groupedSourceIds,
    }));
  }, [timelineItems]);

  const viewStats = useMemo(() => {
    return calculateStats(itemsForStats, completions);
  }, [itemsForStats, completions]);

  // Navigation constraints - allow viewing all days (future days are read-only)
  const canGoPrevious = planStartDate ? dayNumber > 1 : false;
  const canGoNext = planProgress ? dayNumber < planProgress.totalDays : false;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleFiltersChange = useCallback((newFilters: TypeFilters) => {
    setTypeFilters(newFilters);
  }, []);

  const handlePreviousDay = useCallback(() => {
    if (!canGoPrevious) return;
    onDayChange?.(dayNumber - 1);
  }, [canGoPrevious, dayNumber, onDayChange]);

  const handleNextDay = useCallback(() => {
    if (!canGoNext) return;
    onDayChange?.(dayNumber + 1);
  }, [canGoNext, dayNumber, onDayChange]);

  const handleTogglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback((item: ExtendedTimelineItem) => {
    setSelectedItem(item);
  }, []);

  const handleQuickComplete = useCallback(
    async (item: ExtendedTimelineItem) => {
      if (isViewingFutureDay || isViewingPast) return;

      setIsMarking(true);
      try {
        const wasCompleted = isItemCompleted(item.id);

        if (!isOnline) {
          // Queue for offline sync
          const planTypeMap: Record<string, PlanCompletionType> = {
            meal: "diet",
            supplement: "supplement",
            workout: "workout",
            lifestyle: "lifestyle",
          };
          const planType = planTypeMap[item.type];
          const sourceIds = item.groupedSourceIds || [item.sourceId];

          for (const sourceId of sourceIds) {
            queueCompletion(sourceId, planType, dateStr, wasCompleted ? "uncomplete" : "complete");
          }

          // Provide haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }
        } else {
          // Online - use normal API
          if (wasCompleted) {
            await markUncomplete(item);
          } else {
            await markComplete(item);
          }
        }
      } finally {
        setIsMarking(false);
      }
    },
    [
      isViewingFutureDay,
      isViewingPast,
      isItemCompleted,
      isOnline,
      markComplete,
      markUncomplete,
      queueCompletion,
      dateStr,
    ]
  );

  const handleMarkComplete = useCallback(async () => {
    if (!selectedItem) return;
    setIsMarking(true);
    try {
      await markComplete(selectedItem);
    } finally {
      setIsMarking(false);
    }
  }, [selectedItem, markComplete]);

  const handleMarkUncomplete = useCallback(async () => {
    if (!selectedItem) return;
    setIsMarking(true);
    try {
      await markUncomplete(selectedItem);
    } finally {
      setIsMarking(false);
    }
  }, [selectedItem, markUncomplete]);

  const handleMarkSourceItemComplete = useCallback(
    async (sourceId: string) => {
      if (!selectedItem) return;
      const planTypeMap: Record<string, PlanCompletionType> = {
        meal: "diet",
        supplement: "supplement",
        workout: "workout",
        lifestyle: "lifestyle",
      };
      const planType = planTypeMap[selectedItem.type];
      if (planType) {
        await markSourceItemComplete(sourceId, planType);
      }
    },
    [selectedItem, markSourceItemComplete]
  );

  const handleMarkSourceItemUncomplete = useCallback(
    async (sourceId: string) => {
      await markSourceItemUncomplete(sourceId);
    },
    [markSourceItemUncomplete]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      refetch();
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch]);

  // Handle swap food - open alternatives drawer
  const handleSwapFood = useCallback(
    (dietPlanId: string) => {
      if (!selectedItem) return;

      // Find the diet plan entry from the selected item's grouped items
      const groupedItems = selectedItem.groupedItems as DietPlanWithFood[] | undefined;
      const dietPlan = groupedItems?.find((p) => p.id === dietPlanId);

      if (!dietPlan || !dietPlan.food_items) return;

      setSelectedDietPlanForSwap({
        dietPlanId: dietPlanId,
        foodItemId: dietPlan.food_items.id,
        mealCategory: dietPlan.meal_category as MealCategory,
        currentFoodItem: {
          id: dietPlan.food_items.id,
          name: dietPlan.food_items.name,
          calories: dietPlan.food_items.calories,
          protein: dietPlan.food_items.protein,
          serving_size: dietPlan.food_items.serving_size,
          is_vegetarian: dietPlan.food_items.is_vegetarian ?? false,
        },
      });
    },
    [selectedItem]
  );

  // Handle select alternative - swap the food item
  const handleSelectAlternative = useCallback(
    (newFoodItemId: string) => {
      if (!selectedDietPlanForSwap) return;

      setIsUpdatingSwap(true);
      updateMutation.mutate(
        {
          resource: "diet_plans",
          id: selectedDietPlanForSwap.dietPlanId,
          values: { food_item_id: newFoodItemId },
        },
        {
          onSuccess: () => {
            toast.success("Food item swapped successfully");
            setSelectedDietPlanForSwap(null);
            setIsUpdatingSwap(false);
            // Refetch timeline to show updated food
            refetch();
          },
          onError: (error) => {
            console.error("Error swapping food:", error);
            toast.error("Failed to swap food item. Please try again.");
            setIsUpdatingSwap(false);
          },
        }
      );
    },
    [selectedDietPlanForSwap, updateMutation, refetch]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-24 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-secondary/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold mb-2">Failed to load your plan</h2>
          <p className="text-sm text-muted-foreground mb-4">Please try refreshing</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Plan not configured state
  if (!isPlanConfigured) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-lg font-bold mb-2">Plan Not Configured</h2>
          <p className="text-sm text-muted-foreground">
            Your coach hasn&apos;t set up your plan start date yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen">
      {/* Mobile header - sticky */}
      <TimelineMobileHeader
        dayNumber={dayNumber}
        formattedDate={formattedDate}
        isViewingToday={isViewingToday}
        isViewingPast={isViewingPast}
        planProgress={planProgress}
        completedCount={completedCount}
        totalCount={totalCount}
        completionPercentage={viewStats.percentage}
        targets={targets}
        consumed={consumed}
        filters={typeFilters}
        onFiltersChange={handleFiltersChange}
        counts={itemCounts}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        isOffline={!isOnline}
        lastUpdated={lastUpdated}
      />

      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-2 bg-primary/10">
          <RefreshCw className="h-4 w-4 animate-spin text-primary mr-2" />
          <span className="text-sm font-bold text-primary">Refreshing...</span>
        </div>
      )}

      {/* Status banners */}
      {isBeforePlanStart && planStartDate && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="h-4 w-4 shrink-0" />
            <p className="text-sm font-bold">
              Your plan starts{" "}
              {planStartDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      )}

      {isViewingPast && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400">
            <History className="h-4 w-4 shrink-0" />
            <p className="text-sm font-bold">Viewing History</p>
          </div>
        </div>
      )}

      {/* Main content with swipe support */}
      <TimelineSwipeContainer
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        previousDayLabel={`Day ${dayNumber - 1}`}
        nextDayLabel={
          dayNumber === (planProgress?.dayNumber ?? 0) - 1 ? "Today" : `Day ${dayNumber + 1}`
        }
        enabled={!selectedItem}
        className="flex-1"
      >
        <div className="p-4 space-y-4">
          {periods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-bold">No items scheduled</p>
              <p className="text-sm">Check your filters or select a different day</p>
            </div>
          ) : (
            periods.map((period) => (
              <CollapsiblePeriod
                key={period.id}
                period={period}
                isExpanded={expandedPeriods.has(period.id)}
                onToggle={() => handleTogglePeriod(period.id)}
                nowIndicatorRef={period.isNow ? nowIndicatorRef : undefined}
              >
                {period.items.map((item) => {
                  const completed = isItemCompleted(item.id);
                  const status = getItemCompletionStatus(item.id);
                  const pendingAction = getPendingAction(item.sourceId);

                  return (
                    <TimelineItemCard
                      key={item.id}
                      item={item}
                      isCompleted={completed}
                      completionStatus={status}
                      onClick={() => handleItemClick(item)}
                      onQuickComplete={() => handleQuickComplete(item)}
                      readOnly={isViewingFutureDay || isViewingPast}
                      isOfflinePending={!!pendingAction}
                    />
                  );
                })}
              </CollapsiblePeriod>
            ))
          )}
        </div>
      </TimelineSwipeContainer>

      {/* Scroll to now button */}
      <ScrollToNowButton nowIndicatorRef={nowIndicatorRef} />

      {/* Item detail sheet */}
      <TimelineItemSheet
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        isCompleted={selectedItem ? isItemCompleted(selectedItem.id) : false}
        completionStatus={
          selectedItem ? getItemCompletionStatus(selectedItem.id) : { completed: 0, total: 0 }
        }
        isSourceItemCompleted={isSourceItemCompleted}
        onMarkComplete={handleMarkComplete}
        onMarkUncomplete={handleMarkUncomplete}
        onMarkSourceItemComplete={handleMarkSourceItemComplete}
        onMarkSourceItemUncomplete={handleMarkSourceItemUncomplete}
        isMarking={isMarking}
        readOnly={isViewingFutureDay || isViewingPast}
        onSwapFood={isViewingFutureDay || isViewingPast ? undefined : handleSwapFood}
      />

      {/* Food alternatives drawer for swapping food items */}
      <FoodAlternativesDrawer
        isOpen={!!selectedDietPlanForSwap}
        onClose={() => setSelectedDietPlanForSwap(null)}
        mealCategory={selectedDietPlanForSwap?.mealCategory ?? "breakfast"}
        currentFoodItem={selectedDietPlanForSwap?.currentFoodItem ?? null}
        alternatives={alternativesQuery.query.data?.data ?? []}
        targetCalories={targets.calories ?? 0}
        onSelectAlternative={handleSelectAlternative}
        isUpdating={isUpdatingSwap}
      />
    </div>
  );
}
