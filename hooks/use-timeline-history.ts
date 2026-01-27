/**
 * useTimelineHistory Hook
 *
 * Manages timeline history state including:
 * - Date navigation with URL state
 * - Filter state with URL persistence
 * - Historical completions data
 * - Statistics calculation
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useList } from "@refinedev/core";
import type { PlanCompletion } from "@/lib/database.types";
import type { ExtendedTimelineItem } from "./use-timeline-data";
import type { TypeFilters } from "@/components/dashboard/timeline-filters";
import {
  parseFiltersFromParam,
  filtersToParam,
  areAllFiltersEnabled,
} from "@/components/dashboard/timeline-filters";
import {
  calculateStats,
  calculateStatsByType,
  calculateStreak,
  calculateTrend,
  type CompletionStats,
  type StatsByType,
  type StreakInfo,
  type TrendInfo,
  type DayCompletionSummary,
  type TimelineItemWithCompletion,
} from "@/lib/utils/completion-stats";
import { getDayNumber, getDayDate, formatPlanDateForStorage } from "@/lib/utils/plan-dates";

// =============================================================================
// TYPES
// =============================================================================

export interface UseTimelineHistoryOptions {
  /** User ID for fetching completions */
  userId: string | null;
  /** Plan start date */
  planStartDate: Date | null;
  /** Total plan days */
  totalDays: number;
  /** Timeline items for the current view */
  timelineItems: ExtendedTimelineItem[];
  /** Whether to sync with URL params */
  syncWithUrl?: boolean;
}

export interface UseTimelineHistoryReturn {
  // Date state
  selectedDate: Date;
  dayNumber: number;
  isViewingToday: boolean;
  isViewingPast: boolean;
  isViewingFuture: boolean;

  // Date navigation
  navigateToDate: (date: Date) => void;
  navigateToDayNumber: (dayNumber: number) => void;
  navigatePrevDay: () => void;
  navigateNextDay: () => void;
  goToToday: () => void;

  // Filter state
  filters: TypeFilters;
  setFilters: (filters: TypeFilters) => void;
  toggleFilter: (type: keyof TypeFilters) => void;
  resetFilters: () => void;

  // Filtered items
  filteredItems: ExtendedTimelineItem[];

  // Statistics
  todayStats: CompletionStats;
  todayStatsByType: StatsByType;
  streak: StreakInfo;
  trend: TrendInfo;

