import { render, screen, fireEvent } from "@testing-library/react";
import { FoodItemChip, FoodItemChipList } from "../food-item-chip";
import type { FoodItem } from "@/lib/database.types";

const mockFood: FoodItem = {
  id: "1",
  name: "Grilled Chicken",
  calories: 165,
  protein: 31,
  carbs: 0,
  fats: 3.6,
  serving_size: "100g",
  is_vegetarian: false,
  meal_types: ["lunch", "dinner"],
  raw_quantity: "130g raw",
  cooked_quantity: "100g cooked",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const mockVegFood: FoodItem = {
  ...mockFood,
  id: "2",
  name: "Greek Yogurt",
  calories: 100,
  protein: 17,
  is_vegetarian: true,
};

describe("FoodItemChip", () => {
  it("renders food item info", () => {
    render(<FoodItemChip food={mockFood} />);

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("165 kcal")).toBeInTheDocument();
    expect(screen.getByText("31g protein")).toBeInTheDocument();
    expect(screen.getByText("100g")).toBeInTheDocument();
  });

  it("shows vegetarian indicator for vegetarian foods", () => {
    const { container } = render(<FoodItemChip food={mockVegFood} />);

    // Should have a leaf icon
    const leafIcon = container.querySelector(".text-neon-green");
    expect(leafIcon).toBeInTheDocument();
  });

  it("does not show vegetarian indicator for non-vegetarian foods", () => {
    const { container } = render(<FoodItemChip food={mockFood} />);

    // Should not have a leaf icon for non-veg food
    const leafIcons = container.querySelectorAll(".lucide-leaf");
    expect(leafIcons.length).toBe(0);
  });

  it("renders add button for selectable variant", () => {
    const mockOnAdd = jest.fn();

    render(<FoodItemChip food={mockFood} variant="selectable" onAdd={mockOnAdd} />);

    const addButton = screen.getByText("Add");
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it("renders remove button for selected variant", () => {
    const mockOnRemove = jest.fn();

    render(<FoodItemChip food={mockFood} variant="selected" onRemove={mockOnRemove} />);

    const removeButton = screen.getByLabelText(`Remove ${mockFood.name}`);
    expect(removeButton).toBeInTheDocument();

    fireEvent.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it("triggers onAdd when clicking the card in selectable variant", () => {
    const mockOnAdd = jest.fn();

    const { container } = render(
      <FoodItemChip food={mockFood} variant="selectable" onAdd={mockOnAdd} />
    );

    const card = container.firstChild;
    fireEvent.click(card!);
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it("does not show action buttons for default variant", () => {
    render(<FoodItemChip food={mockFood} variant="default" />);

    expect(screen.queryByText("Add")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(`Remove ${mockFood.name}`)).not.toBeInTheDocument();
  });
});

describe("FoodItemChipList", () => {
  const foods = [mockFood, mockVegFood];

  it("renders list of food items", () => {
    render(<FoodItemChipList foods={foods} />);

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Greek Yogurt")).toBeInTheDocument();
  });

  it("shows empty message when no foods", () => {
    render(<FoodItemChipList foods={[]} emptyMessage="No foods available" />);

    expect(screen.getByText("No foods available")).toBeInTheDocument();
  });

  it("shows default empty message", () => {
    render(<FoodItemChipList foods={[]} />);

    expect(screen.getByText("No food items")).toBeInTheDocument();
  });

  it("passes onAdd handler to chips", () => {
    const mockOnAdd = jest.fn();

    render(<FoodItemChipList foods={foods} variant="selectable" onAdd={mockOnAdd} />);

    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    expect(mockOnAdd).toHaveBeenCalledWith(mockFood);
  });

  it("passes onRemove handler to chips", () => {
    const mockOnRemove = jest.fn();

    render(<FoodItemChipList foods={foods} variant="selected" onRemove={mockOnRemove} />);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemove).toHaveBeenCalledWith(mockFood);
  });
});
