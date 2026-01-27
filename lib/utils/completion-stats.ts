/**
 * Completion Statistics Utilities
 *
 * Functions to calculate completion rates, streaks, and statistics
 * for timeline items by activity type.
 */

import type { PlanCompletion, TimelineItemType } from "@/lib/database.types";

// =============================================================================
// TYPES
// =============================================================================

export interface CompletionStats {
  total: number;
  completed: number;
  percentage: number;
}

export interface StatsByType {
  meal: CompletionStats;
  supplement: CompletionStats;
  workout: CompletionStats;
  lifestyle: CompletionStats;
}

export interface DayCompletionSummary {
  date: string;
  total: number;
  completed: number;
  percentage: number;
  byType: StatsByType;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

export interface TrendInfo {
  direction: "improving" | "maintaining" | "declining";
  percentageChange: number;
  comparisonPeriod: string;
}

export interface TimelineItemWithCompletion {
  id: string;
  type: TimelineItemType;
  sourceId: string;
  groupedSourceIds?: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map timeline item type to plan completion type
 */
export function timelineTypeToPlanType(
  type: TimelineItemType
): "diet" | "supplement" | "workout" | "lifestyle" {
  if (type === "meal") return "diet";
  return type;
}

/**
 * Calculate completion stats for a set of items and completions
 */
export function calculateStats(
  items: TimelineItemWithCompletion[],
  completions: PlanCompletion[]
): CompletionStats {
  const total = items.length;
  if (total === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const completedIds = new Set(completions.map((c) => c.plan_item_id));

  let completed = 0;
  for (const item of items) {
    if (item.groupedSourceIds) {
      // For grouped items, count as complete if ALL source items are completed
      const allCompleted = item.groupedSourceIds.every((id) => completedIds.has(id));
      if (allCompleted) completed++;
    } else {
      if (completedIds.has(item.sourceId)) completed++;
    }
  }

  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

/**
 * Calculate completion stats broken down by activity type
 */
export function calculateStatsByType(
  items: TimelineItemWithCompletion[],
  completions: PlanCompletion[]
): StatsByType {
  const types: TimelineItemType[] = ["meal", "supplement", "workout", "lifestyle"];

  const result: StatsByType = {
    meal: { total: 0, completed: 0, percentage: 0 },
    supplement: { total: 0, completed: 0, percentage: 0 },
    workout: { total: 0, completed: 0, percentage: 0 },
    lifestyle: { total: 0, completed: 0, percentage: 0 },
  };

  for (const type of types) {
    const typeItems = items.filter((item) => item.type === type);
    const planType = timelineTypeToPlanType(type);
    const typeCompletions = completions.filter((c) => c.plan_type === planType);
    result[type] = calculateStats(typeItems, typeCompletions);
  }

  return result;
}

/**
 * Calculate a summary of completions for a single day
 */
export function calculateDayCompletionSummary(
  date: string,
  items: TimelineItemWithCompletion[],
  completions: PlanCompletion[]
): DayCompletionSummary {
  const overall = calculateStats(items, completions);
  const byType = calculateStatsByType(items, completions);

  return {
    date,
    total: overall.total,
    completed: overall.completed,
    percentage: overall.percentage,
    byType,
  };
}

// =============================================================================
// STREAK CALCULATIONS
// =============================================================================

/**
 * Check if a date has 100% completion
 */
function hasFullCompletion(dateStats: DayCompletionSummary): boolean {
  return dateStats.total > 0 && dateStats.completed === dateStats.total;
}

/**
 * Calculate streak information from an array of daily summaries
 * @param dailySummaries Array of day summaries sorted by date (newest first)
 */
export function calculateStreak(dailySummaries: DayCompletionSummary[]): StreakInfo {
  if (dailySummaries.length === 0) {
    return { current: 0, longest: 0, lastCompletedDate: null };
  }

  // Sort by date descending (most recent first)
  const sorted = [...dailySummaries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastCompletedDate: string | null = null;

  // Find current streak (consecutive days from today with 100% completion)
  for (let i = 0; i < sorted.length; i++) {
    const summary = sorted[i];
    if (hasFullCompletion(summary)) {
      if (i === 0 || currentStreak > 0) {
        currentStreak++;
      }
      if (!lastCompletedDate) {
        lastCompletedDate = summary.date;
      }
    } else if (currentStreak > 0) {
      // Streak broken
      break;
    }
  }

  // Calculate longest streak
  for (const summary of sorted.reverse()) {
    if (hasFullCompletion(summary)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
    lastCompletedDate,
  };
}

// =============================================================================
// TREND CALCULATIONS
// =============================================================================

/**
 * Calculate the average completion percentage for a set of daily summaries
 */
function calculateAverageCompletion(summaries: DayCompletionSummary[]): number {
  if (summaries.length === 0) return 0;
  const total = summaries.reduce((sum, s) => sum + s.percentage, 0);
  return Math.round(total / summaries.length);
}

/**
 * Calculate trend by comparing recent period to previous period
 * @param dailySummaries Array of day summaries sorted by date
 * @param periodDays Number of days to compare (default 7)
 */
export function calculateTrend(
  dailySummaries: DayCompletionSummary[],
  periodDays: number = 7
): TrendInfo {
  if (dailySummaries.length < periodDays * 2) {
    return {
      direction: "maintaining",
      percentageChange: 0,
      comparisonPeriod: `${periodDays} days`,
    };
  }

  // Sort by date descending
  const sorted = [...dailySummaries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Recent period (last N days)
  const recentPeriod = sorted.slice(0, periodDays);
  // Previous period (N to 2N days ago)
  const previousPeriod = sorted.slice(periodDays, periodDays * 2);

  const recentAvg = calculateAverageCompletion(recentPeriod);
  const previousAvg = calculateAverageCompletion(previousPeriod);

  const percentageChange = recentAvg - previousAvg;

  let direction: TrendInfo["direction"];
  if (percentageChange > 5) {
    direction = "improving";
  } else if (percentageChange < -5) {
    direction = "declining";
  } else {
    direction = "maintaining";
  }

  return {
    direction,
    percentageChange,
    comparisonPeriod: `${periodDays} days`,
  };
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format streak for display
 */
export function formatStreak(streak: StreakInfo): string {
  if (streak.current === 0) {
    return "No current streak";
  }
  return `${streak.current} day${streak.current !== 1 ? "s" : ""}`;
}

/**
 * Format trend for display with appropriate messaging
 */
export function formatTrend(trend: TrendInfo): string {
  switch (trend.direction) {
    case "improving":
      return `+${trend.percentageChange}% vs last ${trend.comparisonPeriod}`;
    case "declining":
      return `${trend.percentageChange}% vs last ${trend.comparisonPeriod}`;
    case "maintaining":
      return `Consistent over last ${trend.comparisonPeriod}`;
  }
}

/**
 * Get trend label with appropriate tone
 */
export function getTrendLabel(trend: TrendInfo): string {
  switch (trend.direction) {
    case "improving":
      return "Improving";
    case "declining":
      return "Room to Grow";
    case "maintaining":
      return "Maintaining";
  }
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage}%`;
}

/**
 * Get color class based on completion percentage
 */
export function getCompletionColorClass(percentage: number): string {
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 50) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Get background color class based on completion percentage
 */
export function getCompletionBgClass(percentage: number): string {
  if (percentage >= 80) return "bg-green-500/20";
  if (percentage >= 50) return "bg-yellow-500/20";
  return "bg-red-500/20";
}
