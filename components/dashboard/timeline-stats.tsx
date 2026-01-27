/**
 * Timeline Statistics Component
 *
 * Displays completion statistics including:
 * - Overall completion percentage
 * - Breakdown by activity type
 * - Current streak
 * - Trend indicator
 */

"use client";

import {
  Utensils,
  Pill,
  Dumbbell,
  Heart,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CompletionStats,
  StatsByType,
  StreakInfo,
  TrendInfo,
} from "@/lib/utils/completion-stats";
import {
  formatStreak,
  getTrendLabel,
  formatPercentage,
  getCompletionColorClass,
} from "@/lib/utils/completion-stats";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineStatsProps {
  /** Overall completion stats */
  stats: CompletionStats;
  /** Stats broken down by type */
  statsByType?: StatsByType;
  /** Streak information */
  streak?: StreakInfo;
  /** Trend information */
  trend?: TrendInfo;
  /** Title/label for the stats period */
  periodLabel?: string;
  /** Whether to show compact view */
  compact?: boolean;
  /** Layout for type breakdown: 'vertical' (default) or 'horizontal' (all in one row) */
  typeLayout?: "vertical" | "horizontal";
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Progress bar component
 */
function ProgressBar({
  percentage,
  colorClass,
  size = "md",
}: {
  percentage: number;
  colorClass: string;
  size?: "sm" | "md";
}) {
  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={cn("w-full bg-secondary rounded-full overflow-hidden", heightClass)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}

/**
 * Type stat row component (vertical layout)
 */
function TypeStatRow({
  icon: Icon,
  label,
  stats,
  colorClass,
  bgColorClass,
}: {
  icon: typeof Utensils;
  label: string;
  stats: CompletionStats;
  colorClass: string;
  bgColorClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-1.5 rounded", bgColorClass)}>
        <Icon className={cn("h-3.5 w-3.5", colorClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={cn("text-xs font-bold", getCompletionColorClass(stats.percentage))}>
            {stats.completed}/{stats.total}
          </span>
        </div>
        <ProgressBar
          percentage={stats.percentage}
          colorClass={bgColorClass.replace("/20", "")}
          size="sm"
        />
      </div>
      <span
        className={cn(
          "text-sm font-bold tabular-nums w-10 text-right",
          getCompletionColorClass(stats.percentage)
        )}
      >
        {formatPercentage(stats.percentage)}
      </span>
    </div>
  );
}

/**
 * Type stat compact component (horizontal layout - for single row display)
 */
function TypeStatCompact({
  icon: Icon,
  label,
  stats,
  colorClass,
  bgColorClass,
}: {
  icon: typeof Utensils;
  label: string;
  stats: CompletionStats;
  colorClass: string;
  bgColorClass: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className={cn("p-1.5 rounded shrink-0", bgColorClass)}>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </div>
      <div className="min-w-0">
        <span className="text-xs font-medium text-muted-foreground block truncate">{label}</span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              getCompletionColorClass(stats.percentage)
            )}
          >
            {stats.completed}/{stats.total}
          </span>
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              getCompletionColorClass(stats.percentage)
            )}
          >
            {formatPercentage(stats.percentage)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Trend icon based on direction
 */
function TrendIcon({ direction }: { direction: TrendInfo["direction"] }) {
  switch (direction) {
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "declining":
      return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    case "maintaining":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Timeline statistics component
 */
export function TimelineStats({
  stats,
  statsByType,
  streak,
  trend,
  periodLabel = "Today",
  compact = false,
  typeLayout = "vertical",
  className,
}: TimelineStatsProps) {
  const progressColorClass =
    stats.percentage >= 80
      ? "bg-green-500"
      : stats.percentage >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  if (compact) {
    // Compact view - just overall stats and streak
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {/* Overall percentage */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{periodLabel}:</span>
          <span className={cn("text-lg font-bold", getCompletionColorClass(stats.percentage))}>
            {formatPercentage(stats.percentage)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({stats.completed}/{stats.total})
          </span>
        </div>

        {/* Streak (if available) */}
        {streak && streak.current > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 rounded">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-500">{formatStreak(streak)}</span>
          </div>
        )}
      </div>
    );
  }

  // Full view with all stats
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with overall percentage */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {periodLabel}
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn("text-3xl font-black", getCompletionColorClass(stats.percentage))}>
              {formatPercentage(stats.percentage)}
            </span>
            <span className="text-sm text-muted-foreground">
              {stats.completed} of {stats.total} completed
            </span>
          </div>
        </div>

        {/* Streak and trend indicators */}
        <div className="flex flex-col items-end gap-2">
          {streak && streak.current > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 rounded-lg">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">{formatStreak(streak)}</span>
            </div>
          )}
          {trend && (
            <div className="flex items-center gap-1.5">
              <TrendIcon direction={trend.direction} />
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "improving" && "text-green-500",
                  trend.direction === "declining" && "text-yellow-500",
                  trend.direction === "maintaining" && "text-muted-foreground"
                )}
              >
                {getTrendLabel(trend)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <ProgressBar percentage={stats.percentage} colorClass={progressColorClass} />

      {/* Breakdown by type */}
      {statsByType && typeLayout === "vertical" && (
        <div className="space-y-3 pt-3 border-t border-border">
          <TypeStatRow
            icon={Utensils}
            label="Meals"
            stats={statsByType.meal}
            colorClass="text-orange-400"
            bgColorClass="bg-orange-500/20"
          />
          <TypeStatRow
            icon={Pill}
            label="Supplements"
            stats={statsByType.supplement}
            colorClass="text-green-400"
            bgColorClass="bg-green-500/20"
          />
          <TypeStatRow
            icon={Dumbbell}
            label="Workouts"
            stats={statsByType.workout}
            colorClass="text-blue-400"
            bgColorClass="bg-blue-500/20"
          />
          <TypeStatRow
            icon={Heart}
            label="Lifestyle"
            stats={statsByType.lifestyle}
            colorClass="text-purple-400"
            bgColorClass="bg-purple-500/20"
          />
        </div>
      )}

      {/* Horizontal breakdown by type (all in one row) */}
      {statsByType && typeLayout === "horizontal" && (
        <div className="flex items-stretch gap-4 pt-3 border-t border-border">
          <TypeStatCompact
            icon={Utensils}
            label="Meals"
            stats={statsByType.meal}
            colorClass="text-orange-400"
            bgColorClass="bg-orange-500/20"
          />
          <TypeStatCompact
            icon={Pill}
            label="Supplements"
            stats={statsByType.supplement}
            colorClass="text-green-400"
            bgColorClass="bg-green-500/20"
          />
          <TypeStatCompact
            icon={Dumbbell}
            label="Workouts"
            stats={statsByType.workout}
            colorClass="text-blue-400"
            bgColorClass="bg-blue-500/20"
          />
          <TypeStatCompact
            icon={Heart}
            label="Lifestyle"
            stats={statsByType.lifestyle}
            colorClass="text-purple-400"
            bgColorClass="bg-purple-500/20"
          />
        </div>
      )}
    </div>
  );
}

export default TimelineStats;
