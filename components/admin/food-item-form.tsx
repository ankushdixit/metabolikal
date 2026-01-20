"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, Leaf } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MEAL_TYPES, type FoodItemFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface FoodItemFormProps {
  register: UseFormRegister<FoodItemFormData>;
  errors: FieldErrors<FoodItemFormData>;
  watch: UseFormWatch<FoodItemFormData>;
  setValue: UseFormSetValue<FoodItemFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * Food Item Form Component
 * Reusable form for creating and editing food items
 */
export function FoodItemForm({
  register,
  errors,
  watch,
  setValue,
  isSubmitting = false,
  onCancel,
  submitLabel,
}: FoodItemFormProps) {
  const isVegetarian = watch("is_vegetarian");
  const selectedMealTypes = (watch("meal_types") || []) as string[];

  const handleMealTypeToggle = (
    mealType: FoodItemFormData["meal_types"] extends (infer T)[] | null | undefined ? T : never
  ) => {
    const currentTypes = selectedMealTypes || [];
    const isSelected = currentTypes.includes(mealType);

    if (isSelected) {
      setValue(
        "meal_types",
        currentTypes.filter((t) => t !== mealType) as FoodItemFormData["meal_types"]
      );
    } else {
      setValue("meal_types", [...currentTypes, mealType] as FoodItemFormData["meal_types"]);
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
          Food Name <span className="text-primary">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g., Grilled Chicken Breast"
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

      {/* Nutritional Information Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-1 gradient-electric" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Nutritional Information
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Calories - Required */}
          <div>
            <label
              htmlFor="calories"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Calories <span className="text-primary">*</span>
            </label>
            <input
              id="calories"
              type="number"
              step="1"
              placeholder="165"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("calories", { valueAsNumber: true })}
            />
            {errors.calories && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.calories.message as string}</span>
              </div>
            )}
          </div>

          {/* Protein - Required */}
          <div>
            <label
              htmlFor="protein"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Protein (g) <span className="text-primary">*</span>
            </label>
            <input
              id="protein"
              type="number"
              step="0.1"
              placeholder="31"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("protein", { valueAsNumber: true })}
            />
            {errors.protein && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.protein.message as string}</span>
              </div>
            )}
          </div>

          {/* Carbs - Optional */}
          <div>
            <label
              htmlFor="carbs"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="number"
              step="0.1"
              placeholder="0"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("carbs", { valueAsNumber: true })}
            />
            {errors.carbs && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.carbs.message as string}</span>
              </div>
            )}
          </div>

          {/* Fats - Optional */}
          <div>
            <label
              htmlFor="fats"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Fats (g)
            </label>
            <input
              id="fats"
              type="number"
              step="0.1"
              placeholder="3.6"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("fats", { valueAsNumber: true })}
            />
            {errors.fats && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.fats.message as string}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Serving Size - Required */}
      <div>
        <label
          htmlFor="serving_size"
          className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-2"
        >
          Serving Size <span className="text-primary">*</span>
        </label>
        <input
          id="serving_size"
          type="text"
          placeholder="e.g., 100g, 1 cup, 1 medium"
          className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          {...register("serving_size")}
        />
        {errors.serving_size && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.serving_size.message as string}</span>
          </div>
        )}
      </div>

      {/* Vegetarian Checkbox */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_vegetarian"
          checked={isVegetarian || false}
          onCheckedChange={(checked) => setValue("is_vegetarian", checked === true)}
          className="h-5 w-5"
        />
        <label
          htmlFor="is_vegetarian"
          className="flex items-center gap-2 text-sm font-bold cursor-pointer"
        >
          <Leaf className="h-4 w-4 text-neon-green" />
          <span>Vegetarian</span>
        </label>
      </div>

      {/* Meal Types - Multi-select */}
      <div>
        <label className="block text-xs font-black tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Meal Types
        </label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((mealType) => {
            const isSelected = selectedMealTypes?.includes(mealType.value);
            return (
              <button
                key={mealType.value}
                type="button"
                onClick={() => handleMealTypeToggle(mealType.value)}
                className={cn(
                  "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                  isSelected
                    ? "gradient-electric text-black"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {mealType.label}
              </button>
            );
          })}
        </div>
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
