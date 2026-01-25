"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Loader2, ArrowLeftRight, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodItemChipList } from "./food-item-chip";
import type { FoodItem, FoodItemAlternativeRow } from "@/lib/database.types";

interface AlternativesLinkerProps {
  foodItems: FoodItem[];
  alternatives: FoodItemAlternativeRow[];
  isLoading?: boolean;
  onChange: (changes: AlternativeChange[]) => void;
  className?: string;
}

export interface AlternativeChange {
  type: "add" | "remove";
  foodItemId: string;
  alternativeFoodId: string;
}

/**
 * Alternatives Linker Component
 * Two-panel interface for managing food item alternatives
 */
export function AlternativesLinker({
  foodItems,
  alternatives,
  isLoading = false,
  onChange,
  className,
}: AlternativesLinkerProps) {
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [primarySearch, setPrimarySearch] = useState("");
  const [alternativeSearch, setAlternativeSearch] = useState("");
  const [pendingChanges, setPendingChanges] = useState<AlternativeChange[]>([]);

  // Filter primary food items
  const filteredPrimaryFoods = useMemo(() => {
    const query = primarySearch.toLowerCase().trim();
    return query ? foodItems.filter((f) => f.name.toLowerCase().includes(query)) : foodItems;
  }, [foodItems, primarySearch]);

  // Get current alternatives for selected food (including pending changes)
  const currentAlternatives = useMemo(() => {
    if (!selectedFoodId) return [];

    // Start with database alternatives
    const dbAlternativeIds = alternatives
      .filter((a) => a.food_item_id === selectedFoodId)
      .map((a) => a.alternative_food_id);

    // Apply pending changes
    const currentIds = new Set(dbAlternativeIds);
    pendingChanges.forEach((change) => {
      if (change.foodItemId === selectedFoodId) {
        if (change.type === "add") {
          currentIds.add(change.alternativeFoodId);
        } else {
          currentIds.delete(change.alternativeFoodId);
        }
      }
    });

    return foodItems.filter((f) => currentIds.has(f.id));
  }, [selectedFoodId, alternatives, pendingChanges, foodItems]);

  // Filter available foods for alternatives (excluding selected and already linked)
  const availableAlternatives = useMemo(() => {
    if (!selectedFoodId) return [];

    const currentAltIds = new Set(currentAlternatives.map((a) => a.id));
    const query = alternativeSearch.toLowerCase().trim();

    return foodItems.filter((f) => {
      if (f.id === selectedFoodId) return false;
      if (currentAltIds.has(f.id)) return false;
      if (query && !f.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [foodItems, selectedFoodId, currentAlternatives, alternativeSearch]);

  // Count items with alternatives
  const itemsWithAlternatives = useMemo(() => {
    const idsWithAlts = new Set(alternatives.map((a) => a.food_item_id));
    return foodItems.filter((f) => idsWithAlts.has(f.id)).length;
  }, [foodItems, alternatives]);

  const handleSelectPrimary = useCallback((foodId: string) => {
    setSelectedFoodId(foodId);
    setAlternativeSearch("");
  }, []);

  const handleAddAlternative = useCallback(
    (alternativeFood: FoodItem) => {
      if (!selectedFoodId) return;

      // Check if this was previously removed
      const existingRemoveIndex = pendingChanges.findIndex(
        (c) =>
          c.type === "remove" &&
          c.foodItemId === selectedFoodId &&
          c.alternativeFoodId === alternativeFood.id
      );

      if (existingRemoveIndex >= 0) {
        // Cancel the remove
        const newChanges = [...pendingChanges];
        newChanges.splice(existingRemoveIndex, 1);
        setPendingChanges(newChanges);
        onChange(newChanges);
      } else {
        // Add new change
        const newChange: AlternativeChange = {
          type: "add",
          foodItemId: selectedFoodId,
          alternativeFoodId: alternativeFood.id,
        };
        const newChanges = [...pendingChanges, newChange];
        setPendingChanges(newChanges);
        onChange(newChanges);
      }
    },
    [selectedFoodId, pendingChanges, onChange]
  );

  const handleRemoveAlternative = useCallback(
    (alternativeFood: FoodItem) => {
      if (!selectedFoodId) return;

      // Check if this was previously added
      const existingAddIndex = pendingChanges.findIndex(
        (c) =>
          c.type === "add" &&
          c.foodItemId === selectedFoodId &&
          c.alternativeFoodId === alternativeFood.id
      );

      if (existingAddIndex >= 0) {
        // Cancel the add
        const newChanges = [...pendingChanges];
        newChanges.splice(existingAddIndex, 1);
        setPendingChanges(newChanges);
        onChange(newChanges);
      } else {
        // Add remove change
        const newChange: AlternativeChange = {
          type: "remove",
          foodItemId: selectedFoodId,
          alternativeFoodId: alternativeFood.id,
        };
        const newChanges = [...pendingChanges, newChange];
        setPendingChanges(newChanges);
        onChange(newChanges);
      }
    },
    [selectedFoodId, pendingChanges, onChange]
  );

  // Calculate changes summary
  const addedCount = pendingChanges.filter((c) => c.type === "add").length;
  const removedCount = pendingChanges.filter((c) => c.type === "remove").length;

  const selectedFood = foodItems.find((f) => f.id === selectedFoodId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="font-bold text-muted-foreground">Loading food items...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel - Primary Food Selection */}
        <div className="athletic-card p-4 space-y-4 max-h-[600px] flex flex-col">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-black tracking-[0.2em] uppercase text-muted-foreground">
              Select Primary Food
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search foods..."
              value={primarySearch}
              onChange={(e) => setPrimarySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Food List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredPrimaryFoods.map((food) => {
              const hasAlternatives = alternatives.some((a) => a.food_item_id === food.id);
              const isSelected = food.id === selectedFoodId;

              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleSelectPrimary(food.id)}
                  className={cn(
                    "w-full text-left p-3 transition-colors",
                    isSelected
                      ? "bg-primary/20 border border-primary"
                      : "bg-card border border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold truncate">{food.name}</span>
                    {hasAlternatives && (
                      <ArrowLeftRight className="h-4 w-4 text-neon-green flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {food.calories} kcal | {food.protein}g protein
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="text-xs text-muted-foreground font-bold border-t border-border pt-3">
            <span className="text-neon-green">{itemsWithAlternatives}</span> items with alternatives
            | <span>{foodItems.length - itemsWithAlternatives}</span> without
          </div>
        </div>

        {/* Right Panel - Alternatives */}
        <div className="athletic-card p-4 space-y-4 max-h-[600px] flex flex-col">
          {selectedFood ? (
            <>
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  <span className="text-sm font-black tracking-[0.2em] uppercase text-muted-foreground">
                    Alternatives for
                  </span>
                </div>
                <div className="font-bold text-lg">&quot;{selectedFood.name}&quot;</div>
                <div className="text-xs text-muted-foreground">
                  {selectedFood.calories} kcal | {selectedFood.protein}g protein
                </div>
              </div>

              {/* Current Alternatives */}
              <div className="flex-shrink-0">
                <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
                  Current Alternatives ({currentAlternatives.length})
                </p>
                <div className="max-h-[180px] overflow-y-auto">
                  <FoodItemChipList
                    foods={currentAlternatives}
                    variant="selected"
                    onRemove={handleRemoveAlternative}
                    emptyMessage="No alternatives linked yet"
                  />
                </div>
              </div>

              {/* Search for alternatives */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search to add alternatives..."
                  value={alternativeSearch}
                  onChange={(e) => setAlternativeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Available alternatives */}
              <div className="flex-1 overflow-y-auto">
                <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
                  Click to add as alternative
                </p>
                <FoodItemChipList
                  foods={availableAlternatives.slice(0, 15)}
                  variant="selectable"
                  onAdd={handleAddAlternative}
                  emptyMessage={
                    alternativeSearch ? "No matching foods found" : "Search to find foods"
                  }
                />
                {availableAlternatives.length > 15 && (
                  <p className="text-xs text-muted-foreground font-bold mt-2">
                    Showing 15 of {availableAlternatives.length} available foods. Use search to find
                    more.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-muted-foreground mb-2">Select a food item</p>
              <p className="text-sm text-muted-foreground">
                Choose a food from the left panel to manage its alternatives
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Changes Summary */}
      {(addedCount > 0 || removedCount > 0) && (
        <div className="flex items-center justify-between p-4 bg-secondary border border-border">
          <div className="text-sm font-bold">
            <span className="text-muted-foreground">Pending changes:</span>
            {addedCount > 0 && (
              <span className="text-neon-green ml-2">+{addedCount} links to add</span>
            )}
            {removedCount > 0 && (
              <span className="text-red-500 ml-2">-{removedCount} links to remove</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
