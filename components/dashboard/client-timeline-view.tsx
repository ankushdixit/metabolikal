/**
 * Client Timeline View Component
 *
 * Client dashboard timeline that matches admin Plan Editor layout exactly.
 * Reuses admin's TimelineGrid component for consistent UI.
 * Adds client-specific features: completion tracking, targets display.
 */

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientTimeline } from "@/hooks/use-client-timeline";
import { TimelineTargetsCard } from "./timeline-targets-card";
import { TimelineItemExpanded } from "./timeline-item-expanded";
import { DaySelectorTabs } from "@/components/admin/timeline-editor/day-selector-tabs";
import { TimelineGrid } from "@/components/admin/timeline-editor/timeline-grid";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

// Filter state (same as admin)
interface TypeFilters {
  meal: boolean;
  supplement: boolean;
  workout: boolean;
  lifestyle: boolean;
}

/**
 * Client Timeline View - matches admin Plan Editor layout
 */
export function ClientTimelineView() {
  // UI State
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [typeFilters, setTypeFilters] = useState<TypeFilters>({
    meal: true,
    supplement: true,
    workout: true,
    lifestyle: true,
  });
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
  });

  // Initialize selected day from plan progress
  useEffect(() => {
    if (planProgress && selectedDayNumber === null) {
      setSelectedDayNumber(planProgress.dayNumber);
    }
  }, [planProgress, selectedDayNumber]);

  // Use the fetched day number for display
  const currentDayNumber = selectedDayNumber ?? dayNumber;

  // Filter items based on type filters (same as admin)
  const filteredItems = useMemo(() => {
    return timelineItems.filter((item) => typeFilters[item.type as keyof TypeFilters]);
  }, [timelineItems, typeFilters]);

  const filteredPackingItems = useMemo(() => {
    return packingItems.filter((item) => typeFilters[item.type as keyof TypeFilters]);
  }, [packingItems, typeFilters]);

  // Item counts by type (same as admin)
  const itemCounts = useMemo(
    () => ({
      meal: dietItems.length,
      supplement: supplementItems.length,
      workout: workoutItems.length,
      lifestyle: lifestyleItems.length,
    }),
    [dietItems, supplementItems, workoutItems, lifestyleItems]
  );

  // Days with content (for day selector indicators)
  const daysWithContent = useMemo(() => {
    // TODO: Fetch from API for performance
    return [];
  }, []);

  // Toggle type filter (same as admin)
  const toggleTypeFilter = useCallback((type: keyof TypeFilters) => {
    setTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Toggle all filters (same as admin)
  const toggleAllFilters = useCallback(() => {
    const allEnabled = Object.values(typeFilters).every(Boolean);
    setTypeFilters({
      meal: !allEnabled,
      supplement: !allEnabled,
      workout: !allEnabled,
      lifestyle: !allEnabled,
    });
  }, [typeFilters]);

  // Handle item click - open expanded view
  const handleItemClick = useCallback((item: ExtendedTimelineItem) => {
    setExpandedItem(item);
  }, []);

  // Handle day change
  const handleDayChange = useCallback((day: number) => {
    setSelectedDayNumber(day);
  }, []);

  // Handle go to today
  const handleGoToToday = useCallback(() => {
    if (planProgress) {
      setSelectedDayNumber(planProgress.dayNumber);
    }
  }, [planProgress]);

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
      // Map timeline item type to plan type
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

  // Is viewing today?
  const isViewingToday = planProgress && currentDayNumber === planProgress.dayNumber;

  // Calculate days until start for banner (if before plan start)
  // Must be before early returns to comply with React hooks rules
  const daysUntilStart =
    isBeforePlanStart && planStartDate
      ? Math.ceil((planStartDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Determine if viewing a future day (can't complete items on future days)
  // Must be before early returns to comply with React hooks rules
  const isViewingFutureDay = useMemo(() => {
    if (!planProgress || !planStartDate) return false;
    // If plan hasn't started yet, all days are future
    if (isBeforePlanStart) return true;
    // Compare current day number with today's day number
    return currentDayNumber > planProgress.dayNumber;
  }, [planProgress, planStartDate, isBeforePlanStart, currentDayNumber]);

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

      {/* Header - same structure as admin */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {isViewingToday ? "Today's" : `Day ${currentDayNumber}`}{" "}
              <span className="gradient-athletic">Plan</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold mt-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Today button - shows when viewing a different day */}
            {!isViewingToday && (
              <button
                onClick={handleGoToToday}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/50 rounded text-sm font-bold text-primary hover:bg-primary/30 transition-colors"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Today</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded">
              <Check className="h-4 w-4 text-green-500" />
              <span className="font-bold text-green-500">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector - same as admin */}
      {planProgress && (
        <div className="athletic-card p-4 pl-8">
          <DaySelectorTabs
            selectedDay={currentDayNumber}
            onSelectDay={handleDayChange}
            daysWithContent={daysWithContent}
            totalDays={planProgress.totalDays}
            planStartDate={planStartDate}
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

      {/* Type Filters - same as admin */}
      <div className="athletic-card p-4 pl-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Show:
          </span>

          {(["meal", "supplement", "workout", "lifestyle"] as const).map((type) => {
            const isActive = typeFilters[type];
            const count = itemCounts[type];
            const labels = {
              meal: "Meals",
              supplement: "Supplements",
              workout: "Workouts",
              lifestyle: "Lifestyle",
            };
            const colors = {
              meal: "bg-orange-500/20 border-orange-500/50 text-orange-400",
              supplement: "bg-green-500/20 border-green-500/50 text-green-400",
              workout: "bg-blue-500/20 border-blue-500/50 text-blue-400",
              lifestyle: "bg-purple-500/20 border-purple-500/50 text-purple-400",
            };

            return (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-bold transition-all",
                  isActive ? colors[type] : "bg-secondary/50 border-border text-muted-foreground"
                )}
              >
                {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{labels[type]}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    isActive ? "bg-black/20" : "bg-secondary"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={toggleAllFilters}
            className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider ml-2"
          >
            {Object.values(typeFilters).every(Boolean) ? "Hide All" : "Show All"}
          </button>

          {/* Refresh button */}
          <button
            onClick={refetch}
            className="btn-athletic p-2 bg-secondary text-foreground ml-auto"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Timeline Grid - reusing admin component exactly */}
      <div className="athletic-card p-4 overflow-x-auto">
        <TimelineGrid
          items={filteredItems}
          packingItems={filteredPackingItems}
          onItemClick={handleItemClick}
          isLoading={isLoading}
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
          readOnly={isViewingFutureDay}
        />
      )}
    </div>
  );
}
