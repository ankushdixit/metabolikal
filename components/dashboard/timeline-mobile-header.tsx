/**
 * Timeline Mobile Header Component
 *
 * Sticky compact header for mobile timeline with:
 * - Day info and completion counter
 * - Swipeable date display
 * - Horizontally scrollable filter chips
 * - Compact mode when scrolled
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Check, ChevronLeft, ChevronRight, AlertTriangle, WifiOff } from "lucide-react";
import { TimelineFilters, type TypeFilters, type FilterCounts } from "./timeline-filters";
import type { MacroTargets, ConsumedTotals, PlanProgress } from "@/hooks/use-client-timeline";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineMobileHeaderProps {
  /** Current day number */
  dayNumber: number;
  /** Formatted date string */
  formattedDate: string;
  /** Whether viewing today */
  isViewingToday: boolean;
  /** Whether viewing a past day */
  isViewingPast: boolean;
  /** Plan progress info */
  planProgress: PlanProgress | null;
  /** Completion counts */
  completedCount: number;
  totalCount: number;
  /** Completion percentage for historical view */
  completionPercentage: number;
  /** Macro targets */
  targets: MacroTargets;
  /** Consumed macros */
  consumed: ConsumedTotals;
  /** Type filters */
  filters: TypeFilters;
  /** Filter change handler */
  onFiltersChange: (filters: TypeFilters) => void;
  /** Item counts */
  counts: FilterCounts;
  /** Navigation handlers */
  onPreviousDay: () => void;
  onNextDay: () => void;
  /** Whether can navigate */
  canGoPrevious: boolean;
  canGoNext: boolean;
  /** Whether offline */
  isOffline?: boolean;
  /** Last updated timestamp */
  lastUpdated?: Date | null;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TimelineMobileHeader({
  dayNumber,
  formattedDate,
  isViewingToday,
  isViewingPast,
  planProgress,
  completedCount,
  totalCount,
  completionPercentage,
  targets,
  consumed,
  filters,
  onFiltersChange,
  counts,
  onPreviousDay,
  onNextDay,
  canGoPrevious,
  canGoNext,
  isOffline = false,
  lastUpdated,
  className,
}: TimelineMobileHeaderProps) {
  const [isCompact, setIsCompact] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Track scroll position to toggle compact mode
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get calorie display
  const calorieDisplay = targets.calories
    ? `${consumed.calories}/${targets.calories}`
    : consumed.calories > 0
      ? `${consumed.calories}`
      : null;

  return (
    <div
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b transition-all duration-200",
        isCompact ? "py-2" : "py-3",
        className
      )}
    >
      {/* Offline indicator */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-black text-xs font-bold text-center py-0.5 flex items-center justify-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline - changes will sync when connected
        </div>
      )}

      <div className={cn("px-4", isOffline && "mt-5")}>
        {/* Main header row */}
        <div className="flex items-center justify-between gap-2">
          {/* Day navigation */}
          <button
            onClick={onPreviousDay}
            disabled={!canGoPrevious}
            className={cn(
              "p-2 -ml-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
              canGoPrevious ? "text-foreground active:bg-secondary" : "text-muted-foreground/30"
            )}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Day info - center */}
          <div className="flex-1 text-center min-w-0">
            {isCompact ? (
              // Compact mode - single line
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold truncate">
                  {isViewingToday ? "Today" : `Day ${dayNumber}`}
                </span>
                {isViewingPast && <span className="text-xs text-purple-400">(History)</span>}
              </div>
            ) : (
              // Full mode
              <>
                <h1 className="text-lg font-black">
                  {isViewingToday ? "Today's Plan" : `Day ${dayNumber}`}
                  {isViewingPast && (
                    <span className="ml-1 text-sm font-bold text-purple-400">(History)</span>
                  )}
                </h1>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">{formattedDate}</span>
                </div>
              </>
            )}
          </div>

          {/* Next day navigation */}
          <button
            onClick={onNextDay}
            disabled={!canGoNext}
            className={cn(
              "p-2 -mr-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
              canGoNext ? "text-foreground active:bg-secondary" : "text-muted-foreground/30"
            )}
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Stats row - hidden in compact mode */}
        {!isCompact && (
          <div className="flex items-center justify-center gap-4 mt-2">
            {/* Completion counter */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold",
                isViewingPast
                  ? completionPercentage >= 80
                    ? "bg-green-500/20 text-green-500"
                    : completionPercentage >= 50
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-red-500/20 text-red-500"
                  : "bg-green-500/20 text-green-500"
              )}
            >
              {isViewingPast && completionPercentage < 100 ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {completedCount}/{totalCount}
            </div>

            {/* Calories */}
            {calorieDisplay && (
              <div className="text-sm">
                <span className="font-bold">{calorieDisplay}</span>
                <span className="text-muted-foreground ml-1">cal</span>
              </div>
            )}

            {/* Progress indicator for plan */}
            {planProgress && isViewingToday && (
              <div className="text-xs text-muted-foreground">Week {planProgress.weekNumber}</div>
            )}
          </div>
        )}

        {/* Filters row - full width on mobile */}
        <div className={cn("mt-2", isCompact && "mt-1")}>
          <TimelineFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            counts={counts}
            mobile
          />
        </div>

        {/* Last updated - only show when relevant */}
        {lastUpdated && !isCompact && (
          <div className="text-center text-xs text-muted-foreground mt-1">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}
