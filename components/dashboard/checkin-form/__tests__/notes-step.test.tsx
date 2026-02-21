import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotesStep } from "../notes-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";
import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";

// Helper to render with form methods
function renderWithForm() {
  const FormWrapper = () => {
    const {
      register,
      watch,
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

    return <NotesStep register={register} watch={watch} setValue={setValue} errors={errors} />;
  };

  return render(<FormWrapper />);
}

describe("NotesStep Component", () => {
  it("renders step indicator", () => {
    renderWithForm();
    expect(screen.getByText("Step 4 of 4: Compliance & Notes")).toBeInTheDocument();
  });

  it("renders diet adherence slider with default value", () => {
    renderWithForm();
    expect(screen.getByText("Diet Adherence")).toBeInTheDocument();
    // Both sliders show 80% by default
    const eightyPercents = screen.getAllByText("80%");
    expect(eightyPercents.length).toBeGreaterThanOrEqual(2);
  });

  it("renders workout adherence slider with default value", () => {
    renderWithForm();
    expect(screen.getByText("Workout Adherence")).toBeInTheDocument();
    // Both sliders have 80% default
    const eightyPercents = screen.getAllByText("80%");
    expect(eightyPercents.length).toBeGreaterThanOrEqual(2);
  });

  it("renders challenges textarea", () => {
    renderWithForm();
    expect(screen.getByLabelText(/Challenges Faced/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("What obstacles did you encounter this week?")
    ).toBeInTheDocument();
  });

  it("renders progress notes textarea", () => {
    renderWithForm();
    expect(screen.getByLabelText(/Progress Toward Goals/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Any wins or progress you want to highlight?")
    ).toBeInTheDocument();
  });

  it("renders questions textarea", () => {
    renderWithForm();
    expect(screen.getByLabelText(/Questions for Coach/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Anything you want to ask or discuss?")).toBeInTheDocument();
  });

  it("marks all text areas as optional", () => {
    renderWithForm();
    const optionalLabels = screen.getAllByText(/\(optional\)/i);
    expect(optionalLabels.length).toBe(3);
  });

  it("renders almost done encouragement section", () => {
    renderWithForm();
    expect(screen.getByText("Almost Done!")).toBeInTheDocument();
    expect(
      screen.getByText(/Review your entries and click "Submit Check-In"/i)
    ).toBeInTheDocument();
  });

  it("renders athletic cards for adherence sliders", () => {
    const { container } = renderWithForm();
    const athleticCards = container.querySelectorAll(".athletic-card");
    expect(athleticCards.length).toBe(2);
  });

  it("shows 0% and 100% labels for adherence sliders", () => {
    renderWithForm();
    expect(screen.getAllByText("0%").length).toBe(2);
    expect(screen.getAllByText("100%").length).toBe(2);
  });

  it("calls setValue when diet adherence slider value changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 80;
      if (field === "workout_adherence") return 80;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "challenges" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {};

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    // Find the slider thumbs (Radix slider renders role="slider")
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBe(2);

    // Use keyboard ArrowRight to trigger onValueChange on the diet adherence slider
    sliders[0].focus();
    fireEvent.keyDown(sliders[0], { key: "ArrowRight" });

    // setValue should be called with "diet_adherence" and the new value (80 + 5 = 85)
    expect(mockSetValue).toHaveBeenCalledWith("diet_adherence", 85);
  });

  it("calls setValue when workout adherence slider value changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 80;
      if (field === "workout_adherence") return 80;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "challenges" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {};

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    const sliders = screen.getAllByRole("slider");

    // Use keyboard ArrowRight to trigger onValueChange on the workout adherence slider
    sliders[1].focus();
    fireEvent.keyDown(sliders[1], { key: "ArrowRight" });

    // setValue should be called with "workout_adherence" and the new value
    expect(mockSetValue).toHaveBeenCalledWith("workout_adherence", 85);
  });

  it("uses fallback value of 80 when watch returns falsy for diet_adherence", () => {
    const mockSetValue = jest.fn();
    // Return 0 (falsy) for diet_adherence to trigger || 80 fallback
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 0;
      if (field === "workout_adherence") return 0;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "challenges" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {};

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    // When watch returns 0 (falsy), || 80 kicks in, so display should show 80%
    const eightyPercents = screen.getAllByText("80%");
    expect(eightyPercents.length).toBe(2);
  });

  it("displays error message for challenges field", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 80;
      if (field === "workout_adherence") return 80;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "challenges" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {
      challenges: {
        type: "maxLength",
        message: "Maximum 1000 characters",
      },
    };

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    expect(screen.getByText("Maximum 1000 characters")).toBeInTheDocument();
  });

  it("displays error message for progress_notes field", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 80;
      if (field === "workout_adherence") return 80;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "progress_notes" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {
      progress_notes: {
        type: "maxLength",
        message: "Progress notes too long",
      },
    };

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    expect(screen.getByText("Progress notes too long")).toBeInTheDocument();
  });

  it("displays error message for questions field", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "diet_adherence") return 80;
      if (field === "workout_adherence") return 80;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;
    const mockRegister = jest.fn(() => ({
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
      name: "questions" as const,
    })) as unknown as UseFormRegister<CheckInFormData>;
    const mockErrors: FieldErrors<CheckInFormData> = {
      questions: {
        type: "maxLength",
        message: "Questions too long",
      },
    };

    render(
      <NotesStep
        register={mockRegister}
        watch={mockWatch}
        setValue={mockSetValue}
        errors={mockErrors}
      />
    );

    expect(screen.getByText("Questions too long")).toBeInTheDocument();
  });

  it("does not display error messages when there are no errors", () => {
    renderWithForm();

    // No error elements should be present
    const errorElements = screen.queryAllByText(/too long|Maximum/i);
    expect(errorElements.length).toBe(0);
  });
});
