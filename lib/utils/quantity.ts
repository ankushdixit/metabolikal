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
 * Calculate the equivalent quantity in the other form (raw <-> cooked)
 *
 * @param quantityGrams - The entered quantity in grams
 * @param quantityType - The type of quantity entered (raw or cooked)
 * @param food - The food item with reference quantities
 * @returns Object with equivalent grams and type, or null if conversion not possible
 *
 * @example
 * // Food item with raw_quantity: "100g", cooked_quantity: "75g"
 * calculateEquivalentQuantity(50, "raw", food)
 * // returns { equivalentGrams: 37.5, equivalentType: "cooked" }
 *
 * calculateEquivalentQuantity(50, "cooked", food)
 * // returns { equivalentGrams: 66.67, equivalentType: "raw" }
 */
export function calculateEquivalentQuantity(
  quantityGrams: number | null | undefined,
  quantityType: QuantityType | null | undefined,
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): { equivalentGrams: number; equivalentType: QuantityType } | null {
  if (!quantityGrams || !quantityType || !food) return null;

  // Both raw and cooked quantities must be defined for conversion
  const rawQty = parseQuantityString(food.raw_quantity);
  const cookedQty = parseQuantityString(food.cooked_quantity);

  if (rawQty === null || cookedQty === null) return null;

  // Calculate the conversion ratio
  // raw_quantity : cooked_quantity represents the same amount of food
  // e.g., 100g raw = 75g cooked means ratio = 75/100 = 0.75
  const rawToCookedRatio = cookedQty / rawQty;

  if (quantityType === "raw") {
    // Convert raw to cooked: raw * ratio = cooked
    const equivalentGrams = quantityGrams * rawToCookedRatio;
    return {
      equivalentGrams: Math.round(equivalentGrams * 10) / 10, // Round to 1 decimal
      equivalentType: "cooked",
    };
  } else {
    // Convert cooked to raw: cooked / ratio = raw
    const equivalentGrams = quantityGrams / rawToCookedRatio;
    return {
      equivalentGrams: Math.round(equivalentGrams * 10) / 10, // Round to 1 decimal
      equivalentType: "raw",
    };
  }
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
 * Format quantity for display with equivalent quantity in other form
 *
 * Shows both the entered quantity and its equivalent (e.g., "50g (raw) / 37.5g (cooked)")
 * Only shows equivalent when both raw and cooked quantities are defined on the food item.
 *
 * @param quantityGrams - The quantity in grams
 * @param quantityType - The type of quantity (raw or cooked)
 * @param quantityNote - Optional descriptive note (e.g., "2 chapatis")
 * @param food - The food item with reference quantities for conversion
 * @returns Formatted string for display with equivalent
 *
 * @example
 * // Food item with raw_quantity: "100g", cooked_quantity: "75g"
 * formatQuantityDisplayWithEquivalent(50, "raw", null, food)
 * // "50g (raw) / 37.5g (cooked)"
 *
 * formatQuantityDisplayWithEquivalent(50, "cooked", "2 pieces", food)
 * // "50g (cooked) / 66.7g (raw) - 2 pieces"
 *
 * // Food with only raw_quantity defined - no equivalent shown
 * formatQuantityDisplayWithEquivalent(50, "raw", null, { raw_quantity: "100g", cooked_quantity: null })
 * // "50g (raw)"
 */
export function formatQuantityDisplayWithEquivalent(
  quantityGrams: number | null | undefined,
  quantityType: QuantityType | null | undefined,
  quantityNote: string | null | undefined,
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): string {
  if (!quantityGrams) return "";

  let display = `${Math.round(quantityGrams)}g`;

  if (quantityType) {
    display += ` (${quantityType})`;
  }

  // Calculate and add equivalent if both quantities are defined
  const equivalent = calculateEquivalentQuantity(quantityGrams, quantityType, food);
  if (equivalent) {
    // Format equivalent grams - show decimal only if needed
    const equivalentStr =
      equivalent.equivalentGrams % 1 === 0
        ? `${equivalent.equivalentGrams}g`
        : `${equivalent.equivalentGrams}g`;
    display += ` / ${equivalentStr} (${equivalent.equivalentType})`;
  }

  if (quantityNote?.trim()) {
    display += ` - ${quantityNote.trim()}`;
  }

  return display;
}

/**
 * Format quantity display for legacy diet plans that only have serving_multiplier
 *
 * Computes the actual quantities by multiplying the food item's reference
 * raw/cooked quantities by the serving multiplier. Falls back to serving_size
 * when raw/cooked are not defined.
 *
 * @param multiplier - The serving multiplier from the diet plan
 * @param food - The food item with reference quantities
 * @returns Formatted string like "150g (cooked) / 50g (raw)" or "150g"
 *
 * @example
 * // Food with raw_quantity: "33.33", cooked_quantity: "100", multiplier: 1.5
 * formatLegacyQuantityDisplay(1.5, food) // "150g (cooked) / 50g (raw)"
 *
 * // Food with only cooked_quantity: "100", multiplier: 1.7
 * formatLegacyQuantityDisplay(1.7, food) // "170g (cooked)"
 *
 * // Food with no raw/cooked but serving_size: "100g"
 * formatLegacyQuantityDisplay(1.5, food) // "150g"
 */
export function formatLegacyQuantityDisplay(
  multiplier: number,
  food: Pick<FoodItem, "serving_size" | "raw_quantity" | "cooked_quantity"> | null | undefined
): string {
  if (!food) return "";

  const rawRef = parseQuantityString(food.raw_quantity);
  const cookedRef = parseQuantityString(food.cooked_quantity);

  if (cookedRef !== null && rawRef !== null) {
    const actualCooked = Math.round(cookedRef * multiplier);
    const actualRaw = Math.round(rawRef * multiplier * 10) / 10;
    const rawStr = actualRaw % 1 === 0 ? `${actualRaw}` : `${actualRaw}`;
    return `${actualCooked}g (cooked) / ${rawStr}g (raw)`;
  }

  if (cookedRef !== null) {
    return `${Math.round(cookedRef * multiplier)}g (cooked)`;
  }

  if (rawRef !== null) {
    const actualRaw = Math.round(rawRef * multiplier * 10) / 10;
    const rawStr = actualRaw % 1 === 0 ? `${actualRaw}` : `${actualRaw}`;
    return `${rawStr}g (raw)`;
  }

  // No raw/cooked defined, try to derive from serving_size if it's a gram value
  const servingStr = (food.serving_size || "").trim();
  const isGramValue = /^\d+(\.\d+)?\s*(g|grams?)?$/i.test(servingStr);
  if (isGramValue) {
    const servingQty = parseQuantityString(servingStr);
    if (servingQty !== null) {
      return `${Math.round(servingQty * multiplier)}g`;
    }
  }

  // serving_size is descriptive (e.g., "2 eggs", "1 cup") - show as-is
  return servingStr;
}

/**
 * Format reference quantities from a food item for display (no multiplier context)
 *
 * Used in alternatives drawer where there's no plan/multiplier, just the food
 * item's base reference quantities.
 *
 * @param food - The food item with reference quantities
 * @returns Formatted string like "100g cooked / 33g raw" or ""
 */
export function formatReferenceQuantities(
  food: Pick<FoodItem, "raw_quantity" | "cooked_quantity"> | null | undefined
): string {
  if (!food) return "";

  const rawQty = parseQuantityString(food.raw_quantity);
  const cookedQty = parseQuantityString(food.cooked_quantity);

  const parts: string[] = [];
  if (cookedQty !== null) {
    parts.push(`${Math.round(cookedQty)}g cooked`);
  }
  if (rawQty !== null) {
    const rawStr = rawQty % 1 === 0 ? `${rawQty}` : `${Math.round(rawQty * 10) / 10}`;
    parts.push(`${rawStr}g raw`);
  }

  return parts.join(" / ");
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
