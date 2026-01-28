"use client";

import { useState } from "react";
import { Check, Leaf, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPortal,
  SheetOverlay,
} from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getCalorieColor } from "@/lib/utils/calorie-colors";
import type { MealCategory } from "@/lib/database.types";
import { MEAL_LABELS } from "./meal-card";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs?: number | null;
  fats?: number | null;
  serving_size: string;
  is_vegetarian: boolean;
  raw_quantity?: string | null;
  cooked_quantity?: string | null;
}

interface FoodAlternative {
  id: string;
  food_item_id: string;
  alternative_food_id?: string;
  is_optimal?: boolean;
  food_items: FoodItem;
}

interface FoodAlternativesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mealCategory: MealCategory;
  currentFoodItem: FoodItem | null;
  alternatives: FoodAlternative[];
  targetCalories: number;
  onSelectAlternative: (foodItemId: string) => void;
  isUpdating?: boolean;
}

/**
 * FoodAlternativesDrawer component
 * Displays food alternatives with color-coded calorie comparison
 */
export function FoodAlternativesDrawer({
  isOpen,
  onClose,
  mealCategory,
  currentFoodItem,
  alternatives,
  targetCalories,
  onSelectAlternative,
  isUpdating = false,
}: FoodAlternativesDrawerProps) {
  const [showVegetarianOnly, setShowVegetarianOnly] = useState(false);

  // Filter alternatives based on vegetarian toggle
  const filteredAlternatives = showVegetarianOnly
    ? alternatives.filter((alt) => alt.food_items.is_vegetarian)
    : alternatives;

  const handleSelect = (foodItemId: string) => {
    if (isUpdating) return;
    onSelectAlternative(foodItemId);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetPortal>
        <SheetOverlay className="z-[100]" />
        <SheetPrimitive.Content
          className={cn(
            "fixed z-[100] gap-4 bg-card p-6 shadow-lg transition ease-in-out",
            "data-[state=closed]:duration-300 data-[state=open]:duration-500",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "w-full sm:max-w-md overflow-y-auto"
          )}
        >
          <SheetPrimitive.Close className="absolute right-4 top-4 p-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-black uppercase tracking-tight">
              <span className="gradient-athletic">{MEAL_LABELS[mealCategory]}</span> Alternatives
            </SheetTitle>
            <SheetDescription className="text-muted-foreground font-bold text-sm">
              Select a food to swap into your meal plan
            </SheetDescription>
          </SheetHeader>

          {/* Vegetarian Filter */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-secondary">
            <Checkbox
              id="vegetarian-filter"
              checked={showVegetarianOnly}
              onCheckedChange={(checked) => setShowVegetarianOnly(checked === true)}
            />
            <label
              htmlFor="vegetarian-filter"
              className="flex items-center gap-2 text-sm font-bold cursor-pointer"
            >
              <Leaf className="h-4 w-4 text-neon-green" />
              Show vegetarian only
            </label>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap gap-3 mb-6 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-neon-green" />
              <span className="text-muted-foreground">Optimal (±10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500" />
              <span className="text-muted-foreground">Higher cal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500" />
              <span className="text-muted-foreground">Lower cal</span>
            </div>
          </div>

          {/* Current Selection */}
          {currentFoodItem && (
            <div className="mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Current Selection
              </p>
              <FoodAlternativeCard
                foodItem={currentFoodItem}
                targetCalories={targetCalories}
                isSelected={true}
                onClick={() => {}}
                disabled={true}
              />
            </div>
          )}

          {/* Alternatives List */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Available Alternatives ({filteredAlternatives.length})
            </p>

            {filteredAlternatives.length === 0 ? (
              <div className="athletic-card p-6 pl-8 text-center">
                <p className="text-sm font-bold text-muted-foreground">
                  {showVegetarianOnly
                    ? "No vegetarian alternatives available"
                    : "No alternatives available"}
                </p>
              </div>
            ) : (
              filteredAlternatives.map((alt) => (
                <FoodAlternativeCard
                  key={alt.id}
                  foodItem={alt.food_items}
                  targetCalories={targetCalories}
                  isSelected={currentFoodItem?.id === alt.food_items.id}
                  onClick={() => handleSelect(alt.food_items.id)}
                  disabled={isUpdating}
                />
              ))
            )}
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}

interface FoodAlternativeCardProps {
  foodItem: FoodItem;
  targetCalories: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function FoodAlternativeCard({
  foodItem,
  targetCalories,
  isSelected,
  onClick,
  disabled,
}: FoodAlternativeCardProps) {
  const colorResult = getCalorieColor(foodItem.calories, targetCalories);

  // Build quantity display
  const quantities: string[] = [];
  if (foodItem.cooked_quantity) quantities.push(`Cooked: ${foodItem.cooked_quantity}`);
  if (foodItem.raw_quantity) quantities.push(`Raw: ${foodItem.raw_quantity}`);

  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={cn(
        "w-full text-left p-4 transition-all",
        "bg-card border",
        isSelected
          ? `border-2 ${colorResult.borderClass} ${colorResult.bgClass}`
          : `border-l-4 ${colorResult.borderClass} border-t-border border-r-border border-b-border hover:bg-secondary/50`,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-black text-sm">{foodItem.name}</h4>
            {foodItem.is_vegetarian && <Leaf className="h-3 w-3 text-neon-green" />}
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <p className="text-xs font-bold text-muted-foreground">{foodItem.serving_size}</p>
          {quantities.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{quantities.join(" | ")}</p>
          )}
        </div>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-1 shrink-0",
            colorResult.bgClass,
            colorResult.textClass
          )}
        >
          {colorResult.label}
        </span>
      </div>
      {/* Macro grid */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center p-1.5 bg-secondary/50 rounded">
          <p className={cn("font-bold", colorResult.textClass)}>{foodItem.calories}</p>
          <p className="text-muted-foreground text-[10px]">cal</p>
        </div>
        <div className="text-center p-1.5 bg-secondary/50 rounded">
          <p className="font-bold text-blue-400">{foodItem.protein}g</p>
          <p className="text-muted-foreground text-[10px]">protein</p>
        </div>
        <div className="text-center p-1.5 bg-secondary/50 rounded">
          <p className="font-bold text-yellow-400">{foodItem.carbs || 0}g</p>
          <p className="text-muted-foreground text-[10px]">carbs</p>
        </div>
        <div className="text-center p-1.5 bg-secondary/50 rounded">
          <p className="font-bold text-pink-400">{foodItem.fats || 0}g</p>
          <p className="text-muted-foreground text-[10px]">fat</p>
        </div>
      </div>
    </button>
  );
}
