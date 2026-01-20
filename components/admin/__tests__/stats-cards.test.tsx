import { render, screen } from "@testing-library/react";
import { StatsCards } from "../stats-cards";

describe("StatsCards Component", () => {
  const defaultProps = {
    totalClients: 25,
    pendingReviews: 5,
    flaggedClients: 3,
  };

  it("renders all stat cards", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("Total Clients")).toBeInTheDocument();
    expect(screen.getByText("Pending Reviews")).toBeInTheDocument();
    expect(screen.getByText("Flagged Clients")).toBeInTheDocument();
  });

  it("displays correct values", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders descriptions for each stat", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("Active clients in the program")).toBeInTheDocument();
    expect(screen.getByText("Check-ins awaiting review")).toBeInTheDocument();
    expect(screen.getByText("Clients needing follow-up")).toBeInTheDocument();
  });

  it("highlights pending reviews when greater than 0", () => {
    render(<StatsCards {...defaultProps} />);
    const pendingValue = screen.getByText("5");
    expect(pendingValue).toHaveClass("gradient-athletic");
  });

  it("highlights flagged clients when greater than 0", () => {
    render(<StatsCards {...defaultProps} />);
    const flaggedValue = screen.getByText("3");
    expect(flaggedValue).toHaveClass("gradient-athletic");
  });

  it("does not highlight total clients", () => {
    render(<StatsCards {...defaultProps} />);
    const totalValue = screen.getByText("25");
    expect(totalValue).not.toHaveClass("gradient-athletic");
  });

  it("renders loading state", () => {
    const { container } = render(<StatsCards {...defaultProps} isLoading={true} />);
    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("does not show loading skeleton when not loading", () => {
    const { container } = render(<StatsCards {...defaultProps} isLoading={false} />);
    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBe(0);
  });

  it("renders zero values correctly", () => {
    render(<StatsCards totalClients={0} pendingReviews={0} flaggedClients={0} />);
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(3);
  });

  it("does not highlight zero values", () => {
    render(<StatsCards totalClients={0} pendingReviews={0} flaggedClients={0} />);
    const pendingZero = screen.getAllByText("0")[1];
    expect(pendingZero).not.toHaveClass("gradient-athletic");
  });

  it("uses athletic-card styling", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    const cards = container.querySelectorAll(".athletic-card");
    expect(cards.length).toBe(3);
  });

  it("renders three cards in a grid", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("md:grid-cols-3");
  });
});
