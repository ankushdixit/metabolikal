/**
 * Tests for DailyDietSection component
 */

import { render, screen } from "@testing-library/react";
import { DailyDietSection } from "../daily-diet-section";
import type { MealCategory } from "@/lib/database.types";
import type { DietPlanWithFood, DietTotals } from "@/hooks/use-daily-plan-data";

describe("DailyDietSection", () => {
  const mockDietPlan: DietPlanWithFood = {
    id: "plan-1",
    client_id: "client-1",
    day_number: 1,
    meal_category: "breakfast",
    food_item_id: "food-1",
    serving_multiplier: 1,
    notes: null,
    time_type: null,
    time_start: null,
    time_end: null,
    time_period: null,
    relative_anchor: null,
    relative_offset_minutes: 0,
    display_order: 0,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    food_items: {
      id: "food-1",
      name: "Oatmeal",
      calories: 150,
      protein: 5,
      carbs: 27,
      fats: 3,
      serving_size: "1 cup",
      is_vegetarian: true,
      meal_types: null,
      raw_quantity: null,
      cooked_quantity: null,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
  };

  const emptyDietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
  const emptyTotals: DietTotals = {
    totalCalories: 0,
    totalProtein: 0,
    mealCount: 0,
  };

  it("renders empty state when no meals are planned", () => {
    render(<DailyDietSection dietByMeal={emptyDietByMeal} totals={emptyTotals} />);
    expect(screen.getByText("No meals planned")).toBeInTheDocument();
  });

  it("renders diet plan header", () => {
    render(<DailyDietSection dietByMeal={emptyDietByMeal} totals={emptyTotals} />);
    expect(screen.getByText(/Diet/)).toBeInTheDocument();
    expect(screen.getByText(/Plan/)).toBeInTheDocument();
  });

  it("renders meals grouped by category", () => {
    const dietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
    dietByMeal.set("breakfast", [mockDietPlan]);
    const totals: DietTotals = {
      totalCalories: 150,
      totalProtein: 5,
      mealCount: 1,
    };

    render(<DailyDietSection dietByMeal={dietByMeal} totals={totals} />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    // The calorie count appears in both the item and totals
    expect(screen.getAllByText(/150/).length).toBeGreaterThan(0);
  });

  it("renders serving multiplier when not 1", () => {
    const planWithMultiplier: DietPlanWithFood = {
      ...mockDietPlan,
      serving_multiplier: 2,
    };
    const dietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
    dietByMeal.set("breakfast", [planWithMultiplier]);
    const totals: DietTotals = {
      totalCalories: 300,
      totalProtein: 10,
      mealCount: 1,
    };

    render(<DailyDietSection dietByMeal={dietByMeal} totals={totals} />);

    expect(screen.getByText(/x2/)).toBeInTheDocument();
    // Multiple elements contain "300" - the item and the totals
    expect(screen.getAllByText(/300/).length).toBeGreaterThan(0);
  });

  it("renders totals correctly", () => {
    const dietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
    dietByMeal.set("breakfast", [mockDietPlan]);
    const totals: DietTotals = {
      totalCalories: 1500,
      totalProtein: 80,
      mealCount: 3,
    };

    render(<DailyDietSection dietByMeal={dietByMeal} totals={totals} />);

    expect(screen.getByText(/1,500 cal/)).toBeInTheDocument();
    expect(screen.getByText(/80g protein/)).toBeInTheDocument();
  });

  it("renders multiple meal categories in correct order", () => {
    const breakfastPlan: DietPlanWithFood = {
      ...mockDietPlan,
      id: "1",
      meal_category: "breakfast",
    };
    const lunchPlan: DietPlanWithFood = {
      ...mockDietPlan,
      id: "2",
      meal_category: "lunch",
      food_items: { ...mockDietPlan.food_items!, name: "Salad" },
    };
    const dinnerPlan: DietPlanWithFood = {
      ...mockDietPlan,
      id: "3",
      meal_category: "dinner",
      food_items: { ...mockDietPlan.food_items!, name: "Chicken" },
    };

    const dietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
    dietByMeal.set("breakfast", [breakfastPlan]);
    dietByMeal.set("lunch", [lunchPlan]);
    dietByMeal.set("dinner", [dinnerPlan]);

    const totals: DietTotals = { totalCalories: 450, totalProtein: 15, mealCount: 3 };

    render(<DailyDietSection dietByMeal={dietByMeal} totals={totals} />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();
  });

  it("handles unknown food gracefully", () => {
    const planWithoutFood: DietPlanWithFood = {
      ...mockDietPlan,
      food_items: null,
    };
    const dietByMeal = new Map<MealCategory, DietPlanWithFood[]>();
    dietByMeal.set("breakfast", [planWithoutFood]);
    const totals: DietTotals = { totalCalories: 0, totalProtein: 0, mealCount: 1 };

    render(<DailyDietSection dietByMeal={dietByMeal} totals={totals} />);

    expect(screen.getByText("Unknown Food")).toBeInTheDocument();
  });
});
