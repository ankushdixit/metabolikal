import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MethodModal } from "../method-modal";

describe("MethodModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Title contains "The METABOLI-K-AL Method"
    expect(screen.getByText("METABOLI-K-AL")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("Beyond Fat Loss: Executive Metabolic Mastery")).toBeInTheDocument();
  });

  it("renders four phase cards", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("BASELINE & AUDIT")).toBeInTheDocument();
    expect(screen.getByText("REBALANCE")).toBeInTheDocument();
    expect(screen.getByText("REWIRE")).toBeInTheDocument();
    expect(screen.getByText("REINFORCE")).toBeInTheDocument();
  });

  it("renders Phase 0 with correct details", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("PHASE 0")).toBeInTheDocument();
    expect(screen.getByText("Foundation Phase")).toBeInTheDocument();
    expect(screen.getByText("4-5 days")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle & rhythm audit")).toBeInTheDocument();
  });

  it("renders Phase 1 with correct details", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("PHASE 1")).toBeInTheDocument();
    expect(screen.getByText("Reset Phase")).toBeInTheDocument();
    expect(screen.getByText("Glucose optimization protocols")).toBeInTheDocument();
  });

  it("renders Phase 2 with correct details", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("PHASE 2")).toBeInTheDocument();
    expect(screen.getByText("Building Phase")).toBeInTheDocument();
    expect(screen.getByText("Strength & mobility protocols")).toBeInTheDocument();
  });

  it("renders Phase 3 with correct details", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("PHASE 3")).toBeInTheDocument();
    expect(screen.getByText("Freedom Phase")).toBeInTheDocument();
    expect(screen.getByText("Executive dining & social protocols")).toBeInTheDocument();
  });

  it("renders each phase with Purpose, Includes, and Outcome", () => {
    render(<MethodModal {...defaultProps} />);
    // Purpose section (4 phases)
    const purposeLabels = screen.getAllByText("Purpose");
    expect(purposeLabels.length).toBe(4);

    // Includes section (4 phases)
    const includesLabels = screen.getAllByText("Includes");
    expect(includesLabels.length).toBe(4);

    // Outcome section (4 phases)
    const outcomeLabels = screen.getAllByText("Outcome");
    expect(outcomeLabels.length).toBe(4);
  });

  it("renders Five Pillars section title", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("The 5 Pillars of Metabolikal Transformation")).toBeInTheDocument();
  });

  it("renders all five pillars", () => {
    render(<MethodModal {...defaultProps} />);
    expect(screen.getByText("Metabolic Reset Protocol")).toBeInTheDocument();
    expect(screen.getByText("Rhythm-Based Nutrition")).toBeInTheDocument();
    expect(screen.getByText("Strategic Movement Design")).toBeInTheDocument();
    expect(screen.getByText("Stress & Recovery Optimization")).toBeInTheDocument();
    expect(screen.getByText("Mindset & Identity Transformation")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<MethodModal {...defaultProps} open={false} />);
    expect(screen.queryByText("BASELINE & AUDIT")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MethodModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
