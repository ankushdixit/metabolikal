import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FoodItemForm } from "../food-item-form";
import { foodItemSchema, type FoodItemFormData } from "@/lib/validations";

// Mock the meal types hook to avoid needing Refine context
jest.mock("@/hooks/use-meal-types", () => ({
  useMealTypes: () => ({
    mealTypes: [
      { id: "1", slug: "breakfast", name: "Breakfast", display_order: 1, is_active: true },
      { id: "2", slug: "lunch", name: "Lunch", display_order: 2, is_active: true },
      { id: "3", slug: "dinner", name: "Dinner", display_order: 3, is_active: true },
      { id: "4", slug: "snack", name: "Snack", display_order: 4, is_active: true },
      { id: "5", slug: "pre-workout", name: "Pre-Workout", display_order: 5, is_active: true },
      { id: "6", slug: "post-workout", name: "Post-Workout", display_order: 6, is_active: true },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  DEFAULT_MEAL_TYPES: [
    { name: "Breakfast", slug: "breakfast" },
    { name: "Lunch", slug: "lunch" },
    { name: "Dinner", slug: "dinner" },
    { name: "Snack", slug: "snack" },
    { name: "Pre-Workout", slug: "pre-workout" },
    { name: "Post-Workout", slug: "post-workout" },
  ],
}));

// Mock the medical conditions hook
jest.mock("@/hooks/use-medical-conditions", () => ({
  useMedicalConditions: () => ({
    conditions: [
      {
        id: "cond-1",
        name: "Type 2 Diabetes",
        slug: "type2-diabetes",
        impact_percent: 12,
      },
      {
        id: "cond-2",
        name: "Hypothyroidism",
        slug: "hypothyroidism",
        impact_percent: 8,
      },
    ],
    isLoading: false,
    error: null,
  }),
  DEFAULT_MEDICAL_CONDITIONS: [
    {
      name: "Type 2 Diabetes",
      slug: "type2-diabetes",
      impact_percent: 12,
      gender_restriction: null,
    },
    { name: "Hypothyroidism", slug: "hypothyroidism", impact_percent: 8, gender_restriction: null },
  ],
}));

// Mock the useList hook for food alternatives selector
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
        ],
      },
      isLoading: false,
    },
  })),
}));

// Wrapper component to provide form context
function TestWrapper({
  onCancel = jest.fn(),
  submitLabel = "Create Food Item",
  isSubmitting = false,
  defaultValues = {},
  foodItemId,
}: {
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  defaultValues?: Partial<FoodItemFormData>;
  foodItemId?: string;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FoodItemFormData>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      name: "",
      calories: undefined,
      protein: undefined,
      carbs: null,
      fats: null,
      serving_size: "",
      is_vegetarian: false,
      meal_types: [],
      raw_quantity: null,
      cooked_quantity: null,
      avoid_for_conditions: [],
      alternative_food_ids: [],
      ...defaultValues,
    },
  });

  return (
    <FoodItemForm
      register={register}
      errors={errors}
      watch={watch}
      setValue={setValue}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      submitLabel={submitLabel}
      foodItemId={foodItemId}
    />
  );
}

