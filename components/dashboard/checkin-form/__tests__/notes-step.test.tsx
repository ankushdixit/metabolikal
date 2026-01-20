import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotesStep } from "../notes-step";
import { checkInSchema, type CheckInFormData } from "@/lib/validations";

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
});
