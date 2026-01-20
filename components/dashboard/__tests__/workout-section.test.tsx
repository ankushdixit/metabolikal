import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutSection, SECTION_CONFIG } from "../workout-section";
import type { WorkoutSection as WorkoutSectionType } from "@/lib/database.types";

describe("WorkoutSection Component", () => {
  const mockOnToggleComplete = jest.fn();

  const mockExercises = [
    {
      id: "ex-1",
      exercise_name: "Push-ups",
      sets: 3,
      reps: 15,
      duration_minutes: null,
      rest_seconds: 30,
      instructions: "Keep your core tight",
      video_url: null,
    },
    {
      id: "ex-2",
      exercise_name: "Squats",
      sets: 4,
      reps: 12,
      duration_minutes: null,
      rest_seconds: 45,
      instructions: null,
      video_url: "https://youtube.com/test",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders warmup section header", () => {
    render(
      <WorkoutSection
        section="warmup"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("Warmup")).toBeInTheDocument();
  });

  it("renders main workout section header", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("Main Workout")).toBeInTheDocument();
  });

  it("renders cooldown section header", () => {
    render(
      <WorkoutSection
        section="cooldown"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("Cooldown")).toBeInTheDocument();
  });

  it("displays exercise count", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("2 exercises")).toBeInTheDocument();
  });

  it("displays singular when only one exercise", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={[mockExercises[0]]}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("1 exercise")).toBeInTheDocument();
  });

  it("renders all exercise items", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(screen.getByText("Push-ups")).toBeInTheDocument();
    expect(screen.getByText("Squats")).toBeInTheDocument();
  });

  it("marks exercises as completed based on completedIds", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set(["ex-1"])}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("calls onToggleComplete when exercise is toggled", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);
    expect(mockOnToggleComplete).toHaveBeenCalledWith("ex-1", true);
  });

  it("returns null when exercises array is empty", () => {
    const { container } = render(
      <WorkoutSection
        section="main"
        exercises={[]}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("passes isUpdating to exercise items", () => {
    render(
      <WorkoutSection
        section="main"
        exercises={mockExercises}
        completedIds={new Set()}
        onToggleComplete={mockOnToggleComplete}
        isUpdating={true}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });

  it("exports correct section config", () => {
    expect(SECTION_CONFIG.warmup.label).toBe("Warmup");
    expect(SECTION_CONFIG.main.label).toBe("Main Workout");
    expect(SECTION_CONFIG.cooldown.label).toBe("Cooldown");
    expect(SECTION_CONFIG.warmup.icon).toBeDefined();
    expect(SECTION_CONFIG.main.icon).toBeDefined();
    expect(SECTION_CONFIG.cooldown.icon).toBeDefined();
  });

  it("displays all three section types correctly", () => {
    const sections: WorkoutSectionType[] = ["warmup", "main", "cooldown"];
    const labels = ["Warmup", "Main Workout", "Cooldown"];

    sections.forEach((section, index) => {
      const { unmount } = render(
        <WorkoutSection
          section={section}
          exercises={mockExercises}
          completedIds={new Set()}
          onToggleComplete={mockOnToggleComplete}
        />
      );
      expect(screen.getByText(labels[index])).toBeInTheDocument();
      unmount();
    });
  });
});
