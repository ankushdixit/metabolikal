import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BodyFatGuideModal } from "../body-fat-guide-modal";

describe("BodyFatGuideModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Title contains "Body Fat Percentage" and "Guide"
    expect(screen.getByRole("heading", { name: /Body Fat Percentage/i })).toBeInTheDocument();
  });

  it("renders men's body fat ranges section title", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /^Men.s Body Fat/i })).toBeInTheDocument();
  });

  it("renders all 5 men's body fat categories", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    // Men's ranges - some ranges appear in both tables
    expect(screen.getAllByText("5-9%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("10-14%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("15-19%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("20-24%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("25%+").length).toBeGreaterThanOrEqual(1);
  });

  it("renders women's body fat ranges section title", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByText(/Women.s Body Fat % Ranges/i)).toBeInTheDocument();
  });

  it("renders all 5 women's body fat categories", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    // Women's specific range
    expect(screen.getByText("25-31%")).toBeInTheDocument();
    expect(screen.getByText("32%+")).toBeInTheDocument();
  });

  it("renders quick estimation tips section", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByText("Quick Estimation Tips")).toBeInTheDocument();
  });

  it("renders all quick estimation tips", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByText("Visible Abs")).toBeInTheDocument();
    expect(screen.getByText("Muscle Definition")).toBeInTheDocument();
    expect(screen.getByText("Soft Appearance")).toBeInTheDocument();
    expect(screen.getByText("Not Sure?")).toBeInTheDocument();
  });

  it("renders category labels", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    // Each table has these categories
    const essentialLabels = screen.getAllByText("Essential");
    expect(essentialLabels.length).toBe(2); // Men and Women

    const athleticLabels = screen.getAllByText("Athletic");
    expect(athleticLabels.length).toBe(2);

    const fitnessLabels = screen.getAllByText("Fitness");
    expect(fitnessLabels.length).toBe(2);

    const averageLabels = screen.getAllByText("Average");
    expect(averageLabels.length).toBe(2);

    const elevatedLabels = screen.getAllByText("Elevated");
    expect(elevatedLabels.length).toBe(2);
  });

  it("renders 'Close Guide' button", () => {
    render(<BodyFatGuideModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Close Guide/i })).toBeInTheDocument();
  });

  it("Close Guide button closes the modal", async () => {
    const user = userEvent.setup();
    render(<BodyFatGuideModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /Close Guide/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when closed", () => {
    render(<BodyFatGuideModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Body Fat Percentage")).not.toBeInTheDocument();
  });
});
