/**
 * Quantity-based input utilities for diet plans
 *
 * Provides functions to parse, calculate, validate, and format quantity-based
 * food input. Supports both raw and cooked quantity measurements.
 */

import type { FoodItem, QuantityType } from "@/lib/database.types";

/**
 * Result of quantity validation
 */
export interface QuantityValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Parse a quantity string like "100g" or "100 g" to extract the numeric value
 *
 * @param str - The quantity string to parse (e.g., "100g", "150 g", "75")
 * @returns The numeric value or null if parsing fails
 *
 * @example
 * parseQuantityString("100g") // returns 100
 * parseQuantityString("150 g") // returns 150
 * parseQuantityString("75") // returns 75
 * parseQuantityString(null) // returns null
 * parseQuantityString("invalid") // returns null
 */
export function parseQuantityString(str: string | null | undefined): number | null {
  if (!str) return null;

  // Remove any units (g, grams, etc.) and whitespace, then parse
  const cleaned = str.replace(/[^\d.]/g, "").trim();
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Get the available quantity types for a food item based on its defined quantities
 *
 * @param food - The food item to check
 * @returns Array of available quantity types ("raw", "cooked", or both)
 *
 * @example
 * // Food with both quantities defined
 * getAvailableQuantityTypes({ raw_quantity: "100g", cooked_quantity: "75g" })
 * // returns ["raw", "cooked"]
 *
 * // Food with only raw quantity
 * getAvailableQuantityTypes({ raw_quantity: "100g", cooked_quantity: null })
 * // returns ["raw"]
 */
export function getAvailableQuantityTypes(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): QuantityType[] {
  if (!food) return [];

  const types: QuantityType[] = [];

  if (food.raw_quantity && parseQuantityString(food.raw_quantity) !== null) {
    types.push("raw");
  }

  if (food.cooked_quantity && parseQuantityString(food.cooked_quantity) !== null) {
    types.push("cooked");
  }

  return types;
}

/**
 * Get the default quantity type for a food item
 * Prefers "raw" if available, otherwise "cooked", or null if neither
 *
 * @param food - The food item to check
 * @returns The default quantity type or null if none available
 */
export function getDefaultQuantityType(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): QuantityType | null {
  const available = getAvailableQuantityTypes(food);

  if (available.includes("raw")) return "raw";
  if (available.includes("cooked")) return "cooked";

  return null;
}

/**
 * Get the reference quantity for a food item based on quantity type
 *
 * @param food - The food item
 * @param quantityType - The quantity type to get reference for
 * @returns The reference quantity in grams, or 100 as fallback
 */
export function getReferenceQuantity(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined,
  quantityType: QuantityType | null
): number {
  if (!food || !quantityType) return 100;

  const quantityStr = quantityType === "raw" ? food.raw_quantity : food.cooked_quantity;
  const parsed = parseQuantityString(quantityStr);

  return parsed ?? 100;
}

/**
 * Calculate the serving multiplier from quantity input
 *
 * The multiplier is calculated as: entered_quantity / reference_quantity
 *
 * @param quantityGrams - The entered quantity in grams
 * @param quantityType - The type of quantity (raw or cooked)
 * @param food - The food item with reference quantities
 * @returns The calculated multiplier
 *
 * @example
 * // Food item with raw_quantity: "100g"
 * calculateMultiplier(150, "raw", food) // returns 1.5
 * calculateMultiplier(50, "raw", food)  // returns 0.5
 */
export function calculateMultiplier(
  quantityGrams: number | null | undefined,
  quantityType: QuantityType | null,
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): number {
  if (!quantityGrams || quantityGrams <= 0) return 1;

  const referenceQty = getReferenceQuantity(food, quantityType);
  const multiplier = quantityGrams / referenceQty;

  // Round to 2 decimal places
  return Math.round(multiplier * 100) / 100;
}

/**
 * Calculate quantity in grams from a multiplier (reverse of calculateMultiplier)
 * Used when editing existing items that only have multiplier stored (legacy)
 *
 * @param multiplier - The serving multiplier
 * @param quantityType - The type of quantity (raw or cooked)
 * @param food - The food item with reference quantities
 * @returns The calculated quantity in grams
 */
export function calculateQuantityFromMultiplier(
  multiplier: number,
  quantityType: QuantityType | null,
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): number {
  const referenceQty = getReferenceQuantity(food, quantityType);
  const quantity = multiplier * referenceQty;

  // Round to nearest integer for cleaner display
  return Math.round(quantity);
}

/**
 * Validate quantity input
 *
 * Rules:
 * - Quantity must be > 0
 * - Quantity must be <= 5000g
 * - Quantity type required when quantity is entered
 * - Quantity type must match available types on food item
 *
 * @param quantityGrams - The entered quantity in grams
 * @param quantityType - The type of quantity (raw or cooked)
 * @param food - The food item to validate against
 * @returns Validation result with error message if invalid
 */
export function validateQuantityInput(
  quantityGrams: number | null | undefined,
  quantityType: QuantityType | null,
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): QuantityValidationResult {
  // Quantity must be provided
  if (quantityGrams === null || quantityGrams === undefined) {
    return { valid: false, error: "Quantity is required" };
  }

  // Quantity must be positive
  if (quantityGrams <= 0) {
    return { valid: false, error: "Quantity must be greater than 0" };
  }

  // Quantity must not exceed maximum
  if (quantityGrams > 5000) {
    return { valid: false, error: "Quantity cannot exceed 5000g" };
  }

  // Quantity type is required when quantity is entered
  if (!quantityType) {
    return { valid: false, error: "Please select raw or cooked" };
  }

  // Quantity type must match available types
  if (food) {
    const available = getAvailableQuantityTypes(food);
    if (available.length > 0 && !available.includes(quantityType)) {
      return {
        valid: false,
        error: `This food only has ${available.join(" or ")} quantity defined`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format quantity for display
 *
 * @param quantityGrams - The quantity in grams
 * @param quantityType - The type of quantity (raw or cooked)
 * @param quantityNote - Optional descriptive note (e.g., "2 chapatis")
 * @returns Formatted string for display
 *
 * @example
 * formatQuantityDisplay(150, "raw", null) // "150g (raw)"
 * formatQuantityDisplay(150, "cooked", "2 pieces") // "150g (cooked) - 2 pieces"
 * formatQuantityDisplay(null, null, null) // ""
 */
export function formatQuantityDisplay(
  quantityGrams: number | null | undefined,
  quantityType: QuantityType | null | undefined,
  quantityNote: string | null | undefined
): string {
  if (!quantityGrams) return "";

  let display = `${Math.round(quantityGrams)}g`;

  if (quantityType) {
    display += ` (${quantityType})`;
  }

  if (quantityNote?.trim()) {
    display += ` - ${quantityNote.trim()}`;
  }

  return display;
}

/**
 * Check if a food item has any quantity definitions (raw or cooked)
 *
 * @param food - The food item to check
 * @returns True if at least one quantity type is defined
 */
export function hasQuantityDefinitions(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): boolean {
  return getAvailableQuantityTypes(food).length > 0;
}

/**
 * Determine if the raw/cooked toggle should be shown
 * Only show when both raw and cooked quantities are defined
 *
 * @param food - The food item to check
 * @returns True if toggle should be shown
 */
export function shouldShowQuantityTypeToggle(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): boolean {
  const available = getAvailableQuantityTypes(food);
  return available.length === 2;
}

/**
 * Get the initial quantity value when a food item is selected
 * Uses the reference quantity for the default type
 *
 * @param food - The food item
 * @returns Initial quantity value in grams
 */
export function getInitialQuantity(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): number {
  const defaultType = getDefaultQuantityType(food);
  return getReferenceQuantity(food, defaultType);
}
