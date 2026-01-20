import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RatingsStep } from "../ratings-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";

// Helper to render with form methods
function renderWithForm() {
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
});
