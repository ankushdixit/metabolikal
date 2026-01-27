/**
 * Client Timeline View Component
 *
 * Client dashboard timeline that matches admin Plan Editor layout exactly.
 * Reuses admin's TimelineGrid component for consistent UI.
 * Adds client-specific features: completion tracking, targets display.
 *
 * Enhanced with:
 * - Date navigation for viewing past days
 * - Activity type filters with URL persistence
 * - Completion statistics and streak tracking
 * - Historical view styling (read-only past days)
 */

"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Check, AlertCircle, Clock, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientTimeline } from "@/hooks/use-client-timeline";
import { TimelineTargetsCard } from "./timeline-targets-card";
import { TimelineItemExpanded } from "./timeline-item-expanded";
import { TimelineDateNav } from "./timeline-date-nav";
import {
  TimelineFilters,
  type TypeFilters,
  parseFiltersFromParam,
  filtersToParam,
} from "./timeline-filters";
import { TimelineStats } from "./timeline-stats";
import { TimelineGrid } from "@/components/admin/timeline-editor/timeline-grid";
import {
  calculateStats,
  calculateStatsByType,
  type TimelineItemWithCompletion,
} from "@/lib/utils/completion-stats";
import { getDayNumber, formatPlanDateForStorage, getDayDate } from "@/lib/utils/plan-dates";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

// =============================================================================
// INNER COMPONENT (uses useSearchParams)
// =============================================================================

