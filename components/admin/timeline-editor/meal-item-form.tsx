/**
 * Meal Item Form
 *
 * Form for adding/editing meal items on the timeline.
 * Allows selecting food from database, timing, and serving multiplier.
 * Shows warnings when food items have potential incompatibilities with client conditions.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import { Search, Loader2, Utensils, X, AlertTriangle } from "lucide-react";
import { useMealTypes } from "@/hooks/use-meal-types";
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
import { FoodWarningDialog } from "./food-warning-dialog";
import { useFoodCompatibility } from "@/hooks/use-food-compatibility";
import type { ClientConditionWithDetails } from "@/hooks/use-timeline-data";
import type { FoodItem, DietPlan, DietPlanInsert, QuantityType } from "@/lib/database.types";
import {
  calculateMultiplier,
  calculateQuantityFromMultiplier,
  getDefaultQuantityType,
  getInitialQuantity,
  hasQuantityDefinitions,
  shouldShowQuantityTypeToggle,
  validateQuantityInput,
} from "@/lib/utils/quantity";

/** Context passed when adding a food item to an existing meal group */
export interface MealGroupContext {
  mealCategory: string;
  timing: TimingValues;
  existingFoodItemIds?: string[];
}

interface MealItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  dayNumber: number;
  editItem?: DietPlan & { food_items?: FoodItem | null };
  clientConditions?: ClientConditionWithDetails[];
  /** When provided, hides meal category & timing fields (inherited from existing group) */
  groupContext?: MealGroupContext;
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
  clientConditions = [],
  groupContext,
}: MealItemFormProps) {
  const isEditing = !!editItem;

  // Fetch meal categories from database
  const { mealTypes, isLoading: isLoadingMealTypes, error: mealTypesError } = useMealTypes();
  const mealCategories = mealTypes.map((mt) => ({ value: mt.slug, label: mt.name }));

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [mealCategory, setMealCategory] = useState<string>("breakfast");
  const [quantityGrams, setQuantityGrams] = useState<number>(100);
  const [quantityType, setQuantityType] = useState<QuantityType | null>(null);
  const [quantityNote, setQuantityNote] = useState("");
  const [notes, setNotes] = useState("");
  const [timing, setTiming] = useState<TimingValues>({
    timeType: "period",
    timeStart: null,
    timeEnd: null,
    timePeriod: "morning",
    relativeAnchor: null,
    relativeOffsetMinutes: 0,
  });

  // Warning dialog state
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Food compatibility check
  const { incompatibleConditions, hasIncompatibility, isChecking } = useFoodCompatibility(
    selectedFood?.id || null,
    clientConditions
  );

  // Reset form when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const food = editItem?.food_items || null;
      setSelectedFood(food);
      setMealCategory(
        groupContext?.mealCategory ||
          editItem?.meal_category ||
          mealCategories[0]?.value ||
          "breakfast"
      );

      // Handle quantity fields - prioritize stored quantity_grams, fall back to calculating from multiplier
      if (editItem?.quantity_grams != null) {
        setQuantityGrams(editItem.quantity_grams);
        setQuantityType(editItem.quantity_type || getDefaultQuantityType(food));
        setQuantityNote(editItem.quantity_note || "");
      } else if (food) {
        // Legacy: calculate quantity from multiplier
        const defaultType = getDefaultQuantityType(food);
        setQuantityType(defaultType);
        if (editItem?.serving_multiplier) {
          setQuantityGrams(
            calculateQuantityFromMultiplier(editItem.serving_multiplier, defaultType, food)
          );
        } else {
          setQuantityGrams(getInitialQuantity(food));
        }
        setQuantityNote("");
      } else {
        setQuantityGrams(100);
        setQuantityType(null);
        setQuantityNote("");
      }

      setNotes(editItem?.notes || "");
      setTiming(
        groupContext?.timing || {
          timeType: editItem?.time_type || "period",
          timeStart: editItem?.time_start || null,
          timeEnd: editItem?.time_end || null,
          timePeriod: editItem?.time_period || "morning",
          relativeAnchor: editItem?.relative_anchor || null,
          relativeOffsetMinutes: editItem?.relative_offset_minutes || 0,
        }
      );
      setShowWarningDialog(false);
    }
  }, [isOpen, editItem]);

  // Auto-set quantity type and initial quantity when food is newly selected (not from reset)
  useEffect(() => {
    // Only run when food selection changes after initial load
    if (!isOpen || editItem?.food_items?.id === selectedFood?.id) return;

    if (selectedFood) {
      const defaultType = getDefaultQuantityType(selectedFood);
      setQuantityType(defaultType);
      setQuantityGrams(getInitialQuantity(selectedFood));
      setQuantityNote("");
    } else {
      setQuantityType(null);
      setQuantityGrams(100);
      setQuantityNote("");
    }
  }, [selectedFood?.id, isOpen, editItem?.food_items?.id]);

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

  // Calculate the multiplier from quantity
  const calculatedMultiplier = useMemo(() => {
    return calculateMultiplier(quantityGrams, quantityType, selectedFood);
  }, [quantityGrams, quantityType, selectedFood]);

  // Calculate nutrition for selected food
  const calculatedNutrition = useMemo(() => {
    if (!selectedFood) return null;
    return {
      calories: Math.round(selectedFood.calories * calculatedMultiplier),
      protein: Math.round(selectedFood.protein * calculatedMultiplier),
    };
  }, [selectedFood, calculatedMultiplier]);

  // Perform the actual save operation
  const performSave = async () => {
    if (!selectedFood) return;

    const data: DietPlanInsert = {
      client_id: clientId,
      day_number: dayNumber,
      food_item_id: selectedFood.id,
      meal_category: mealCategory,
      serving_multiplier: calculatedMultiplier,
      notes: notes || null,
      time_type: timing.timeType,
      time_start: timing.timeStart,
      time_end: timing.timeEnd,
      time_period: timing.timePeriod,
      relative_anchor: timing.relativeAnchor,
      relative_offset_minutes: timing.relativeOffsetMinutes,
      quantity_grams: quantityGrams,
      quantity_type: quantityType,
      quantity_note: quantityNote || null,
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
    } catch {
      toast.error(isEditing ? "Failed to update meal" : "Failed to add meal");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFood) {
      toast.error("Please select a food item");
      return;
    }

    // Check for duplicate in group
    if (!isEditing && groupContext?.existingFoodItemIds?.includes(selectedFood.id)) {
      toast.error("This food item is already in this meal");
      return;
    }

    // Validate quantity input
    const validation = validateQuantityInput(quantityGrams, quantityType, selectedFood);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid quantity");
      return;
    }

    // Check for incompatibilities before submitting
    if (hasIncompatibility) {
      setShowWarningDialog(true);
      return;
    }

    // No incompatibilities, proceed with save
    await performSave();
  };

  // Handle confirm from warning dialog (add anyway)
  const handleWarningConfirm = async () => {
    setShowWarningDialog(false);
    await performSave();
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
              : groupContext
                ? "Add another food item to this meal."
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
                <div className="space-y-2">
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
                  {/* Compatibility warning indicator */}
                  {!isChecking && hasIncompatibility && (
                    <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-400">Compatibility Warning</p>
                        <p className="text-xs text-muted-foreground">
                          This food may be unsuitable for client conditions:{" "}
                          {incompatibleConditions.map((c) => c.name).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
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

            {/* Meal Category - hidden when adding to existing group */}
            {!groupContext && (
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Meal Category *
                </Label>
                {isLoadingMealTypes ? (
                  <div className="flex items-center gap-2 h-10 px-3 bg-secondary border border-border rounded-md text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading meal types...</span>
                  </div>
                ) : mealTypesError ? (
                  <div className="flex items-center gap-2 h-10 px-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Failed to load meal types</span>
                  </div>
                ) : (
                  <Select
                    value={mealCategory}
                    onValueChange={setMealCategory}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealCategories.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Quantity Input */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Quantity *
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    value={quantityGrams}
                    onChange={(e) => setQuantityGrams(Number(e.target.value) || 0)}
                    disabled={isSubmitting}
                    className="w-20 bg-secondary border-border"
                  />
                  <span className="text-sm text-muted-foreground font-bold">g</span>
                </div>

                {/* Raw/Cooked Toggle - only show when both are defined */}
                {selectedFood && shouldShowQuantityTypeToggle(selectedFood) && (
                  <div className="flex items-center gap-1 bg-secondary rounded p-1">
                    <button
                      type="button"
                      onClick={() => setQuantityType("raw")}
                      disabled={isSubmitting}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded transition-colors",
                        quantityType === "raw"
                          ? "bg-orange-500 text-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Raw
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantityType("cooked")}
                      disabled={isSubmitting}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded transition-colors",
                        quantityType === "cooked"
                          ? "bg-orange-500 text-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Cooked
                    </button>
                  </div>
                )}

                {/* Show type label when only one is available */}
                {selectedFood &&
                  hasQuantityDefinitions(selectedFood) &&
                  !shouldShowQuantityTypeToggle(selectedFood) &&
                  quantityType && (
                    <span className="text-xs text-muted-foreground">({quantityType})</span>
                  )}
              </div>

              {/* Calculated nutrition */}
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

              {/* Warning when no quantity definitions */}
              {selectedFood && !hasQuantityDefinitions(selectedFood) && (
                <p className="text-xs text-amber-400">
                  No quantity reference defined for this food. Using 100g as base.
                </p>
              )}
            </div>

            {/* Serving Note (optional) */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Serving Note (optional)
              </Label>
              <Input
                value={quantityNote}
                onChange={(e) => setQuantityNote(e.target.value)}
                placeholder="e.g., 2 chapatis, 3 slices"
                disabled={isSubmitting}
                maxLength={100}
                className="bg-secondary border-border"
              />
            </div>

            {/* Timing - hidden when adding to existing group */}
            {!groupContext && (
              <TimingSelector
                values={timing}
                onChange={setTiming}
                showAllDay={false}
                disabled={isSubmitting}
              />
            )}

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

      {/* Food Compatibility Warning Dialog */}
      <FoodWarningDialog
        isOpen={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        onConfirm={handleWarningConfirm}
        foodName={selectedFood?.name || ""}
        incompatibleConditions={incompatibleConditions}
      />
    </Dialog>
  );
}
