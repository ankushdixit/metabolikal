import { render, screen, fireEvent } from "@testing-library/react";
import { FoodAlternativesDrawer } from "../food-alternatives-drawer";

const mockCurrentFoodItem = {
  id: "food-1",
  name: "Grilled Chicken Breast",
  calories: 300,
  protein: 35,
  serving_size: "200g",
  is_vegetarian: false,
};

const mockAlternatives = [
  {
    id: "alt-1",
    food_item_id: "food-2",
    is_optimal: false,
    food_items: {
      id: "food-2",
      name: "Salmon Fillet",
      calories: 350,
      protein: 40,
      serving_size: "180g",
      is_vegetarian: false,
    },
  },
  {
    id: "alt-2",
    food_item_id: "food-3",
    is_optimal: false,
    food_items: {
      id: "food-3",
      name: "Tofu Steak",
      calories: 250,
      protein: 20,
      serving_size: "150g",
      is_vegetarian: true,
    },
  },
  {
    id: "alt-3",
    food_item_id: "food-4",
    is_optimal: false,
    food_items: {
      id: "food-4",
      name: "Beef Steak",
      calories: 400,
      protein: 45,
      serving_size: "200g",
      is_vegetarian: false,
    },
  },
];

describe("FoodAlternativesDrawer Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSelectAlternative = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={false}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.queryByText("Breakfast Alternatives")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    // Check for the title which contains both "Breakfast" and "Alternatives"
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Breakfast");
    expect(screen.getByText("Select a food to swap into your meal plan")).toBeInTheDocument();
  });

  it("displays current selection", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("Current Selection")).toBeInTheDocument();
    expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
  });

  it("displays all alternatives", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("Salmon Fillet")).toBeInTheDocument();
    expect(screen.getByText("Tofu Steak")).toBeInTheDocument();
    expect(screen.getByText("Beef Steak")).toBeInTheDocument();
  });

  it("displays calories and protein for each alternative", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("350")).toBeInTheDocument(); // Salmon calories
    expect(screen.getByText("40g")).toBeInTheDocument(); // Salmon protein (with g suffix)
  });

  it("displays vegetarian filter toggle", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("Show vegetarian only")).toBeInTheDocument();
  });

  it("filters to vegetarian only when toggle is clicked", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );

    // Click the vegetarian filter
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Only Tofu Steak should be visible (it's vegetarian)
    expect(screen.getByText("Tofu Steak")).toBeInTheDocument();
    expect(screen.queryByText("Salmon Fillet")).not.toBeInTheDocument();
    expect(screen.queryByText("Beef Steak")).not.toBeInTheDocument();
  });

  it("displays color legend", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("Optimal (±10%)")).toBeInTheDocument();
    // Use getAllByText since these labels appear in legend AND on cards
    expect(screen.getAllByText("Higher cal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Lower cal").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onSelectAlternative when alternative is clicked", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );

    fireEvent.click(screen.getByText("Salmon Fillet"));
    expect(mockOnSelectAlternative).toHaveBeenCalledWith("food-2");
  });

  it("shows empty state when no alternatives available", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={[]}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("No alternatives available")).toBeInTheDocument();
  });

  it("shows empty state for vegetarian filter when no vegetarian alternatives", () => {
    const nonVegAlternatives = mockAlternatives.filter((alt) => !alt.food_items.is_vegetarian);

    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={nonVegAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );

    // Click the vegetarian filter
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(screen.getByText("No vegetarian alternatives available")).toBeInTheDocument();
  });

  it("displays correct count of alternatives", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
      />
    );
    expect(screen.getByText("Available Alternatives (3)")).toBeInTheDocument();
  });

  it("disables alternatives when isUpdating is true", () => {
    render(
      <FoodAlternativesDrawer
        isOpen={true}
        onClose={mockOnClose}
        mealCategory="breakfast"
        currentFoodItem={mockCurrentFoodItem}
        alternatives={mockAlternatives}
        targetCalories={300}
        onSelectAlternative={mockOnSelectAlternative}
        isUpdating={true}
      />
    );

    const alternativeButton = screen.getByText("Salmon Fillet").closest("button");
    expect(alternativeButton).toBeDisabled();
  });
});
