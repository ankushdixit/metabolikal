import { render, screen, fireEvent } from "@testing-library/react";
import { MealCard, MEAL_LABELS } from "../meal-card";
import type { MealCategory } from "@/lib/database.types";

const mockFoodItem = {
  id: "food-1",
  name: "Grilled Chicken Breast",
  calories: 300,
  protein: 35,
  serving_size: "200g",
  is_vegetarian: false,
};

describe("MealCard Component", () => {
  const mockOnSeeAlternatives = jest.fn();
  const mockOnLogFood = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all 6 meal category labels correctly", () => {
    const categories: MealCategory[] = [
      "pre-workout",
      "post-workout",
      "breakfast",
      "lunch",
      "evening-snack",
      "dinner",
    ];

    categories.forEach((category) => {
      const { unmount } = render(
        <MealCard
          mealCategory={category}
          foodItem={mockFoodItem}
          servingMultiplier={1}
          onSeeAlternatives={mockOnSeeAlternatives}
          onLogFood={mockOnLogFood}
        />
      );
      expect(screen.getByText(MEAL_LABELS[category])).toBeInTheDocument();
      unmount();
    });
  });

  it("displays food item name", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
  });

  it("displays calories and protein values", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("g protein")).toBeInTheDocument();
  });

  it("calculates adjusted values based on serving multiplier", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1.5}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    // 300 * 1.5 = 450 calories
    expect(screen.getByText("450")).toBeInTheDocument();
    // 35 * 1.5 = 52.5 rounded to 53
    expect(screen.getByText("53")).toBeInTheDocument();
    // Should show multiplier badge
    expect(screen.getByText("1.5x serving")).toBeInTheDocument();
  });

  it("displays serving size", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("200g")).toBeInTheDocument();
  });

  it("has See Alternatives button", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("See Alternatives")).toBeInTheDocument();
  });

  it("has Log This button", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Log This")).toBeInTheDocument();
  });

  it("calls onSeeAlternatives when button is clicked", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    fireEvent.click(screen.getByText("See Alternatives"));
    expect(mockOnSeeAlternatives).toHaveBeenCalledTimes(1);
  });

  it("calls onLogFood when button is clicked", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    fireEvent.click(screen.getByText("Log This"));
    expect(mockOnLogFood).toHaveBeenCalledTimes(1);
  });

  it("renders No meal assigned when foodItem is null", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={null}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("No meal assigned")).toBeInTheDocument();
  });

  it("does not show multiplier badge when multiplier is 1", () => {
    render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.queryByText(/serving$/)).not.toBeInTheDocument();
  });

  it("renders athletic card styling", () => {
    const { container } = render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("applies btn-athletic class to buttons", () => {
    const { container } = render(
      <MealCard
        mealCategory="breakfast"
        foodItem={mockFoodItem}
        servingMultiplier={1}
        onSeeAlternatives={mockOnSeeAlternatives}
        onLogFood={mockOnLogFood}
      />
    );
    const buttons = container.querySelectorAll(".btn-athletic");
    expect(buttons.length).toBe(2);
  });
});
