import { render, screen, fireEvent } from "@testing-library/react";
import { FoodLogForm } from "../food-log-form";

const mockFoodItem = {
  id: "food-1",
  name: "Grilled Chicken Breast",
  calories: 300,
  protein: 35,
  serving_size: "200g",
  raw_quantity: "200g",
  cooked_quantity: "150g",
};

const mockFoodItemNoQuantity = {
  id: "food-2",
  name: "Mystery Food",
  calories: 100,
  protein: 10,
  serving_size: "100g",
  raw_quantity: null,
  cooked_quantity: null,
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
    // "200g" appears both as serving_size and as a preset button
    expect(screen.getAllByText("200g").length).toBeGreaterThanOrEqual(1);
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

  it("displays quick quantity preset buttons", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("50g")).toBeInTheDocument();
    expect(screen.getByText("100g")).toBeInTheDocument();
    expect(screen.getByText("150g")).toBeInTheDocument();
    // "200g" appears both as serving_size and as a preset button
    expect(screen.getAllByText("200g").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("250g")).toBeInTheDocument();
    expect(screen.getByText("300g")).toBeInTheDocument();
  });

  it("shows raw/cooked toggle when food has both quantities defined", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(screen.getByText("Raw")).toBeInTheDocument();
    expect(screen.getByText("Cooked")).toBeInTheDocument();
  });

  it("shows correct default values with initial quantity", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    // Default quantity should be the raw_quantity value (200g) which equals 1x multiplier
    expect(screen.getByText("300")).toBeInTheDocument(); // calories
    expect(screen.getByText("35")).toBeInTheDocument(); // protein
  });

  it("calculates nutrition values correctly with different quantity", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    // Click 100g preset (which is 0.5x of 200g raw quantity)
    fireEvent.click(screen.getByText("100g"));

    // 300 * 0.5 = 150
    expect(screen.getByText("150")).toBeInTheDocument();
    // 35 * 0.5 = 17.5, rounded to 18
    expect(screen.getByText("18")).toBeInTheDocument();
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

    expect(mockOnLogFood).toHaveBeenCalledWith(
      expect.objectContaining({
        food_item_id: "food-1",
        calories: 300,
        protein: 35,
        serving_multiplier: 1,
        meal_category: "breakfast",
        quantity_grams: 200,
        quantity_type: "raw",
      })
    );
  });

  it("calls onLogFood with adjusted values when quantity is changed", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    // Click 300g preset (which is 1.5x of 200g raw quantity)
    fireEvent.click(screen.getByText("300g"));
    fireEvent.click(screen.getByText("Log Food"));

    expect(mockOnLogFood).toHaveBeenCalledWith(
      expect.objectContaining({
        food_item_id: "food-1",
        calories: 450, // 300 * 1.5
        protein: 53, // 35 * 1.5 rounded
        serving_multiplier: 1.5,
        meal_category: "breakfast",
        quantity_grams: 300,
        quantity_type: "raw",
      })
    );
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

  it("highlights selected quantity preset button", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    // Click 150g preset
    fireEvent.click(screen.getByText("150g"));

    // 150g should be selected with gradient-electric class
    expect(screen.getByText("150g")).toHaveClass("gradient-electric");
  });

  it("shows warning when food has no quantity definitions", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItemNoQuantity}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );
    expect(
      screen.getByText("No quantity reference defined. Using 100g as base.")
    ).toBeInTheDocument();
  });

  it("uses initial quantity values when provided", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
        initialQuantityGrams={150}
        initialQuantityType="cooked"
        initialQuantityNote="2 pieces"
      />
    );

    // Should show the note input with initial value
    const noteInput = screen.getByPlaceholderText("Note (e.g., 2 chapatis)");
    expect(noteInput).toHaveValue("2 pieces");
  });

  it("allows entering custom quantity via input", () => {
    render(
      <FoodLogForm
        isOpen={true}
        onClose={mockOnClose}
        foodItem={mockFoodItem}
        mealCategory="breakfast"
        onLogFood={mockOnLogFood}
      />
    );

    // Find quantity input and change it
    const quantityInput = screen.getByRole("spinbutton");
    fireEvent.change(quantityInput, { target: { value: "400" } });
    fireEvent.click(screen.getByText("Log Food"));

    // 400g is 2x of 200g raw quantity
    expect(mockOnLogFood).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity_grams: 400,
        serving_multiplier: 2,
      })
    );
  });
});
