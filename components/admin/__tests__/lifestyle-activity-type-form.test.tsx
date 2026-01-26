import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifestyleActivityTypeForm } from "../lifestyle-activity-type-form";
import { lifestyleActivityTypeSchema, type LifestyleActivityTypeFormData } from "@/lib/validations";

// Wrapper component to provide form context
function TestWrapper({
  onCancel = jest.fn(),
  submitLabel = "Create Activity Type",
  isSubmitting = false,
  defaultValues = {},
}: {
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  defaultValues?: Partial<LifestyleActivityTypeFormData>;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LifestyleActivityTypeFormData>({
    resolver: zodResolver(lifestyleActivityTypeSchema),
    defaultValues: {
      name: "",
      category: undefined,
      default_target_value: null,
      target_unit: null,
      description: null,
      rationale: null,
      icon: null,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <LifestyleActivityTypeForm
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

describe("LifestyleActivityTypeForm Component", () => {
  it("renders all required fields", () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/activity name/i)).toBeInTheDocument();
    expect(screen.getByText(/category/i)).toBeInTheDocument();
  });

  it("renders category selection buttons", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Movement")).toBeInTheDocument();
    expect(screen.getByText("Mindfulness")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
    expect(screen.getByText("Hydration")).toBeInTheDocument();
    expect(screen.getByText("Sunlight")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Recovery")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("renders icon selector", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Icon")).toBeInTheDocument();
    // Check that icon buttons are rendered
    expect(screen.getByLabelText("Footprints")).toBeInTheDocument();
    expect(screen.getByLabelText("Sun")).toBeInTheDocument();
  });

  it("renders optional fields", () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/target value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target unit/i)).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText(/rationale/i)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(<TestWrapper submitLabel="Create Activity Type" />);

    expect(screen.getByText("Create Activity Type")).toBeInTheDocument();
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

    const nameInput = screen.getByLabelText(/activity name/i);
    fireEvent.change(nameInput, { target: { value: "Daily Steps" } });
    expect(nameInput).toHaveValue("Daily Steps");
  });

  it("allows typing in target value field", () => {
    render(<TestWrapper />);

    const targetInput = screen.getByLabelText(/target value/i);
    fireEvent.change(targetInput, { target: { value: "12000" } });
    expect(targetInput).toHaveValue(12000);
  });

  it("allows typing in target unit field", () => {
    render(<TestWrapper />);

    const unitInput = screen.getByLabelText(/target unit/i);
    fireEvent.change(unitInput, { target: { value: "steps" } });
    expect(unitInput).toHaveValue("steps");
  });

  it("toggles active checkbox", () => {
    render(<TestWrapper />);

    const checkbox = screen.getByRole("checkbox", { name: /active/i });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("toggles category selection", () => {
    render(<TestWrapper />);

    const movementButton = screen.getByText("Movement");

    // Initially not selected
    expect(movementButton).toHaveClass("bg-secondary");

    // Click to select
    fireEvent.click(movementButton);

    // Should now have gradient-electric class
    expect(movementButton).toHaveClass("gradient-electric");
  });

  it("renders with pre-filled values", () => {
    render(
      <TestWrapper
        defaultValues={{
          name: "Daily Steps",
          category: "movement",
          default_target_value: 12000,
          target_unit: "steps",
          description: "Walk throughout the day",
          rationale: "Good for health",
          icon: "footprints",
          is_active: true,
        }}
      />
    );

    expect(screen.getByLabelText(/activity name/i)).toHaveValue("Daily Steps");
    expect(screen.getByLabelText(/target value/i)).toHaveValue(12000);
    expect(screen.getByLabelText(/target unit/i)).toHaveValue("steps");
    expect(screen.getByRole("checkbox", { name: /active/i })).toBeChecked();

    // Check category is selected
    const movementButton = screen.getByText("Movement");
    expect(movementButton).toHaveClass("gradient-electric");

    // Check icon is selected
    const footprintsButton = screen.getByLabelText("Footprints");
    expect(footprintsButton).toHaveClass("gradient-electric");
  });

  it("uses athletic button styling", () => {
    render(<TestWrapper />);

    const cancelButton = screen.getByText("Cancel");
    const submitButton = screen.getByText("Create Activity Type");

    expect(cancelButton).toHaveClass("btn-athletic");
    expect(submitButton).toHaveClass("btn-athletic");
  });

  it("renders default target section header", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Default Target")).toBeInTheDocument();
  });

  it("allows typing in description textarea", () => {
    render(<TestWrapper />);

    const descriptionTextarea = screen.getByPlaceholderText(/brief description/i);
    fireEvent.change(descriptionTextarea, { target: { value: "Walk to reach step goal" } });
    expect(descriptionTextarea).toHaveValue("Walk to reach step goal");
  });

  it("allows typing in rationale textarea", () => {
    render(<TestWrapper />);

    const rationaleTextarea = screen.getByPlaceholderText(/explain why this activity/i);
    fireEvent.change(rationaleTextarea, { target: { value: "Improves cardiovascular health" } });
    expect(rationaleTextarea).toHaveValue("Improves cardiovascular health");
  });

  it("renders with inactive checkbox when is_active is false", () => {
    render(
      <TestWrapper
        defaultValues={{
          is_active: false,
        }}
      />
    );

    expect(screen.getByRole("checkbox", { name: /active/i })).not.toBeChecked();
  });

  it("only one category can be selected at a time", () => {
    render(<TestWrapper />);

    const movementButton = screen.getByText("Movement");
    const sleepButton = screen.getByText("Sleep");

    // Select Movement
    fireEvent.click(movementButton);
    expect(movementButton).toHaveClass("gradient-electric");
    expect(sleepButton).toHaveClass("bg-secondary");

    // Select Sleep
    fireEvent.click(sleepButton);
    expect(sleepButton).toHaveClass("gradient-electric");
    expect(movementButton).toHaveClass("bg-secondary");
  });

  it("allows selecting an icon", () => {
    render(<TestWrapper />);

    const sunButton = screen.getByLabelText("Sun");

    // Initially not selected
    expect(sunButton).toHaveClass("bg-secondary");

    // Click to select
    fireEvent.click(sunButton);

    // Should now have gradient-electric class
    expect(sunButton).toHaveClass("gradient-electric");
  });

  it("only one icon can be selected at a time", () => {
    render(<TestWrapper />);

    const footprintsButton = screen.getByLabelText("Footprints");
    const moonButton = screen.getByLabelText("Moon");

    // Select Footprints
    fireEvent.click(footprintsButton);
    expect(footprintsButton).toHaveClass("gradient-electric");
    expect(moonButton).toHaveClass("bg-secondary");

    // Select Moon
    fireEvent.click(moonButton);
    expect(moonButton).toHaveClass("gradient-electric");
    expect(footprintsButton).toHaveClass("bg-secondary");
  });
});
