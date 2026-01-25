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

// Wrapper component to provide form context
function TestWrapper({
  onCancel = jest.fn(),
  submitLabel = "Create Food Item",
  isSubmitting = false,
  defaultValues = {},
}: {
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  defaultValues?: Partial<FoodItemFormData>;
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

    const checkbox = screen.getByRole("checkbox");
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
    expect(screen.getByRole("checkbox")).toBeChecked();
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
});
