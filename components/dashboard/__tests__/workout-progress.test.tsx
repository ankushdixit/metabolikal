import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutProgress } from "../workout-progress";

describe("WorkoutProgress Component", () => {
  const mockOnMarkAllComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays completed and total exercise count", () => {
    render(<WorkoutProgress completed={3} total={10} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 10 exercises")).toBeInTheDocument();
  });

  it("displays progress section header", () => {
    render(<WorkoutProgress completed={0} total={5} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("shows Mark All Complete button when not all completed", () => {
    render(<WorkoutProgress completed={3} total={10} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.getByText("Mark All Complete")).toBeInTheDocument();
  });

  it("calls onMarkAllComplete when button is clicked", () => {
    render(<WorkoutProgress completed={3} total={10} onMarkAllComplete={mockOnMarkAllComplete} />);
    fireEvent.click(screen.getByText("Mark All Complete"));
    expect(mockOnMarkAllComplete).toHaveBeenCalledTimes(1);
  });

  it("shows completion message when all exercises done", () => {
    render(<WorkoutProgress completed={10} total={10} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.getByText("Workout complete! Great job!")).toBeInTheDocument();
  });

  it("hides Mark All Complete button when workout is complete", () => {
    render(<WorkoutProgress completed={10} total={10} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.queryByText("Mark All Complete")).not.toBeInTheDocument();
  });

  it("disables button when isUpdating is true", () => {
    render(
      <WorkoutProgress
        completed={3}
        total={10}
        onMarkAllComplete={mockOnMarkAllComplete}
        isUpdating={true}
      />
    );
    const button = screen.getByText("Updating...");
    expect(button.closest("button")).toBeDisabled();
  });

  it("shows Updating... text when isUpdating is true", () => {
    render(
      <WorkoutProgress
        completed={3}
        total={10}
        onMarkAllComplete={mockOnMarkAllComplete}
        isUpdating={true}
      />
    );
    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("renders athletic card styling", () => {
    const { container } = render(
      <WorkoutProgress completed={5} total={10} onMarkAllComplete={mockOnMarkAllComplete} />
    );
    expect(container.querySelector(".athletic-card")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const { container } = render(
      <WorkoutProgress completed={5} total={10} onMarkAllComplete={mockOnMarkAllComplete} />
    );
    const progressBar = container.querySelector(".bg-neon-green");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: "50%" });
  });

  it("handles zero total gracefully", () => {
    render(<WorkoutProgress completed={0} total={0} onMarkAllComplete={mockOnMarkAllComplete} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("/ 0 exercises")).toBeInTheDocument();
  });
});
