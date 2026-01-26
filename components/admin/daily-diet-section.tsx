/**
 * Daily Diet Section Component
 *
 * Displays the diet plan for a specific day, organized by meal category.
 * Shows food items with calories and protein, plus daily totals.
 */

"use client";

import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealCategory } from "@/lib/database.types";
import type { DietPlanWithFood, DietTotals } from "@/hooks/use-daily-plan-data";

interface DailyDietSectionProps {
  dietByMeal: Map<MealCategory, DietPlanWithFood[]>;
  totals: DietTotals;
  className?: string;
}

/**
 * Meal category labels for display
 */
const MEAL_LABELS: Record<MealCategory, string> = {
  "pre-workout": "Pre-Workout",
  breakfast: "Breakfast",
  lunch: "Lunch",
  "evening-snack": "Evening Snack",
  "post-workout": "Post-Workout",
  dinner: "Dinner",
};

/**
 * Meal category display order
 */
const MEAL_ORDER: MealCategory[] = [
  "pre-workout",
  "breakfast",
  "lunch",
  "evening-snack",
  "post-workout",
  "dinner",
];

/**
 * Daily diet section component
 */
export function DailyDietSection({ dietByMeal, totals, className }: DailyDietSectionProps) {
  const hasPlans = dietByMeal.size > 0;

  // Get meals in display order
  const orderedMeals = MEAL_ORDER.filter((meal) => dietByMeal.has(meal));

  return (
    <div className={cn("athletic-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-tight">
          Diet <span className="gradient-athletic">Plan</span>
        </h3>
      </div>

      {!hasPlans ? (
        <p className="text-muted-foreground text-sm font-bold text-center py-4">No meals planned</p>
      ) : (
        <div className="space-y-3">
          {/* Meal categories */}
          {orderedMeals.map((meal) => {
            const items = dietByMeal.get(meal) || [];
            if (items.length === 0) return null;

            return (
              <div key={meal} className="bg-secondary/30 p-3 rounded">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  {MEAL_LABELS[meal]}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const calories = item.food_items?.calories || 0;
                    const protein = item.food_items?.protein || 0;
                    const multiplier = item.serving_multiplier || 1;
                    const totalCal = Math.round(calories * multiplier);
                    const totalProt = Math.round(protein * multiplier);

                    return (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2">
                          {item.food_items?.name || "Unknown Food"}
                          {multiplier !== 1 && (
                            <span className="text-muted-foreground ml-1">x{multiplier}</span>
                          )}
                        </span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {totalCal} cal
                          {totalProt > 0 && <span className="ml-2 text-xs">({totalProt}g)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-bold">
              Total:{" "}
              <span className="text-primary">{totals.totalCalories.toLocaleString()} cal</span>
              {" | "}
              <span className="text-primary">{totals.totalProtein}g protein</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
