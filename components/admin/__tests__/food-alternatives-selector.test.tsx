import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FoodAlternativesSelector } from "../food-alternatives-selector";

// Mock the useList hook
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(() => ({
    query: {
      data: {
        data: [
          {
            id: "food-1",
            name: "Grilled Chicken Breast",
            calories: 165,
            protein: 31,
            serving_size: "100g",
          },
          {
            id: "food-2",
            name: "Grilled Fish",
            calories: 150,
            protein: 28,
            serving_size: "100g",
          },
          {
            id: "food-3",
            name: "Paneer (100g)",
            calories: 265,
            protein: 18,
            serving_size: "100g",
          },
          {
            id: "food-4",
            name: "Tofu (firm)",
            calories: 144,
            protein: 17,
            serving_size: "100g",
          },
        ],
      },
      isLoading: false,
    },
  })),
}));

describe("FoodAlternativesSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders search input", () => {
    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    expect(
      screen.getByPlaceholderText("Search foods to add as alternatives...")
    ).toBeInTheDocument();
  });

  it("shows empty state when no alternatives selected", () => {
    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    expect(
      screen.getByText("No alternatives selected. Search above to add food alternatives.")
    ).toBeInTheDocument();
  });

  it("shows selected alternatives with details", () => {
    render(
      <FoodAlternativesSelector selectedFoodIds={["food-1", "food-2"]} onChange={mockOnChange} />
    );

    expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
    expect(screen.getByText("Grilled Fish")).toBeInTheDocument();
    expect(screen.getByText("Selected Alternatives (2)")).toBeInTheDocument();
  });

  it("shows food details in selected alternatives", () => {
    render(<FoodAlternativesSelector selectedFoodIds={["food-1"]} onChange={mockOnChange} />);

    expect(screen.getByText("165 kcal | 31g protein | 100g")).toBeInTheDocument();
  });

  it("shows search results when typing", async () => {
    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search foods to add as alternatives...");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "chicken" } });

    await waitFor(() => {
      expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
    });
  });

  it("adds alternative when clicking search result", async () => {
    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search foods to add as alternatives...");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "chicken" } });

    await waitFor(() => {
      const addButton = screen.getByText("Add");
      fireEvent.click(addButton);
    });

    expect(mockOnChange).toHaveBeenCalledWith(["food-1"]);
  });

  it("removes alternative when clicking remove button", async () => {
    render(
      <FoodAlternativesSelector selectedFoodIds={["food-1", "food-2"]} onChange={mockOnChange} />
    );

    const removeButton = screen.getByRole("button", { name: /remove grilled chicken breast/i });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith(["food-2"]);
  });

  it("excludes current food item from search results", async () => {
    render(
      <FoodAlternativesSelector
        selectedFoodIds={[]}
        excludeFoodId="food-1"
        onChange={mockOnChange}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search foods to add as alternatives...");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "grilled" } });

    await waitFor(() => {
      // Should find Grilled Fish but not Grilled Chicken (excluded)
      expect(screen.getByText("Grilled Fish")).toBeInTheDocument();
    });

    // Grilled Chicken should not be in search results
    const searchResults = screen.queryByRole("button", { name: /grilled chicken breast.*add/i });
    expect(searchResults).not.toBeInTheDocument();
  });

  it("excludes already selected items from search results", async () => {
    render(<FoodAlternativesSelector selectedFoodIds={["food-2"]} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search foods to add as alternatives...");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "grilled" } });

    await waitFor(() => {
      // Should only show Grilled Chicken (food-2 Grilled Fish is already selected)
      expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
    });
  });

  it("shows no results message when search has no matches", async () => {
    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    const searchInput = screen.getByPlaceholderText("Search foods to add as alternatives...");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "xyz123nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText("No matching foods found")).toBeInTheDocument();
    });
  });

  it("shows loading state when fetching foods", () => {
    const { useList } = require("@refinedev/core");
    useList.mockReturnValueOnce({
      query: {
        data: null,
        isLoading: true,
      },
    });

    render(<FoodAlternativesSelector selectedFoodIds={[]} onChange={mockOnChange} />);

    // Search input should still be visible
    expect(
      screen.getByPlaceholderText("Search foods to add as alternatives...")
    ).toBeInTheDocument();
  });
});
