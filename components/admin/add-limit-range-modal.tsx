"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientPlanLimits } from "@/hooks/use-client-plan-limits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientPlanLimit } from "@/lib/database.types";

interface AddLimitRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  editingLimit?: ClientPlanLimit | null;
}

// Form data type definition
interface LimitRangeFormData {
  start_date: string;
  end_date: string;
  max_calories_per_day: number;
  min_protein_per_day: number;
  max_protein_per_day?: number | null;
  min_carbs_per_day?: number | null;
  max_carbs_per_day?: number | null;
  min_fats_per_day?: number | null;
  max_fats_per_day?: number | null;
  notes?: string | null;
}

// Helper to transform empty string or coerce to number, returning null for empty
const optionalCoerceNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
  z.number().nullable().optional()
);

// Form validation schema
const limitRangeSchema = z
  .object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    max_calories_per_day: z.coerce.number().min(1, "Max calories must be greater than 0"),
    min_protein_per_day: z.coerce.number().min(1, "Min protein must be greater than 0"),
    max_protein_per_day: optionalCoerceNumber,
    min_carbs_per_day: optionalCoerceNumber,
    max_carbs_per_day: optionalCoerceNumber,
    min_fats_per_day: optionalCoerceNumber,
    max_fats_per_day: optionalCoerceNumber,
    notes: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  )
  .refine(
    (data) => {
      if (data.max_protein_per_day !== null && data.max_protein_per_day !== undefined) {
        return data.max_protein_per_day >= data.min_protein_per_day;
      }
      return true;
    },
    {
      message: "Max protein must be >= min protein",
      path: ["max_protein_per_day"],
    }
  )
  .refine(
    (data) => {
      if (
        data.max_carbs_per_day !== null &&
        data.max_carbs_per_day !== undefined &&
        data.min_carbs_per_day !== null &&
        data.min_carbs_per_day !== undefined
      ) {
        return data.max_carbs_per_day >= data.min_carbs_per_day;
      }
      return true;
    },
    {
      message: "Max carbs must be >= min carbs",
      path: ["max_carbs_per_day"],
    }
  )
  .refine(
    (data) => {
      if (
        data.max_fats_per_day !== null &&
        data.max_fats_per_day !== undefined &&
        data.min_fats_per_day !== null &&
        data.min_fats_per_day !== undefined
      ) {
        return data.max_fats_per_day >= data.min_fats_per_day;
      }
      return true;
    },
    {
      message: "Max fats must be >= min fats",
      path: ["max_fats_per_day"],
    }
  );

/**
 * Modal for adding or editing a macro limit range
 */
