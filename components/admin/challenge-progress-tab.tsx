"use client";

import { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import {
  Trophy,
  Flame,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Footprints,
  Droplets,
  Building2,
  Drumstick,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDaysSinceStart,
  calculateStreak,
  calculateCompletionPercent,
  calculateTotalPoints,
  buildDayProgressMap,
  getDateForDay,
  DEFAULT_CHALLENGE_DAYS,
} from "@/lib/challenge-utils";
import type { DayProgress } from "@/lib/challenge-utils";
import type { Profile, ChallengeProgress } from "@/lib/database.types";

interface ChallengeProgressTabProps {
  clientId: string;
  profile: Profile;
}

export function ChallengeProgressTab({ clientId, profile }: ChallengeProgressTabProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Fetch all challenge progress for this client
  const progressQuery = useList<ChallengeProgress>({
    resource: "challenge_progress",
    filters: [{ field: "user_id", operator: "eq", value: clientId }],
    sorters: [{ field: "day_number", order: "desc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!clientId,
    },
  });

  const progressRows = progressQuery.query.data?.data || [];
  const isLoading = progressQuery.query.isLoading;

  // Compute challenge parameters from profile
  const totalDays = profile.plan_duration_days || DEFAULT_CHALLENGE_DAYS;
  const startDate = profile.plan_start_date || profile.created_at?.split("T")[0] || "";

  // Build day progress map and compute stats
  const progress = useMemo(() => buildDayProgressMap(progressRows), [progressRows]);

  const currentDay = useMemo(() => getDaysSinceStart(startDate, totalDays), [startDate, totalDays]);

  const totalPoints = useMemo(() => calculateTotalPoints(progress), [progress]);
  const dayStreak = useMemo(() => calculateStreak(progress, currentDay), [progress, currentDay]);
  const completionPercent = useMemo(
    () => calculateCompletionPercent(progress, totalDays),
    [progress, totalDays]
  );
  const daysCompleted = useMemo(
    () => Object.values(progress).filter((p) => p.hasData).length,
    [progress]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="athletic-card p-6 pl-8 animate-pulse">
          <div className="h-4 w-48 bg-secondary mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-secondary/50 p-4">
                <div className="h-3 w-20 bg-secondary mb-2" />
                <div className="h-8 w-16 bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (progressRows.length === 0) {
    return (
      <div className="athletic-card p-8 pl-10 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-bold">No challenge data yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          This client hasn&apos;t logged any challenge progress
        </p>
      </div>
    );
  }

  // Build the day list (currentDay down to 1)
  const dayList: { dayNumber: number; entry: DayProgress | null; date: Date }[] = [];
  for (let d = currentDay; d >= 1; d--) {
    dayList.push({
      dayNumber: d,
      entry: progress[d] || null,
      date: getDateForDay(startDate, d),
    });
  }

  const stats = [
    {
      label: "Current Day",
      value: `${currentDay} / ${totalDays}`,
      icon: Calendar,
    },
    {
      label: "Total Points",
      value: totalPoints.toLocaleString(),
      icon: Trophy,
      highlight: totalPoints > 0,
    },
    {
      label: "Day Streak",
      value: dayStreak,
      icon: Flame,
      highlight: dayStreak >= 3,
    },
    {
      label: "Completion",
      value: `${completionPercent}%`,
      icon: Target,
    },
    {
      label: "Days Completed",
      value: daysCompleted,
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="athletic-card p-6 pl-8">
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">
          Challenge <span className="gradient-athletic">Stats</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-secondary/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 ${stat.highlight ? "bg-primary/20" : "bg-secondary"}`}>
                  <stat.icon
                    className={`h-4 w-4 ${
                      stat.highlight ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p
                className={`text-2xl font-black ${
                  stat.highlight ? "gradient-athletic" : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Log */}
      <div className="athletic-card p-6 pl-8">
        <h2 className="text-lg font-black uppercase tracking-tight mb-4">
          Daily <span className="gradient-athletic">Log</span>
        </h2>
        <div className="space-y-2">
          {dayList.map(({ dayNumber, entry, date }) => {
            const isExpanded = expandedDay === dayNumber;
            const hasData = entry?.hasData ?? false;
            const dateStr = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <div key={dayNumber} className="border border-border bg-card/50">
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : dayNumber)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  disabled={!hasData}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "px-3 py-1 text-sm font-black uppercase",
                        hasData
                          ? "gradient-electric text-black"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      Day {dayNumber}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasData ? (
                      <>
                        <span className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-bold uppercase">
                          {entry!.pointsEarned} pts
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs font-bold uppercase">
                        Missed
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded metrics */}
                {isExpanded && hasData && entry && (
                  <div className="border-t border-border p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <MetricCard
                        icon={Footprints}
                        label="Steps"
                        value={entry.metrics.steps.toLocaleString()}
                      />
                      <MetricCard
                        icon={Droplets}
                        label="Water"
                        value={`${entry.metrics.waterLiters}L`}
                      />
                      <MetricCard
                        icon={Building2}
                        label="Floors"
                        value={String(entry.metrics.floorsClimbed)}
                      />
                      <MetricCard
                        icon={Drumstick}
                        label="Protein"
                        value={`${entry.metrics.proteinGrams}g`}
                      />
                      <MetricCard
                        icon={Moon}
                        label="Sleep"
                        value={`${entry.metrics.sleepHours}h`}
                      />
                    </div>

                    {(entry.metrics.feeling || entry.metrics.tomorrowFocus) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entry.metrics.feeling && (
                          <div className="bg-secondary/50 p-4">
                            <p className="text-xs text-muted-foreground font-bold uppercase mb-2">
                              Feeling
                            </p>
                            <p className="text-sm">{entry.metrics.feeling}</p>
                          </div>
                        )}
                        {entry.metrics.tomorrowFocus && (
                          <div className="bg-secondary/50 p-4">
                            <p className="text-xs text-muted-foreground font-bold uppercase mb-2">
                              Tomorrow&apos;s Focus
                            </p>
                            <p className="text-sm">{entry.metrics.tomorrowFocus}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-secondary/50 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
      </div>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}
