"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useList, useCreate, useDelete } from "@refinedev/core";
import { Calendar, Flame, Coffee, History } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { WorkoutProgress, WorkoutSection } from "@/components/dashboard";
import type { WorkoutSection as WorkoutSectionType } from "@/lib/database.types";

interface Profile {
  full_name?: string;
  created_at?: string;
}

interface WorkoutPlanEntry {
  id: string;
  client_id: string;
  day_number: number | null;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  rest_seconds: number;
  instructions: string | null;
  video_url: string | null;
  section: WorkoutSectionType | null;
  display_order: number;
}

interface WorkoutLog {
  id: string;
  workout_plan_id: string | null;
  completed_at: string;
}

/**
 * Section order for display
 */
const SECTION_ORDER: WorkoutSectionType[] = ["warmup", "main", "cooldown"];

/**
 * Workout Plan Page
 * Displays daily workout with exercises grouped by section
 */
export default function WorkoutPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState(1);

  // Track optimistic updates for completion state
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // Get current user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  // Fetch profile to calculate day number
  const profileQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "id", operator: "eq", value: userId || "" }],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate day number from profile creation date (cycles through 7-day plan)
  useEffect(() => {
    const profile = profileQuery.query.data?.data?.[0];
    if (profile?.created_at) {
      const today = new Date();
      const startDate = new Date(profile.created_at);
      const totalDays =
        Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Cycle through 7-day plan: day 8 becomes day 1, day 15 becomes day 1, etc.
      const cyclicDay = ((totalDays - 1) % 7) + 1;
      setDayNumber(cyclicDay);
    }
  }, [profileQuery.query.data]);

  // Fetch workout plan for current day
  const workoutPlanQuery = useList<WorkoutPlanEntry>({
    resource: "workout_plans",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "day_number", operator: "eq", value: dayNumber },
    ],
    sorters: [
      { field: "section", order: "asc" },
      { field: "display_order", order: "asc" },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Calculate date range for today's workout logs
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Fetch today's workout logs
  const workoutLogsQuery = useList<WorkoutLog>({
    resource: "workout_logs",
    filters: [
      { field: "client_id", operator: "eq", value: userId },
      { field: "completed_at", operator: "gte", value: startOfToday.toISOString() },
      { field: "completed_at", operator: "lt", value: startOfTomorrow.toISOString() },
    ],
    queryOptions: {
      enabled: !!userId,
    },
  });

  // Sync optimistic state with server data
  useEffect(() => {
    const serverCompletedIds = new Set(
      (workoutLogsQuery.query.data?.data || [])
        .map((log) => log.workout_plan_id)
        .filter((id): id is string => id !== null)
    );
    setOptimisticCompletedIds(serverCompletedIds);
  }, [workoutLogsQuery.query.data]);

  // Mutations
  const createMutation = useCreate();
  const deleteMutation = useDelete();

  // Handle exercise completion toggle
  const handleToggleComplete = useCallback(
    (workoutPlanId: string, completed: boolean) => {
      if (!userId || pendingUpdates.has(workoutPlanId)) return;

      // Optimistic update
      setPendingUpdates((prev) => new Set(prev).add(workoutPlanId));
      setOptimisticCompletedIds((prev) => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.add(workoutPlanId);
        } else {
          newSet.delete(workoutPlanId);
        }
        return newSet;
      });

      if (completed) {
        // Create workout log
        createMutation.mutate(
          {
            resource: "workout_logs",
            values: {
              client_id: userId,
              workout_plan_id: workoutPlanId,
              completed_at: new Date().toISOString(),
            },
          },
          {
            onSuccess: () => {
              workoutLogsQuery.query.refetch();
              setPendingUpdates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(workoutPlanId);
                return newSet;
              });
            },
            onError: () => {
              // Revert optimistic update
              setOptimisticCompletedIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(workoutPlanId);
                return newSet;
              });
              setPendingUpdates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(workoutPlanId);
                return newSet;
              });
            },
          }
        );
      } else {
        // Find the log to delete
        const logToDelete = workoutLogsQuery.query.data?.data?.find(
          (log) => log.workout_plan_id === workoutPlanId
        );

        if (logToDelete) {
          deleteMutation.mutate(
            {
              resource: "workout_logs",
              id: logToDelete.id,
            },
            {
              onSuccess: () => {
                workoutLogsQuery.query.refetch();
                setPendingUpdates((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(workoutPlanId);
                  return newSet;
                });
              },
              onError: () => {
                // Revert optimistic update
                setOptimisticCompletedIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.add(workoutPlanId);
                  return newSet;
                });
                setPendingUpdates((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(workoutPlanId);
                  return newSet;
                });
              },
            }
          );
        }
      }
    },
    [userId, createMutation, deleteMutation, workoutLogsQuery.query, pendingUpdates]
  );

  // Handle "Mark All Complete"
  const handleMarkAllComplete = useCallback(() => {
    const exercises = workoutPlanQuery.query.data?.data || [];
    exercises.forEach((exercise) => {
      if (!optimisticCompletedIds.has(exercise.id)) {
        handleToggleComplete(exercise.id, true);
      }
    });
  }, [workoutPlanQuery.query.data, optimisticCompletedIds, handleToggleComplete]);

  // Group exercises by section
  const exercisesBySection = useMemo(() => {
    const exercises = workoutPlanQuery.query.data?.data || [];
    const grouped: Record<WorkoutSectionType, WorkoutPlanEntry[]> = {
      warmup: [],
      main: [],
      cooldown: [],
    };

    exercises.forEach((exercise) => {
      const section = exercise.section || "main";
      grouped[section].push(exercise);
    });

    return grouped;
  }, [workoutPlanQuery.query.data]);

  // Calculate totals
  const totalExercises = workoutPlanQuery.query.data?.data?.length || 0;
  const completedExercises = optimisticCompletedIds.size;

  // Format date
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isLoading = workoutPlanQuery.query.isLoading || profileQuery.query.isLoading;
  const isUpdating = createMutation.mutation.isPending || deleteMutation.mutation.isPending;

  // Check if it's a rest day (no exercises)
  const isRestDay = !isLoading && totalExercises === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              Today&apos;s <span className="gradient-athletic">Workout</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
                <Flame className="h-4 w-4 text-primary" />
                <span className="uppercase tracking-wider">Day {dayNumber}</span>
              </div>
            </div>
          </div>

          {/* View History Link */}
          <Link
            href="/dashboard/workout/history"
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground"
          >
            <History className="h-4 w-4" />
            <span>View History</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="athletic-card p-6 pl-8 animate-pulse">
            <div className="h-4 w-32 bg-secondary mb-4" />
            <div className="h-8 w-48 bg-secondary mb-4" />
            <div className="h-2 w-64 bg-secondary" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="athletic-card p-6 pl-8 animate-pulse">
              <div className="h-4 w-24 bg-secondary mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-secondary" />
                <div className="h-12 bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest Day State */}
      {isRestDay && (
        <div className="athletic-card p-8 pl-10 text-center">
          <div className="p-4 bg-secondary inline-block mb-4">
            <Coffee className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Rest Day!</h3>
          <p className="text-muted-foreground font-bold">
            No workout scheduled. Take this time to recover and prepare for tomorrow.
          </p>
        </div>
      )}

      {/* Workout Content */}
      {!isLoading && !isRestDay && (
        <>
          {/* Progress Indicator */}
          <WorkoutProgress
            completed={completedExercises}
            total={totalExercises}
            onMarkAllComplete={handleMarkAllComplete}
            isUpdating={isUpdating}
          />

          {/* Workout Sections */}
          <div className="space-y-6">
            {SECTION_ORDER.map((section) => (
              <WorkoutSection
                key={section}
                section={section}
                exercises={exercisesBySection[section]}
                completedIds={optimisticCompletedIds}
                onToggleComplete={handleToggleComplete}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
