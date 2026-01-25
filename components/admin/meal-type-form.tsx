"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface MealTypeFormData {
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

interface MealTypeFormProps {
  register: UseFormRegister<MealTypeFormData>;
  errors: FieldErrors<MealTypeFormData>;
  watch: UseFormWatch<MealTypeFormData>;
  setValue: UseFormSetValue<MealTypeFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
  isEdit?: boolean;
}

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Meal Type Form Component
 * Reusable form for creating and editing meal types
 */
export function MealTypeForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
  isEdit = false,
}: MealTypeFormProps) {
  const isActive = watch("is_active");

  // Auto-generate slug from name when creating
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (!isEdit) {
      setValue("slug", generateSlug(newName));
    }
  };

  return (
    <div className="space-y-6">
      {/* Name - Required */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Meal Type Name <span className="text-primary">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Mid-Morning Snack"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("name", {
            onChange: handleNameChange,
          })}
        />
        {errors.name && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.name.message as string}</span>
          </div>
        )}
      </div>

      {/* Slug - Auto-generated or editable */}
      <div>
        <label
          htmlFor="slug"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Slug <span className="text-primary">*</span>
        </label>
        <input
          id="slug"
          type="text"
          placeholder="e.g., mid-morning-snack"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("slug")}
          readOnly={isEdit}
        />
        {!isEdit && (
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-generated from name. Used as unique identifier.
          </p>
        )}
        {errors.slug && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.slug.message as string}</span>
          </div>
        )}
      </div>

      {/* Display Order */}
      <div>
        <label
          htmlFor="display_order"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Display Order <span className="text-primary">*</span>
        </label>
        <input
          id="display_order"
          type="number"
          min="0"
          step="1"
          placeholder="e.g., 1"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("display_order", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Lower numbers appear first in the list.
        </p>
        {errors.display_order && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.display_order.message as string}</span>
          </div>
        )}
      </div>

      {/* Active Checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked === true)}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_active"
          className="flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <span>Active</span>
        </label>
        <span className="text-xs text-muted-foreground">
          (Inactive meal types are hidden from selection)
        </span>
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
