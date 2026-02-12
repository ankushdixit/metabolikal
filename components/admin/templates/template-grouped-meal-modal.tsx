/**
 * Template Grouped Meal Modal
 *
 * Modal for viewing and managing multiple food items in a grouped meal within a template.
 * Adapted from GroupedMealModal for template items.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Utensils, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type {
  TemplateDietItemWithFood,
  ExtendedTemplateTimelineItem,
} from "@/hooks/use-template-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";
import { formatQuantityDisplayWithEquivalent } from "@/lib/utils/quantity";

/**
 * Check if a template diet item matches the group criteria (meal category + timing)
 */
function itemMatchesGroup(
  plan: TemplateDietItemWithFood,
  item: ExtendedTemplateTimelineItem
): boolean {
  const targetCategory = (item.groupedItems as TemplateDietItemWithFood[])?.[0]?.meal_category;
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

interface TemplateGroupedMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (item: TemplateDietItemWithFood) => void;
  item: ExtendedTemplateTimelineItem | null;
  /** Live diet items from the hook — used to keep the list fresh after add/delete */
  rawDietItems?: TemplateDietItemWithFood[];
}

/**
 * Modal for managing grouped template meal items
 */
export function TemplateGroupedMealModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  item,
  rawDietItems,
}: TemplateGroupedMealModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const invalidate = useInvalidate();
  const { mutateAsync: deleteItem } = useDelete();

  // Reset deleted IDs when the modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setDeletedIds(new Set());
    }
  }, [isOpen, item?.id]);

  // Derive items from live data when available, fall back to stale prop
  const groupedItems = useMemo(() => {
    if (rawDietItems && item) {
      return rawDietItems
        .filter((p) => itemMatchesGroup(p, item) && !deletedIds.has(p.id))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return ((item?.groupedItems as TemplateDietItemWithFood[]) || []).filter(
      (p) => !deletedIds.has(p.id)
    );
  }, [rawDietItems, item, deletedIds]);

  // Calculate totals
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const templateItem of groupedItems) {
      const multiplier = templateItem.serving_multiplier || 1;
      const food = templateItem.food_items;
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
  }, [groupedItems]);

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await deleteItem({
        resource: "template_diet_items",
        id: itemId,
      });
      invalidate({
        resource: "template_diet_items",
        invalidates: ["list"],
      });
      toast.success("Food item removed");

      // Track deletion locally for immediate UI update
      const newDeletedIds = new Set(deletedIds);
      newDeletedIds.add(itemId);
      setDeletedIds(newDeletedIds);

      // Close modal if this was the last visible item
      if (groupedItems.length <= 1) {
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
            <span>
              {groupedItems.length} {groupedItems.length === 1 ? "item" : "items"}
            </span>
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
            {groupedItems.map((templateItem, index) => {
              const food = templateItem.food_items;
              const multiplier = templateItem.serving_multiplier || 1;
              const calories = Math.round((food?.calories || 0) * multiplier);
              const protein = Math.round((food?.protein || 0) * multiplier);
              const isDeleting = deletingId === templateItem.id;

              // Format quantity display with equivalent
              const quantityDisplay = formatQuantityDisplayWithEquivalent(
                templateItem.quantity_grams,
                templateItem.quantity_type,
                templateItem.quantity_note,
                food
              );

              return (
                <div
                  key={templateItem.id}
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
                      onClick={() => onEditItem(templateItem)}
                      className="p-1.5 hover:bg-primary/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(templateItem.id)}
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
