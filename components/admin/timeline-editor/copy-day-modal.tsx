/**
 * Copy Day Modal
 *
 * Modal for copying all items from one day to multiple other days.
 * Supports additive copy or replace existing items.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useCreate } from "@refinedev/core";
import { Copy, Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type {
  DietPlan,
  SupplementPlan,
  WorkoutPlan,
  LifestyleActivityPlan,
} from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { formatDayDate, isToday } from "@/lib/utils/plan-dates";

type CopyMode = "add" | "replace";

interface CopyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  sourceDay: number;
  // Raw plan data for complete field copying
  dietPlans: DietPlan[];
  supplementPlans: SupplementPlan[];
  workoutPlans: WorkoutPlan[];
  lifestylePlans: LifestyleActivityPlan[];
  totalDays?: number;
  planStartDate?: Date | null;
}

/**
 * Modal for copying items to other days
 */
export function CopyDayModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  sourceDay,
  dietPlans,
  supplementPlans,
  workoutPlans,
  lifestylePlans,
  totalDays = 7,
  planStartDate = null,
}: CopyDayModalProps) {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [copyMode, setCopyMode] = useState<CopyMode>("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected days when modal opens (but NOT copyMode - let user's choice persist during session)
  useEffect(() => {
    if (isOpen) {
      setSelectedDays(new Set());
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Create mutations for each resource type
  const { mutateAsync: createDietPlan } = useCreate();
  const { mutateAsync: createSupplementPlan } = useCreate();
  const { mutateAsync: createWorkoutPlan } = useCreate();
  const { mutateAsync: createLifestylePlan } = useCreate();

  // Count items by type
  const itemCounts = useMemo(() => {
    return {
      meal: dietPlans.length,
      supplement: supplementPlans.length,
      workout: workoutPlans.length,
      lifestyle: lifestylePlans.length,
    };
  }, [dietPlans, supplementPlans, workoutPlans, lifestylePlans]);

  const totalItems =
    dietPlans.length + supplementPlans.length + workoutPlans.length + lifestylePlans.length;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const selectAllDays = () => {
    setSelectedDays(new Set(days.filter((d) => d !== sourceDay)));
  };

  const clearSelection = () => {
    setSelectedDays(new Set());
  };

  const handleCopy = async () => {
    if (selectedDays.size === 0) {
      toast.error("Please select at least one target day");
      return;
    }

    setIsSubmitting(true);

    try {
      const targetDays = Array.from(selectedDays);
      const supabase = createBrowserSupabaseClient();

      // Log and show toast to confirm mode
      console.log("=== COPY OPERATION ===");
      console.log("Mode:", copyMode);
      console.log("Target days:", targetDays);
      console.log("Items to copy:", totalItems);

      if (copyMode === "replace") {
        toast.info(`Replace mode: Deleting existing items first...`);
      }

      // Process each target day
      for (const targetDay of targetDays) {
        // For replace mode, delete existing items on target day first
        if (copyMode === "replace") {
          console.log(
            `REPLACE MODE: Deleting existing items on day ${targetDay} for client ${clientId}...`
          );

          // Fetch existing item IDs first
          const { data: dietIds } = await supabase
            .from("diet_plans")
            .select("id")
            .eq("client_id", clientId)
            .eq("day_number", targetDay);

          const { data: supplementIds } = await supabase
            .from("supplement_plans")
            .select("id")
            .eq("client_id", clientId)
            .eq("day_number", targetDay);

          const { data: workoutIds } = await supabase
            .from("workout_plans")
            .select("id")
            .eq("client_id", clientId)
            .eq("day_number", targetDay);

          const { data: lifestyleIds } = await supabase
            .from("lifestyle_activity_plans")
            .select("id")
            .eq("client_id", clientId)
            .eq("day_number", targetDay);

          const allIds = {
            diet: dietIds || [],
            supplement: supplementIds || [],
            workout: workoutIds || [],
            lifestyle: lifestyleIds || [],
          };

          console.log("Found items to delete:", {
            diet: allIds.diet.length,
            supplement: allIds.supplement.length,
            workout: allIds.workout.length,
            lifestyle: allIds.lifestyle.length,
          });

          // Delete by IDs using Supabase .in() for each table
          if (allIds.diet.length > 0) {
            const ids = allIds.diet.map((i) => i.id);
            const { error } = await supabase.from("diet_plans").delete().in("id", ids);
            if (error) {
              console.error("Failed to delete diet_plans:", error);
              throw error;
            }
            console.log(`Deleted ${ids.length} diet plans`);
          }

          if (allIds.supplement.length > 0) {
            const ids = allIds.supplement.map((i) => i.id);
            const { error } = await supabase.from("supplement_plans").delete().in("id", ids);
            if (error) {
              console.error("Failed to delete supplement_plans:", error);
              throw error;
            }
            console.log(`Deleted ${ids.length} supplement plans`);
          }

          if (allIds.workout.length > 0) {
            const ids = allIds.workout.map((i) => i.id);
            const { error } = await supabase.from("workout_plans").delete().in("id", ids);
            if (error) {
              console.error("Failed to delete workout_plans:", error);
              throw error;
            }
            console.log(`Deleted ${ids.length} workout plans`);
          }

          if (allIds.lifestyle.length > 0) {
            const ids = allIds.lifestyle.map((i) => i.id);
            const { error } = await supabase
              .from("lifestyle_activity_plans")
              .delete()
              .in("id", ids);
            if (error) {
              console.error("Failed to delete lifestyle_activity_plans:", error);
              throw error;
            }
            console.log(`Deleted ${ids.length} lifestyle plans`);
          }

          const totalDeleted =
            allIds.diet.length +
            allIds.supplement.length +
            allIds.workout.length +
            allIds.lifestyle.length;
          console.log(
            `REPLACE MODE: Successfully deleted ${totalDeleted} items from day ${targetDay}`
          );
        }

        // Copy diet plans with all fields (including display_order for ordering)
        for (const plan of dietPlans) {
          await createDietPlan({
            resource: "diet_plans",
            values: {
              client_id: clientId,
              day_number: targetDay,
              food_item_id: plan.food_item_id,
              meal_category: plan.meal_category,
              serving_multiplier: plan.serving_multiplier,
              time_type: plan.time_type,
              time_start: plan.time_start,
              time_end: plan.time_end,
              time_period: plan.time_period,
              relative_anchor: plan.relative_anchor,
              relative_offset_minutes: plan.relative_offset_minutes,
              notes: plan.notes,
              display_order: plan.display_order,
            },
          });
        }

        // Copy supplement plans with all fields
        for (const plan of supplementPlans) {
          await createSupplementPlan({
            resource: "supplement_plans",
            values: {
              client_id: clientId,
              day_number: targetDay,
              supplement_id: plan.supplement_id,
              dosage: plan.dosage,
              time_type: plan.time_type,
              time_start: plan.time_start,
              time_end: plan.time_end,
              time_period: plan.time_period,
              relative_anchor: plan.relative_anchor,
              relative_offset_minutes: plan.relative_offset_minutes,
              notes: plan.notes,
              is_active: plan.is_active ?? true,
              display_order: plan.display_order,
            },
          });
        }

        // Copy workout plans with all fields
        for (const plan of workoutPlans) {
          await createWorkoutPlan({
            resource: "workout_plans",
            values: {
              client_id: clientId,
              day_number: targetDay,
              exercise_id: plan.exercise_id,
              exercise_name: plan.exercise_name,
              section: plan.section,
              sets: plan.sets,
              reps: plan.reps,
              duration_minutes: plan.duration_minutes,
              scheduled_duration_minutes: plan.scheduled_duration_minutes,
              rest_seconds: plan.rest_seconds,
              time_type: plan.time_type,
              time_start: plan.time_start,
              time_end: plan.time_end,
              time_period: plan.time_period,
              relative_anchor: plan.relative_anchor,
              relative_offset_minutes: plan.relative_offset_minutes,
              instructions: plan.instructions,
              display_order: plan.display_order,
            },
          });
        }

        // Copy lifestyle activity plans with all fields
        for (const plan of lifestylePlans) {
          await createLifestylePlan({
            resource: "lifestyle_activity_plans",
            values: {
              client_id: clientId,
              day_number: targetDay,
              activity_type_id: plan.activity_type_id,
              target_value: plan.target_value,
              time_type: plan.time_type,
              time_start: plan.time_start,
              time_end: plan.time_end,
              time_period: plan.time_period,
              relative_anchor: plan.relative_anchor,
              relative_offset_minutes: plan.relative_offset_minutes,
              notes: plan.notes,
              is_active: plan.is_active ?? true,
              display_order: plan.display_order,
            },
          });
        }
      }

      const dayText = selectedDays.size === 1 ? "day" : "days";
      const modeText = copyMode === "replace" ? "Replaced and copied" : "Copied";
      toast.success(`${modeText} ${totalItems} items to ${selectedDays.size} ${dayText}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy items. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedDays(new Set());
      setCopyMode("add");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card p-0">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copy Day <span className="gradient-athletic">{sourceDay}</span> To...
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Select target days to copy {totalItems} items.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Day Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Target Days
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              className={cn(
                "grid gap-2",
                totalDays <= 7
                  ? "grid-cols-7"
                  : totalDays <= 14
                    ? "grid-cols-7"
                    : "grid-cols-5 sm:grid-cols-7"
              )}
            >
              {days.map((day) => {
                const isSource = day === sourceDay;
                const isSelected = selectedDays.has(day);
                const dateLabel = formatDayDate(planStartDate, day);
                const isTodayDay = planStartDate ? isToday(planStartDate, day) : false;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isSource && toggleDay(day)}
                    disabled={isSource || isSubmitting}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded border transition-all text-sm font-bold p-1",
                      isSource
                        ? "bg-primary/20 border-primary/50 text-primary cursor-not-allowed"
                        : isSelected
                          ? "bg-primary border-primary text-black"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50",
                      isTodayDay &&
                        !isSource &&
                        !isSelected &&
                        "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                  >
                    <span>Day</span>
                    <span className="text-lg">{day}</span>
                    {dateLabel && (
                      <span
                        className={cn(
                          "text-[9px] font-medium",
                          isSelected
                            ? "text-black/70"
                            : isSource
                              ? "text-primary/70"
                              : "text-muted-foreground"
                        )}
                      >
                        {dateLabel}
                      </span>
                    )}
                    {isSource && <span className="text-[10px]">(source)</span>}
                    {isSelected && <Check className="h-3 w-3 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copy Mode */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              Copy Mode
            </Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="copyMode"
                  value="add"
                  checked={copyMode === "add"}
                  onChange={() => setCopyMode("add")}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    copyMode === "add" ? "border-primary" : "border-muted-foreground"
                  )}
                >
                  {copyMode === "add" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-bold text-sm">Add to existing</p>
                  <p className="text-xs text-muted-foreground">
                    Keep existing items and add new ones
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded cursor-pointer hover:border-destructive/50 transition-colors">
                <input
                  type="radio"
                  name="copyMode"
                  value="replace"
                  checked={copyMode === "replace"}
                  onChange={() => setCopyMode("replace")}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    copyMode === "replace" ? "border-destructive" : "border-muted-foreground"
                  )}
                >
                  {copyMode === "replace" && (
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">Replace existing</p>
                  <p className="text-xs text-muted-foreground">Clear target days before copying</p>
                </div>
              </label>
            </div>
          </div>

          {/* Replace Mode Warning */}
          {copyMode === "replace" && selectedDays.size > 0 && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-destructive text-sm">Warning</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All existing items on{" "}
                  {selectedDays.size === 1
                    ? "the selected day"
                    : `${selectedDays.size} selected days`}{" "}
                  will be permanently deleted before copying.
                </p>
              </div>
            </div>
          )}

          {/* Item Summary */}
          <div className="p-3 bg-secondary/50 border border-border rounded">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Items to copy
            </p>
            <p className="text-sm">
              <span className="font-bold">{totalItems}</span> items (
              {itemCounts.meal > 0 && (
                <span className="text-orange-400">{itemCounts.meal} meals</span>
              )}
              {itemCounts.meal > 0 && itemCounts.supplement > 0 && ", "}
              {itemCounts.supplement > 0 && (
                <span className="text-green-400">{itemCounts.supplement} suppl.</span>
              )}
              {(itemCounts.meal > 0 || itemCounts.supplement > 0) && itemCounts.workout > 0 && ", "}
              {itemCounts.workout > 0 && (
                <span className="text-blue-400">{itemCounts.workout} workout</span>
              )}
              {(itemCounts.meal > 0 || itemCounts.supplement > 0 || itemCounts.workout > 0) &&
                itemCounts.lifestyle > 0 &&
                ", "}
              {itemCounts.lifestyle > 0 && (
                <span className="text-purple-400">{itemCounts.lifestyle} lifestyle</span>
              )}
              )
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={isSubmitting || selectedDays.size === 0 || totalItems === 0}
            className={cn(
              "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black font-bold",
              (isSubmitting || selectedDays.size === 0 || totalItems === 0) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Copying...</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>
                  Copy to {selectedDays.size} Day{selectedDays.size !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
