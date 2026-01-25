"use client";

import { X, Plus, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/lib/database.types";

interface FoodItemChipProps {
  food: FoodItem;
  variant?: "default" | "selected" | "selectable";
  onAdd?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * Food Item Chip Component
 * Compact display of a food item with actions
 */
export function FoodItemChip({
  food,
  variant = "default",
  onAdd,
  onRemove,
  className,
}: FoodItemChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border transition-colors",
        variant === "selected" && "bg-neon-green/5 border-neon-green/30",
        variant === "selectable" && "bg-card border-border hover:border-primary/50 cursor-pointer",
        variant === "default" && "bg-card border-border",
        className
      )}
      onClick={variant === "selectable" && onAdd ? onAdd : undefined}
    >
      {/* Food Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate">{food.name}</span>
          {food.is_vegetarian && <Leaf className="h-3.5 w-3.5 text-neon-green flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{food.calories} kcal</span>
          <span>|</span>
          <span>{food.protein}g protein</span>
          {food.serving_size && (
            <>
              <span>|</span>
              <span>{food.serving_size}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {variant === "selectable" && onAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      )}

      {variant === "selected" && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          aria-label={`Remove ${food.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface FoodItemChipListProps {
  foods: FoodItem[];
  variant?: "default" | "selected" | "selectable";
  onAdd?: (food: FoodItem) => void;
  onRemove?: (food: FoodItem) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Food Item Chip List Component
 * Renders a list of food item chips
 */
export function FoodItemChipList({
  foods,
  variant = "default",
  onAdd,
  onRemove,
  emptyMessage = "No food items",
  className,
}: FoodItemChipListProps) {
  if (foods.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground font-bold py-4", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {foods.map((food) => (
        <FoodItemChip
          key={food.id}
          food={food}
          variant={variant}
          onAdd={onAdd ? () => onAdd(food) : undefined}
          onRemove={onRemove ? () => onRemove(food) : undefined}
        />
      ))}
    </div>
  );
}
