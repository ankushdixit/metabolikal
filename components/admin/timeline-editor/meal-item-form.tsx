/**
 * Meal Item Form
 *
 * Form for adding/editing meal items on the timeline.
 * Allows selecting food from database, timing, and serving multiplier.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { Search, Loader2, Utensils, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimingSelector, type TimingValues } from "./timing-selector";
import type { FoodItem, MealCategory, DietPlan, DietPlanInsert } from "@/lib/database.types";

// Meal categories
const MEAL_CATEGORIES: { value: MealCategory; label: string }[] = [
  { value: "pre-workout", label: "Pre-Workout" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "evening-snack", label: "Evening Snack" },
  { value: "post-workout", label: "Post-Workout" },
  { value: "dinner", label: "Dinner" },
];

interface MealItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  editItem?: DietPlan & { food_items?: FoodItem | null };
}

/**
 * Form for adding/editing meal items
 */
export function MealItemForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  dayNumber,
  editItem,
}: MealItemFormProps) {
  const isEditing = !!editItem;

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [mealCategory, setMealCategory] = useState<MealCategory>("breakfast");
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [notes, setNotes] = useState("");
  const [timing, setTiming] = useState<TimingValues>({
    timeType: "period",
    timeStart: null,
    timeEnd: null,
    timePeriod: "morning",
    relativeAnchor: null,
    relativeOffsetMinutes: 0,
  });

  // Reset form when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedFood(editItem?.food_items || null);
      setMealCategory(editItem?.meal_category || "breakfast");
      setServingMultiplier(editItem?.serving_multiplier || 1);
      setNotes(editItem?.notes || "");
      setTiming({
        timeType: editItem?.time_type || "period",
        timeStart: editItem?.time_start || null,
        timeEnd: editItem?.time_end || null,
        timePeriod: editItem?.time_period || "morning",
        relativeAnchor: editItem?.relative_anchor || null,
        relativeOffsetMinutes: editItem?.relative_offset_minutes || 0,
      });
    }
  }, [isOpen, editItem]);

  // Fetch food items
  const foodItemsQuery = useList<FoodItem>({
    resource: "food_items",
    pagination: { pageSize: 500 },
    sorters: [{ field: "name", order: "asc" }],
  });

  const foodItems = foodItemsQuery.query.data?.data || [];

  // Filter food items based on search
  const filteredFoodItems = useMemo(() => {
    if (!searchQuery) return foodItems.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return foodItems.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
  }, [foodItems, searchQuery]);

  // Mutations
  const createMutation = useCreate<DietPlan>();
  const updateMutation = useUpdate<DietPlan>();

  const isSubmitting = createMutation.mutation.isPending || updateMutation.mutation.isPending;

  // Calculate nutrition for selected food
  const calculatedNutrition = useMemo(() => {
    if (!selectedFood) return null;
    return {
      calories: Math.round(selectedFood.calories * servingMultiplier),
      protein: Math.round(selectedFood.protein * servingMultiplier),
    };
  }, [selectedFood, servingMultiplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFood) {
      toast.error("Please select a food item");
      return;
    }

    const data: DietPlanInsert = {
      client_id: clientId,
      day_number: dayNumber,
      food_item_id: selectedFood.id,
      meal_category: mealCategory,
      serving_multiplier: servingMultiplier,
      notes: notes || null,
      time_type: timing.timeType,
      time_start: timing.timeStart,
      time_end: timing.timeEnd,
      time_period: timing.timePeriod,
      relative_anchor: timing.relativeAnchor,
      relative_offset_minutes: timing.relativeOffsetMinutes,
    };

    try {
      if (isEditing && editItem) {
        await updateMutation.mutation.mutateAsync({
          resource: "diet_plans",
          id: editItem.id,
          values: data,
        });
        toast.success("Meal updated successfully");
      } else {
        await createMutation.mutation.mutateAsync({
          resource: "diet_plans",
          values: data,
        });
        toast.success("Meal added successfully");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update meal" : "Failed to add meal");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card p-0 max-h-[90vh] flex flex-col">
        {/* Top accent - orange for meals */}
        <div className="h-1 bg-orange-500" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-400" />
            {isEditing ? "Edit" : "Add"} <span className="text-orange-400">Meal</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {isEditing
              ? "Update the meal details below."
              : "Add a food item to the timeline for this day."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Food Search & Selection */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Food Item *
              </Label>

              {selectedFood ? (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{selectedFood.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFood.calories} cal | {selectedFood.protein}g protein |{" "}
                      {selectedFood.serving_size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="p-1 hover:bg-secondary rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search food items..."
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-border rounded">
                    {foodItemsQuery.query.isLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredFoodItems.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No food items found
                      </div>
                    ) : (
                      filteredFoodItems.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => {
                            setSelectedFood(food);
                            setSearchQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-secondary/50 border-b border-border last:border-b-0 transition-colors"
                        >
                          <p className="font-bold text-sm">{food.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {food.calories} cal | {food.protein}g protein
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Meal Category */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Meal Category *
              </Label>
              <Select
                value={mealCategory}
                onValueChange={(value) => setMealCategory(value as MealCategory)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serving Multiplier */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Serving Multiplier
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0.25"
                  max="10"
                  step="0.25"
                  value={servingMultiplier}
                  onChange={(e) => setServingMultiplier(Number(e.target.value) || 1)}
                  disabled={isSubmitting}
                  className="w-24 bg-secondary border-border"
                />
                {calculatedNutrition && (
                  <p className="text-sm text-muted-foreground">
                    ={" "}
                    <span className="font-bold text-foreground">
                      {calculatedNutrition.calories} cal
                    </span>
                    ,{" "}
                    <span className="font-bold text-foreground">
                      {calculatedNutrition.protein}g protein
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Timing */}
            <TimingSelector
              values={timing}
              onChange={setTiming}
              showAllDay={false}
              disabled={isSubmitting}
            />

            {/* Notes */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                disabled={isSubmitting}
                className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20 rounded"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-athletic flex-1 px-4 py-3 bg-secondary text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFood}
              className={cn(
                "btn-athletic flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-black font-bold",
                (isSubmitting || !selectedFood) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Update Meal" : "Add Meal"}</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
