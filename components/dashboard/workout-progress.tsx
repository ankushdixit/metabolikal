"use client";

import { CheckCircle } from "lucide-react";

interface WorkoutProgressProps {
  completed: number;
  total: number;
  onMarkAllComplete?: () => void;
  isUpdating?: boolean;
}

/**
 * Workout progress indicator
 * Shows completion status and "Mark All Complete" button
 */
export function WorkoutProgress({
  completed,
  total,
  onMarkAllComplete,
  isUpdating = false,
}: WorkoutProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className="athletic-card p-6 pl-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Progress Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 gradient-electric" />
            <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
              Progress
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black gradient-athletic">{completed}</span>
            <span className="text-lg font-bold text-muted-foreground">/ {total} exercises</span>
          </div>
          <div className="mt-3 h-2 bg-secondary overflow-hidden w-full md:w-64">
            <div
              className="h-full bg-neon-green transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Mark All Complete Button */}
        {!isComplete && total > 0 && (
          <button
            onClick={onMarkAllComplete}
            disabled={isUpdating}
            className="btn-athletic flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isUpdating ? "Updating..." : "Mark All Complete"}</span>
          </button>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="flex items-center gap-3 px-5 py-3 bg-neon-green/10 border border-neon-green/30">
            <CheckCircle className="h-5 w-5 text-neon-green" />
            <span className="font-black uppercase tracking-wider text-neon-green">
              Workout complete! Great job!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