function ClientTimelineViewInner() {
  const searchParams = useSearchParams();

  // Parse URL params
  const dateParam = searchParams.get("date");
  const filterParam = searchParams.get("filter");

  // Parse date from URL
  const urlDate = useMemo(() => {
    if (!dateParam) return null;
    const parsed = new Date(dateParam + "T00:00:00");
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [dateParam]);

  // Parse filters from URL
  const urlFilters = useMemo(() => {
    return parseFiltersFromParam(filterParam);
  }, [filterParam]);

  // UI State
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(urlDate);
  const [typeFilters, setTypeFilters] = useState<TypeFilters>(urlFilters);
  const [expandedItem, setExpandedItem] = useState<ExtendedTimelineItem | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  // Fetch timeline data
  const {
    timelineItems,
    packingItems,
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
    completedCount,
    totalCount,
    completions,
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
  } = useClientTimeline({
    dayNumberOverride: selectedDayNumber ?? undefined,
    selectedDate: selectedDate ?? undefined,
  });

  // Today's date
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Initialize selected day from URL or plan progress
  useEffect(() => {
    if (urlDate && planStartDate) {
      // URL has date - calculate day number
      const urlDayNumber = getDayNumber(planStartDate, urlDate);
      setSelectedDayNumber(urlDayNumber > 0 ? urlDayNumber : 1);
      setSelectedDate(urlDate);
    } else if (planProgress && selectedDayNumber === null) {
      // No URL date - use today
      setSelectedDayNumber(planProgress.dayNumber);
    }
  }, [urlDate, planProgress, selectedDayNumber, planStartDate]);

  // Sync filters with URL changes
  useEffect(() => {
    setTypeFilters(urlFilters);
  }, [urlFilters]);

  // Use the fetched day number for display
  const currentDayNumber = selectedDayNumber ?? dayNumber;

  // Calculate if viewing today
  const isViewingToday = useMemo(() => {
    if (!planProgress) return false;
    return currentDayNumber === planProgress.dayNumber;
  }, [currentDayNumber, planProgress]);

  // Calculate if viewing past (historical view)
  const isViewingPast = useMemo(() => {
    if (!planProgress || !planStartDate) return false;
    if (isBeforePlanStart) return false;
    return currentDayNumber < planProgress.dayNumber;
  }, [currentDayNumber, planProgress, planStartDate, isBeforePlanStart]);

  // Determine if viewing a future day (can't complete items on future days)
  const isViewingFutureDay = useMemo(() => {
    if (!planProgress || !planStartDate) return false;
    if (isBeforePlanStart) return true;
    return currentDayNumber > planProgress.dayNumber;
  }, [planProgress, planStartDate, isBeforePlanStart, currentDayNumber]);

  // Filter items based on type filters
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => typeFilters[item.type as keyof TypeFilters]);
  }, [timelineItems, typeFilters]);

  const filteredPackingItems = useMemo(() => {
    return packingItems.filter((item) => typeFilters[item.type as keyof TypeFilters]);
  }, [packingItems, typeFilters]);

  // Item counts by type
  const itemCounts = useMemo(
    () => ({
      meal: dietItems.length,
      supplement: supplementItems.length,
      workout: workoutItems.length,
      lifestyle: lifestyleItems.length,
      total: timelineItems.length,
    }),
    [dietItems, supplementItems, workoutItems, lifestyleItems, timelineItems]
  );

  // Calculate completion statistics for current view
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

  const viewStatsByType = useMemo(() => {
    return calculateStatsByType(itemsForStats, completions);
  }, [itemsForStats, completions]);

  // Calculate days until start for banner (if before plan start)
  const daysUntilStart =
    isBeforePlanStart && planStartDate
      ? Math.ceil((planStartDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // =============================================================================
  // URL UPDATE HELPER
  // =============================================================================

  const updateUrl = useCallback(
    (newDate: Date | null, newFilters: TypeFilters) => {
      const params = new URLSearchParams();

      // Add date param if not today
      if (newDate) {
        const dateStr = formatPlanDateForStorage(newDate);
        const todayStr = formatPlanDateForStorage(today);
        if (dateStr !== todayStr) {
          params.set("date", dateStr);
        }
      }

      // Add filter param if not all enabled
      const filterParam = filtersToParam(newFilters);
      if (filterParam) {
        params.set("filter", filterParam);
      }

      // Build URL
      const queryString = params.toString();
      const newUrl = queryString ? `/dashboard?${queryString}` : "/dashboard";

      // Use history API to avoid full page reload
      window.history.replaceState(null, "", newUrl);
    },
    [today]
  );

  // =============================================================================
  // HANDLERS
  // =============================================================================

  // Handle filter change
  const handleFiltersChange = useCallback(
    (newFilters: TypeFilters) => {
      setTypeFilters(newFilters);
      updateUrl(selectedDate, newFilters);
    },
    [selectedDate, updateUrl]
  );

  // Handle date navigation
  const handleDateChange = useCallback(
    (date: Date) => {
      if (!planStartDate) return;

      const newDayNumber = getDayNumber(planStartDate, date);
      setSelectedDayNumber(newDayNumber > 0 ? newDayNumber : 1);
      setSelectedDate(date);
      updateUrl(date, typeFilters);
    },
    [planStartDate, typeFilters, updateUrl]
  );

  // Handle go to today
  const handleGoToToday = useCallback(() => {
    if (planProgress) {
      setSelectedDayNumber(planProgress.dayNumber);
      setSelectedDate(null);
      updateUrl(null, typeFilters);
    }
  }, [planProgress, typeFilters, updateUrl]);

  // Handle item click - open expanded view
  const handleItemClick = useCallback((item: ExtendedTimelineItem) => {
    setExpandedItem(item);
  }, []);

  // Handle mark complete
  const handleMarkComplete = useCallback(async () => {
    if (!expandedItem) return;
    setIsMarking(true);
    try {
      await markComplete(expandedItem);
    } finally {
      setIsMarking(false);
    }
  }, [expandedItem, markComplete]);

  // Handle mark uncomplete
  const handleMarkUncomplete = useCallback(async () => {
    if (!expandedItem) return;
    setIsMarking(true);
    try {
      await markUncomplete(expandedItem);
    } finally {
      setIsMarking(false);
    }
  }, [expandedItem, markUncomplete]);

  // Handle mark individual source item complete
  const handleMarkSourceItemComplete = useCallback(
    async (sourceId: string) => {
      if (!expandedItem) return;
      const planTypeMap: Record<string, "diet" | "supplement" | "workout" | "lifestyle"> = {
        meal: "diet",
        supplement: "supplement",
        workout: "workout",
        lifestyle: "lifestyle",
      };
      const planType = planTypeMap[expandedItem.type];
      if (planType) {
        await markSourceItemComplete(sourceId, planType);
      }
    },
    [expandedItem, markSourceItemComplete]
  );

  // Handle mark individual source item uncomplete
  const handleMarkSourceItemUncomplete = useCallback(
    async (sourceId: string) => {
      await markSourceItemUncomplete(sourceId);
    },
    [markSourceItemUncomplete]
  );

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-8 w-64 bg-secondary mb-4" />
          <div className="h-4 w-48 bg-secondary" />
        </div>
        <div className="athletic-card p-4 pl-8 animate-pulse">
          <div className="h-12 w-full bg-secondary" />
        </div>
        <div className="athletic-card p-4 animate-pulse" style={{ height: 600 }}>
          <div className="h-full bg-secondary/50" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 border-red-500/50">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-bold">Failed to load your plan</p>
              <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
            </div>
          </div>
          <Button onClick={refetch} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Plan not configured state
  if (!isPlanConfigured) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="athletic-card p-8 pl-10 border-yellow-500/50">
          <div className="flex items-center gap-3 text-yellow-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <div>
              <p className="font-bold text-lg">Plan Not Configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your coach hasn&apos;t set up your plan start date yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate the current view date for display
  const viewDate =
    selectedDate || (planStartDate ? getDayDate(planStartDate, currentDayNumber) : new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Banner: Plan starts in the future */}
      {isBeforePlanStart && planStartDate && daysUntilStart !== null && (
        <div className="athletic-card p-4 pl-8 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center gap-3 text-blue-400">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">
                Your plan starts in {daysUntilStart} day{daysUntilStart !== 1 ? "s" : ""} (
                {planStartDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                )
              </p>
              <p className="text-sm text-muted-foreground">
                Preview your Day 1 plan below. You&apos;ll be able to track completions once your
                plan begins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner: Viewing future day */}
      {!isBeforePlanStart && isViewingFutureDay && (
        <div className="athletic-card p-4 pl-8 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-center gap-3 text-yellow-400">
            <Clock className="h-5 w-5 shrink-0" />
            <p className="font-bold">
              You&apos;re previewing a future day. Completions can only be tracked for today and
              past days.
            </p>
          </div>
        </div>
      )}

      {/* Banner: Viewing historical day */}
      {isViewingPast && (
        <div className="athletic-card p-4 pl-8 border-purple-500/50 bg-purple-500/10">
          <div className="flex items-center gap-3 text-purple-400">
            <History className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Viewing History - Day {currentDayNumber}</p>
              <p className="text-sm text-muted-foreground">
                This is a read-only view of your past plan. Uncompleted items are shown as missed.
              </p>
            </div>
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 text-sm font-bold bg-purple-500/20 border border-purple-500/50 rounded hover:bg-purple-500/30 transition-colors"
            >
              Back to Today
            </button>
          </div>
        </div>
      )}

      {/* Header with date navigation */}
      <div className="athletic-card p-4 md:p-6 pl-6 md:pl-8">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight truncate">
                {isViewingToday ? "Today's" : `Day ${currentDayNumber}`}{" "}
                <span className="gradient-athletic">Plan</span>
                {isViewingPast && (
                  <span className="ml-2 text-xs md:text-sm font-bold text-purple-400 normal-case">
                    (History)
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground font-bold mt-0.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>

            {/* Completion counter */}
            <div
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded border shrink-0",
                isViewingPast
                  ? viewStats.percentage >= 80
                    ? "bg-green-500/20 border-green-500/50"
                    : viewStats.percentage >= 50
                      ? "bg-yellow-500/20 border-yellow-500/50"
                      : "bg-red-500/20 border-red-500/50"
                  : "bg-green-500/20 border-green-500/50"
              )}
            >
              {isViewingPast && viewStats.percentage < 100 ? (
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    viewStats.percentage >= 80
                      ? "text-green-500"
                      : viewStats.percentage >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                  )}
                />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              <span
                className={cn(
                  "font-bold text-sm",
                  isViewingPast
                    ? viewStats.percentage >= 80
                      ? "text-green-500"
                      : viewStats.percentage >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    : "text-green-500"
                )}
              >
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Date navigation - hidden on mobile for faster timeline access */}
          {planStartDate && planProgress && (
            <div className="hidden md:block">
              <TimelineDateNav
                selectedDate={viewDate}
                planStartDate={planStartDate}
                totalDays={planProgress.totalDays}
                onDateChange={handleDateChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Statistics Card - hidden on mobile for faster access to timeline */}
      {(isViewingPast || isViewingToday) && (
        <div className="athletic-card p-6 pl-8 hidden md:block">
          <TimelineStats
            stats={viewStats}
            statsByType={viewStatsByType}
            periodLabel={isViewingToday ? "Today's Progress" : `Day ${currentDayNumber} Summary`}
            compact={false}
          />
        </div>
      )}

      {/* Targets Card - client-specific */}
      <TimelineTargetsCard
        targets={targets}
        consumed={consumed}
        planProgress={planProgress}
        className="athletic-card"
      />

      {/* Type Filters - icon-only on mobile, full on desktop */}
      <div className="athletic-card p-3 md:p-4 pl-4 md:pl-8">
        {/* Mobile: compact icon filters */}
        <div className="md:hidden">
          <TimelineFilters
            filters={typeFilters}
            onFiltersChange={handleFiltersChange}
            counts={itemCounts}
            compact
          />
        </div>
        {/* Desktop: full filters */}
        <div className="hidden md:block">
          <TimelineFilters
            filters={typeFilters}
            onFiltersChange={handleFiltersChange}
            counts={itemCounts}
          />
        </div>
      </div>

      {/* Timeline Grid - reusing admin component exactly */}
      <div className="athletic-card p-4 overflow-auto max-h-[60vh] md:max-h-none">
        <TimelineGrid
          items={filteredItems}
          packingItems={filteredPackingItems}
          onItemClick={handleItemClick}
          isLoading={isLoading}
          autoScrollToFirstItem
        />
      </div>

      {/* Expanded item modal - client-specific for completion */}
      {expandedItem && (
        <TimelineItemExpanded
          item={expandedItem}
          isCompleted={isItemCompleted(expandedItem.id)}
          completionStatus={getItemCompletionStatus(expandedItem.id)}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkComplete={handleMarkComplete}
          onMarkUncomplete={handleMarkUncomplete}
          onMarkSourceItemComplete={handleMarkSourceItemComplete}
          onMarkSourceItemUncomplete={handleMarkSourceItemUncomplete}
          onClose={() => setExpandedItem(null)}
          isMarking={isMarking}
          readOnly={isViewingFutureDay || isViewingPast}
        />
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT (with Suspense boundary)
// =============================================================================

/**
 * Client Timeline View - matches admin Plan Editor layout
 * Wrapped in Suspense for useSearchParams
 */
export function ClientTimelineView() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-8 w-64 bg-secondary mb-4" />
            <div className="h-4 w-48 bg-secondary" />
          </div>
        </div>
      }
    >
      <ClientTimelineViewInner />
    </Suspense>
  );
}
