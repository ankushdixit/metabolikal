/**
 * Daily Workout Section Component
 *
 * Displays the workout plan for a specific day, organized by section
 * (warmup, main, cooldown). Shows exercises with sets/reps or duration.
 */

"use client";

import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutSection } from "@/lib/database.types";
import type { WorkoutPlanWithExercise, WorkoutTotals } from "@/hooks/use-daily-plan-data";

interface DailyWorkoutSectionProps {
  workoutBySection: Map<WorkoutSection, WorkoutPlanWithExercise[]>;
  totals: WorkoutTotals;
  className?: string;
}

/**
 * Workout section labels for display
 */
const SECTION_LABELS: Record<WorkoutSection, string> = {
  warmup: "Warm-up",
  main: "Main Workout",
  cooldown: "Cool-down",
};

/**
 * Workout section display order
 */
const SECTION_ORDER: WorkoutSection[] = ["warmup", "main", "cooldown"];

/**
 * Format exercise details (sets/reps or duration)
 */
function formatExerciseDetails(workout: WorkoutPlanWithExercise): string {
  if (workout.sets && workout.reps) {
    return `${workout.sets}x${workout.reps}`;
  }
  if (workout.duration_minutes) {
    return `${workout.duration_minutes} min`;
  }
  if (workout.scheduled_duration_minutes) {
    return `${workout.scheduled_duration_minutes} min`;
  }
  return "—";
}

/**
 * Daily workout section component
 */
export function DailyWorkoutSection({
  workoutBySection,
  totals,
  className,
}: DailyWorkoutSectionProps) {
  const hasWorkouts = workoutBySection.size > 0;

  // Get sections in display order
  const orderedSections = SECTION_ORDER.filter((section) => workoutBySection.has(section));

  return (
    <div className={cn("athletic-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-tight">
          Work<span className="gradient-athletic">out</span>
        </h3>
      </div>

      {!hasWorkouts ? (
        <p className="text-muted-foreground text-sm font-bold text-center py-4">
          No workout planned
        </p>
      ) : (
        <div className="space-y-3">
          {/* Workout sections */}
          {orderedSections.map((section) => {
            const exercises = workoutBySection.get(section) || [];
            if (exercises.length === 0) return null;

            return (
              <div key={section} className="bg-secondary/30 p-3 rounded">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  {SECTION_LABELS[section]}
                </p>
                <div className="space-y-1">
                  {exercises.map((exercise) => {
                    const name =
                      exercise.exercise_name || exercise.exercises?.name || "Unknown Exercise";
                    const details = formatExerciseDetails(exercise);

                    return (
                      <div key={exercise.id} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2">{name}</span>
                        <span className="text-muted-foreground flex-shrink-0">{details}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-bold">
              <span className="text-primary">{totals.exerciseCount} exercises</span>
              {totals.totalDuration > 0 && (
                <>
                  {" | "}
                  <span className="text-primary">~{totals.totalDuration} min</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
