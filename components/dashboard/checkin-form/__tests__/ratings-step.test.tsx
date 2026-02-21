import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RatingsStep } from "../ratings-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";
import type { UseFormWatch } from "react-hook-form";

// Helper to render with form methods
function renderWithForm(defaults?: Partial<CheckInFormData>) {
  const FormWrapper = () => {
    const { watch, setValue } = useForm<CheckInFormData>({
      resolver: zodResolver(checkInSchema),
      defaultValues: {
        energy_rating: 5,
        sleep_rating: 5,
        stress_rating: 5,
        mood_rating: 5,
        diet_adherence: 80,
        workout_adherence: 80,
        ...defaults,
      },
    });

    return <RatingsStep watch={watch} setValue={setValue} />;
  };

  return render(<FormWrapper />);
}

describe("RatingsStep Component", () => {
  it("renders step indicator", () => {
    renderWithForm();
    expect(screen.getByText("Step 3 of 4: How You're Feeling")).toBeInTheDocument();
  });

  it("renders energy levels slider", () => {
    renderWithForm();
    expect(screen.getByText("Energy Levels")).toBeInTheDocument();
    expect(screen.getByText("1 - Exhausted")).toBeInTheDocument();
    expect(screen.getByText("10 - Energized")).toBeInTheDocument();
  });

  it("renders sleep quality slider", () => {
    renderWithForm();
    expect(screen.getByText("Sleep Quality")).toBeInTheDocument();
    expect(screen.getByText("1 - Terrible")).toBeInTheDocument();
    expect(screen.getByText("10 - Excellent")).toBeInTheDocument();
  });

  it("renders stress levels slider", () => {
    renderWithForm();
    expect(screen.getByText("Stress Levels")).toBeInTheDocument();
    expect(screen.getByText("1 - Overwhelmed")).toBeInTheDocument();
    expect(screen.getByText("10 - Calm")).toBeInTheDocument();
  });

  it("renders overall mood slider", () => {
    renderWithForm();
    expect(screen.getByText("Overall Mood")).toBeInTheDocument();
    expect(screen.getByText("1 - Low")).toBeInTheDocument();
    expect(screen.getByText("10 - Great")).toBeInTheDocument();
  });

  it("displays default values (5)", () => {
    renderWithForm();
    // All sliders should show default value of 5
    const fives = screen.getAllByText("5");
    expect(fives.length).toBe(4);
  });

  it("renders why this matters section", () => {
    renderWithForm();
    expect(screen.getByText("Why This Matters")).toBeInTheDocument();
    expect(
      screen.getByText(/These ratings help your coach understand factors beyond the scale/i)
    ).toBeInTheDocument();
  });

  it("renders athletic cards for each slider", () => {
    const { container } = renderWithForm();
    const athleticCards = container.querySelectorAll(".athletic-card");
    expect(athleticCards.length).toBe(4);
  });

  it("renders all 4 slider icons", () => {
    const { container } = renderWithForm();
    // Battery, Moon, Brain, Smile icons
    const icons = container.querySelectorAll('[class*="lucide-"]');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it("uses fallback value of 5 when watch returns falsy for ratings", () => {
    const mockSetValue = jest.fn();
    // Return 0 (falsy) to trigger || 5 fallback
    const mockWatch = jest.fn(() => 0) as unknown as UseFormWatch<CheckInFormData>;

    render(<RatingsStep watch={mockWatch} setValue={mockSetValue} />);

    // When watch returns 0 (falsy), || 5 kicks in, so display should show 5
    const fives = screen.getAllByText("5");
    expect(fives.length).toBe(4);
  });

  it("displays custom rating values when watch returns non-falsy values", () => {
    renderWithForm({
      energy_rating: 8,
      sleep_rating: 3,
      stress_rating: 7,
      mood_rating: 9,
    });

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("calls setValue for energy_rating when slider changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "energy_rating") return 5;
      if (field === "sleep_rating") return 5;
      if (field === "stress_rating") return 5;
      if (field === "mood_rating") return 5;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;

    render(<RatingsStep watch={mockWatch} setValue={mockSetValue} />);

    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBe(4);

    // Trigger ArrowRight on energy slider (index 0, step=1, so 5+1=6)
    sliders[0].focus();
    fireEvent.keyDown(sliders[0], { key: "ArrowRight" });

    expect(mockSetValue).toHaveBeenCalledWith("energy_rating", 6);
  });

  it("calls setValue for sleep_rating when slider changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "energy_rating") return 5;
      if (field === "sleep_rating") return 5;
      if (field === "stress_rating") return 5;
      if (field === "mood_rating") return 5;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;

    render(<RatingsStep watch={mockWatch} setValue={mockSetValue} />);

    const sliders = screen.getAllByRole("slider");
    sliders[1].focus();
    fireEvent.keyDown(sliders[1], { key: "ArrowRight" });

    expect(mockSetValue).toHaveBeenCalledWith("sleep_rating", 6);
  });

  it("calls setValue for stress_rating when slider changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "energy_rating") return 5;
      if (field === "sleep_rating") return 5;
      if (field === "stress_rating") return 5;
      if (field === "mood_rating") return 5;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;

    render(<RatingsStep watch={mockWatch} setValue={mockSetValue} />);

    const sliders = screen.getAllByRole("slider");
    sliders[2].focus();
    fireEvent.keyDown(sliders[2], { key: "ArrowRight" });

    expect(mockSetValue).toHaveBeenCalledWith("stress_rating", 6);
  });

  it("calls setValue for mood_rating when slider changes via keyboard", () => {
    const mockSetValue = jest.fn();
    const mockWatch = jest.fn((field: string) => {
      if (field === "energy_rating") return 5;
      if (field === "sleep_rating") return 5;
      if (field === "stress_rating") return 5;
      if (field === "mood_rating") return 5;
      return undefined;
    }) as unknown as UseFormWatch<CheckInFormData>;

    render(<RatingsStep watch={mockWatch} setValue={mockSetValue} />);

    const sliders = screen.getAllByRole("slider");
    sliders[3].focus();
    fireEvent.keyDown(sliders[3], { key: "ArrowRight" });

    expect(mockSetValue).toHaveBeenCalledWith("mood_rating", 6);
  });

  it("renders RatingSlider subcomponent with correct labels for each rating", () => {
    renderWithForm();

    // Verify all low/high labels are rendered — confirms RatingSlider is called with correct props
    expect(screen.getByText("1 - Exhausted")).toBeInTheDocument();
    expect(screen.getByText("10 - Energized")).toBeInTheDocument();
    expect(screen.getByText("1 - Terrible")).toBeInTheDocument();
    expect(screen.getByText("10 - Excellent")).toBeInTheDocument();
    expect(screen.getByText("1 - Overwhelmed")).toBeInTheDocument();
    expect(screen.getByText("10 - Calm")).toBeInTheDocument();
    expect(screen.getByText("1 - Low")).toBeInTheDocument();
    expect(screen.getByText("10 - Great")).toBeInTheDocument();
  });
});
