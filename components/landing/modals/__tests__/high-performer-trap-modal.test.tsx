import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HighPerformerTrapModal } from "../high-performer-trap-modal";

describe("HighPerformerTrapModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onOpenCalendly: jest.fn(),
    onOpenAssessment: jest.fn(),
    onOpenChallenge: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<HighPerformerTrapModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Modal title is "The High-Performer Trap Revealed" (h2)
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders three trap items", () => {
    render(<HighPerformerTrapModal {...defaultProps} />);
    expect(screen.getByText("Decision Fatigue Hits at 3PM")).toBeInTheDocument();
    expect(screen.getByText("Peak Performance Inconsistency")).toBeInTheDocument();
    expect(screen.getByText('"Tried Everything" Frustration')).toBeInTheDocument();
  });

  it("renders trap item descriptions", () => {
    render(<HighPerformerTrapModal {...defaultProps} />);
    expect(
      screen.getByText("Million-dollar decisions compromised by metabolic crashes")
    ).toBeInTheDocument();
    expect(screen.getByText("Brilliant one day, brain fog the next")).toBeInTheDocument();
    expect(
      screen.getByText("Elite strategies that work for everyone else fail you")
    ).toBeInTheDocument();
  });

  it("renders revelation section", () => {
    render(<HighPerformerTrapModal {...defaultProps} />);
    expect(screen.getByText("You weren't designed for generic solutions.")).toBeInTheDocument();
    expect(screen.getByText(/Most executives aren't lacking/i)).toBeInTheDocument();
    expect(screen.getByText(/METABOLIC OPERATING SYSTEM/i)).toBeInTheDocument();
  });

  it("renders three CTAs", () => {
    render(<HighPerformerTrapModal {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Claim Your FREE Strategy Session/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Take the Metabolic Assessment/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start the 30-Day Challenge/i })).toBeInTheDocument();
  });

  it("Calendly CTA opens Calendly modal", async () => {
    const user = userEvent.setup();
    render(<HighPerformerTrapModal {...defaultProps} />);

    const calendlyButton = screen.getByRole("button", {
      name: /Claim Your FREE Strategy Session/i,
    });
    await user.click(calendlyButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();
  });

  it("Assessment CTA triggers assessment callback", async () => {
    const user = userEvent.setup();
    render(<HighPerformerTrapModal {...defaultProps} />);

    const assessmentButton = screen.getByRole("button", {
      name: /Take the Metabolic Assessment/i,
    });
    await user.click(assessmentButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenAssessment).toHaveBeenCalled();
  });

  it("Challenge CTA triggers challenge callback", async () => {
    const user = userEvent.setup();
    render(<HighPerformerTrapModal {...defaultProps} />);

    const challengeButton = screen.getByRole("button", {
      name: /Start the 30-Day Challenge/i,
    });
    await user.click(challengeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenChallenge).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<HighPerformerTrapModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Decision Fatigue Hits at 3PM")).not.toBeInTheDocument();
  });
});
