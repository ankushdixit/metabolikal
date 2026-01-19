import { render, screen, fireEvent } from "@testing-library/react";
import { UserGuideModal } from "../user-guide-modal";

describe("UserGuideModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onLaunchChallenge: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when open", () => {
    render(<UserGuideModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/30-Day Challenge/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<UserGuideModal {...defaultProps} open={false} />);

    expect(screen.queryByText(/How the/)).not.toBeInTheDocument();
  });

  it("displays the welcome message", () => {
    render(<UserGuideModal {...defaultProps} />);

    expect(screen.getByText(/Welcome to the 30-Day METABOLI-K-AL Challenge!/)).toBeInTheDocument();
  });

  it("displays all 5 challenge steps", () => {
    render(<UserGuideModal {...defaultProps} />);

    expect(screen.getByText("Start Your Challenge")).toBeInTheDocument();
    expect(screen.getByText("Track Daily Metrics")).toBeInTheDocument();
    expect(screen.getByText("Build Your Streak")).toBeInTheDocument();
    expect(screen.getByText("Unlock New Weeks")).toBeInTheDocument();
    expect(screen.getByText("Reach Your Goals")).toBeInTheDocument();
  });

  it("displays the points table", () => {
    render(<UserGuideModal {...defaultProps} />);

    // Use getAllByText for elements that appear multiple times
    expect(screen.getAllByText("Points System").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Steps").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Water").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Floors").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Protein").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sleep").length).toBeGreaterThan(0);
    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Maximum Daily")).toBeInTheDocument();
    expect(screen.getByText("150 pts")).toBeInTheDocument();
  });

  it("displays key features section", () => {
    render(<UserGuideModal {...defaultProps} />);

    expect(screen.getByText("Key Features")).toBeInTheDocument();
    expect(screen.getByText("30-Day Calendar View")).toBeInTheDocument();
    expect(screen.getByText("Streak Tracking")).toBeInTheDocument();
    expect(screen.getByText("Cumulative Stats")).toBeInTheDocument();
  });

  it("displays tips for success section", () => {
    render(<UserGuideModal {...defaultProps} />);

    expect(screen.getByText("7 Tips for Success")).toBeInTheDocument();
    expect(screen.getByText(/Log your metrics at the same time each day/)).toBeInTheDocument();
  });

  it("calls onLaunchChallenge when CTA button is clicked", () => {
    render(<UserGuideModal {...defaultProps} />);

    const launchButton = screen.getByRole("button", { name: /Launch Challenge Hub Now/i });
    fireEvent.click(launchButton);

    expect(defaultProps.onLaunchChallenge).toHaveBeenCalledTimes(1);
  });
});
