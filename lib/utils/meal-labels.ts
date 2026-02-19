/**
 * Pure utility functions for meal category labels and sorting.
 * No React, no hooks — safe to use anywhere.
 */

import type { MealTypeRow } from "@/lib/database.types";

/**
 * Build a slug → display-name lookup map from meal types.
 */
export function buildMealLabelMap(mealTypes: MealTypeRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const mt of mealTypes) {
    map[mt.slug] = mt.name;
  }
  return map;
}

/**
 * Get the display label for a meal category slug.
 * Falls back to formatting the slug itself (e.g. "evening-snack" → "Evening Snack").
 */
export function getMealLabel(slug: string, labelMap: Record<string, string>): string {
  if (labelMap[slug]) return labelMap[slug];
  // Fallback: capitalize each word, replace hyphens with spaces
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Sort an array of meal category slugs by the display_order of the
 * corresponding meal types. Unknown slugs sort to the end.
 */
export function sortMealCategories(categories: string[], mealTypes: MealTypeRow[]): string[] {
  const orderMap = new Map<string, number>();
  for (const mt of mealTypes) {
    orderMap.set(mt.slug, mt.display_order);
  }
  return [...categories].sort((a, b) => {
    const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
    const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
    return oa - ob;
  });
}
