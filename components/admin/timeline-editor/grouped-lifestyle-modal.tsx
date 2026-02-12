/**
 * Grouped Lifestyle Modal
 *
 * Modal for viewing and managing multiple lifestyle activities in a grouped time slot.
 * Allows adding, editing, and removing individual activities within the group.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Activity, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RenderIcon } from "@/components/admin/icon-selector";
import type {
  LifestyleActivityPlanWithType,
  ExtendedTimelineItem,
} from "@/hooks/use-timeline-data";
import { getSchedulingDisplayText } from "@/lib/utils/timeline";

/**
 * Check if a lifestyle plan matches the group criteria (timing)
 */
function planMatchesGroup(
  plan: LifestyleActivityPlanWithType,
  item: ExtendedTimelineItem
): boolean {
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

interface GroupedLifestyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
  onEditItem: (plan: LifestyleActivityPlanWithType) => void;
  item: ExtendedTimelineItem | null;
  /** Live lifestyle plans from the hook — used to keep the list fresh after add/delete */
  rawLifestyleActivityPlans?: LifestyleActivityPlanWithType[];
}

/**
 * Format lifestyle activity details for display
 */
function formatActivityDetails(plan: LifestyleActivityPlanWithType): string {
  const activityType = plan.lifestyle_activity_types;
  const targetValue = plan.target_value || activityType?.default_target_value;
  const targetUnit = activityType?.target_unit || "";

  if (targetValue && targetUnit) {
    return `Target: ${targetValue} ${targetUnit}`;
  }
  return "";
}

/**
 * Modal for managing grouped lifestyle activity items
 */
export function GroupedLifestyleModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  item,
  rawLifestyleActivityPlans,
}: GroupedLifestyleModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const invalidate = useInvalidate();
  const { mutateAsync: deletePlan } = useDelete();

  useEffect(() => {
    if (isOpen) setDeletedIds(new Set());
  }, [isOpen, item?.id]);

  // Derive items from live data when available, fall back to stale prop
  const groupedPlans = useMemo(() => {
    if (rawLifestyleActivityPlans && item) {
      return rawLifestyleActivityPlans
        .filter((p) => planMatchesGroup(p, item) && !deletedIds.has(p.id))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return ((item?.groupedItems as LifestyleActivityPlanWithType[]) || []).filter(
      (p) => !deletedIds.has(p.id)
    );
  }, [rawLifestyleActivityPlans, item, deletedIds]);

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      await deletePlan({
        resource: "lifestyle_activity_plans",
        id: planId,
      });
      invalidate({
        resource: "lifestyle_activity_plans",
        invalidates: ["list"],
      });
      toast.success("Activity removed");

      const newDeletedIds = new Set(deletedIds);
      newDeletedIds.add(planId);
      setDeletedIds(newDeletedIds);

      if (groupedPlans.length <= 1) {
        onClose();
      }
    } catch {
      toast.error("Failed to remove activity");
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
        <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600" />

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            {item.title}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>
              {groupedPlans.length} activit{groupedPlans.length !== 1 ? "ies" : "y"}
            </span>
            <span>{timeText}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Activities List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {groupedPlans.map((plan, index) => {
              const activityType = plan.lifestyle_activity_types;
              const name = activityType?.name || "Unknown Activity";
              const details = formatActivityDetails(plan);
              const category = activityType?.category || "";
              const icon = activityType?.icon;
              const isDeleting = deletingId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded border border-border group"
                >
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                    {index + 1}.
                  </span>

                  {icon && (
                    <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center shrink-0">
                      <RenderIcon icon={icon} className="h-4 w-4 text-purple-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {details}
                      {details && category && " | "}
                      {category}
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

          {/* Add Activity Button */}
          <button
            onClick={onAddItem}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold text-sm">Add Activity</span>
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
