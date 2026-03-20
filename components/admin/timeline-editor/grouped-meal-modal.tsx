/**
 * Grouped Meal Modal
 *
 * Modal for viewing and managing multiple food items in a grouped meal.
 * Allows adding, editing, and removing individual food items within the meal.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Utensils, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DietPlanWithFood, ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";
import { formatQuantityDisplayWithEquivalent } from "@/lib/utils/quantity";

/**
 * Check if a diet plan matches the group criteria (meal category + timing)
 */
function planMatchesGroup(plan: DietPlanWithFood, item: ExtendedTimelineItem): boolean {
  // Match meal category from the first grouped item
  const targetCategory = (item.groupedItems as DietPlanWithFood[])?.[0]?.meal_category;
  if (plan.meal_category !== targetCategory) return false;

  const s = item.scheduling;
  if (plan.time_type !== s.time_type) return false;

  switch (s.time_type) {
    case "period":
      return plan.time_period === s.time_period;
    case "fixed":
      return plan.time_start === s.time_start;
    case "relative":
      return (
        plan.relative_anchor === s.relative_anchor &&
        (plan.relative_offset_minutes || 0) === (s.relative_offset_minutes || 0)
      );
    case "all_day":
      return true;
    default:
      return true;
  }
}

interface GroupedMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (plan: DietPlanWithFood) => void;
  item: ExtendedTimelineItem | null;
  /** Live diet plans from the hook — used to keep the list fresh after add/delete */
  rawDietPlans?: DietPlanWithFood[];
}

/**
 * Modal for managing grouped meal items
 */
export function GroupedMealModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  item,
  rawDietPlans,
}: GroupedMealModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const invalidate = useInvalidate();
  const { mutateAsync: deletePlan } = useDelete();

  // Reset deleted IDs when the modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setDeletedIds(new Set());
    }
  }, [isOpen, item?.id]);

  // Derive items from live data when available, fall back to stale prop
  const groupedPlans = useMemo(() => {
    if (rawDietPlans && item) {
      return rawDietPlans
        .filter((p) => planMatchesGroup(p, item) && !deletedIds.has(p.id))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return ((item?.groupedItems as DietPlanWithFood[]) || []).filter((p) => !deletedIds.has(p.id));
  }, [rawDietPlans, item, deletedIds]);

  // Calculate totals
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const plan of groupedPlans) {
      const multiplier = plan.serving_multiplier || 1;
      const food = plan.food_items;
      if (food) {
        calories += (food.calories || 0) * multiplier;
        protein += (food.protein || 0) * multiplier;
        carbs += (food.carbs || 0) * multiplier;
        fat += (food.fats || 0) * multiplier;
      }
    }

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    };
  }, [groupedPlans]);

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deletePlan({
        resource: "diet_plans",
        id: planId,
      });
      invalidate({
        resource: "diet_plans",
        invalidates: ["list"],
      });
      toast.success("Food item removed");

      // Track deletion locally for immediate UI update
      const newDeletedIds = new Set(deletedIds);
      newDeletedIds.add(planId);
      setDeletedIds(newDeletedIds);

      // Close modal if this was the last visible item
      if (groupedPlans.length <= 1) {
        onClose();
      }
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setDeletingId(null);
    }
  };

  if (!item) return null;

  const timeText = getSchedulingDisplayText(item.scheduling);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 flex flex-col overflow-hidden max-h-[85vh]">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600 shrink-0" />

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-400" />
            {item.title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>
              {groupedPlans.length} {groupedPlans.length === 1 ? "item" : "items"}
            </span>
            <span>{timeText}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Totals Summary */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-orange-500/10 rounded border border-orange-500/30">
            <div className="text-center">
              <p className="text-lg font-bold text-orange-400">{totals.calories}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{totals.protein}g</p>
              <p className="text-[10px] text-muted-foreground uppercase">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{totals.carbs}g</p>
              <p className="text-[10px] text-muted-foreground uppercase">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-400">{totals.fat}g</p>
              <p className="text-[10px] text-muted-foreground uppercase">Fat</p>
            </div>
          </div>

          {/* Food Items List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {groupedPlans.map((plan, index) => {
              const food = plan.food_items;
              const multiplier = plan.serving_multiplier || 1;
              const calories = Math.round((food?.calories || 0) * multiplier);
              const protein = Math.round((food?.protein || 0) * multiplier);
              const isDeleting = deletingId === plan.id;

              // Format quantity display with equivalent
              const quantityDisplay = formatQuantityDisplayWithEquivalent(
                plan.quantity_grams,
                plan.quantity_type,
                plan.quantity_note,
                food
              );

              return (
                <div
                  key={plan.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded border border-border group"
                >
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                    {index + 1}.
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{food?.name || "Unknown Food"}</p>
                    <p className="text-xs text-muted-foreground">
                      {quantityDisplay
                        ? `${quantityDisplay} • `
                        : multiplier !== 1
                          ? `${multiplier}x • `
                          : ""}
                      {calories} cal • {protein}g protein
                    </p>
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

          {/* Add Item Button */}
          <button
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold text-sm">Add Food Item</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="p-6 pt-4 border-t border-border shrink-0">
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
