"use client";

import { useState } from "react";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MealCategory } from "@/lib/database.types";
import { MEAL_LABELS } from "./meal-card";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  serving_size: string;
  is_vegetarian: boolean;
}

interface FoodSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: FoodItem[];
  isSearching: boolean;
  onSelectFood: (foodItem: FoodItem, mealCategory: MealCategory) => void;
  onLogCustomFood: (data: {
    food_name: string;
    calories: number;
    protein: number;
    meal_category: string;
  }) => void;
  isLogging?: boolean;
}

const MEAL_CATEGORIES: MealCategory[] = [
  "pre-workout",
  "post-workout",
  "breakfast",
  "lunch",
  "evening-snack",
  "dinner",
];

/**
 * FoodSearch component
 * Search for food items or manually enter custom food
 */
export function FoodSearch({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectFood,
  onLogCustomFood,
  isLogging = false,
}: FoodSearchProps) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>("breakfast");
  const [manualFood, setManualFood] = useState({
    name: "",
    calories: "",
    protein: "",
  });

  const handleSelectFood = (foodItem: FoodItem) => {
    onSelectFood(foodItem, selectedCategory);
  };

  const handleManualSubmit = () => {
    if (!manualFood.name || !manualFood.calories || !manualFood.protein || isLogging) return;

    onLogCustomFood({
      food_name: manualFood.name,
      calories: parseInt(manualFood.calories),
      protein: parseInt(manualFood.protein),
      meal_category: selectedCategory,
    });

    // Reset form
    setManualFood({ name: "", calories: "", protein: "" });
    setShowManualEntry(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShowManualEntry(false);
      setManualFood({ name: "", calories: "", protein: "" });
    }
  };

  const isManualFormValid =
    manualFood.name.trim() !== "" &&
    manualFood.calories !== "" &&
    parseInt(manualFood.calories) > 0 &&
    manualFood.protein !== "" &&
    parseInt(manualFood.protein) >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            {showManualEntry ? (
              <button onClick={() => setShowManualEntry(false)} className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                <span>
                  Add <span className="gradient-athletic">Custom Food</span>
                </span>
              </button>
            ) : (
              <>
                Log <span className="gradient-athletic">Custom Food</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {showManualEntry
              ? "Enter nutrition information manually"
              : "Search for food or add manually"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Meal Category Selection */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Meal Category
            </p>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as MealCategory)}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {MEAL_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showManualEntry ? (
            /* Manual Entry Form */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Food Name *
                </label>
                <Input
                  value={manualFood.name}
                  onChange={(e) => setManualFood((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Calories *
                  </label>
                  <Input
                    type="number"
                    value={manualFood.calories}
                    onChange={(e) =>
                      setManualFood((prev) => ({ ...prev, calories: e.target.value }))
                    }
                    placeholder="kcal"
                    min="1"
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Protein *
                  </label>
                  <Input
                    type="number"
                    value={manualFood.protein}
                    onChange={(e) =>
                      setManualFood((prev) => ({ ...prev, protein: e.target.value }))
                    }
                    placeholder="grams"
                    min="0"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <button
                onClick={handleManualSubmit}
                disabled={!isManualFormValid || isLogging}
                className={cn(
                  "btn-athletic w-full px-5 py-4 gradient-electric text-black glow-power",
                  (!isManualFormValid || isLogging) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLogging ? "Logging..." : "Log Food"}
              </button>
            </div>
          ) : (
            /* Search View */
            <>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search food items (min 2 characters)"
                  className="pl-10 bg-secondary border-border"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isSearching ? "Searching..." : `Results (${searchResults.length})`}
                  </p>

                  {!isSearching && searchResults.length === 0 && (
                    <div className="athletic-card p-4 pl-6 text-center">
                      <p className="text-sm font-bold text-muted-foreground mb-2">
                        No food items found
                      </p>
                      <button
                        onClick={() => setShowManualEntry(true)}
                        className="text-sm font-bold text-primary hover:underline"
                      >
                        Add manually instead
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => handleSelectFood(food)}
                        className="w-full text-left p-4 bg-card border border-border hover:bg-secondary/50 transition-all"
                      >
                        <h4 className="font-black text-sm mb-1">{food.name}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                          <span>{food.calories} kcal</span>
                          <span>{food.protein}g protein</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Entry Button */}
              <button
                onClick={() => setShowManualEntry(true)}
                className="btn-athletic w-full flex items-center justify-center gap-2 px-5 py-4 bg-secondary text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>Add Food Manually</span>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
