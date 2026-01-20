import { render, screen, fireEvent } from "@testing-library/react";
import { FoodSearch } from "../food-search";

const mockSearchResults = [
  {
    id: "food-1",
    name: "Grilled Chicken",
    calories: 300,
    protein: 35,
    serving_size: "200g",
    is_vegetarian: false,
  },
  {
    id: "food-2",
    name: "Brown Rice",
    calories: 200,
    protein: 5,
    serving_size: "150g",
    is_vegetarian: true,
  },
];

describe("FoodSearch Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSearchChange = jest.fn();
  const mockOnSelectFood = jest.fn();
  const mockOnLogCustomFood = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <FoodSearch
        isOpen={false}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );
    expect(screen.queryByText("Log")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );
    expect(screen.getByText("Log")).toBeInTheDocument();
    expect(screen.getByText("Custom Food")).toBeInTheDocument();
  });

  it("displays search input", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );
    expect(screen.getByPlaceholderText("Search food items (min 2 characters)")).toBeInTheDocument();
  });

  it("calls onSearchChange when typing in search", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    const input = screen.getByPlaceholderText("Search food items (min 2 characters)");
    fireEvent.change(input, { target: { value: "chicken" } });

    expect(mockOnSearchChange).toHaveBeenCalledWith("chicken");
  });

  it("displays search results when query has 2+ characters", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="ch"
        onSearchChange={mockOnSearchChange}
        searchResults={mockSearchResults}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Brown Rice")).toBeInTheDocument();
  });

  it("displays calories and protein for search results", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="ch"
        onSearchChange={mockOnSearchChange}
        searchResults={mockSearchResults}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("300 kcal")).toBeInTheDocument();
    expect(screen.getByText("35g protein")).toBeInTheDocument();
  });

  it("shows Searching... when isSearching is true", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="ch"
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={true}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it("shows no results message when search returns empty", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="xyz"
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("No food items found")).toBeInTheDocument();
  });

  it("calls onSelectFood when search result is clicked", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="ch"
        onSearchChange={mockOnSearchChange}
        searchResults={mockSearchResults}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    fireEvent.click(screen.getByText("Grilled Chicken"));

    expect(mockOnSelectFood).toHaveBeenCalled();
  });

  it("displays Add Food Manually button", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("Add Food Manually")).toBeInTheDocument();
  });

  it("shows manual entry form when Add Food Manually is clicked", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    fireEvent.click(screen.getByText("Add Food Manually"));

    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., Grilled Chicken Breast")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("kcal")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("grams")).toBeInTheDocument();
  });

  it("displays meal category selector", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("Meal Category")).toBeInTheDocument();
  });

  it("validates manual entry form - disabled when empty", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    fireEvent.click(screen.getByText("Add Food Manually"));

    const logButton = screen.getByText("Log Food");
    expect(logButton.closest("button")).toBeDisabled();
  });

  it("enables Log Food button when all fields are filled", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    fireEvent.click(screen.getByText("Add Food Manually"));

    fireEvent.change(screen.getByPlaceholderText("e.g., Grilled Chicken Breast"), {
      target: { value: "Custom Food" },
    });
    fireEvent.change(screen.getByPlaceholderText("kcal"), {
      target: { value: "250" },
    });
    fireEvent.change(screen.getByPlaceholderText("grams"), {
      target: { value: "20" },
    });

    const logButton = screen.getByText("Log Food");
    expect(logButton.closest("button")).not.toBeDisabled();
  });

  it("calls onLogCustomFood with correct data when form is submitted", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    fireEvent.click(screen.getByText("Add Food Manually"));

    fireEvent.change(screen.getByPlaceholderText("e.g., Grilled Chicken Breast"), {
      target: { value: "My Custom Food" },
    });
    fireEvent.change(screen.getByPlaceholderText("kcal"), {
      target: { value: "250" },
    });
    fireEvent.change(screen.getByPlaceholderText("grams"), {
      target: { value: "20" },
    });

    fireEvent.click(screen.getByText("Log Food"));

    expect(mockOnLogCustomFood).toHaveBeenCalledWith({
      food_name: "My Custom Food",
      calories: 250,
      protein: 20,
      meal_category: "breakfast", // default category
    });
  });

  it("shows Logging... when isLogging is true", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        searchResults={[]}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
        isLogging={true}
      />
    );

    fireEvent.click(screen.getByText("Add Food Manually"));

    fireEvent.change(screen.getByPlaceholderText("e.g., Grilled Chicken Breast"), {
      target: { value: "Custom Food" },
    });
    fireEvent.change(screen.getByPlaceholderText("kcal"), {
      target: { value: "250" },
    });
    fireEvent.change(screen.getByPlaceholderText("grams"), {
      target: { value: "20" },
    });

    expect(screen.getByText("Logging...")).toBeInTheDocument();
  });

  it("displays results count", () => {
    render(
      <FoodSearch
        isOpen={true}
        onClose={mockOnClose}
        searchQuery="ch"
        onSearchChange={mockOnSearchChange}
        searchResults={mockSearchResults}
        isSearching={false}
        onSelectFood={mockOnSelectFood}
        onLogCustomFood={mockOnLogCustomFood}
      />
    );

    expect(screen.getByText("Results (2)")).toBeInTheDocument();
  });
});