describe("FoodItemForm Component", () => {
  it("renders all required fields", () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/food name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/protein/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/serving size/i)).toBeInTheDocument();
  });

  it("renders optional fields", () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/carbs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fats/i)).toBeInTheDocument();
    expect(screen.getByText(/vegetarian/i)).toBeInTheDocument();
  });

  it("renders meal type buttons", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Snack")).toBeInTheDocument();
    expect(screen.getByText("Pre-Workout")).toBeInTheDocument();
    expect(screen.getByText("Post-Workout")).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(<TestWrapper submitLabel="Create Food Item" />);

    expect(screen.getByText("Create Food Item")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button clicked", () => {
    const mockOnCancel = jest.fn();
    render(<TestWrapper onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables buttons when submitting", () => {
    render(<TestWrapper isSubmitting={true} />);

    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("shows custom submit label", () => {
    render(<TestWrapper submitLabel="Save Changes" />);

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("allows typing in name field", () => {
    render(<TestWrapper />);

    const nameInput = screen.getByLabelText(/food name/i);
    fireEvent.change(nameInput, { target: { value: "Grilled Chicken" } });
    expect(nameInput).toHaveValue("Grilled Chicken");
  });

  it("allows typing in number fields", () => {
    render(<TestWrapper />);

    const caloriesInput = screen.getByLabelText(/calories/i);
    fireEvent.change(caloriesInput, { target: { value: "165" } });
    expect(caloriesInput).toHaveValue(165);

    const proteinInput = screen.getByLabelText(/protein/i);
    fireEvent.change(proteinInput, { target: { value: "31" } });
    expect(proteinInput).toHaveValue(31);
  });

  it("toggles vegetarian checkbox", () => {
    render(<TestWrapper />);

    // Get the vegetarian checkbox specifically
    const checkbox = screen.getByRole("checkbox", { name: /vegetarian/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("toggles meal type selection", () => {
    render(<TestWrapper />);

    const breakfastButton = screen.getByText("Breakfast");

    // Initially not selected (has bg-secondary class)
    expect(breakfastButton).toHaveClass("bg-secondary");

    // Click to select
    fireEvent.click(breakfastButton);

    // Should now have gradient-electric class
    expect(breakfastButton).toHaveClass("gradient-electric");
  });

  it("renders with pre-filled values", () => {
    render(
      <TestWrapper
        defaultValues={{
          name: "Test Food",
          calories: 100,
          protein: 20,
          serving_size: "100g",
          is_vegetarian: true,
        }}
      />
    );

    expect(screen.getByLabelText(/food name/i)).toHaveValue("Test Food");
    expect(screen.getByLabelText(/calories/i)).toHaveValue(100);
    expect(screen.getByLabelText(/protein/i)).toHaveValue(20);
    expect(screen.getByLabelText(/serving size/i)).toHaveValue("100g");
    expect(screen.getByRole("checkbox", { name: /vegetarian/i })).toBeChecked();
  });

  it("uses athletic button styling", () => {
    render(<TestWrapper />);

    const cancelButton = screen.getByText("Cancel");
    const submitButton = screen.getByText("Create Food Item");

    expect(cancelButton).toHaveClass("btn-athletic");
    expect(submitButton).toHaveClass("btn-athletic");
  });

  it("renders nutritional information section header", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Nutritional Information")).toBeInTheDocument();
  });

  it("renders meal types section header", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Meal Types")).toBeInTheDocument();
  });

  // New tests for enhanced form

  it("renders quantity information section", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Quantity Information")).toBeInTheDocument();
    expect(screen.getByLabelText(/raw quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cooked quantity/i)).toBeInTheDocument();
  });

  it("allows typing in quantity fields", () => {
    render(<TestWrapper />);

    const rawQuantityInput = screen.getByLabelText(/raw quantity/i);
    fireEvent.change(rawQuantityInput, { target: { value: "100g raw" } });
    expect(rawQuantityInput).toHaveValue("100g raw");

    const cookedQuantityInput = screen.getByLabelText(/cooked quantity/i);
    fireEvent.change(cookedQuantityInput, { target: { value: "75g cooked" } });
    expect(cookedQuantityInput).toHaveValue("75g cooked");
  });

  it("renders avoid for conditions section", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Avoid For Conditions")).toBeInTheDocument();
    expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
    expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
  });

  it("renders alternatives section", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Alternatives")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search foods to add as alternatives...")
    ).toBeInTheDocument();
  });

  it("renders with pre-filled quantity values", () => {
    render(
      <TestWrapper
        defaultValues={{
          name: "Test Food",
          calories: 100,
          protein: 20,
          serving_size: "100g",
          raw_quantity: "150g raw",
          cooked_quantity: "100g cooked",
        }}
      />
    );

    expect(screen.getByLabelText(/raw quantity/i)).toHaveValue("150g raw");
    expect(screen.getByLabelText(/cooked quantity/i)).toHaveValue("100g cooked");
  });

  it("shows description text for quantity section", () => {
    render(<TestWrapper />);

    expect(
      screen.getByText(/Track raw and cooked quantities for accurate meal planning/)
    ).toBeInTheDocument();
  });

  it("shows description text for conditions section", () => {
    render(<TestWrapper />);

    expect(
      screen.getByText(/Select medical conditions that should avoid this food/)
    ).toBeInTheDocument();
  });

  it("shows description text for alternatives section", () => {
    render(<TestWrapper />);

    expect(
      screen.getByText(/Add food items that can substitute for this one in diet plans/)
    ).toBeInTheDocument();
  });
});
