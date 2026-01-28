"use client";

import { FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AlertCircle, Leaf, Loader2, Scale, Ban, ArrowLeftRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMealTypes } from "@/hooks/use-meal-types";
import { AlertTriangle } from "lucide-react";
import { ConditionSelector } from "./condition-selector";
import { FoodAlternativesSelector } from "./food-alternatives-selector";
import { type FoodItemFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface FoodItemFormProps {
  register: UseFormRegister<FoodItemFormData>;
  errors: FieldErrors<FoodItemFormData>;
  watch: UseFormWatch<FoodItemFormData>;
  setValue: UseFormSetValue<FoodItemFormData>;
  isSubmitting?: boolean;
  onCancel: () => void;
  submitLabel: string;
  foodItemId?: string; // For edit mode - exclude current item from alternatives
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
  foodItemId,
}: FoodItemFormProps) {
  const isVegetarian = watch("is_vegetarian");
  const selectedMealTypes = (watch("meal_types") || []) as string[];
  const selectedConditionIds = (watch("avoid_for_conditions") || []) as string[];
  const selectedAlternativeIds = (watch("alternative_food_ids") || []) as string[];

  // Fetch meal types from database - NO FALLBACK
  const {
    mealTypes: dbMealTypes,
    isLoading: isLoadingMealTypes,
    error: mealTypesError,
  } = useMealTypes();

  // Use database meal types directly
  const mealTypes: { value: string; label: string }[] = dbMealTypes.map((mt) => ({
    value: mt.slug,
    label: mt.name,
  }));

  const handleMealTypeToggle = (mealType: string) => {
    const currentTypes = selectedMealTypes || [];
    const isSelected = currentTypes.includes(mealType);

    if (isSelected) {
      setValue(
        "meal_types",
        currentTypes.filter((t) => t !== mealType)
      );
    } else {
      setValue("meal_types", [...currentTypes, mealType]);
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

      {/* Quantity Information */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Quantity Information
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Track raw and cooked quantities for accurate meal planning (e.g., 100g raw chicken = 75g
          cooked)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Raw Quantity */}
          <div>
            <label
              htmlFor="raw_quantity"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Raw Quantity
            </label>
            <input
              id="raw_quantity"
              type="text"
              placeholder="e.g., 100g raw"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("raw_quantity")}
            />
            {errors.raw_quantity && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.raw_quantity.message as string}</span>
              </div>
            )}
          </div>

          {/* Cooked Quantity */}
          <div>
            <label
              htmlFor="cooked_quantity"
              className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2"
            >
              Cooked Quantity
            </label>
            <input
              id="cooked_quantity"
              type="text"
              placeholder="e.g., 75g cooked"
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("cooked_quantity")}
            />
            {errors.cooked_quantity && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.cooked_quantity.message as string}</span>
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
        {isLoadingMealTypes ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-bold">Loading meal types...</span>
          </div>
        ) : mealTypesError ? (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded">
            <div className="flex items-center gap-2 text-destructive text-sm font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>Failed to load meal types</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Please ensure the database is running and seeded.
            </p>
          </div>
        ) : mealTypes.length === 0 ? (
          <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded">
            <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>No meal types found</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Please seed the database with meal types.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((mealType: { value: string; label: string }) => {
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
        )}
      </div>

      {/* Avoid For Conditions */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Ban className="h-5 w-5 text-red-500" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Avoid For Conditions
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select medical conditions that should avoid this food
        </p>
        <ConditionSelector
          selectedConditionIds={selectedConditionIds}
          onChange={(conditionIds) => setValue("avoid_for_conditions", conditionIds)}
        />
      </div>

      {/* Alternatives */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-muted-foreground">
            Alternatives
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Add food items that can substitute for this one in diet plans
        </p>
        <FoodAlternativesSelector
          selectedFoodIds={selectedAlternativeIds}
          excludeFoodId={foodItemId}
          onChange={(foodIds) => setValue("alternative_food_ids", foodIds)}
        />
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
