/**
 * Grouped Supplement Modal
 *
 * Modal for viewing and managing multiple supplements in a grouped time slot.
 * Allows adding, editing, and removing individual supplements within the group.
 */

"use client";

import { useState } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Pill, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SupplementPlanWithSupplement, ExtendedTimelineItem } from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

interface GroupedSupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (plan: SupplementPlanWithSupplement) => void;
  item: ExtendedTimelineItem | null;
}

/**
 * Format supplement details for display
 */
function formatSupplementDetails(plan: SupplementPlanWithSupplement): string {
  const dosage = plan.dosage || 1;
  const unit = plan.supplements?.dosage_unit || "unit";
  return `${dosage} ${unit}`;
}

/**
 * Modal for managing grouped supplement items
 */
export function GroupedSupplementModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  item,
}: GroupedSupplementModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invalidate = useInvalidate();
  const { mutateAsync: deletePlan } = useDelete();

  const groupedPlans = (item?.groupedItems as SupplementPlanWithSupplement[]) || [];

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deletePlan({
        resource: "supplement_plans",
        id: planId,
      });
      invalidate({
        resource: "supplement_plans",
        invalidates: ["list"],
      });
      toast.success("Supplement removed");

      // Close modal if this was the last item
      if (groupedPlans.length <= 1) {
        onClose();
      }
    } catch {
      toast.error("Failed to remove supplement");
    } finally {
      setDeletingId(null);
    }
  };

  if (!item) return null;

  const timeText = getSchedulingDisplayText(item.scheduling);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-green-500 to-green-600" />

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-400" />
            {item.title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>
              {item.itemCount} supplement{item.itemCount !== 1 ? "s" : ""}
            </span>
            <span>{timeText}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Supplements List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {groupedPlans.map((plan, index) => {
              const supplement = plan.supplements;
              const name = supplement?.name || "Unknown Supplement";
              const details = formatSupplementDetails(plan);
              const category = supplement?.category || "";
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
                    <p className="font-bold text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {details}
                      {category && ` | ${category}`}
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

          {/* Add Supplement Button */}
          <button
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded hover:border-green-500/50 hover:bg-green-500/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold text-sm">Add Supplement</span>
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
