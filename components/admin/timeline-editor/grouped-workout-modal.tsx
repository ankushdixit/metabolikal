/**
 * Grouped Workout Modal
 *
 * Modal for viewing and managing multiple exercises in a grouped workout session.
 * Allows adding, editing, removing, and reordering exercises within the session.
 */

"use client";

import { useState, useMemo } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Dumbbell, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WorkoutPlanWithExercise, ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

interface GroupedWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (plan: WorkoutPlanWithExercise) => void;
  item: ExtendedTimelineItem | null;
}

/**
 * Format exercise details for display
 */
function formatExerciseDetails(plan: WorkoutPlanWithExercise): string {
  const parts: string[] = [];

  if (plan.sets && plan.reps) {
    parts.push(`${plan.sets}x${plan.reps}`);
  }

  if (plan.duration_minutes) {
    parts.push(`${plan.duration_minutes} min`);
  }

  if (plan.rest_seconds && plan.rest_seconds > 0) {
    parts.push(`${plan.rest_seconds}s rest`);
  }

  return parts.join(" • ");
}

/**
 * Modal for managing grouped workout items
 */
export function GroupedWorkoutModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  item,
}: GroupedWorkoutModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invalidate = useInvalidate();
  const { mutateAsync: deletePlan } = useDelete();

  const groupedPlans = (item?.groupedItems as WorkoutPlanWithExercise[]) || [];

  // Calculate totals
  const totals = useMemo(() => {
    let totalDuration = 0;
    let totalSets = 0;

    for (const plan of groupedPlans) {
      totalDuration += plan.scheduled_duration_minutes || plan.duration_minutes || 5;
      totalSets += plan.sets || 0;
    }

    return {
      exercises: groupedPlans.length,
      duration: totalDuration,
      sets: totalSets,
    };
  }, [groupedPlans]);

  // Group exercises by section
  const exercisesBySection = useMemo(() => {
    const sections: Record<string, WorkoutPlanWithExercise[]> = {
      warmup: [],
      main: [],
      cooldown: [],
    };

    for (const plan of groupedPlans) {
      const section = plan.section || "main";
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(plan);
    }

    return sections;
  }, [groupedPlans]);

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deletePlan({
        resource: "workout_plans",
        id: planId,
      });
      invalidate({
        resource: "workout_plans",
        invalidates: ["list"],
      });
      toast.success("Exercise removed");

      // Close modal if this was the last item
      if (groupedPlans.length <= 1) {
        onClose();
      }
    } catch {
      toast.error("Failed to remove exercise");
    } finally {
      setDeletingId(null);
    }
  };

  if (!item) return null;

  const timeText = getSchedulingDisplayText(item.scheduling);

  const sectionLabels: Record<string, string> = {
    warmup: "Warm Up",
    main: "Main Workout",
    cooldown: "Cool Down",
  };

  const sectionColors: Record<string, string> = {
    warmup: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    main: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    cooldown: "text-green-400 border-green-500/30 bg-green-500/10",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-400" />
            {item.title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{totals.exercises} exercises</span>
            <span>~{totals.duration} min</span>
            <span>{timeText}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Totals Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-blue-500/10 rounded border border-blue-500/30">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{totals.exercises}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Exercises</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{totals.sets}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-400">~{totals.duration}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Minutes</p>
            </div>
          </div>

          {/* Exercises by Section */}
          {(["warmup", "main", "cooldown"] as const).map((section) => {
            const exercises = exercisesBySection[section];
            if (exercises.length === 0) return null;

            return (
              <div key={section}>
                <div
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-t border-b-0 inline-block",
                    sectionColors[section]
                  )}
                >
                  {sectionLabels[section]}
                </div>
                <div className="space-y-2 border border-border rounded-b rounded-tr p-2 bg-secondary/30">
                  {exercises.map((plan, index) => {
                    const exercise = plan.exercises;
                    const name = plan.exercise_name || exercise?.name || "Unknown Exercise";
                    const details = formatExerciseDetails(plan);
                    const isDeleting = deletingId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className="flex items-center gap-3 p-2 bg-card rounded border border-border group"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                          {index + 1}.
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{name}</p>
                          {details && <p className="text-xs text-muted-foreground">{details}</p>}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditItem(plan)}
                            className="p-1.5 hover:bg-primary/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            disabled={isDeleting}
                            className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                            title="Remove"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Exercise Button */}
          <button
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold text-sm">Add Exercise</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="p-6 pt-0 shrink-0">
          <button
            onClick={onClose}
            className="btn-athletic w-full px-4 py-3 bg-secondary text-foreground"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
