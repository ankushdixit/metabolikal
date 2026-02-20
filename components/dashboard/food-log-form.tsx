"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MealCategory, QuantityType } from "@/lib/database.types";
import { getMealLabel } from "@/lib/utils/meal-labels";
import {
  calculateMultiplier,
  getDefaultQuantityType,
  getInitialQuantity,
  hasQuantityDefinitions,
  shouldShowQuantityTypeToggle,
} from "@/lib/utils/quantity";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
  raw_quantity: string | null;
  cooked_quantity: string | null;
}

interface FoodLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  mealCategory: MealCategory;
  onLogFood: (data: {
    food_item_id: string;
    calories: number;
    protein: number;
    serving_multiplier: number;
    meal_category: string;
    quantity_grams?: number | null;
    quantity_type?: QuantityType | null;
    quantity_note?: string | null;
  }) => void;
  isLogging?: boolean;
  /** Display label for this meal category (from useMealTypes) */
  mealLabel?: string;
  /** Pre-filled quantity from planned meal */
  initialQuantityGrams?: number | null;
  initialQuantityType?: QuantityType | null;
  initialQuantityNote?: string | null;
}

/**
 * Quick quantity presets for common amounts
 */
const QUICK_QUANTITIES = [50, 100, 150, 200, 250, 300];

/**
 * FoodLogForm component
 * Quick log form for logging food with quantity-based input
 */
export function FoodLogForm({
  isOpen,
  onClose,
  foodItem,
  mealCategory,
  onLogFood,
  isLogging = false,
  mealLabel: mealLabelProp,
  initialQuantityGrams,
  initialQuantityType,
  initialQuantityNote,
}: FoodLogFormProps) {
  const [quantityGrams, setQuantityGrams] = useState<number>(100);
  const [debouncedQuantityGrams, setDebouncedQuantityGrams] = useState<number>(100);
  const [quantityType, setQuantityType] = useState<QuantityType | null>(null);
  const [quantityNote, setQuantityNote] = useState("");

  // Debounce quantity changes (300ms) — keeps input responsive while
  // deferring multiplier/calorie recalculation for fast typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuantityGrams(quantityGrams), 300);
    return () => clearTimeout(timer);
  }, [quantityGrams]);

  // Initialize quantity when dialog opens or food item changes
  useEffect(() => {
    if (isOpen && foodItem) {
      // Use initial values if provided (from planned meal), otherwise calculate defaults
      if (initialQuantityGrams != null) {
        setQuantityGrams(initialQuantityGrams);
        setDebouncedQuantityGrams(initialQuantityGrams);
        setQuantityType(initialQuantityType || getDefaultQuantityType(foodItem));
        setQuantityNote(initialQuantityNote || "");
      } else {
        const initial = getInitialQuantity(foodItem);
        setQuantityGrams(initial);
        setDebouncedQuantityGrams(initial);
        setQuantityType(getDefaultQuantityType(foodItem));
        setQuantityNote("");
      }
    }
  }, [isOpen, foodItem, initialQuantityGrams, initialQuantityType, initialQuantityNote]);

  // Calculate multiplier from debounced quantity
  const calculatedMultiplier = useMemo(() => {
    return calculateMultiplier(debouncedQuantityGrams, quantityType, foodItem);
  }, [debouncedQuantityGrams, quantityType, foodItem]);

  // Calculate adjusted values
  const adjustedCalories = foodItem ? Math.round(foodItem.calories * calculatedMultiplier) : 0;
  const adjustedProtein = foodItem ? Math.round(foodItem.protein * calculatedMultiplier) : 0;

  const handleLog = useCallback(() => {
    if (!foodItem || isLogging) return;

    // Use actual quantity (not debounced) for submission accuracy
    const actualMultiplier = calculateMultiplier(quantityGrams, quantityType, foodItem);
    const actualCalories = Math.round(foodItem.calories * actualMultiplier);
    const actualProtein = Math.round(foodItem.protein * actualMultiplier);

    onLogFood({
      food_item_id: foodItem.id,
      calories: actualCalories,
      protein: actualProtein,
      serving_multiplier: actualMultiplier,
      meal_category: mealCategory,
      quantity_grams: quantityGrams,
      quantity_type: quantityType,
      quantity_note: quantityNote || null,
    });
  }, [foodItem, isLogging, quantityGrams, quantityType, mealCategory, quantityNote, onLogFood]);

  // Reset when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!foodItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Log <span className="gradient-athletic">Food</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {mealLabelProp || getMealLabel(mealCategory, {})}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Food Item Display */}
          <div className="athletic-card p-4 pl-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary">
                <Utensils className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-sm">{foodItem.name}</h4>
                <p className="text-xs font-bold text-muted-foreground">{foodItem.serving_size}</p>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Quantity
            </p>

            {/* Quantity input with raw/cooked toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  value={quantityGrams}
                  onChange={(e) => setQuantityGrams(Number(e.target.value) || 0)}
                  disabled={isLogging}
                  className="w-20 bg-secondary border-border text-center font-bold"
                />
                <span className="text-sm text-muted-foreground font-bold">g</span>
              </div>

              {/* Raw/Cooked Toggle */}
              {foodItem && shouldShowQuantityTypeToggle(foodItem) && (
                <div className="flex items-center gap-1 bg-secondary rounded p-1">
                  <button
                    type="button"
                    onClick={() => setQuantityType("raw")}
                    disabled={isLogging}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded transition-colors",
                      quantityType === "raw"
                        ? "gradient-electric text-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Raw
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantityType("cooked")}
                    disabled={isLogging}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded transition-colors",
                      quantityType === "cooked"
                        ? "gradient-electric text-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Cooked
                  </button>
                </div>
              )}

              {/* Show type label when only one is available */}
              {foodItem &&
                hasQuantityDefinitions(foodItem) &&
                !shouldShowQuantityTypeToggle(foodItem) &&
                quantityType && (
                  <span className="text-xs text-muted-foreground">({quantityType})</span>
                )}
            </div>

            {/* Quick quantity presets */}
            <div className="grid grid-cols-6 gap-1">
              {QUICK_QUANTITIES.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    setQuantityGrams(qty);
                    setDebouncedQuantityGrams(qty);
                  }}
                  disabled={isLogging}
                  className={cn(
                    "py-2 text-xs font-bold rounded transition-all",
                    quantityGrams === qty
                      ? "gradient-electric text-black"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {qty}g
                </button>
              ))}
            </div>

            {/* Serving note */}
            <Input
              value={quantityNote}
              onChange={(e) => setQuantityNote(e.target.value)}
              placeholder="Note (e.g., 2 chapatis)"
              disabled={isLogging}
              maxLength={100}
              className="bg-secondary border-border text-sm"
            />

            {/* Warning when no quantity definitions */}
            {foodItem && !hasQuantityDefinitions(foodItem) && (
              <p className="text-xs text-amber-400">
                No quantity reference defined. Using 100g as base.
              </p>
            )}
          </div>

          {/* Calculated Nutrition */}
          <div className="athletic-card p-4 pl-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Nutrition Values
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-black gradient-athletic">{adjustedCalories}</span>
                <span className="text-sm font-bold text-muted-foreground ml-1">kcal</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-3xl font-black">{adjustedProtein}</span>
                <span className="text-sm font-bold text-muted-foreground ml-1">g protein</span>
              </div>
            </div>
          </div>

          {/* Log Button */}
          <button
            onClick={handleLog}
            disabled={isLogging}
            className={cn(
              "btn-athletic w-full px-5 py-4 gradient-electric text-black glow-power",
              isLogging && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLogging ? "Logging..." : "Log Food"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
