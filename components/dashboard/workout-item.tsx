"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play, Timer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface WorkoutItemProps {
  id: string;
  exerciseName: string;
  sets: number | null;
  reps: number | null;
  durationMinutes: number | null;
  restSeconds: number;
  instructions: string | null;
  videoUrl: string | null;
  isCompleted: boolean;
  onToggleComplete: (id: string, completed: boolean) => void;
  isUpdating?: boolean;
}

/**
 * Individual exercise item component
 * Displays exercise details with expand/collapse functionality
 */
export function WorkoutItem({
  id,
  exerciseName,
  sets,
  reps,
  durationMinutes,
  restSeconds,
  instructions,
  videoUrl,
  isCompleted,
  onToggleComplete,
  isUpdating = false,
}: WorkoutItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (!isUpdating) {
      onToggleComplete(id, !isCompleted);
    }
  };

  // Format exercise details
  const exerciseDetails = () => {
    if (sets && reps) {
      return `${sets} sets × ${reps} reps`;
    }
    if (durationMinutes) {
      return `${durationMinutes} minutes`;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "athletic-card p-4 pl-6 transition-all duration-200",
        isCompleted && "opacity-70"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <Checkbox
          id={`exercise-${id}`}
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          className="h-5 w-5 border-2"
        />

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor={`exercise-${id}`}
            className={cn(
              "block text-base font-black cursor-pointer transition-all",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {exerciseName}
          </label>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {exerciseDetails() && (
              <span className="text-sm font-bold text-muted-foreground">{exerciseDetails()}</span>
            )}
            {restSeconds > 0 && (
              <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                <Timer className="h-3 w-3" />
                Rest: {restSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {(instructions || videoUrl) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-secondary hover:bg-secondary/80 transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (instructions || videoUrl) && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {/* Instructions */}
          {instructions && (
            <div className="text-sm font-medium text-muted-foreground leading-relaxed">
              {instructions}
            </div>
          )}

          {/* Video Link */}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-athletic inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
            >
              <Play className="h-4 w-4 text-primary" />
              <span>Watch Video</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
