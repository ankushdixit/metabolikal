import { render, screen, fireEvent } from "@testing-library/react";
import { WorkoutItem } from "../workout-item";

describe("WorkoutItem Component", () => {
  const mockOnToggleComplete = jest.fn();

  const defaultProps = {
    id: "exercise-1",
    exerciseName: "Bench Press",
    sets: 3,
    reps: 12,
    durationMinutes: null,
    restSeconds: 60,
    instructions: "Keep your back flat on the bench.",
    videoUrl: "https://www.youtube.com/watch?v=test",
    isCompleted: false,
    onToggleComplete: mockOnToggleComplete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders exercise name", () => {
    render(<WorkoutItem {...defaultProps} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });

  it("displays sets and reps when provided", () => {
    render(<WorkoutItem {...defaultProps} />);
    expect(screen.getByText("3 sets × 12 reps")).toBeInTheDocument();
  });

  it("displays duration instead of sets/reps when provided", () => {
    render(<WorkoutItem {...defaultProps} sets={null} reps={null} durationMinutes={20} />);
    expect(screen.getByText("20 minutes")).toBeInTheDocument();
    expect(screen.queryByText(/sets/)).not.toBeInTheDocument();
  });

  it("displays rest interval", () => {
    render(<WorkoutItem {...defaultProps} />);
    expect(screen.getByText("Rest: 60s")).toBeInTheDocument();
  });

  it("does not show rest interval when rest_seconds is 0", () => {
    render(<WorkoutItem {...defaultProps} restSeconds={0} />);
    expect(screen.queryByText(/Rest:/)).not.toBeInTheDocument();
  });

  it("renders checkbox unchecked when not completed", () => {
    render(<WorkoutItem {...defaultProps} isCompleted={false} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checkbox checked when completed", () => {
    render(<WorkoutItem {...defaultProps} isCompleted={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onToggleComplete when checkbox is clicked", () => {
    render(<WorkoutItem {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockOnToggleComplete).toHaveBeenCalledWith("exercise-1", true);
  });

  it("passes correct completion state when toggling", () => {
    render(<WorkoutItem {...defaultProps} isCompleted={true} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockOnToggleComplete).toHaveBeenCalledWith("exercise-1", false);
  });

  it("has expand button when instructions exist", () => {
    render(<WorkoutItem {...defaultProps} />);
    const expandButton = screen.getByLabelText("Expand details");
    expect(expandButton).toBeInTheDocument();
  });

  it("does not show expand button when no instructions or video", () => {
    render(<WorkoutItem {...defaultProps} instructions={null} videoUrl={null} />);
    expect(screen.queryByLabelText("Expand details")).not.toBeInTheDocument();
  });

  it("shows instructions when expanded", () => {
    render(<WorkoutItem {...defaultProps} />);
    const expandButton = screen.getByLabelText("Expand details");
    fireEvent.click(expandButton);
    expect(screen.getByText("Keep your back flat on the bench.")).toBeInTheDocument();
  });

  it("shows video link when expanded", () => {
    render(<WorkoutItem {...defaultProps} />);
    const expandButton = screen.getByLabelText("Expand details");
    fireEvent.click(expandButton);
    expect(screen.getByText("Watch Video")).toBeInTheDocument();
  });

  it("video link opens in new tab", () => {
    render(<WorkoutItem {...defaultProps} />);
    const expandButton = screen.getByLabelText("Expand details");
    fireEvent.click(expandButton);
    const videoLink = screen.getByText("Watch Video").closest("a");
    expect(videoLink).toHaveAttribute("target", "_blank");
    expect(videoLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies line-through style when completed", () => {
    render(<WorkoutItem {...defaultProps} isCompleted={true} />);
    const label = screen.getByText("Bench Press");
    expect(label).toHaveClass("line-through");
  });

  it("does not apply line-through when not completed", () => {
    render(<WorkoutItem {...defaultProps} isCompleted={false} />);
    const label = screen.getByText("Bench Press");
    expect(label).not.toHaveClass("line-through");
  });

  it("disables checkbox when isUpdating is true", () => {
    render(<WorkoutItem {...defaultProps} isUpdating={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("does not call onToggleComplete when isUpdating", () => {
    render(<WorkoutItem {...defaultProps} isUpdating={true} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockOnToggleComplete).not.toHaveBeenCalled();
  });

  it("renders athletic card styling", () => {
    const { container } = render(<WorkoutItem {...defaultProps} />);
    expect(container.querySelector(".athletic-card")).toBeInTheDocument();
  });

  it("collapses when clicking expand button again", () => {
    render(<WorkoutItem {...defaultProps} />);
    const expandButton = screen.getByLabelText("Expand details");

    // Expand
    fireEvent.click(expandButton);
    expect(screen.getByText("Keep your back flat on the bench.")).toBeInTheDocument();

    // Collapse
    const collapseButton = screen.getByLabelText("Collapse details");
    fireEvent.click(collapseButton);
    expect(screen.queryByText("Keep your back flat on the bench.")).not.toBeInTheDocument();
  });
});
