"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, Pill, FileText, Info, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SUPPLEMENT_CATEGORIES, type SupplementFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface SupplementFormProps {
  register: UseFormRegister<SupplementFormData>;
  errors: FieldErrors<SupplementFormData>;
  watch: UseFormWatch<SupplementFormData>;
  setValue: UseFormSetValue<SupplementFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Supplement Form Component
 * Reusable form for creating and editing supplements
 */
export function SupplementForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: SupplementFormProps) {
  const isActive = watch("is_active");
  const selectedCategory = watch("category");

  return (
    <div className="space-y-6">
      {/* Name - Required */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Supplement Name <span className="text-primary">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Fish Oil, Vitamin D3"
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
          {SUPPLEMENT_CATEGORIES.map((category) => {
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

      {/* Dosage Information */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Pill className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Dosage Information
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Dosage - Required */}
          <div>
            <label
              htmlFor="default_dosage"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Default Dosage <span className="text-primary">*</span>
            </label>
            <input
              id="default_dosage"
              type="number"
              step="0.1"
              placeholder="e.g., 2, 500, 1000"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("default_dosage", { valueAsNumber: true })}
            />
            {errors.default_dosage && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.default_dosage.message as string}</span>
              </div>
            )}
          </div>

          {/* Dosage Unit - Required */}
          <div>
            <label
              htmlFor="dosage_unit"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Dosage Unit <span className="text-primary">*</span>
            </label>
            <input
              id="dosage_unit"
              type="text"
              placeholder="e.g., capsule, tablet, mg, g, ml, IU"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("dosage_unit")}
            />
            {errors.dosage_unit && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.dosage_unit.message as string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions - Optional */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Instructions
          </span>
        </div>
        <textarea
          id="instructions"
          rows={3}
          placeholder="e.g., Take with food to improve absorption..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          {...register("instructions")}
        />
        {errors.instructions && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.instructions.message as string}</span>
          </div>
        )}
      </div>

      {/* Notes - Optional */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Info className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Notes
          </span>
        </div>
        <textarea
          id="notes"
          rows={3}
          placeholder="Additional notes about this supplement..."
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          {...register("notes")}
        />
        {errors.notes && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.notes.message as string}</span>
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
