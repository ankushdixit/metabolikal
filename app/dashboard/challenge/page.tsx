"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useList } from "@refinedev/core";
import {
  Trophy,
  Flame,
  Calendar,
  AlertCircle,
  Check,
  Footprints,
  Droplets,
  Building2,
  Beef,
  Moon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDaysSinceStart,
  getDateForDay,
  buildDayProgressMap,
  calculateCumulativeStats,
} from "@/lib/challenge-utils";
import type { DayProgress } from "@/lib/challenge-utils";
import { HistoricalCycleBanner } from "@/components/shared/historical-cycle-banner";
import { usePlanCycleData } from "@/contexts/plan-cycle-context";
import type { ChallengeProgress } from "@/lib/database.types";

const DEFAULT_TOTAL_DAYS = 30;

/**
 * Challenge History Page
 * Displays the user's challenge progress in the client portal
 */
export default function ChallengeHistoryPage() {
  const { userId, selectedCycle, cycleDetails } = usePlanCycleData();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const totalDays = cycleDetails?.durationDays || DEFAULT_TOTAL_DAYS;
  const startDate = cycleDetails?.startDate || "";
  // Dependencies not yet available (parent contexts still loading)
  const isReady = !!userId && !!selectedCycle;

  // Fetch challenge progress via React Query (replaces raw Supabase call)
  const progressQuery = useList<ChallengeProgress>({
    resource: "challenge_progress",
    filters: [
      { field: "user_id", operator: "eq", value: userId || "" },
      { field: "plan_cycle", operator: "eq", value: selectedCycle || 0 },
    ],
    sorters: [{ field: "day_number", order: "asc" }],
    pagination: { mode: "off" },
    meta: {
      select:
        "day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, tomorrow_focus, points_earned",
    },
    queryOptions: { enabled: isReady },
  });

  const isLoading = progressQuery.query.isLoading;
  const isError = progressQuery.query.isError;

  // Convert raw DB rows to DayProgress map using shared utility
  const progress = useMemo<Record<number, DayProgress>>(() => {
    const rows = progressQuery.query.data?.data;
    if (!rows?.length) return {};
    return buildDayProgressMap(rows as ChallengeProgress[]);
  }, [progressQuery.query.data?.data]);

  // Reset selected day when cycle changes
  useEffect(() => {
    setSelectedDay(null);
  }, [selectedCycle]);

  // Calculate current day from start date (0 = plan hasn't started)
  const currentDay = useMemo(() => {
    if (!startDate) return 0;
    return getDaysSinceStart(startDate, totalDays);
  }, [startDate, totalDays]);

  // Filter progress to only include days that have actually occurred (day <= currentDay).
  // This prevents stale DB rows from future dates from appearing as "completed".
  const validProgress = useMemo(() => {
    if (currentDay === 0) return {};
    const filtered: Record<number, DayProgress> = {};
    for (const [key, value] of Object.entries(progress)) {
      const dayNum = Number(key);
      if (dayNum <= currentDay) {
        filtered[dayNum] = value;
      }
    }
    return filtered;
  }, [progress, currentDay]);

  // Calculate cumulative stats using only valid (occurred) progress
  const cumulativeStats = useMemo(() => {
    const stats = calculateCumulativeStats(validProgress);
    const totalPoints = Object.values(validProgress).reduce(
      (sum, day) => sum + day.pointsEarned,
      0
    );
    return {
      ...stats,
      totalWater: Math.round(stats.totalWater * 10) / 10,
      totalSleepHours: Math.round(stats.totalSleepHours * 10) / 10,
      totalPoints,
    };
  }, [validProgress]);

  // Calculate completion percentage
  const completionPercent = Math.round((cumulativeStats.daysCompleted / totalDays) * 100);

  // Handle day click
  const handleDayClick = useCallback(
    (day: number) => {
      const dayProgress = validProgress[day];
      if (dayProgress?.hasData && day <= currentDay) {
        setSelectedDay(selectedDay === day ? null : day);
      } else {
        setSelectedDay(null);
      }
    },
    [validProgress, selectedDay, currentDay]
  );

  const selectedDayProgress = selectedDay ? validProgress[selectedDay] : null;
  const showSkeleton = !isReady || isLoading;
  const hasError = isError && !isLoading;
  const isEmpty = !showSkeleton && !hasError && cumulativeStats.daysCompleted === 0;

  const summaryStats = [
    {
      icon: Flame,
      label: "Days Completed",
      value: cumulativeStats.daysCompleted,
      unit: `/ ${totalDays}`,
      color: "text-orange-500",
    },
    {
      icon: Trophy,
      label: "Total Points",
      value: cumulativeStats.totalPoints.toLocaleString(),
      unit: "pts",
      color: "text-primary",
    },
    {
      icon: Calendar,
      label: "Completion",
      value: completionPercent,
      unit: "%",
      color: "text-blue-500",
    },
  ];

  const detailedStats = [
    {
      icon: Footprints,
      label: "Total Steps",
      value: cumulativeStats.totalSteps.toLocaleString(),
      unit: "steps",
    },
    {
      icon: Droplets,
      label: "Total Water",
      value: cumulativeStats.totalWater.toFixed(1),
      unit: "liters",
    },
    {
      icon: Building2,
      label: "Total Floors",
      value: cumulativeStats.totalFloors.toLocaleString(),
      unit: "floors",
    },
    {
      icon: Beef,
      label: "Total Protein",
      value: cumulativeStats.totalProtein.toLocaleString(),
      unit: "grams",
    },
    {
      icon: Moon,
      label: "Total Sleep",
      value: cumulativeStats.totalSleepHours.toFixed(1),
      unit: "hours",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Challenge <span className="gradient-athletic">History</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Your {totalDays}-day metabolic challenge journey
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion Badge */}
            {cumulativeStats.daysCompleted > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">
                  {cumulativeStats.daysCompleted} days completed
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Cycle Selector + Historical Banner */}
      <HistoricalCycleBanner />

      {/* Loading State */}
      {showSkeleton && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="athletic-card p-4 pl-6 animate-pulse">
                <div className="h-8 w-16 bg-secondary mx-auto mb-2" />
                <div className="h-6 w-20 bg-secondary mx-auto" />
              </div>
            ))}
          </div>
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-64 bg-secondary" />
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold">Failed to load challenge history. Please try again.</span>
          </div>
          <button
            onClick={() => progressQuery.query.refetch()}
            className="btn-athletic inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
            No Challenge Data Yet
          </h3>
          <p className="text-muted-foreground font-bold mb-6 max-w-md mx-auto">
            Your {totalDays}-day challenge progress will appear here once you start logging your
            daily metrics. Visit the Challenge Hub on the landing page to begin!
          </p>
        </div>
      )}

      {/* Content */}
      {!showSkeleton && !hasError && !isEmpty && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {summaryStats.map((stat, i) => (
              <div key={i} className="athletic-card p-2 sm:p-4 pl-3 sm:pl-6 text-center">
                <div className="p-1.5 sm:p-2 bg-secondary w-fit mx-auto mb-1 sm:mb-2">
                  <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                </div>
                <div className="text-lg sm:text-2xl font-black">{stat.value}</div>
                <div className="text-[10px] sm:text-xs font-black tracking-wider text-muted-foreground uppercase">
                  {stat.unit}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-0.5 sm:mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* 30-Day Calendar */}
          <div className="athletic-card p-6 pl-8">
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                {totalDays}-Day Calendar
              </h3>
            </div>

            {/* Calendar Grid */}
            <div className="bg-secondary/30 p-3 sm:p-4">
              {/* Week Labels */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-black text-muted-foreground uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Leading padding cells for weekday alignment */}
                {startDate &&
                  (() => {
                    const day1Weekday = new Date(startDate + "T00:00:00").getDay();
                    return Array.from({ length: day1Weekday }, (_, i) => (
                      <div key={`pad-${i}`} className="aspect-square" />
                    ));
                  })()}

                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const dayProgress = validProgress[day];
                  const hasData = dayProgress?.hasData || false;
                  const hasOccurred = day <= currentDay;
                  const isSelected = selectedDay === day;
                  const dayDate = startDate ? getDateForDay(startDate, day) : null;
                  const dateLabel = dayDate
                    ? dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : null;

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      disabled={!hasData}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center relative",
                        "text-sm font-black transition-all",
                        hasData && hasOccurred
                          ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-90"
                          : day === currentDay
                            ? "ring-2 ring-primary bg-secondary"
                            : "bg-secondary text-muted-foreground cursor-default",
                        isSelected && "ring-2 ring-accent"
                      )}
                    >
                      {hasData && hasOccurred ? <Check className="h-4 w-4" /> : day}
                      {dateLabel && (
                        <span className="text-[8px] leading-tight opacity-70">{dateLabel}</span>
                      )}
                    </button>
                  );
                })}

                {/* Fill remaining cells for visual consistency */}
                {(() => {
                  const day1Weekday = startDate ? new Date(startDate + "T00:00:00").getDay() : 0;
                  const totalCells = day1Weekday + totalDays;
                  const trailing = (7 - (totalCells % 7)) % 7;
                  return Array.from({ length: trailing }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ));
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary flex-shrink-0" />
                  <span className="text-xs font-bold text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary flex-shrink-0" />
                  <span className="text-xs font-bold text-muted-foreground">Not Logged</span>
                </div>
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDayProgress && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-secondary">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-wide">
                      Day {selectedDay} Details
                    </h4>
                    <p className="text-xs text-muted-foreground font-bold">
                      Logged on {selectedDayProgress.loggedDate}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  <div className="bg-secondary p-3">
                    <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                      Steps
                    </div>
                    <div className="text-lg font-black">
                      {selectedDayProgress.metrics.steps.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-secondary p-3">
                    <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                      Water
                    </div>
                    <div className="text-lg font-black">
                      {selectedDayProgress.metrics.waterLiters}L
                    </div>
                  </div>
                  <div className="bg-secondary p-3">
                    <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                      Floors
                    </div>
                    <div className="text-lg font-black">
                      {selectedDayProgress.metrics.floorsClimbed}
                    </div>
                  </div>
                  <div className="bg-secondary p-3">
                    <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                      Protein
                    </div>
                    <div className="text-lg font-black">
                      {selectedDayProgress.metrics.proteinGrams}g
                    </div>
                  </div>
                  <div className="bg-secondary p-3">
                    <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                      Sleep
                    </div>
                    <div className="text-lg font-black">
                      {selectedDayProgress.metrics.sleepHours}h
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-wide">Points Earned</span>
                  <span className="px-4 py-2 gradient-electric text-black font-black">
                    {selectedDayProgress.pointsEarned} pts
                  </span>
                </div>

                {selectedDayProgress.metrics.feeling && (
                  <div className="mt-3">
                    <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-1">
                      Feeling
                    </span>
                    <p className="text-sm font-bold">{selectedDayProgress.metrics.feeling}</p>
                  </div>
                )}

                {selectedDayProgress.metrics.tomorrowFocus && (
                  <div className="mt-3">
                    <span className="text-xs font-black tracking-wider text-muted-foreground uppercase block mb-1">
                      Tomorrow&apos;s Focus
                    </span>
                    <p className="text-sm font-bold">{selectedDayProgress.metrics.tomorrowFocus}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cumulative Metrics */}
          <div className="athletic-card p-6 pl-8">
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 gradient-electric" />
              <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
                Cumulative Metrics
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {detailedStats.map((stat, i) => (
                <div key={i} className="bg-secondary/50 p-2 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-secondary flex-shrink-0">
                      <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-black tracking-wider text-muted-foreground uppercase truncate">
                        {stat.label}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm sm:text-lg font-black">{stat.value}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-bold">
                          {stat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Message */}
          <div className="athletic-card p-6 pl-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary flex-shrink-0">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-wide mb-2">
                  {getProgressMessage(cumulativeStats.daysCompleted, totalDays)}
                </h4>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  {getProgressDescription(
                    cumulativeStats.daysCompleted,
                    cumulativeStats.totalPoints,
                    totalDays
                  )}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getProgressMessage(daysCompleted: number, totalDays: number): string {
  const pct = daysCompleted / totalDays;
  if (pct >= 1) return "Challenge Complete!";
  if (pct >= 0.83) return "Almost There!";
  if (pct >= 0.67) return "Final Stretch!";
  if (pct >= 0.5) return "Halfway Champion!";
  if (pct >= 0.33) return "Building Momentum!";
  if (pct >= 0.23) return "Week One Complete!";
  if (daysCompleted >= 3) return "Great Start!";
  return "Keep Going!";
}

function getProgressDescription(
  daysCompleted: number,
  totalPoints: number,
  totalDays: number
): string {
  const pct = daysCompleted / totalDays;
  const remaining = totalDays - daysCompleted;
  if (pct >= 1) {
    return `Congratulations! You've completed all ${totalDays} days with ${totalPoints.toLocaleString()} total points. Your metabolic transformation journey is complete!`;
  }
  if (pct >= 0.83) {
    return `You've completed ${daysCompleted} days with ${totalPoints.toLocaleString()} total points. Just ${remaining} more days to finish the challenge!`;
  }
  if (pct >= 0.5) {
    return `Incredible progress! You're over halfway through with ${totalPoints.toLocaleString()} points earned. Your metabolic habits are becoming second nature.`;
  }
  if (pct >= 0.23) {
    return `One week down! You've earned ${totalPoints.toLocaleString()} points so far. Keep this momentum going!`;
  }
  return `You've completed ${daysCompleted} day${daysCompleted === 1 ? "" : "s"} so far with ${totalPoints.toLocaleString()} points. Every day logged brings you closer to your metabolic transformation goals.`;
}
