import { render, screen, fireEvent } from "@testing-library/react";
import { AlternativesLinker, type AlternativeChange } from "../alternatives-linker";
import type { FoodItem, FoodItemAlternativeRow } from "@/lib/database.types";

const mockFoods: FoodItem[] = [
  {
    id: "1",
    name: "Grilled Chicken",
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
    serving_size: "100g",
    is_vegetarian: false,
    meal_types: null,
    raw_quantity: null,
    cooked_quantity: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "2",
    name: "Turkey Breast",
    calories: 135,
    protein: 30,
    carbs: 0,
    fats: 1,
    serving_size: "100g",
    is_vegetarian: false,
    meal_types: null,
    raw_quantity: null,
    cooked_quantity: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "3",
    name: "Tofu",
    calories: 144,
    protein: 17,
    carbs: 3,
    fats: 9,
    serving_size: "100g",
    is_vegetarian: true,
    meal_types: null,
    raw_quantity: null,
    cooked_quantity: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

const mockAlternatives: FoodItemAlternativeRow[] = [
  {
    id: "alt-1",
    food_item_id: "1",
    alternative_food_id: "2",
    display_order: 1,
    created_at: "2024-01-01",
  },
];

describe("AlternativesLinker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    render(
      <AlternativesLinker
        foodItems={[]}
        alternatives={[]}
        isLoading={true}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/loading food items/i)).toBeInTheDocument();
  });

  it("renders two panels", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/select primary food/i)).toBeInTheDocument();
    expect(screen.getByText(/select a food item/i)).toBeInTheDocument();
  });

  it("shows food items in left panel", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Turkey Breast")).toBeInTheDocument();
    expect(screen.getByText("Tofu")).toBeInTheDocument();
  });

  it("filters food items by search", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    const searchInput = screen.getAllByPlaceholderText("Search foods...")[0];
    fireEvent.change(searchInput, { target: { value: "chicken" } });

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.queryByText("Turkey Breast")).not.toBeInTheDocument();
    expect(screen.queryByText("Tofu")).not.toBeInTheDocument();
  });

  it("selects primary food when clicked", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Should show alternatives panel for chicken
    expect(screen.getByText(/alternatives for/i)).toBeInTheDocument();
    expect(screen.getByText(/"Grilled Chicken"/)).toBeInTheDocument();
  });

  it("shows existing alternatives for selected food", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Should show Turkey Breast as alternative
    expect(screen.getByText(/current alternatives/i)).toBeInTheDocument();
    // Turkey should appear in the current alternatives section
  });

  it("calls onChange when adding alternative", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={[]} // No existing alternatives
        onChange={mockOnChange}
      />
    );

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Find and click add button for Tofu
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    expect(mockOnChange).toHaveBeenCalled();
    const changes: AlternativeChange[] = mockOnChange.mock.calls[0][0];
    expect(changes.length).toBe(1);
    expect(changes[0].type).toBe("add");
    expect(changes[0].foodItemId).toBe("1");
  });

  it("shows item count stats", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    // Should show stats about items with/without alternatives
    expect(screen.getByText(/items with alternatives/i)).toBeInTheDocument();
    expect(screen.getByText(/without/i)).toBeInTheDocument();
  });

  it("shows indicator for foods that have alternatives", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    // Chicken has alternatives, should have indicator
    const chickenItem = screen.getByText("Grilled Chicken").closest("button");
    expect(chickenItem?.querySelector(".lucide-arrow-left-right")).toBeInTheDocument();
  });

  it("shows pending changes summary", () => {
    render(<AlternativesLinker foodItems={mockFoods} alternatives={[]} onChange={mockOnChange} />);

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Add an alternative
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    // Should show pending changes
    expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    expect(screen.getByText(/links to add/i)).toBeInTheDocument();
  });

  it("shows remove count in pending changes when removing alternatives", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    // Select chicken (which has Turkey Breast as alternative)
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Remove the existing alternative (Turkey Breast) using aria-label
    const removeButton = screen.getByRole("button", { name: /remove turkey breast/i });
    fireEvent.click(removeButton);

    // Should show remove count
    expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    expect(screen.getByText(/links to remove/i)).toBeInTheDocument();
  });

  it("cancels a pending add when removing that alternative", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={[]} // No existing alternatives
        onChange={mockOnChange}
      />
    );

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Add Turkey Breast as alternative
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const firstChanges = mockOnChange.mock.calls[0][0];
    expect(firstChanges.length).toBe(1);
    expect(firstChanges[0].type).toBe("add");

    // Now remove it (cancels the pending add) - Turkey Breast should now be in "selected" variant
    const removeButton = screen.getByRole("button", { name: /remove turkey breast/i });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledTimes(2);
    const secondChanges = mockOnChange.mock.calls[1][0];
    // The add should be cancelled, resulting in 0 changes
    expect(secondChanges.length).toBe(0);
  });

  it("cancels a pending remove when re-adding that alternative", () => {
    render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={mockAlternatives}
        onChange={mockOnChange}
      />
    );

    // Select chicken (which has Turkey Breast as existing alternative)
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Remove existing alternative (Turkey Breast) using aria-label
    const removeButton = screen.getByRole("button", { name: /remove turkey breast/i });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const firstChanges = mockOnChange.mock.calls[0][0];
    expect(firstChanges[0].type).toBe("remove");

    // After removal, Turkey Breast should appear in available alternatives
    // Find all Add buttons and click the one for Turkey Breast
    const addButtons = screen.getAllByText("Add");
    // Click each add button that's in the available alternatives panel
    // (Turkey Breast should be among the selectable chips now)
    for (const btn of addButtons) {
      // Walk up to find the parent chip that contains "Turkey Breast"
      let el: HTMLElement | null = btn;
      while (el && !el.textContent?.includes("Turkey Breast")) {
        el = el.parentElement;
      }
      if (el && el.textContent?.includes("Turkey Breast") && el.textContent?.includes("Add")) {
        fireEvent.click(btn);
        break;
      }
    }

    expect(mockOnChange).toHaveBeenCalledTimes(2);
    const secondChanges = mockOnChange.mock.calls[1][0];
    // The remove should be cancelled, resulting in 0 changes
    expect(secondChanges.length).toBe(0);
  });

  it("filters available alternatives by search text", () => {
    render(<AlternativesLinker foodItems={mockFoods} alternatives={[]} onChange={mockOnChange} />);

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Search for "tofu" in the alternatives panel
    const searchInputs = screen.getAllByPlaceholderText(/search/i);
    const alternativesSearch = searchInputs[1]; // Second search input is for alternatives
    fireEvent.change(alternativesSearch, { target: { value: "tofu" } });

    // Should still have Tofu visible (in both left panel and alternatives)
    const tofuElements = screen.getAllByText("Tofu");
    expect(tofuElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty message when alternative search has no results", () => {
    render(<AlternativesLinker foodItems={mockFoods} alternatives={[]} onChange={mockOnChange} />);

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Search for something that doesn't exist
    const searchInputs = screen.getAllByPlaceholderText(/search/i);
    const alternativesSearch = searchInputs[1];
    fireEvent.change(alternativesSearch, { target: { value: "nonexistentfood" } });

    expect(screen.getByText("No matching foods found")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AlternativesLinker
        foodItems={mockFoods}
        alternatives={[]}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("clears alternative search when selecting a different primary food", () => {
    render(<AlternativesLinker foodItems={mockFoods} alternatives={[]} onChange={mockOnChange} />);

    // Select chicken
    const chickenButton = screen.getByText("Grilled Chicken").closest("button");
    fireEvent.click(chickenButton!);

    // Type in the alternatives search
    const searchInputs = screen.getAllByPlaceholderText(/search/i);
    const alternativesSearch = searchInputs[1];
    fireEvent.change(alternativesSearch, { target: { value: "tofu" } });

    // Switch to Turkey Breast
    const turkeyButton = screen.getByText("Turkey Breast").closest("button");
    fireEvent.click(turkeyButton!);

    // Alternatives search should be reset
    expect(alternativesSearch).toHaveValue("");
  });
});
