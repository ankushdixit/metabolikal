/**
 * Lifestyle Item Form
 *
 * Form for adding/editing lifestyle activity items on the timeline.
 * Allows selecting activity type from database, timing, and target value.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { Search, Loader2, Activity, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimingSelector, type TimingValues } from "./timing-selector";
import { RenderIcon } from "@/components/admin/icon-selector";
import type {
  LifestyleActivityType,
  LifestyleActivityPlan,
  LifestyleActivityPlanInsert,
} from "@/lib/database.types";

interface LifestyleItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  editItem?: LifestyleActivityPlan & { lifestyle_activity_types?: LifestyleActivityType | null };
}

/**
 * Form for adding/editing lifestyle activity items
 */
export function LifestyleItemForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  dayNumber,
  editItem,
}: LifestyleItemFormProps) {
  const isEditing = !!editItem;

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<LifestyleActivityType | null>(null);
  const [targetValue, setTargetValue] = useState<number | "">("");
  const [customRationale, setCustomRationale] = useState("");
  const [notes, setNotes] = useState("");
  const [timing, setTiming] = useState<TimingValues>({
    timeType: "all_day",
    timeStart: null,
    timeEnd: null,
    timePeriod: null,
    relativeAnchor: null,
    relativeOffsetMinutes: 0,
  });

  // Reset form when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedActivity(editItem?.lifestyle_activity_types || null);
      setTargetValue(
        editItem?.target_value || editItem?.lifestyle_activity_types?.default_target_value || ""
      );
      setCustomRationale(editItem?.custom_rationale || "");
      setNotes(editItem?.notes || "");
      setTiming({
        timeType: editItem?.time_type || "all_day",
        timeStart: editItem?.time_start || null,
        timeEnd: editItem?.time_end || null,
        timePeriod: editItem?.time_period || null,
        relativeAnchor: editItem?.relative_anchor || null,
        relativeOffsetMinutes: editItem?.relative_offset_minutes || 0,
      });
    }
  }, [isOpen, editItem]);

  // Fetch lifestyle activity types
  const activityTypesQuery = useList<LifestyleActivityType>({
    resource: "lifestyle_activity_types",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { pageSize: 500 },
    sorters: [
      { field: "category", order: "asc" },
      { field: "name", order: "asc" },
    ],
  });

  const activityTypes = activityTypesQuery.query.data?.data || [];

  // Filter activity types based on search
  const filteredActivityTypes = useMemo(() => {
    if (!searchQuery) return activityTypes.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return activityTypes
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
      )
      .slice(0, 20);
  }, [activityTypes, searchQuery]);

  // Group by category for display
  const groupedActivityTypes = useMemo(() => {
    const groups = new Map<string, LifestyleActivityType[]>();
    for (const activity of filteredActivityTypes) {
      const existing = groups.get(activity.category) || [];
      existing.push(activity);
      groups.set(activity.category, existing);
    }
    return groups;
  }, [filteredActivityTypes]);

  // Mutations
  const createMutation = useCreate<LifestyleActivityPlan>();
  const updateMutation = useUpdate<LifestyleActivityPlan>();

  const isSubmitting = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  // When activity is selected, populate defaults
  const handleSelectActivity = (activity: LifestyleActivityType) => {
    setSelectedActivity(activity);
    if (!isEditing && activity.default_target_value) {
      setTargetValue(activity.default_target_value);
    }
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedActivity) {
      toast.error("Please select an activity type");
      return;
    }

    const data: LifestyleActivityPlanInsert = {
      client_id: clientId,
      activity_type_id: selectedActivity.id,
      day_number: dayNumber,
      target_value: targetValue || null,
      custom_rationale: customRationale || null,
      notes: notes || null,
      time_type: timing.timeType,
      time_start: timing.timeStart,
      time_end: timing.timeEnd,
      time_period: timing.timePeriod,
      relative_anchor: timing.relativeAnchor,
      relative_offset_minutes: timing.relativeOffsetMinutes,
      is_active: true,
    };

    try {
      if (isEditing && editItem) {
        await updateMutation.mutation.mutateAsync({
          resource: "lifestyle_activity_plans",
          id: editItem.id,
          values: data,
        });
        toast.success("Activity updated successfully");
      } else {
        await createMutation.mutation.mutateAsync({
          resource: "lifestyle_activity_plans",
          values: data,
        });
        toast.success("Activity added successfully");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update activity" : "Failed to add activity");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent - purple for lifestyle */}
        <div className="h-1 bg-purple-500" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            {isEditing ? "Edit" : "Add"} <span className="text-purple-400">Lifestyle</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {isEditing
              ? "Update the lifestyle activity details below."
              : "Add a lifestyle activity to the timeline for this day."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Activity Type Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Activity Type *
              </Label>

              {selectedActivity ? (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedActivity.icon && (
                        <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                          <RenderIcon
                            icon={selectedActivity.icon}
                            className="h-4 w-4 text-purple-400"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-foreground">{selectedActivity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedActivity.category}
                          {selectedActivity.default_target_value &&
                            ` | Default: ${selectedActivity.default_target_value} ${selectedActivity.target_unit || ""}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedActivity.rationale && (
                    <p className="text-xs text-muted-foreground mt-2 pl-11">
                      {selectedActivity.rationale}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search activities..."
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-border rounded">
                    {activityTypesQuery.query.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : groupedActivityTypes.size === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No activities found
                      </div>
                    ) : (
                      Array.from(groupedActivityTypes.entries()).map(([category, activities]) => (
                        <div key={category}>
                          <div className="px-3 py-2 bg-secondary/50 text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0">
                            {category}
                          </div>
                          {activities.map((activity) => (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={() => handleSelectActivity(activity)}
                              className="w-full p-3 text-left hover:bg-secondary/50 border-b border-border last:border-b-0 transition-colors flex items-center gap-3"
                            >
                              {activity.icon && (
                                <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center shrink-0">
                                  <RenderIcon
                                    icon={activity.icon}
                                    className="h-4 w-4 text-muted-foreground"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm">{activity.name}</p>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Target Value */}
            {selectedActivity?.target_unit && (
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Target Value
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : "")}
                    disabled={isSubmitting}
                    className="w-32 bg-secondary border-border"
                  />
                  <span className="text-sm text-muted-foreground font-bold">
                    {selectedActivity.target_unit}
                  </span>
                </div>
              </div>
            )}

            {/* Timing */}
            <TimingSelector
              values={timing}
              onChange={setTiming}
              showAllDay={true}
              disabled={isSubmitting}
            />

            {/* Custom Rationale */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Custom Rationale (optional)
              </Label>
              <textarea
                value={customRationale}
                onChange={(e) => setCustomRationale(e.target.value)}
                placeholder="Why this activity is important for the client..."
                disabled={isSubmitting}
                className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20 rounded"
              />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional instructions..."
                disabled={isSubmitting}
                className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20 rounded"
              />
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
              type="submit"
              disabled={isSubmitting || !selectedActivity}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-black font-bold",
                (isSubmitting || !selectedActivity) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Update Activity" : "Add Activity"}</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
