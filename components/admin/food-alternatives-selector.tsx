"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useList } from "@refinedev/core";
import { Search, X, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/lib/database.types";

interface FoodAlternativesSelectorProps {
  selectedFoodIds: string[];
  excludeFoodId?: string; // The food item being edited (to exclude from search)
  onChange: (foodIds: string[]) => void;
  className?: string;
}

/**
 * Food Alternatives Selector Component
 * Search and select other food items as alternatives
 */
export function FoodAlternativesSelector({
  selectedFoodIds,
  excludeFoodId,
  onChange,
  className,
}: FoodAlternativesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all food items for search
  const foodItemsQuery = useList<FoodItem>({
    resource: "food_items",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  });

  const allFoodItems = foodItemsQuery.query.data?.data || [];
  const isLoading = foodItemsQuery.query.isLoading;

  // Filter food items for search results
  const searchResults = searchQuery.trim()
    ? allFoodItems
        .filter((item) => {
          // Exclude current food item and already selected items
          if (item.id === excludeFoodId) return false;
          if (selectedFoodIds.includes(item.id)) return false;
          // Match by name
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .slice(0, 8) // Limit to 8 results
    : [];

  // Get selected food items for display
  const selectedFoods = allFoodItems.filter((item) => selectedFoodIds.includes(item.id));

  const handleAddAlternative = useCallback(
    (foodId: string) => {
      if (!selectedFoodIds.includes(foodId)) {
        onChange([...selectedFoodIds, foodId]);
      }
      setSearchQuery("");
      setIsSearchFocused(false);
    },
    [selectedFoodIds, onChange]
  );

  const handleRemoveAlternative = useCallback(
    (foodId: string) => {
      onChange(selectedFoodIds.filter((id) => id !== foodId));
    },
    [selectedFoodIds, onChange]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search foods to add as alternatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border shadow-lg max-h-64 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm font-bold">
                {isLoading ? "Searching..." : "No matching foods found"}
              </div>
            ) : (
              searchResults.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleAddAlternative(food.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-secondary text-left transition-colors border-b border-border last:border-b-0"
                >
                  <div>
                    <span className="font-bold block">{food.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {food.calories} kcal | {food.protein}g protein
                    </span>
                  </div>
                  <span className="text-xs text-primary font-bold uppercase">Add</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Alternatives */}
      {selectedFoods.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
            Selected Alternatives ({selectedFoods.length})
          </p>
          <div className="space-y-2">
            {selectedFoods.map((food) => (
              <div
                key={food.id}
                className="flex items-center gap-3 p-3 bg-card border border-border"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block truncate">{food.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {food.calories} kcal | {food.protein}g protein | {food.serving_size}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAlternative(food.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  aria-label={`Remove ${food.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-bold py-2">
          No alternatives selected. Search above to add food alternatives.
        </p>
      )}
    </div>
  );
}
