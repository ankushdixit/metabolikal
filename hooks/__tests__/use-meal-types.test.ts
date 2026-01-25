import { DEFAULT_MEAL_TYPES } from "../use-meal-types";

describe("DEFAULT_MEAL_TYPES", () => {
  it("has 6 default meal types", () => {
    expect(DEFAULT_MEAL_TYPES).toHaveLength(6);
  });

  it("has all expected meal types", () => {
    const slugs = DEFAULT_MEAL_TYPES.map((mt) => mt.slug);
    expect(slugs).toContain("breakfast");
    expect(slugs).toContain("lunch");
    expect(slugs).toContain("dinner");
    expect(slugs).toContain("snack");
    expect(slugs).toContain("pre-workout");
    expect(slugs).toContain("post-workout");
  });

  it("has correct names for each meal type", () => {
    const getName = (slug: string) => DEFAULT_MEAL_TYPES.find((mt) => mt.slug === slug)?.name;

    expect(getName("breakfast")).toBe("Breakfast");
    expect(getName("lunch")).toBe("Lunch");
    expect(getName("dinner")).toBe("Dinner");
    expect(getName("snack")).toBe("Snack");
    expect(getName("pre-workout")).toBe("Pre-Workout");
    expect(getName("post-workout")).toBe("Post-Workout");
  });

  it("each meal type has name and slug properties", () => {
    DEFAULT_MEAL_TYPES.forEach((mealType) => {
      expect(mealType).toHaveProperty("name");
      expect(mealType).toHaveProperty("slug");
      expect(typeof mealType.name).toBe("string");
      expect(typeof mealType.slug).toBe("string");
    });
  });

  it("slugs are lowercase with hyphens", () => {
    DEFAULT_MEAL_TYPES.forEach((mealType) => {
      expect(mealType.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
