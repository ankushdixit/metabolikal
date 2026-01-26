import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupplementForm } from "../supplement-form";
import { supplementSchema, type SupplementFormData } from "@/lib/validations";

// Wrapper component to provide form context
function TestWrapper({
  onCancel = jest.fn(),
  submitLabel = "Create Supplement",
  isSubmitting = false,
  defaultValues = {},
}: {
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  defaultValues?: Partial<SupplementFormData>;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplementFormData>({
    resolver: zodResolver(supplementSchema),
    defaultValues: {
      name: "",
      category: undefined,
      default_dosage: undefined,
      dosage_unit: "",
      instructions: null,
      notes: null,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <SupplementForm
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

describe("SupplementForm Component", () => {
  it("renders all required fields", () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/supplement name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default dosage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage unit/i)).toBeInTheDocument();
  });

  it("renders category selection buttons", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Vitamin")).toBeInTheDocument();
    expect(screen.getByText("Mineral")).toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("Amino Acid")).toBeInTheDocument();
    expect(screen.getByText("Fatty Acid")).toBeInTheDocument();
    expect(screen.getByText("Herbal")).toBeInTheDocument();
    expect(screen.getByText("Probiotic")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("renders optional fields", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(<TestWrapper submitLabel="Create Supplement" />);

    expect(screen.getByText("Create Supplement")).toBeInTheDocument();
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

    const nameInput = screen.getByLabelText(/supplement name/i);
    fireEvent.change(nameInput, { target: { value: "Fish Oil" } });
    expect(nameInput).toHaveValue("Fish Oil");
  });

  it("allows typing in dosage field", () => {
    render(<TestWrapper />);

    const dosageInput = screen.getByLabelText(/default dosage/i);
    fireEvent.change(dosageInput, { target: { value: "1000" } });
    expect(dosageInput).toHaveValue(1000);
  });

  it("allows typing in dosage unit field", () => {
    render(<TestWrapper />);

    const dosageUnitInput = screen.getByLabelText(/dosage unit/i);
    fireEvent.change(dosageUnitInput, { target: { value: "mg" } });
    expect(dosageUnitInput).toHaveValue("mg");
  });

  it("toggles active checkbox", () => {
    render(<TestWrapper />);

    // Get the active checkbox - initially checked (default is true)
    const checkbox = screen.getByRole("checkbox", { name: /active/i });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("toggles category selection", () => {
    render(<TestWrapper />);

    const vitaminButton = screen.getByText("Vitamin");

    // Initially not selected (has bg-secondary class)
    expect(vitaminButton).toHaveClass("bg-secondary");

    // Click to select
    fireEvent.click(vitaminButton);

    // Should now have gradient-electric class
    expect(vitaminButton).toHaveClass("gradient-electric");
  });

  it("renders with pre-filled values", () => {
    render(
      <TestWrapper
        defaultValues={{
          name: "Fish Oil",
          category: "fatty_acid",
          default_dosage: 2,
          dosage_unit: "capsule",
          instructions: "Take with food",
          notes: "Good for heart health",
          is_active: true,
        }}
      />
    );

    expect(screen.getByLabelText(/supplement name/i)).toHaveValue("Fish Oil");
    expect(screen.getByLabelText(/default dosage/i)).toHaveValue(2);
    expect(screen.getByLabelText(/dosage unit/i)).toHaveValue("capsule");
    expect(screen.getByRole("checkbox", { name: /active/i })).toBeChecked();

    // Check category is selected
    const fattyAcidButton = screen.getByText("Fatty Acid");
    expect(fattyAcidButton).toHaveClass("gradient-electric");
  });

  it("uses athletic button styling", () => {
    render(<TestWrapper />);

    const cancelButton = screen.getByText("Cancel");
    const submitButton = screen.getByText("Create Supplement");

    expect(cancelButton).toHaveClass("btn-athletic");
    expect(submitButton).toHaveClass("btn-athletic");
  });

  it("renders dosage information section header", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Dosage Information")).toBeInTheDocument();
  });

  it("allows typing in instructions textarea", () => {
    render(<TestWrapper />);

    const instructionsTextarea = screen.getByPlaceholderText(
      /Take with food to improve absorption/i
    );
    fireEvent.change(instructionsTextarea, { target: { value: "Take after meals" } });
    expect(instructionsTextarea).toHaveValue("Take after meals");
  });

  it("allows typing in notes textarea", () => {
    render(<TestWrapper />);

    const notesTextarea = screen.getByPlaceholderText(/Additional notes about this supplement/i);
    fireEvent.change(notesTextarea, { target: { value: "Omega-3 fatty acids" } });
    expect(notesTextarea).toHaveValue("Omega-3 fatty acids");
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

    const vitaminButton = screen.getByText("Vitamin");
    const mineralButton = screen.getByText("Mineral");

    // Select Vitamin
    fireEvent.click(vitaminButton);
    expect(vitaminButton).toHaveClass("gradient-electric");
    expect(mineralButton).toHaveClass("bg-secondary");

    // Select Mineral
    fireEvent.click(mineralButton);
    expect(mineralButton).toHaveClass("gradient-electric");
    expect(vitaminButton).toHaveClass("bg-secondary");
  });
});
