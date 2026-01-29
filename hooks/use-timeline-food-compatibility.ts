/**
 * useTimelineFoodCompatibility Hook
 *
 * Batch checks food compatibility for all diet items on a timeline day.
 * Returns a map of food_item_id -> incompatible condition names for display.
 */

"use client";

import { useMemo } from "react";
import { useList } from "@refinedev/core";
import type { FoodItemCondition, MedicalConditionRow } from "@/lib/database.types";
import type { ClientConditionWithDetails, DietPlanWithFood } from "./use-timeline-data";

// Extended type with joined medical condition
interface FoodItemConditionWithDetails extends FoodItemCondition {
  medical_conditions?: MedicalConditionRow | null;
}

export interface FoodIncompatibility {
  foodItemId: string;
  foodName: string;
  conditions: string[];
}

export interface UseTimelineFoodCompatibilityReturn {
  /** Map of food_item_id -> array of incompatible condition names */
  incompatibleFoodsMap: Map<string, string[]>;
  /** Set of food_item_ids that have incompatibilities */
  incompatibleFoodIds: Set<string>;
  /** Detailed incompatibility info for tooltips */
  incompatibilities: FoodIncompatibility[];
  /** Whether the data is still loading */
  isLoading: boolean;
}

/**
 * Hook to batch check food compatibility for all diet items on a day
 *
 * @param dietPlans - Raw diet plans with food item details
 * @param clientConditions - The client's conditions with details
 * @returns Map of food_item_id -> incompatible condition names
 */
export function useTimelineFoodCompatibility(
  dietPlans: DietPlanWithFood[],
  clientConditions: ClientConditionWithDetails[]
): UseTimelineFoodCompatibilityReturn {
  // Extract unique food item IDs from diet plans
  const foodItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const plan of dietPlans) {
      if (plan.food_item_id) {
        ids.add(plan.food_item_id);
      }
    }
    return Array.from(ids);
  }, [dietPlans]);

  // Build food name lookup
  const foodNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const plan of dietPlans) {
      if (plan.food_item_id && plan.food_items?.name) {
        map.set(plan.food_item_id, plan.food_items.name);
      }
    }
    return map;
  }, [dietPlans]);

  // Fetch food item conditions for all food items
  // Using IN filter would be ideal, but Refine doesn't support it well
  // Instead, we fetch all food_item_conditions and filter client-side
  // This is acceptable for a day's worth of items (typically < 20 foods)
  const { query: foodConditionsQuery } = useList<FoodItemConditionWithDetails>({
    resource: "food_item_conditions",
    pagination: {
      pageSize: 500, // Get all conditions for the foods
    },
    meta: {
      select: "*, medical_conditions(id, name)",
    },
    queryOptions: {
      // Only fetch when we have foods AND client has conditions
      enabled: foodItemIds.length > 0 && clientConditions.length > 0,
    },
  });

  // Create a set of client condition IDs for quick lookup
  const clientConditionIds = useMemo(
    () => new Set(clientConditions.map((c) => c.condition_id)),
    [clientConditions]
  );

  // Build incompatibility map
  const result = useMemo<UseTimelineFoodCompatibilityReturn>(() => {
    const incompatibleFoodsMap = new Map<string, string[]>();
    const incompatibleFoodIds = new Set<string>();
    const incompatibilities: FoodIncompatibility[] = [];

    const foodConditions = foodConditionsQuery.data?.data;

    // If no data or no client conditions, return empty
    if (!foodConditions || clientConditionIds.size === 0) {
      return {
        incompatibleFoodsMap,
        incompatibleFoodIds,
        incompatibilities,
        isLoading: foodConditionsQuery.isLoading,
      };
    }

    // Group food conditions by food_item_id
    const conditionsByFood = new Map<string, FoodItemConditionWithDetails[]>();
    for (const fc of foodConditions) {
      // Only process foods in our current diet plans
      if (!foodItemIds.includes(fc.food_item_id)) continue;

      const existing = conditionsByFood.get(fc.food_item_id) || [];
      existing.push(fc);
      conditionsByFood.set(fc.food_item_id, existing);
    }

    // Check each food for incompatibilities with client conditions
    for (const [foodId, conditions] of conditionsByFood) {
      const matchingConditions: string[] = [];

      for (const fc of conditions) {
        if (clientConditionIds.has(fc.condition_id)) {
          matchingConditions.push(fc.medical_conditions?.name || "Unknown condition");
        }
      }

      if (matchingConditions.length > 0) {
        incompatibleFoodsMap.set(foodId, matchingConditions);
        incompatibleFoodIds.add(foodId);
        incompatibilities.push({
          foodItemId: foodId,
          foodName: foodNameMap.get(foodId) || "Unknown food",
          conditions: matchingConditions,
        });
      }
    }

    return {
      incompatibleFoodsMap,
      incompatibleFoodIds,
      incompatibilities,
      isLoading: foodConditionsQuery.isLoading,
    };
  }, [
    foodConditionsQuery.data?.data,
    foodConditionsQuery.isLoading,
    clientConditionIds,
    foodItemIds,
    foodNameMap,
  ]);

  return result;
}
