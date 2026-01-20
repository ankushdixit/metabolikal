"use client";

import { Utensils, ArrowRight, Plus } from "lucide-react";
import type { MealCategory } from "@/lib/database.types";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
}

interface MealCardProps {
  mealCategory: MealCategory;
  foodItem: FoodItem | null;
  servingMultiplier: number;
  onSeeAlternatives: () => void;
  onLogFood: () => void;
}

/**
 * Meal category display names in order
 */
const MEAL_LABELS: Record<MealCategory, string> = {
  "pre-workout": "Pre-Workout Meal",
  "post-workout": "Post-Workout Meal",
  breakfast: "Breakfast",
  lunch: "Lunch",
  "evening-snack": "Evening Snacks",
  dinner: "Dinner",
};

/**
 * Meal icons based on category
 */
const getMealIcon = (_category: MealCategory) => {
  // Using Utensils for all for consistency with dashboard design
  return Utensils;
};

/**
 * MealCard component
 * Displays a single meal from the diet plan with athletic styling
 */
export function MealCard({
  mealCategory,
  foodItem,
  servingMultiplier,
  onSeeAlternatives,
  onLogFood,
}: MealCardProps) {
  const MealIcon = getMealIcon(mealCategory);

  // Calculate adjusted values based on serving multiplier
  const adjustedCalories = foodItem ? Math.round(foodItem.calories * servingMultiplier) : 0;
  const adjustedProtein = foodItem ? Math.round(foodItem.protein * servingMultiplier) : 0;

  if (!foodItem) {
    return (
      <div className="athletic-card p-6 pl-8 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-secondary">
            <MealIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-black tracking-[0.15em] text-muted-foreground uppercase">
            {MEAL_LABELS[mealCategory]}
          </h3>
        </div>
        <p className="text-sm font-bold text-muted-foreground">No meal assigned</p>
      </div>
    );
  }

  return (
    <div className="athletic-card p-6 pl-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary">
            <MealIcon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-black tracking-[0.15em] text-primary uppercase">
            {MEAL_LABELS[mealCategory]}
          </h3>
        </div>
        {servingMultiplier !== 1 && (
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 bg-secondary">
            {servingMultiplier}x serving
          </span>
        )}
      </div>

      {/* Food Item Details */}
      <div className="mb-6">
        <h4 className="text-lg font-black mb-2">{foodItem.name}</h4>
        <p className="text-sm font-bold text-muted-foreground mb-3">{foodItem.serving_size}</p>

        {/* Nutrition Info */}
        <div className="flex items-center gap-6">
          <div>
            <span className="text-2xl font-black gradient-athletic">{adjustedCalories}</span>
            <span className="text-sm font-bold text-muted-foreground ml-1">kcal</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-2xl font-black">{adjustedProtein}</span>
            <span className="text-sm font-bold text-muted-foreground ml-1">g protein</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSeeAlternatives}
          className="btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground"
        >
          <span>See Alternatives</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onLogFood}
          className="btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-electric text-black glow-power"
        >
          <Plus className="h-4 w-4" />
          <span>Log This</span>
        </button>
      </div>
    </div>
  );
}

export { MEAL_LABELS };
