"use client";

import { useState, useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Calendar, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface WorkoutLog {
  id: string;
  workout_plan_id: string | null;
  completed_at: string;
  workout_plans?: {
    exercise_name: string;
    day_number: number | null;
  } | null;
}

interface WorkoutPlanEntry {
  id: string;
  day_number: number | null;
  exercise_name: string;
}

interface DayHistory {
  date: string;
  dayNumber: number;
  completedCount: number;
  totalCount: number;
  exercises: string[];
}

/**
 * Workout History Page
 * Displays past workout completion records
 */
export default function WorkoutHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch workout logs for the past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const workoutLogsQuery = useList<WorkoutLog>({
    resource: "workout_logs",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "completed_at", operator: "gte", value: thirtyDaysAgo.toISOString() },
    ],
    meta: {
      select: "*, workout_plans(exercise_name, day_number)",
    },
    sorters: [{ field: "completed_at", order: "desc" }],
    pagination: {
      pageSize: 500,
    },
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Fetch all workout plans to calculate totals per day
  const workoutPlansQuery = useList<WorkoutPlanEntry>({
    resource: "workout_plans",
    filters: [{ field: "client_id", operator: "eq", value: userId }],
    pagination: {
      pageSize: 500,
    },
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Group logs by date and calculate completion percentages
  const historyByDay = useMemo(() => {
    const logs = workoutLogsQuery.query.data?.data || [];
    const plans = workoutPlansQuery.query.data?.data || [];

    // Calculate exercises per day number
    const exercisesPerDay: Record<number, number> = {};
    plans.forEach((plan) => {
      if (plan.day_number !== null) {
        exercisesPerDay[plan.day_number] = (exercisesPerDay[plan.day_number] || 0) + 1;
      }
    });

    // Group logs by date
    const byDate: Record<string, { logs: WorkoutLog[]; dayNumbers: Set<number> }> = {};

    logs.forEach((log) => {
      const date = new Date(log.completed_at).toISOString().split("T")[0];
      if (!byDate[date]) {
        byDate[date] = { logs: [], dayNumbers: new Set() };
      }
      byDate[date].logs.push(log);
      const dayNum = log.workout_plans?.day_number;
      if (dayNum !== null && dayNum !== undefined) {
        byDate[date].dayNumbers.add(dayNum);
      }
    });

    // Convert to array with completion stats
    const history: DayHistory[] = Object.entries(byDate).map(([date, { logs, dayNumbers }]) => {
      // Get the day number (use the first one found)
      const dayNumber = dayNumbers.size > 0 ? Array.from(dayNumbers)[0] : 0;

      // Total exercises for that day
      const totalCount = exercisesPerDay[dayNumber] || logs.length;
      const completedCount = logs.length;

      // Get exercise names
      const exercises = logs
        .map((log) => log.workout_plans?.exercise_name)
        .filter((name): name is string => !!name);

      return {
        date,
        dayNumber,
        completedCount,
        totalCount,
        exercises,
      };
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutLogsQuery.query.data, workoutPlansQuery.query.data]);

  const isLoading = workoutLogsQuery.query.isLoading || workoutPlansQuery.query.isLoading;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Workout <span className="gradient-athletic">History</span>
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Last 30 days</span>
              </div>
            </div>
          </div>

          {/* Back to Workout Link */}
          <Link
            href="/dashboard/workout"
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 gradient-electric text-black glow-power"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workout</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="athletic-card p-6 pl-8 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-secondary" />
                  <div className="h-3 w-48 bg-secondary" />
                </div>
                <div className="h-8 w-20 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && historyByDay.length === 0 && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">No History Yet</h3>
          <p className="text-muted-foreground font-bold mb-6">
            Complete your first workout to start tracking your progress.
          </p>
          <Link
            href="/dashboard/workout"
            className="btn-athletic inline-flex items-center gap-2 px-5 py-3 gradient-electric text-black glow-power"
          >
            <span>Start Today&apos;s Workout</span>
          </Link>
        </div>
      )}

      {/* History List */}
      {!isLoading && historyByDay.length > 0 && (
        <div className="space-y-3">
          {historyByDay.map((day) => {
            const percentage = Math.round((day.completedCount / day.totalCount) * 100);
            const isComplete = percentage >= 100;

            return (
              <div key={day.date} className="athletic-card p-6 pl-8">
                <div className="flex items-center justify-between gap-4">
                  {/* Date and Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black">{formatDate(day.date)}</h3>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 bg-secondary">
                        Day {day.dayNumber}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground truncate">
                      {day.exercises.slice(0, 3).join(", ")}
                      {day.exercises.length > 3 && ` +${day.exercises.length - 3} more`}
                    </p>
                  </div>

                  {/* Completion Badge */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2",
                      isComplete ? "bg-neon-green/10 border border-neon-green/30" : "bg-secondary"
                    )}
                  >
                    {isComplete && <CheckCircle className="h-4 w-4 text-neon-green" />}
                    <span
                      className={cn(
                        "text-lg font-black",
                        isComplete ? "text-neon-green" : "gradient-athletic"
                      )}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isComplete ? "bg-neon-green" : "gradient-electric"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                {/* Completion Count */}
                <div className="mt-2 text-xs font-bold text-muted-foreground">
                  {day.completedCount} / {day.totalCount} exercises completed
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