  // Loading
  isLoadingHistory: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_FILTERS: TypeFilters = {
  meal: true,
  supplement: true,
  workout: true,
  lifestyle: true,
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useTimelineHistory({
  userId,
  planStartDate,
  totalDays,
  timelineItems,
  syncWithUrl = true,
}: UseTimelineHistoryOptions): UseTimelineHistoryReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Today's date (normalized to midnight)
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // =============================================================================
  // URL STATE PARSING
  // =============================================================================

  // Parse date from URL
  const dateFromUrl = useMemo(() => {
    if (!syncWithUrl) return null;
    const dateParam = searchParams.get("date");
    if (!dateParam) return null;
    const parsed = new Date(dateParam + "T00:00:00");
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [searchParams, syncWithUrl]);

  // Parse filters from URL
  const filtersFromUrl = useMemo(() => {
    if (!syncWithUrl) return DEFAULT_FILTERS;
    return parseFiltersFromParam(searchParams.get("filter"));
  }, [searchParams, syncWithUrl]);

  // =============================================================================
  // STATE
  // =============================================================================

  // Date state - defaults to today, syncs with URL
  const [selectedDate, setSelectedDate] = useState<Date>(dateFromUrl || today);

  // Filter state - syncs with URL
  const [filters, setFiltersState] = useState<TypeFilters>(filtersFromUrl);

  // Sync state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (syncWithUrl) {
      if (dateFromUrl) {
        setSelectedDate(dateFromUrl);
      } else {
        setSelectedDate(today);
      }
      setFiltersState(filtersFromUrl);
    }
  }, [dateFromUrl, filtersFromUrl, syncWithUrl, today]);

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  // Day number for selected date
  const dayNumber = useMemo(() => {
    if (!planStartDate) return 1;
    const raw = getDayNumber(planStartDate, selectedDate);
    // Cycle through plan days if beyond total
    return raw > totalDays ? ((raw - 1) % totalDays) + 1 : Math.max(1, raw);
  }, [planStartDate, selectedDate, totalDays]);

  // View state
  const isViewingToday = selectedDate.toDateString() === today.toDateString();
  const isViewingPast = selectedDate < today;
  const isViewingFuture = selectedDate > today;

  // =============================================================================
  // URL UPDATE HELPER
  // =============================================================================

  const updateUrl = useCallback(
    (newDate: Date, newFilters: TypeFilters) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams();

      // Add date param if not today
      const dateStr = formatPlanDateForStorage(newDate);
      const todayStr = formatPlanDateForStorage(today);
      if (dateStr !== todayStr) {
        params.set("date", dateStr);
      }

      // Add filter param if not all enabled
      const filterParam = filtersToParam(newFilters);
      if (filterParam) {
        params.set("filter", filterParam);
      }

      // Build URL
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Use replace to avoid building up history for minor changes
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, syncWithUrl, today]
  );

  // =============================================================================
  // NAVIGATION HANDLERS
  // =============================================================================

  const navigateToDate = useCallback(
    (date: Date) => {
      // Don't allow future dates
      if (date > today) return;
      // Don't allow dates before plan start
      if (planStartDate && date < planStartDate) return;

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      setSelectedDate(normalizedDate);
      updateUrl(normalizedDate, filters);
    },
    [today, planStartDate, filters, updateUrl]
  );

  const navigateToDayNumber = useCallback(
    (targetDayNumber: number) => {
      if (!planStartDate) return;
      const date = getDayDate(planStartDate, targetDayNumber);
      navigateToDate(date);
    },
    [planStartDate, navigateToDate]
  );

  const navigatePrevDay = useCallback(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    navigateToDate(prevDate);
  }, [selectedDate, navigateToDate]);

  const navigateNextDay = useCallback(() => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    navigateToDate(nextDate);
  }, [selectedDate, navigateToDate]);

  const goToToday = useCallback(() => {
    navigateToDate(today);
  }, [today, navigateToDate]);

  // =============================================================================
  // FILTER HANDLERS
  // =============================================================================

  const setFilters = useCallback(
    (newFilters: TypeFilters) => {
      setFiltersState(newFilters);
      updateUrl(selectedDate, newFilters);
    },
    [selectedDate, updateUrl]
  );

  const toggleFilter = useCallback(
    (type: keyof TypeFilters) => {
      const newFilters = { ...filters, [type]: !filters[type] };
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  // =============================================================================
  // FILTERED ITEMS
  // =============================================================================

  const filteredItems = useMemo(() => {
    if (areAllFiltersEnabled(filters)) return timelineItems;
    return timelineItems.filter((item) => filters[item.type as keyof TypeFilters]);
  }, [timelineItems, filters]);

  // =============================================================================
  // HISTORICAL COMPLETIONS DATA
  // =============================================================================

  // Fetch completions for the last 14 days (for streak/trend calculation)
  const twoWeeksAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 14);
    return formatPlanDateForStorage(date);
  }, [today]);

  const todayStr = useMemo(() => formatPlanDateForStorage(today), [today]);

  const historicalCompletionsQuery = useList<PlanCompletion>({
    resource: "plan_completions",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "completed_date", operator: "gte", value: twoWeeksAgo },
      { field: "completed_date", operator: "lte", value: todayStr },
    ],
    pagination: { pageSize: 500 },
    queryOptions: {
      enabled: !!userId,
    },
  });

  const allCompletions = historicalCompletionsQuery.query.data?.data || [];

  // =============================================================================
  // STATISTICS CALCULATION
  // =============================================================================

  // Convert timeline items to completion-compatible format
  const itemsForStats: TimelineItemWithCompletion[] = useMemo(() => {
    return timelineItems.map((item) => ({
      id: item.id,
      type: item.type,
      sourceId: item.sourceId,
      groupedSourceIds: item.groupedSourceIds,
    }));
  }, [timelineItems]);

  // Today's completions
  const todayCompletions = useMemo(() => {
    const selectedDateStr = formatPlanDateForStorage(selectedDate);
    return allCompletions.filter((c: PlanCompletion) => c.completed_date === selectedDateStr);
  }, [allCompletions, selectedDate]);

  // Today's stats
  const todayStats = useMemo(() => {
    return calculateStats(itemsForStats, todayCompletions);
  }, [itemsForStats, todayCompletions]);

  const todayStatsByType = useMemo(() => {
    return calculateStatsByType(itemsForStats, todayCompletions);
  }, [itemsForStats, todayCompletions]);

  // Daily summaries for streak/trend (mock data since we don't have historical items)
  // In a full implementation, you'd fetch items for each day
  const dailySummaries: DayCompletionSummary[] = useMemo(() => {
    // Group completions by date
    const completionsByDate = new Map<string, PlanCompletion[]>();
    for (const completion of allCompletions) {
      const dateKey = completion.completed_date;
      const existing = completionsByDate.get(dateKey) || [];
      completionsByDate.set(dateKey, [...existing, completion]);
    }

    // Create summaries (simplified - assumes same items each day)
    const summaries: DayCompletionSummary[] = [];
    completionsByDate.forEach((completions, date) => {
      summaries.push({
        date,
        total: itemsForStats.length,
        completed: completions.length,
        percentage:
          itemsForStats.length > 0
            ? Math.round((completions.length / itemsForStats.length) * 100)
            : 0,
        byType: calculateStatsByType(itemsForStats, completions),
      });
    });

    return summaries;
  }, [allCompletions, itemsForStats]);

  // Streak calculation
  const streak = useMemo(() => {
    return calculateStreak(dailySummaries);
  }, [dailySummaries]);

  // Trend calculation
  const trend = useMemo(() => {
    return calculateTrend(dailySummaries, 7);
  }, [dailySummaries]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Date state
    selectedDate,
    dayNumber,
    isViewingToday,
    isViewingPast,
    isViewingFuture,

    // Date navigation
    navigateToDate,
    navigateToDayNumber,
    navigatePrevDay,
    navigateNextDay,
    goToToday,

    // Filter state
    filters,
    setFilters,
    toggleFilter,
    resetFilters,

    // Filtered items
    filteredItems,

    // Statistics
    todayStats,
    todayStatsByType,
    streak,
    trend,

    // Loading
    isLoadingHistory: historicalCompletionsQuery.query.isLoading,
  };
}

export default useTimelineHistory;
