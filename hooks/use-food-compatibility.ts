/**
 * useFoodCompatibility Hook
 *
 * Checks if a food item is compatible with a client's medical conditions.
 * Cross-references the food_item_conditions table with the client's conditions
 * to determine if any incompatibilities exist.
 */

"use client";

import { useMemo } from "react";
import { useList } from "@refinedev/core";
import type { FoodItemCondition, MedicalConditionRow } from "@/lib/database.types";
import type { ClientConditionWithDetails } from "./use-timeline-data";

// Extended type with joined medical condition
interface FoodItemConditionWithDetails extends FoodItemCondition {
  medical_conditions?: MedicalConditionRow | null;
}

export interface IncompatibleCondition {
  id: string;
  name: string;
}

export interface FoodCompatibilityResult {
  isChecking: boolean;
  incompatibleConditions: IncompatibleCondition[];
  hasIncompatibility: boolean;
}

/**
 * Hook to check food compatibility with client conditions
 *
 * @param foodItemId - The ID of the food item to check (null if no food selected)
 * @param clientConditions - The client's conditions with details
 * @returns Compatibility result with any incompatible conditions
 */
export function useFoodCompatibility(
  foodItemId: string | null,
  clientConditions: ClientConditionWithDetails[]
): FoodCompatibilityResult {
  // Fetch food item conditions for the selected food
  const { query: foodConditionsQuery } = useList<FoodItemConditionWithDetails>({
    resource: "food_item_conditions",
    filters: [{ field: "food_item_id", operator: "eq", value: foodItemId }],
    meta: {
      select: "*, medical_conditions(id, name)",
    },
    queryOptions: {
      // Only fetch when we have a food item AND client has conditions
      enabled: !!foodItemId && clientConditions.length > 0,
    },
  });

  // Cross-reference food conditions with client conditions
  const incompatibleConditions = useMemo<IncompatibleCondition[]>(() => {
    const foodConditions = foodConditionsQuery.data?.data;

    // No incompatibilities if:
    // - No food selected
    // - Client has no conditions
    // - Food has no condition restrictions
    if (!foodConditions || !clientConditions.length || foodConditions.length === 0) {
      return [];
    }

    // Create a set of the client's condition IDs for quick lookup
    const clientConditionIds = new Set(clientConditions.map((c) => c.condition_id));

    // Find overlapping conditions (food restrictions that match client conditions)
    return foodConditions
      .filter((fc) => clientConditionIds.has(fc.condition_id))
      .map((fc) => ({
        id: fc.condition_id,
        name: fc.medical_conditions?.name || "Unknown condition",
      }));
  }, [foodConditionsQuery.data?.data, clientConditions]);

  return {
    isChecking: foodConditionsQuery.isLoading,
    incompatibleConditions,
    hasIncompatibility: incompatibleConditions.length > 0,
  };
}
