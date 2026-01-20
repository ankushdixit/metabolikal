import { render, screen, fireEvent } from "@testing-library/react";
import { FoodLogForm } from "../food-log-form";

const mockFoodItem = {
  id: "food-1",
  name: "Grilled Chicken Breast",
  calories: 300,
  protein: 35,
  serving_size: "200g",
};

describe("FoodLogForm Component", () => {
  const mockOnClose = jest.fn();
  const mockOnLogFood = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <FoodLogForm
        isOpen={false}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.queryByText("Log Food")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Log")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("displays food item name", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
  });

  it("displays serving size", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("200g")).toBeInTheDocument();
  });

  it("displays meal category", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
  });

  it("displays all serving multiplier options", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("0.5x")).toBeInTheDocument();
    expect(screen.getByText("0.75x")).toBeInTheDocument();
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("1.25x")).toBeInTheDocument();
    expect(screen.getByText("1.5x")).toBeInTheDocument();
    expect(screen.getByText("2x")).toBeInTheDocument();
  });

  it("shows correct default values with 1x multiplier", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("300")).toBeInTheDocument(); // calories
    expect(screen.getByText("35")).toBeInTheDocument(); // protein
  });

  it("calculates nutrition values correctly with 0.5x multiplier", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    fireEvent.click(screen.getByText("0.5x"));

    // 300 * 0.5 = 150
    expect(screen.getByText("150")).toBeInTheDocument();
    // 35 * 0.5 = 17.5, rounded to 18
    expect(screen.getByText("18")).toBeInTheDocument();
  });

  it("calculates nutrition values correctly with 2x multiplier", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    fireEvent.click(screen.getByText("2x"));

    // 300 * 2 = 600
    expect(screen.getByText("600")).toBeInTheDocument();
    // 35 * 2 = 70
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("calls onLogFood with correct data when Log Food button is clicked", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    fireEvent.click(screen.getByText("Log Food"));

    expect(mockOnLogFood).toHaveBeenCalledWith({
      food_item_id: "food-1",
      calories: 300,
      protein: 35,
      serving_multiplier: 1,
      meal_category: "breakfast",
    });
  });

  it("calls onLogFood with adjusted values when multiplier is selected", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    fireEvent.click(screen.getByText("1.5x"));
    fireEvent.click(screen.getByText("Log Food"));

    expect(mockOnLogFood).toHaveBeenCalledWith({
      food_item_id: "food-1",
      calories: 450, // 300 * 1.5
      protein: 53, // 35 * 1.5 rounded
      serving_multiplier: 1.5,
      meal_category: "breakfast",
    });
  });

  it("shows Logging... when isLogging is true", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
        isLogging={true}
      />
    );
    expect(screen.getByText("Logging...")).toBeInTheDocument();
  });

  it("disables button when isLogging is true", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
        isLogging={true}
      />
    );
    const button = screen.getByText("Logging...").closest("button");
    expect(button).toBeDisabled();
  });

  it("does not render when foodItem is null", () => {
    const { container } = render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={null}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("highlights selected multiplier button", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    // 1x should be selected by default with gradient-electric class
    const oneXButton = screen.getByText("1x");
    expect(oneXButton).toHaveClass("gradient-electric");

    // Click 2x
    fireEvent.click(screen.getByText("2x"));

    // Now 2x should have gradient-electric class
    expect(screen.getByText("2x")).toHaveClass("gradient-electric");
    // 1x should no longer have it
    expect(screen.getByText("1x")).not.toHaveClass("gradient-electric");
  });
});