export function AddLimitRangeModal({
  isOpen,
  onClose,
  clientId,
  editingLimit,
}: AddLimitRangeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { createLimitRange, updateLimitRange, getUnavailableDates, hasOverlap } =
    useClientPlanLimits({ clientId });

  const isEditing = !!editingLimit;

  // Get unavailable dates (excluding the current limit if editing)
  const unavailableDates = useMemo(() => {
    return getUnavailableDates(editingLimit?.id);
  }, [getUnavailableDates, editingLimit?.id]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LimitRangeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(limitRangeSchema) as any,
    defaultValues: {
      start_date: "",
      end_date: "",
      max_calories_per_day: 2000,
      min_protein_per_day: 100,
      max_protein_per_day: null,
      min_carbs_per_day: null,
      max_carbs_per_day: null,
      min_fats_per_day: null,
      max_fats_per_day: null,
      notes: "",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  // Reset form when modal opens/closes or editing limit changes
  useEffect(() => {
    if (isOpen) {
      if (editingLimit) {
        reset({
          start_date: editingLimit.start_date,
          end_date: editingLimit.end_date,
          max_calories_per_day: editingLimit.max_calories_per_day,
          min_protein_per_day: editingLimit.min_protein_per_day,
          max_protein_per_day: editingLimit.max_protein_per_day,
          min_carbs_per_day: editingLimit.min_carbs_per_day,
          max_carbs_per_day: editingLimit.max_carbs_per_day,
          min_fats_per_day: editingLimit.min_fats_per_day,
          max_fats_per_day: editingLimit.max_fats_per_day,
          notes: editingLimit.notes || "",
        });
      } else {
        reset({
          start_date: "",
          end_date: "",
          max_calories_per_day: 2000,
          min_protein_per_day: 100,
          max_protein_per_day: null,
          min_carbs_per_day: null,
          max_carbs_per_day: null,
          min_fats_per_day: null,
          max_fats_per_day: null,
          notes: "",
        });
      }
      setServerError(null);
    }
  }, [isOpen, editingLimit, reset]);

  // Check for date overlap when dates change
  const hasDateOverlap = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    return hasOverlap(start, end, editingLimit?.id);
  }, [startDate, endDate, hasOverlap, editingLimit?.id]);

  const handleFormSubmit = async (data: LimitRangeFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Clean up the data - convert empty strings to null
      const cleanedData = {
        ...data,
        max_protein_per_day: data.max_protein_per_day || null,
        min_carbs_per_day: data.min_carbs_per_day || null,
        max_carbs_per_day: data.max_carbs_per_day || null,
        min_fats_per_day: data.min_fats_per_day || null,
        max_fats_per_day: data.max_fats_per_day || null,
        notes: data.notes || null,
      };

      if (isEditing && editingLimit) {
        await updateLimitRange(editingLimit.id, cleanedData);
      } else {
        await createLimitRange(cleanedData);
      }

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  // Check if a date string is unavailable
  const isDateUnavailable = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T00:00:00");
    return unavailableDates.some(
      (d) => d.toISOString().split("T")[0] === date.toISOString().split("T")[0]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isEditing ? "Edit" : "Add"} Macro{" "}
            <span className="gradient-athletic">Limit Range</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Set calorie and macro limits for a specific date range.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 space-y-4 flex-1 overflow-y-auto"
        >
          {/* Server Error */}
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
              {serverError}
            </div>
          )}

          {/* Date Range Overlap Warning */}
          {hasDateOverlap && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-bold">
              This date range overlaps with an existing range
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="start_date"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Start Date *
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
                className={cn(
                  "bg-secondary border-border",
                  errors.start_date && "border-destructive",
                  isDateUnavailable(startDate) && "border-amber-500"
                )}
                disabled={isSubmitting}
              />
              {errors.start_date && (
                <p className="text-destructive text-xs mt-1 font-bold">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="end_date"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                End Date *
              </Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
                min={startDate || undefined}
                className={cn(
                  "bg-secondary border-border",
                  errors.end_date && "border-destructive",
                  isDateUnavailable(endDate) && "border-amber-500"
                )}
                disabled={isSubmitting}
              />
              {errors.end_date && (
                <p className="text-destructive text-xs mt-1 font-bold">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Required Section */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Required
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Max Calories */}
              <div>
                <Label
                  htmlFor="max_calories_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Max Calories/Day *
                </Label>
                <div className="relative">
                  <Input
                    id="max_calories_per_day"
                    type="number"
                    min={1}
                    {...register("max_calories_per_day")}
                    className={cn(
                      "bg-secondary border-border pr-10",
                      errors.max_calories_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    cal
                  </span>
                </div>
                {errors.max_calories_per_day && (
                  <p className="text-destructive text-xs mt-1 font-bold">
                    {errors.max_calories_per_day.message}
                  </p>
                )}
              </div>

              {/* Min Protein */}
              <div>
                <Label
                  htmlFor="min_protein_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Min Protein/Day *
                </Label>
                <div className="relative">
                  <Input
                    id="min_protein_per_day"
                    type="number"
                    min={1}
                    {...register("min_protein_per_day")}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.min_protein_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {errors.min_protein_per_day && (
                  <p className="text-destructive text-xs mt-1 font-bold">
                    {errors.min_protein_per_day.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Optional Section */}
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Optional
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Max Protein */}
              <div>
                <Label
                  htmlFor="max_protein_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Max Protein/Day
                </Label>
                <div className="relative">
                  <Input
                    id="max_protein_per_day"
                    type="number"
                    min={0}
                    {...register("max_protein_per_day", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.max_protein_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {errors.max_protein_per_day && (
                  <p className="text-destructive text-xs mt-1 font-bold">
                    {errors.max_protein_per_day.message}
                  </p>
                )}
              </div>

              {/* Min Carbs */}
              <div>
                <Label
                  htmlFor="min_carbs_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Min Carbs/Day
                </Label>
                <div className="relative">
                  <Input
                    id="min_carbs_per_day"
                    type="number"
                    min={0}
                    {...register("min_carbs_per_day", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.min_carbs_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
              </div>

              {/* Max Carbs */}
              <div>
                <Label
                  htmlFor="max_carbs_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Max Carbs/Day
                </Label>
                <div className="relative">
                  <Input
                    id="max_carbs_per_day"
                    type="number"
                    min={0}
                    {...register("max_carbs_per_day", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.max_carbs_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {errors.max_carbs_per_day && (
                  <p className="text-destructive text-xs mt-1 font-bold">
                    {errors.max_carbs_per_day.message}
                  </p>
                )}
              </div>

              {/* Min Fats */}
              <div>
                <Label
                  htmlFor="min_fats_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Min Fats/Day
                </Label>
                <div className="relative">
                  <Input
                    id="min_fats_per_day"
                    type="number"
                    min={0}
                    {...register("min_fats_per_day", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.min_fats_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
              </div>

              {/* Max Fats */}
              <div>
                <Label
                  htmlFor="max_fats_per_day"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Max Fats/Day
                </Label>
                <div className="relative">
                  <Input
                    id="max_fats_per_day"
                    type="number"
                    min={0}
                    {...register("max_fats_per_day", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className={cn(
                      "bg-secondary border-border pr-6",
                      errors.max_fats_per_day && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {errors.max_fats_per_day && (
                  <p className="text-destructive text-xs mt-1 font-bold">
                    {errors.max_fats_per_day.message}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <Label
                htmlFor="notes"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Notes
              </Label>
              <textarea
                id="notes"
                {...register("notes")}
                placeholder="e.g., Cutting phase, Bulking phase, Maintenance..."
                className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-16"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasDateOverlap}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black glow-power",
                (isSubmitting || hasDateOverlap) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  <span>{isEditing ? "Update Range" : "Create Range"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
