/**
 * Supplement Item Form
 *
 * Form for adding/editing supplement items on the timeline.
 * Allows selecting supplement from database, timing, and dosage.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { Search, Loader2, Pill, X } from "lucide-react";
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
import type { Supplement, SupplementPlan, SupplementPlanInsert } from "@/lib/database.types";

interface SupplementItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  editItem?: SupplementPlan & { supplements?: Supplement | null };
}

/**
 * Form for adding/editing supplement items
 */
export function SupplementItemForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  dayNumber,
  editItem,
}: SupplementItemFormProps) {
  const isEditing = !!editItem;

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [dosage, setDosage] = useState(1);
  const [notes, setNotes] = useState("");
  const [timing, setTiming] = useState<TimingValues>({
    timeType: "relative",
    timeStart: null,
    timeEnd: null,
    timePeriod: null,
    relativeAnchor: "breakfast",
    relativeOffsetMinutes: 0,
  });

  // Reset form when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedSupplement(editItem?.supplements || null);
      setDosage(editItem?.dosage || editItem?.supplements?.default_dosage || 1);
      setNotes(editItem?.notes || "");
      setTiming({
        timeType: editItem?.time_type || "relative",
        timeStart: editItem?.time_start || null,
        timeEnd: editItem?.time_end || null,
        timePeriod: editItem?.time_period || null,
        relativeAnchor: editItem?.relative_anchor || "breakfast",
        relativeOffsetMinutes: editItem?.relative_offset_minutes || 0,
      });
    }
  }, [isOpen, editItem]);

  // Fetch supplements
  const supplementsQuery = useList<Supplement>({
    resource: "supplements",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { pageSize: 500 },
    sorters: [{ field: "name", order: "asc" }],
  });

  const supplements = supplementsQuery.query.data?.data || [];

  // Filter supplements based on search
  const filteredSupplements = useMemo(() => {
    if (!searchQuery) return supplements.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return supplements.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
  }, [supplements, searchQuery]);

  // Mutations
  const createMutation = useCreate<SupplementPlan>();
  const updateMutation = useUpdate<SupplementPlan>();

  const isSubmitting = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  // When supplement is selected, update dosage to default
  const handleSelectSupplement = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    if (!isEditing) {
      setDosage(supplement.default_dosage);
    }
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplement) {
      toast.error("Please select a supplement");
      return;
    }

    const data: SupplementPlanInsert = {
      client_id: clientId,
      supplement_id: selectedSupplement.id,
      day_number: dayNumber,
      dosage: dosage,
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
          resource: "supplement_plans",
          id: editItem.id,
          values: data,
        });
        toast.success("Supplement updated successfully");
      } else {
        await createMutation.mutation.mutateAsync({
          resource: "supplement_plans",
          values: data,
        });
        toast.success("Supplement added successfully");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update supplement" : "Failed to add supplement");
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
        {/* Top accent - green for supplements */}
        <div className="h-1 bg-green-500" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-400" />
            {isEditing ? "Edit" : "Add"} <span className="text-green-400">Supplement</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {isEditing
              ? "Update the supplement details below."
              : "Add a supplement to the timeline for this day."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Supplement Search & Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Supplement *
              </Label>

              {selectedSupplement ? (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{selectedSupplement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSupplement.category} | Default: {selectedSupplement.default_dosage}{" "}
                      {selectedSupplement.dosage_unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSupplement(null)}
                    className="p-1 hover:bg-secondary rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search supplements..."
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-border rounded">
                    {supplementsQuery.query.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredSupplements.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No supplements found
                      </div>
                    ) : (
                      filteredSupplements.map((supp) => (
                        <button
                          key={supp.id}
                          type="button"
                          onClick={() => handleSelectSupplement(supp)}
                          className="w-full p-3 text-left hover:bg-secondary/50 border-b border-border last:border-b-0 transition-colors"
                        >
                          <p className="font-bold text-sm">{supp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {supp.category} | {supp.default_dosage} {supp.dosage_unit}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dosage */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Dosage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={dosage}
                  onChange={(e) => setDosage(Number(e.target.value) || 1)}
                  disabled={isSubmitting}
                  className="w-24 bg-secondary border-border"
                />
                <span className="text-sm text-muted-foreground font-bold">
                  {selectedSupplement?.dosage_unit || "unit(s)"}
                </span>
              </div>
            </div>

            {/* Timing */}
            <TimingSelector
              values={timing}
              onChange={setTiming}
              showAllDay={false}
              disabled={isSubmitting}
            />

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
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
              disabled={isSubmitting || !selectedSupplement}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-black font-bold",
                (isSubmitting || !selectedSupplement) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Update Supplement" : "Add Supplement"}</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
