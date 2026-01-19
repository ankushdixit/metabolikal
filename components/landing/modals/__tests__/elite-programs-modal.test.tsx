import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EliteProgramsModal } from "../elite-programs-modal";

describe("EliteProgramsModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onOpenCalendly: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Elite Transformation/i })).toBeInTheDocument();
  });

  it("renders three program cards", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("Core Reset")).toBeInTheDocument();
    expect(screen.getByText("Rhythm Rewire")).toBeInTheDocument();
    expect(screen.getByText("The Fulmane Experience")).toBeInTheDocument();
  });

  it("renders Core Reset card with correct details", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("MONTHLY COACHING")).toBeInTheDocument();
    expect(screen.getByText("Starting Point")).toBeInTheDocument();
    expect(
      screen.getByText("Personalized onboarding & comprehensive assessment")
    ).toBeInTheDocument();
  });

  it("renders Rhythm Rewire with MOST POPULAR badge", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("MOST POPULAR")).toBeInTheDocument();
    expect(screen.getByText("QUARTERLY INTENSIVE")).toBeInTheDocument();
    expect(screen.getByText("Complete System")).toBeInTheDocument();
  });

  it("renders The Fulmane Experience card with correct details", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("4-MONTH ELITE MENTORSHIP")).toBeInTheDocument();
    expect(screen.getByText("Elite Level")).toBeInTheDocument();
    expect(screen.getByText("Weekly 1:1 strategy sessions with Shivashish")).toBeInTheDocument();
  });

  it("renders 'Perfect for' description on each card", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    // 3 "Perfect For" labels
    const perfectForLabels = screen.getAllByText("Perfect For");
    expect(perfectForLabels.length).toBe(3);

    expect(
      screen.getByText(/Executives ready to establish foundational health habits/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Busy executives who want complete transformation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/C-suite executives who want the ultimate/i)).toBeInTheDocument();
  });

  it("renders 'All Programs Include' section", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("All Programs Include")).toBeInTheDocument();
    expect(screen.getByText("The METABOLI-K-AL Method")).toBeInTheDocument();
    expect(screen.getByText("Performance Integration")).toBeInTheDocument();
  });

  it("renders common features", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByText("Comprehensive metabolic assessment")).toBeInTheDocument();
    expect(screen.getByText("60/40 lifestyle optimization system")).toBeInTheDocument();
    expect(screen.getByText("Executive performance optimization")).toBeInTheDocument();
  });

  it("renders CTA button 'Book Your Strategy Session'", () => {
    render(<EliteProgramsModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Book Your Strategy Session/i })).toBeInTheDocument();
  });

  it("CTA opens Calendly modal", async () => {
    const user = userEvent.setup();
    render(<EliteProgramsModal {...defaultProps} />);

    const ctaButton = screen.getByRole("button", {
      name: /Book Your Strategy Session/i,
    });
    await user.click(ctaButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<EliteProgramsModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Core Reset")).not.toBeInTheDocument();
  });
});
