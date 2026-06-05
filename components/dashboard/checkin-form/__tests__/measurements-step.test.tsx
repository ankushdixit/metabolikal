import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeasurementsStep } from "../measurements-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

// Helper to render with form methods
function renderWithForm(currentDate: string) {
  const FormWrapper = () => {
    const {
      register,
      setValue,
      formState: { errors },
    } = useForm<CheckInFormData>({
      resolver: zodResolver(checkInSchema),
      defaultValues: {
        energy_rating: 5,
        sleep_rating: 5,
        stress_rating: 5,
        mood_rating: 5,
        diet_adherence: 80,
        workout_adherence: 80,
      },
    });

    return (
      <MeasurementsStep
        register={register}
        setValue={setValue}
        errors={errors}
        currentDate={currentDate}
      />
    );
  };

  return render(<FormWrapper />);
}

describe("MeasurementsStep Component", () => {
  const currentDate = "Monday, January 20, 2026";

  it("renders step indicator", () => {
    renderWithForm(currentDate);
    expect(screen.getByText("Step 1 of 4: Measurements")).toBeInTheDocument();
  });

  it("displays the current date", () => {
    renderWithForm(currentDate);
    expect(screen.getByText(currentDate)).toBeInTheDocument();
  });

  it("renders weight input field with required indicator", () => {
    renderWithForm(currentDate);
    expect(screen.getByLabelText(/Current Weight/i)).toBeInTheDocument();
    // Required indicator
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders body fat percentage input field", () => {
    renderWithForm(currentDate);
    expect(screen.getByLabelText(/Body Fat/i)).toBeInTheDocument();
  });

  it("renders all measurement input fields", () => {
    renderWithForm(currentDate);
    expect(screen.getByLabelText(/Neck/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Waist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hips/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Arms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thighs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Calves/i)).toBeInTheDocument();
  });

  it("marks measurements as optional", () => {
    renderWithForm(currentDate);
    expect(screen.getByText(/Body Measurements \(cm\) - Optional/i)).toBeInTheDocument();
  });

  it("has correct input types for number fields", () => {
    renderWithForm(currentDate);
    const weightInput = screen.getByLabelText(/Current Weight/i);
    expect(weightInput).toHaveAttribute("type", "number");
    expect(weightInput).toHaveAttribute("step", "0.1");
  });

  it("has placeholders for inputs", () => {
    renderWithForm(currentDate);
    expect(screen.getByPlaceholderText("75.5")).toBeInTheDocument(); // weight
    expect(screen.getByPlaceholderText("15.0")).toBeInTheDocument(); // body fat
    expect(screen.getByPlaceholderText("38")).toBeInTheDocument(); // neck
    expect(screen.getByPlaceholderText("100")).toBeInTheDocument(); // chest
    expect(screen.getByPlaceholderText("80")).toBeInTheDocument(); // waist
    expect(screen.getByPlaceholderText("95")).toBeInTheDocument(); // hips
    expect(screen.getByPlaceholderText("35")).toBeInTheDocument(); // arms
    expect(screen.getByPlaceholderText("55")).toBeInTheDocument(); // thighs
    expect(screen.getByPlaceholderText("40")).toBeInTheDocument(); // calves
  });

  it("renders weight icon", () => {
    const { container } = renderWithForm(currentDate);
    // Scale icon should be present
    const scaleIcon = container.querySelector('[class*="lucide-scale"]');
    expect(scaleIcon).toBeInTheDocument();
  });

  it("renders measurement section header with ruler icon", () => {
    const { container } = renderWithForm(currentDate);
    const rulerIcon = container.querySelector('[class*="lucide-ruler"]');
    expect(rulerIcon).toBeInTheDocument();
  });

  it("displays weight error when present", () => {
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "weight" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {
      weight: {
        type: "required",
        message: "Weight is required and must be a number",
      },
    };

    render(
      <MeasurementsStep
        register={mockRegister}
        setValue={jest.fn()}
        errors={mockErrors}
        currentDate={currentDate}
      />
    );

    expect(screen.getByText("Weight is required and must be a number")).toBeInTheDocument();
  });

  it("displays body_fat_percent error when present", () => {
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "body_fat_percent" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {
      body_fat_percent: {
        type: "max",
        message: "Body fat must be between 1 and 70",
      },
    };

    render(
      <MeasurementsStep
        register={mockRegister}
        setValue={jest.fn()}
        errors={mockErrors}
        currentDate={currentDate}
      />
    );

    expect(screen.getByText("Body fat must be between 1 and 70")).toBeInTheDocument();
  });

  it("does not display errors when there are none", () => {
    renderWithForm(currentDate);

    // No AlertCircle icons indicating errors should be rendered
    const errorMessages = screen.queryAllByText(/required|must be/i);
    expect(errorMessages.length).toBe(0);
  });

  describe("parseOptionalNumber via register setValueAs", () => {
    it("handles valid numeric input by registering with setValueAs", () => {
      renderWithForm(currentDate);
      const bodyFatInput = screen.getByLabelText(/Body Fat/i);
      // Verify the input is registered properly (type=number ensures browser-level parsing)
      expect(bodyFatInput).toHaveAttribute("type", "number");
    });

    it("handles empty string input for optional fields", () => {
      renderWithForm(currentDate);
      const chestInput = screen.getByLabelText(/Chest/i);
      // Fire change with empty string — parseOptionalNumber should return undefined
      fireEvent.change(chestInput, { target: { value: "" } });
      // Field should be empty/cleared
      expect(chestInput).toHaveValue(null);
    });

    it("handles non-numeric input for optional fields gracefully", () => {
      renderWithForm(currentDate);
      const waistInput = screen.getByLabelText(/Waist/i);
      // Type "abc" — parseOptionalNumber should return undefined for NaN
      fireEvent.change(waistInput, { target: { value: "abc" } });
      // HTML number input will not accept non-numeric text
      expect(waistInput).toHaveValue(null);
    });
  });

  describe("parseRequiredNumber via register setValueAs", () => {
    it("handles empty string for required weight field", () => {
      renderWithForm(currentDate);
      const weightInput = screen.getByLabelText(/Current Weight/i);
      // Fire change with empty string — parseRequiredNumber returns NaN for zod validation
      fireEvent.change(weightInput, { target: { value: "" } });
      expect(weightInput).toHaveValue(null);
    });

    it("handles valid numeric input for weight field", () => {
      renderWithForm(currentDate);
      const weightInput = screen.getByLabelText(/Current Weight/i);
      fireEvent.change(weightInput, { target: { value: "75.5" } });
      expect(weightInput).toHaveValue(75.5);
    });
  });

  describe("cm / inches unit toggle", () => {
    // Stub register/setValue so we can render the step in isolation and inspect
    // the canonical (cm) values written to the form.
    const stubRegister = () =>
      jest.fn(() => ({
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
        name: "field" as const,
      })) as unknown as UseFormRegister<CheckInFormData>;

    it("renders a cm/in toggle that defaults to cm", () => {
      renderWithForm(currentDate);
      const cmButton = screen.getByRole("button", { name: "cm" });
      const inButton = screen.getByRole("button", { name: "in" });
      expect(cmButton).toHaveAttribute("aria-pressed", "true");
      expect(inButton).toHaveAttribute("aria-pressed", "false");
    });

    it("updates the section label when switching units", () => {
      renderWithForm(currentDate);
      expect(screen.getByText(/Body Measurements \(cm\) - Optional/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "in" }));
      expect(screen.getByText(/Body Measurements \(in\) - Optional/i)).toBeInTheDocument();
    });

    it("stores a measurement as cm when entered in cm mode", () => {
      const setValue = jest.fn();
      render(
        <MeasurementsStep
          register={stubRegister()}
          setValue={setValue}
          errors={{}}
          currentDate={currentDate}
        />
      );
      fireEvent.change(screen.getByLabelText(/Neck/i), { target: { value: "38" } });
      expect(setValue).toHaveBeenCalledWith("neck_cm", 38, { shouldValidate: false });
    });

    it("converts inches to cm before storing when in inch mode", () => {
      const setValue = jest.fn();
      render(
        <MeasurementsStep
          register={stubRegister()}
          setValue={setValue}
          errors={{}}
          currentDate={currentDate}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "in" }));
      fireEvent.change(screen.getByLabelText(/Neck/i), { target: { value: "13" } });
      // 13 in = 33.02 cm — comfortably inside the >= 15 cm range that previously rejected "13"
      expect(setValue).toHaveBeenCalledWith("neck_cm", 13 * 2.54, { shouldValidate: false });
    });

    it("converts the displayed value when the unit is switched", () => {
      const setValue = jest.fn();
      render(
        <MeasurementsStep
          register={stubRegister()}
          setValue={setValue}
          errors={{}}
          currentDate={currentDate}
        />
      );
      const neck = screen.getByLabelText(/Neck/i);
      fireEvent.change(neck, { target: { value: "10" } }); // 10 cm
      fireEvent.click(screen.getByRole("button", { name: "in" }));
      // 10 cm -> 3.9 in (displayed, rounded to 1 decimal)
      expect(neck).toHaveValue(3.9);
    });
  });
});
