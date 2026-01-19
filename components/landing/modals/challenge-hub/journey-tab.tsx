"use client";

import { Flame, Trophy, Footprints, Droplets, Building2, Beef, Moon, Calendar } from "lucide-react";

interface JourneyTabProps {
  dayStreak: number;
  totalPoints: number;
  cumulativeStats: {
    totalSteps: number;
    totalWater: number;
    totalFloors: number;
    totalProtein: number;
    totalSleepHours: number;
    daysCompleted: number;
  };
}

export function JourneyTab({ dayStreak, totalPoints, cumulativeStats }: JourneyTabProps) {
  const isNewUser = cumulativeStats.daysCompleted === 0;

  const stats = [
    {
      icon: Flame,
      label: "Day Streak",
      value: dayStreak,
      unit: "days",
      color: "text-orange-500",
    },
    {
      icon: Trophy,
      label: "Total Points",
      value: totalPoints.toLocaleString(),
      unit: "pts",
      color: "text-primary",
    },
    {
      icon: Calendar,
      label: "Days Completed",
      value: cumulativeStats.daysCompleted,
      unit: "/ 30",
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
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-1 gradient-electric" />
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          Your Journey So Far
        </h3>
      </div>

      {isNewUser ? (
        /* New User Encouragement */
        <div className="athletic-card p-6 pl-8 text-center">
          <div className="p-4 bg-secondary w-fit mx-auto mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-xl font-black uppercase tracking-tight mb-3">
            Your Journey <span className="gradient-athletic">Begins Today!</span>
          </h4>
          <p className="text-muted-foreground font-bold text-sm max-w-md mx-auto mb-4">
            You haven&apos;t logged any days yet. Complete today&apos;s tasks to start building your
            streak and earning points towards your metabolic transformation.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary">
            <span className="text-xs font-black tracking-wider text-muted-foreground uppercase">
              Day 1 Awaits
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="athletic-card p-4 pl-6 text-center">
                <div className="p-2 bg-secondary w-fit mx-auto mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                  {stat.unit}
                </div>
                <div className="text-xs font-bold text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Detailed Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 gradient-electric" />
              <h4 className="text-xs font-black tracking-[0.15em] text-muted-foreground uppercase">
                Cumulative Metrics
              </h4>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {detailedStats.map((stat, i) => (
                <div key={i} className="athletic-card p-4 pl-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-secondary flex-shrink-0">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                        {stat.label}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black">{stat.value}</span>
                        <span className="text-xs text-muted-foreground font-bold">{stat.unit}</span>
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
                  {getProgressMessage(cumulativeStats.daysCompleted, dayStreak)}
                </h4>
                <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                  {getProgressDescription(cumulativeStats.daysCompleted, dayStreak, totalPoints)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getProgressMessage(daysCompleted: number, streak: number): string {
  if (daysCompleted >= 25) return "Almost There!";
  if (daysCompleted >= 20) return "Final Stretch!";
  if (daysCompleted >= 15) return "Halfway Champion!";
  if (daysCompleted >= 10) return "Building Momentum!";
  if (daysCompleted >= 7) return "Week One Complete!";
  if (streak >= 5) return "Streak Master!";
  if (streak >= 3) return "Consistency King!";
  if (daysCompleted >= 3) return "Great Start!";
  return "Keep Going!";
}

function getProgressDescription(daysCompleted: number, streak: number, points: number): string {
  if (daysCompleted >= 25) {
    return `You've completed ${daysCompleted} days with ${points.toLocaleString()} total points. Just ${30 - daysCompleted} more days to finish the challenge!`;
  }
  if (daysCompleted >= 15) {
    return `Incredible progress! You're over halfway through with a ${streak}-day streak. Your metabolic habits are becoming second nature.`;
  }
  if (daysCompleted >= 7) {
    return `One week down! You've earned ${points.toLocaleString()} points so far. Keep this momentum going into week two.`;
  }
  if (streak >= 3) {
    return `Your ${streak}-day streak shows real commitment. Consistency is the key to lasting metabolic transformation.`;
  }
  return `You've completed ${daysCompleted} day${daysCompleted === 1 ? "" : "s"} so far. Every day you log brings you closer to your metabolic transformation goals.`;
}
