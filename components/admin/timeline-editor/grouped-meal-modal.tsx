/**
 * Grouped Meal Modal
 *
 * Modal for viewing and managing multiple food items in a grouped meal.
 * Allows adding, editing, and removing individual food items within the meal.
 */

"use client";

import { useState, useMemo } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Utensils, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DietPlanWithFood, ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

interface GroupedMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (plan: DietPlanWithFood) => void;
  item: ExtendedTimelineItem | null;
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
}: GroupedMealModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invalidate = useInvalidate();
  const { mutateAsync: deletePlan } = useDelete();

  const groupedPlans = (item?.groupedItems as DietPlanWithFood[]) || [];

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

      // Close modal if this was the last item
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
      <DialogContent className="sm:max-w-lg bg-card p-0">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-400" />
            {item.title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{item.itemCount} items</span>
            <span>{timeText}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
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
                      {multiplier !== 1 && `${multiplier}x • `}
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
        <div className="p-6 pt-0">
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
