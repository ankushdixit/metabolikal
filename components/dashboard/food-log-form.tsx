"use client";

import { useState } from "react";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MealCategory } from "@/lib/database.types";
import { MEAL_LABELS } from "./meal-card";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
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
  }) => void;
  isLogging?: boolean;
}

/**
 * Available serving multiplier options
 */
const SERVING_MULTIPLIERS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
];

/**
 * FoodLogForm component
 * Quick log form for logging food with serving multiplier
 */
export function FoodLogForm({
  isOpen,
  onClose,
  foodItem,
  mealCategory,
  onLogFood,
  isLogging = false,
}: FoodLogFormProps) {
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);

  // Calculate adjusted values
  const adjustedCalories = foodItem ? Math.round(foodItem.calories * selectedMultiplier) : 0;
  const adjustedProtein = foodItem ? Math.round(foodItem.protein * selectedMultiplier) : 0;

  const handleLog = () => {
    if (!foodItem || isLogging) return;

    onLogFood({
      food_item_id: foodItem.id,
      calories: adjustedCalories,
      protein: adjustedProtein,
      serving_multiplier: selectedMultiplier,
      meal_category: mealCategory,
    });
  };

  // Reset multiplier when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedMultiplier(1);
    }
  };

  if (!foodItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card p-0">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Log <span className="gradient-athletic">Food</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {MEAL_LABELS[mealCategory]}
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

          {/* Serving Multiplier Selection */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Serving Size
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SERVING_MULTIPLIERS.map((multiplier) => (
                <button
                  key={multiplier.value}
                  onClick={() => setSelectedMultiplier(multiplier.value)}
                  className={cn(
                    "py-3 text-sm font-black uppercase tracking-wider transition-all",
                    selectedMultiplier === multiplier.value
                      ? "gradient-electric text-black"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  {multiplier.label}
                </button>
              ))}
            </div>
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
