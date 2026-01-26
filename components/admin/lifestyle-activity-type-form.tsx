"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, FileText, CheckCircle2, Target, Activity } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LIFESTYLE_ACTIVITY_CATEGORIES,
  type LifestyleActivityTypeFormData,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { IconSelector } from "./icon-selector";

interface LifestyleActivityTypeFormProps {
  register: UseFormRegister<LifestyleActivityTypeFormData>;
  errors: FieldErrors<LifestyleActivityTypeFormData>;
  watch: UseFormWatch<LifestyleActivityTypeFormData>;
  setValue: UseFormSetValue<LifestyleActivityTypeFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Lifestyle Activity Type Form Component
 * Reusable form for creating and editing lifestyle activity types
 */
export function LifestyleActivityTypeForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: LifestyleActivityTypeFormProps) {
  const isActive = watch("is_active");
  const selectedCategory = watch("category");
  const selectedIcon = watch("icon");

  return (
    <div className="space-y-6">
      {/* Name - Required */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Activity Name <span className="text-primary">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Daily Steps, Sunlight Exposure, Gratitude Journaling"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("name")}
        />
        {errors.name && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.name.message as string}</span>
          </div>
        )}
      </div>

      {/* Category - Required */}
      <div>
        <label
          htmlFor="category"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Category <span className="text-primary">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LIFESTYLE_ACTIVITY_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setValue("category", category.value)}
                className={cn(
                  "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
        {errors.category && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.category.message as string}</span>
          </div>
        )}
      </div>

      {/* Icon Selector */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Icon
          </span>
        </div>
        <IconSelector value={selectedIcon} onChange={(value) => setValue("icon", value)} />
        {errors.icon && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.icon.message as string}</span>
          </div>
        )}
      </div>

      {/* Default Target Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Default Target
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Target Value */}
          <div>
            <label
              htmlFor="default_target_value"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Target Value
            </label>
            <input
              id="default_target_value"
              type="number"
              min="0"
              step="any"
              placeholder="e.g., 12000, 15, 8"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("default_target_value", { valueAsNumber: true })}
            />
            {errors.default_target_value && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.default_target_value.message as string}</span>
              </div>
            )}
          </div>

          {/* Target Unit */}
          <div>
            <label
              htmlFor="target_unit"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Target Unit
            </label>
            <input
              id="target_unit"
              type="text"
              placeholder="e.g., steps, minutes, glasses, hours"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("target_unit")}
            />
            {errors.target_unit && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.target_unit.message as string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Description
          </span>
        </div>
        <textarea
          id="description"
          rows={2}
          placeholder="Brief description of the activity..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          {...register("description")}
        />
        {errors.description && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.description.message as string}</span>
          </div>
        )}
      </div>

      {/* Rationale */}
      <div>
        <label
          htmlFor="rationale"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Rationale (Why)
        </label>
        <textarea
          id="rationale"
          rows={3}
          placeholder="Explain why this activity is beneficial for health and wellness..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          {...register("rationale")}
        />
        {errors.rationale && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.rationale.message as string}</span>
          </div>
        )}
      </div>

      {/* Active Checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_active"
          checked={isActive ?? true}
          onCheckedChange={(checked) => setValue("is_active", checked === true)}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_active"
          className="flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 text-neon-green" />
          <span>Active</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn-athletic px-6 py-3 bg-secondary text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-athletic flex-1 px-6 py-3 gradient-electric text-black glow-power disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
