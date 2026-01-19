import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EliteLifestylesModal } from "../elite-lifestyles-modal";

describe("EliteLifestylesModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onOpenCalendly: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<EliteLifestylesModal {...defaultProps} />);
    expect(screen.getByText(/We Understand/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Lifestyle/)).toBeInTheDocument();
  });

  it("renders all six lifestyle cards", () => {
    render(<EliteLifestylesModal {...defaultProps} />);
    expect(screen.getByText("C-Suite Executives")).toBeInTheDocument();
    expect(screen.getByText("High-Performance Entrepreneurs")).toBeInTheDocument();
    expect(screen.getByText("Global Professionals")).toBeInTheDocument();
    expect(screen.getByText("Elite Performers")).toBeInTheDocument();
    expect(screen.getByText("Professionals")).toBeInTheDocument();
    expect(screen.getByText("NOW YOU!!")).toBeInTheDocument();
  });

  it("renders lifestyle descriptions", () => {
    render(<EliteLifestylesModal {...defaultProps} />);
    expect(screen.getByText(/Where 9-5 isn't even a concept/i)).toBeInTheDocument();
    expect(screen.getByText(/Who answer to no one but their vision/i)).toBeInTheDocument();
    expect(screen.getByText(/6 countries in 8 weeks means metabolic chaos/i)).toBeInTheDocument();
    expect(screen.getByText(/Who live to scale peak performance/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Whose demanding careers require metabolic excellence/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for your transformation?")).toBeInTheDocument();
  });

  it("renders 'NOW YOU!!' card as highlighted", () => {
    render(<EliteLifestylesModal {...defaultProps} />);
    // NOW YOU!! card has the gradient-athletic class applied to its title
    const nowYouTitle = screen.getByText("NOW YOU!!");
    expect(nowYouTitle).toHaveClass("gradient-athletic");
  });

  it("renders CTA button", () => {
    render(<EliteLifestylesModal {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Claim Your FREE Strategy Session/i })
    ).toBeInTheDocument();
  });

  it("CTA opens Calendly modal", async () => {
    const user = userEvent.setup();
    render(<EliteLifestylesModal {...defaultProps} />);

    const ctaButton = screen.getByRole("button", {
      name: /Claim Your FREE Strategy Session/i,
    });
    await user.click(ctaButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<EliteLifestylesModal {...defaultProps} open={false} />);
    expect(screen.queryByText("C-Suite Executives")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<EliteLifestylesModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
