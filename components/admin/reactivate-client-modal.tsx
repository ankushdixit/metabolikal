"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCcw } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReactivateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { plan_start_date: string; plan_duration_days: number }) => Promise<void>;
  client: Profile;
}

const DURATION_PRESETS = [7, 14, 21, 28, 30, 60, 90] as const;

const reactivateSchema = z.object({
  plan_start_date: z.string().min(1, "Start date is required"),
  plan_duration_days: z.number().int().min(1).max(365),
});

type ReactivateFormData = z.infer<typeof reactivateSchema>;

export function ReactivateClientModal({
  isOpen,
  onClose,
  onConfirm,
  client,
}: ReactivateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReactivateFormData>({
    resolver: zodResolver(reactivateSchema),
    defaultValues: {
      plan_start_date: today,
      plan_duration_days: 30,
    },
  });

  const currentDuration = watch("plan_duration_days");
  const isPreset = DURATION_PRESETS.includes(currentDuration as (typeof DURATION_PRESETS)[number]);

  const onSubmit = async (data: ReactivateFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await onConfirm(data);
      onClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to reactivate client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Reactivate <span className="gradient-athletic">Client</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            Set new plan details for {client.full_name || client.email}. A new plan cycle will be
            created. Previous data is preserved and can be viewed in plan history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
              {serverError}
            </div>
          )}

          {/* Plan Start Date */}
          <div>
            <Label
              htmlFor="plan_start_date"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block"
            >
              Plan Start Date
            </Label>
            <Input
              id="plan_start_date"
              type="date"
              {...register("plan_start_date")}
              className={cn(
                "bg-secondary border-border",
                errors.plan_start_date && "border-destructive"
              )}
              disabled={isSubmitting}
            />
            <p className="text-muted-foreground text-xs mt-1">When does Day 1 begin?</p>
            {errors.plan_start_date && (
              <p className="text-destructive text-xs mt-1 font-bold">
                {errors.plan_start_date.message}
              </p>
            )}
          </div>

          {/* Plan Duration */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Plan Duration
            </Label>
            <Select
              value={isPreset ? String(currentDuration) : "custom"}
              onValueChange={(val) => {
                if (val === "custom") {
                  setCustomDuration(String(currentDuration));
                } else {
                  setValue("plan_duration_days", parseInt(val), { shouldValidate: true });
                  setCustomDuration("");
                }
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_PRESETS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} days
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {(!isPreset || customDuration) && (
              <Input
                type="number"
                min={1}
                max={365}
                value={customDuration || currentDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setCustomDuration(e.target.value);
                  setValue("plan_duration_days", Math.min(365, Math.max(1, val)), {
                    shouldValidate: true,
                  });
                }}
                className="bg-secondary border-border mt-2"
                placeholder="Enter days (1-365)"
                disabled={isSubmitting}
              />
            )}
            {errors.plan_duration_days && (
              <p className="text-destructive text-xs mt-1 font-bold">
                {errors.plan_duration_days.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              disabled={isSubmitting}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black glow-power",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reactivating...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Reactivate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
