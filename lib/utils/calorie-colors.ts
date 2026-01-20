/**
 * Calorie color coding utility
 * Returns color classes based on how a food item's calories compare to the target
 *
 * Color coding:
 * - Green: Within ±10% of target (optimal choice)
 * - Red: >10% above target (higher calories)
 * - Yellow/Amber: >10% below target (lower calories)
 */

export type CalorieColor = "green" | "red" | "yellow";

export interface CalorieColorResult {
  color: CalorieColor;
  borderClass: string;
  bgClass: string;
  textClass: string;
  label: string;
}

/**
 * Get color coding based on calorie comparison
 * @param foodCalories - Calories of the food item
 * @param targetCalories - Target calories for the meal
 * @returns Color classes and label
 */
export function getCalorieColor(foodCalories: number, targetCalories: number): CalorieColorResult {
  if (targetCalories <= 0) {
    // Default to green if no target
    return {
      color: "green",
      borderClass: "border-neon-green",
      bgClass: "bg-neon-green/10",
      textClass: "text-neon-green",
      label: "Optimal",
    };
  }

  const percentageDiff = ((foodCalories - targetCalories) / targetCalories) * 100;

  // Within ±10% - Green (optimal)
  if (Math.abs(percentageDiff) <= 10) {
    return {
      color: "green",
      borderClass: "border-neon-green",
      bgClass: "bg-neon-green/10",
      textClass: "text-neon-green",
      label: "Optimal",
    };
  }

  // >10% above - Red (higher calories)
  if (percentageDiff > 10) {
    return {
      color: "red",
      borderClass: "border-red-500",
      bgClass: "bg-red-500/10",
      textClass: "text-red-500",
      label: "Higher cal",
    };
  }

  // >10% below - Yellow (lower calories)
  return {
    color: "yellow",
    borderClass: "border-yellow-500",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-500",
    label: "Lower cal",
  };
}

/**
 * Get color classes for a food alternative card
 * @param isOptimal - Whether this is the optimal/current selection
 * @param foodCalories - Calories of the food item
 * @param targetCalories - Target calories for the meal
 * @returns Combined class string for the card
 */
export function getAlternativeCardClasses(
  isOptimal: boolean,
  foodCalories: number,
  targetCalories: number
): string {
  const colorResult = getCalorieColor(foodCalories, targetCalories);

  if (isOptimal) {
    return `border-2 ${colorResult.borderClass} ${colorResult.bgClass}`;
  }

  return `border-l-4 ${colorResult.borderClass}`;
}
