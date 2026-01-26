/**
 * Clear Day Dialog
 *
 * Confirmation dialog for clearing all items from a day.
 * Supports clearing all items or filtering by type.
 */

"use client";

import { useState, useMemo } from "react";
import { useDelete } from "@refinedev/core";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TimelineItemType } from "@/lib/database.types";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

interface ClearDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dayNumber: number;
  items: ExtendedTimelineItem[];
}

/**
 * Dialog for clearing items from a day
 */
export function ClearDayDialog({
  isOpen,
  onClose,
  onSuccess,
  dayNumber,
  items,
}: ClearDayDialogProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineItemType>>(
    new Set(["meal", "supplement", "workout", "lifestyle"])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete mutation
  const deleteItem = useDelete();

  // Expand grouped items to get all underlying source IDs
  // For grouped items, we need to delete each underlying item, not just the group
  const expandedItems = useMemo(() => {
    const result: {
      type: TimelineItemType;
      sourceType: ExtendedTimelineItem["sourceType"];
      sourceId: string;
    }[] = [];

    for (const item of items) {
      if (item.isGrouped && item.groupedSourceIds) {
        // Expand grouped item to all underlying source IDs
        for (const sourceId of item.groupedSourceIds) {
          result.push({
            type: item.type,
            sourceType: item.sourceType,
            sourceId,
          });
        }
      } else {
        result.push({
          type: item.type,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
        });
      }
    }

    return result;
  }, [items]);

  // Count items by type (using expanded items)
  const itemsByType = useMemo(() => {
    const grouped: Record<TimelineItemType, typeof expandedItems> = {
      meal: [],
      supplement: [],
      workout: [],
      lifestyle: [],
    };
    for (const item of expandedItems) {
      grouped[item.type].push(item);
    }
    return grouped;
  }, [expandedItems]);

  // Items to be deleted based on selection (using expanded items)
  const itemsToDelete = useMemo(() => {
    return expandedItems.filter((item) => selectedTypes.has(item.type));
  }, [expandedItems, selectedTypes]);

  const toggleType = (type: TimelineItemType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleClear = async () => {
    if (itemsToDelete.length === 0) {
      toast.error("No items selected to delete");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map source type to resource name
      const sourceTypeToResource: Record<ExtendedTimelineItem["sourceType"], string> = {
        diet_plan: "diet_plans",
        supplement_plan: "supplement_plans",
        workout_plan: "workout_plans",
        lifestyle_activity_plan: "lifestyle_activity_plans",
      };

      // Delete each item
      const deletePromises = itemsToDelete.map((item) => {
        const resource = sourceTypeToResource[item.sourceType];
        return deleteItem.mutation.mutateAsync({
          resource,
          id: item.sourceId,
        });
      });

      await Promise.all(deletePromises);

      toast.success(`Cleared ${itemsToDelete.length} items from Day ${dayNumber}`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to clear items. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedTypes(new Set(["meal", "supplement", "workout", "lifestyle"]));
      onClose();
    }
  };

  const typeConfig: {
    type: TimelineItemType;
    label: string;
    colorClass: string;
  }[] = [
    { type: "meal", label: "Meals", colorClass: "text-orange-400" },
    { type: "supplement", label: "Supplements", colorClass: "text-green-400" },
    { type: "workout", label: "Workouts", colorClass: "text-blue-400" },
    { type: "lifestyle", label: "Lifestyle", colorClass: "text-purple-400" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card p-0">
        {/* Top accent - red for destructive action */}
        <div className="h-1 bg-destructive" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Clear Day <span className="text-destructive">{dayNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            This will permanently delete selected items from this day.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-destructive text-sm">Warning</p>
              <p className="text-xs text-muted-foreground mt-1">
                This action cannot be undone. The selected items will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              Select Items to Clear
            </Label>

            <div className="space-y-2">
              {typeConfig.map(({ type, label, colorClass }) => {
                const count = itemsByType[type].length;
                const isSelected = selectedTypes.has(type);
                const isDisabled = count === 0;

                return (
                  <label
                    key={type}
                    className={cn(
                      "flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded transition-colors",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-destructive/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected && !isDisabled}
                      onCheckedChange={() => !isDisabled && toggleType(type)}
                      disabled={isDisabled || isSubmitting}
                      className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                    <span className={cn("font-bold", colorClass)}>{label}</span>
                    <span className="text-muted-foreground text-sm ml-auto">
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-secondary/50 border border-border rounded">
            <p className="text-sm">
              <span className="font-bold text-destructive">{itemsToDelete.length}</span> items will
              be deleted
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
            onClick={handleClear}
            disabled={isSubmitting || itemsToDelete.length === 0}
            className={cn(
              "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground font-bold",
              (isSubmitting || itemsToDelete.length === 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Clear {itemsToDelete.length} Items</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
