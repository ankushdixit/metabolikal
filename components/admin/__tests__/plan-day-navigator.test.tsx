/**
 * Tests for PlanDayNavigator component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { PlanDayNavigator } from "../plan-day-navigator";

describe("PlanDayNavigator", () => {
  const defaultProps = {
    currentDay: 5,
    totalDays: 30,
    planStartDate: new Date("2026-01-01"),
    onDayChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders current day number", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    expect(screen.getByText("Day 5")).toBeInTheDocument();
  });

  it("renders day count", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    expect(screen.getByText("5 of 30 days")).toBeInTheDocument();
  });

  it("renders date when planStartDate is provided", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    // Day 5 of a plan starting Jan 1 = Jan 5
    expect(screen.getByText(/Jan 5, 2026/)).toBeInTheDocument();
  });

  it("does not render date when planStartDate is null", () => {
    render(<PlanDayNavigator {...defaultProps} planStartDate={null} />);
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("calls onDayChange when next button is clicked", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    const nextButton = screen.getByLabelText("Next day");
    fireEvent.click(nextButton);
    expect(defaultProps.onDayChange).toHaveBeenCalledWith(6);
  });

  it("calls onDayChange when previous button is clicked", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    const prevButton = screen.getByLabelText("Previous day");
    fireEvent.click(prevButton);
    expect(defaultProps.onDayChange).toHaveBeenCalledWith(4);
  });

  it("disables previous button on day 1", () => {
    render(<PlanDayNavigator {...defaultProps} currentDay={1} />);
    const prevButton = screen.getByLabelText("Previous day");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last day", () => {
    render(<PlanDayNavigator {...defaultProps} currentDay={30} />);
    const nextButton = screen.getByLabelText("Next day");
    expect(nextButton).toBeDisabled();
  });

  it("handles go to day input submission", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    const input = screen.getByPlaceholderText("1-30");
    const goButton = screen.getByRole("button", { name: "Go" });

    fireEvent.change(input, { target: { value: "15" } });
    fireEvent.click(goButton);

    expect(defaultProps.onDayChange).toHaveBeenCalledWith(15);
  });

  it("does not submit invalid day numbers", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    const input = screen.getByPlaceholderText("1-30");
    const goButton = screen.getByRole("button", { name: "Go" });

    fireEvent.change(input, { target: { value: "50" } }); // Out of range
    fireEvent.click(goButton);

    expect(defaultProps.onDayChange).not.toHaveBeenCalled();
  });

  it("only allows numeric input", () => {
    render(<PlanDayNavigator {...defaultProps} />);
    const input = screen.getByPlaceholderText("1-30") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "abc" } });
    expect(input.value).toBe("");

    fireEvent.change(input, { target: { value: "12" } });
    expect(input.value).toBe("12");
  });

  it("disables all controls when disabled prop is true", () => {
    render(<PlanDayNavigator {...defaultProps} disabled />);

    expect(screen.getByLabelText("Previous day")).toBeDisabled();
    expect(screen.getByLabelText("Next day")).toBeDisabled();
    expect(screen.getByPlaceholderText("1-30")).toBeDisabled();
  });

  it("shows Today badge when current day is today", () => {
    // Create a date that is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start date 4 days ago makes today = day 5
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 4);

    render(<PlanDayNavigator {...defaultProps} currentDay={5} planStartDate={startDate} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
  });
});
