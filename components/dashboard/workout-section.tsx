"use client";

import { Flame, Target, Wind } from "lucide-react";
import type { WorkoutSection as WorkoutSectionType } from "@/lib/database.types";
import { WorkoutItem } from "./workout-item";

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  rest_seconds: number;
  instructions: string | null;
  video_url: string | null;
}

interface WorkoutSectionProps {
  section: WorkoutSectionType;
  exercises: WorkoutExercise[];
  completedIds: Set<string>;
  onToggleComplete: (id: string, completed: boolean) => void;
  isUpdating?: boolean;
}

/**
 * Section labels and icons
 */
const SECTION_CONFIG: Record<
  WorkoutSectionType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  warmup: { label: "Warmup", icon: Flame },
  main: { label: "Main Workout", icon: Target },
  cooldown: { label: "Cooldown", icon: Wind },
};

/**
 * Workout section component
 * Groups exercises by section with header
 */
export function WorkoutSection({
  section,
  exercises,
  completedIds,
  onToggleComplete,
  isUpdating = false,
}: WorkoutSectionProps) {
  const config = SECTION_CONFIG[section];
  const Icon = config.icon;

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-secondary">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
          {config.label}
        </h3>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold text-muted-foreground uppercase">
          {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Exercise Items */}
      <div className="space-y-2">
        {exercises.map((exercise) => (
          <WorkoutItem
            key={exercise.id}
            id={exercise.id}
            exerciseName={exercise.exercise_name}
            sets={exercise.sets}
            reps={exercise.reps}
            durationMinutes={exercise.duration_minutes}
            restSeconds={exercise.rest_seconds}
            instructions={exercise.instructions}
            videoUrl={exercise.video_url}
            isCompleted={completedIds.has(exercise.id)}
            onToggleComplete={onToggleComplete}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}

export { SECTION_CONFIG };
