import { buildMealLabelMap, getMealLabel, sortMealCategories } from "../meal-labels";
import type { MealTypeRow } from "@/lib/database.types";

const mockMealTypes: MealTypeRow[] = [
  {
    id: "1",
    slug: "pre-workout",
    name: "Pre-Workout",
    display_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    slug: "breakfast",
    name: "Breakfast",
    display_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    slug: "lunch",
    name: "Lunch",
    display_order: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    slug: "snack",
    name: "Snack",
    display_order: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "5",
    slug: "evening-snack",
    name: "Evening Snack",
    display_order: 5,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "6",
    slug: "dinner",
    name: "Dinner",
    display_order: 6,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

describe("buildMealLabelMap", () => {
  it("builds a slug → name lookup from meal types", () => {
    const map = buildMealLabelMap(mockMealTypes);
    expect(map).toEqual({
      "pre-workout": "Pre-Workout",
      breakfast: "Breakfast",
      lunch: "Lunch",
      snack: "Snack",
      "evening-snack": "Evening Snack",
      dinner: "Dinner",
    });
  });

  it("returns empty object for empty input", () => {
    expect(buildMealLabelMap([])).toEqual({});
  });
});

describe("getMealLabel", () => {
  const labelMap = buildMealLabelMap(mockMealTypes);

  it("returns the name from the label map when the slug exists", () => {
    expect(getMealLabel("breakfast", labelMap)).toBe("Breakfast");
    expect(getMealLabel("pre-workout", labelMap)).toBe("Pre-Workout");
    expect(getMealLabel("evening-snack", labelMap)).toBe("Evening Snack");
  });

  it("falls back to formatted slug for unknown categories", () => {
    expect(getMealLabel("mid-morning-snack", labelMap)).toBe("Mid Morning Snack");
    expect(getMealLabel("post-workout", labelMap)).toBe("Post Workout");
  });

  it("handles single-word slugs", () => {
    expect(getMealLabel("brunch", {})).toBe("Brunch");
  });

  it("works with empty label map", () => {
    expect(getMealLabel("breakfast", {})).toBe("Breakfast");
    expect(getMealLabel("evening-snack", {})).toBe("Evening Snack");
  });
});

describe("sortMealCategories", () => {
  it("sorts categories by display_order", () => {
    const unsorted = ["dinner", "breakfast", "pre-workout", "lunch"];
    const sorted = sortMealCategories(unsorted, mockMealTypes);
    expect(sorted).toEqual(["pre-workout", "breakfast", "lunch", "dinner"]);
  });

  it("puts unknown categories at the end", () => {
    const categories = ["breakfast", "unknown-meal", "pre-workout"];
    const sorted = sortMealCategories(categories, mockMealTypes);
    expect(sorted).toEqual(["pre-workout", "breakfast", "unknown-meal"]);
  });

  it("does not mutate the original array", () => {
    const original = ["dinner", "breakfast"];
    sortMealCategories(original, mockMealTypes);
    expect(original).toEqual(["dinner", "breakfast"]);
  });

  it("handles empty categories", () => {
    expect(sortMealCategories([], mockMealTypes)).toEqual([]);
  });

  it("handles empty meal types", () => {
    const categories = ["breakfast", "dinner"];
    const sorted = sortMealCategories(categories, []);
    // With no ordering info, original relative order preserved (stable sort)
    expect(sorted).toEqual(["breakfast", "dinner"]);
  });
});
