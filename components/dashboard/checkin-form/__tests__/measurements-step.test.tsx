import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeasurementsStep } from "../measurements-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";

// Helper to render with form methods
function renderWithForm(currentDate: string) {
  const FormWrapper = () => {
    const {
      register,
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

    return <MeasurementsStep register={register} errors={errors} currentDate={currentDate} />;
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
    expect(screen.getByLabelText(/Chest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Waist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hips/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Arms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thighs/i)).toBeInTheDocument();
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
    expect(screen.getByPlaceholderText("100")).toBeInTheDocument(); // chest
    expect(screen.getByPlaceholderText("80")).toBeInTheDocument(); // waist
    expect(screen.getByPlaceholderText("95")).toBeInTheDocument(); // hips
    expect(screen.getByPlaceholderText("35")).toBeInTheDocument(); // arms
    expect(screen.getByPlaceholderText("55")).toBeInTheDocument(); // thighs
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
});
