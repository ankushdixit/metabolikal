/**
 * Tests for TimelineDateNav component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineDateNav } from "../timeline-date-nav";

describe("TimelineDateNav", () => {
  // Fixed dates for testing
  const planStartDate = new Date("2026-01-15T00:00:00");
  const mockOnDateChange = jest.fn();

  beforeEach(() => {
    mockOnDateChange.mockClear();
    // Mock current date to January 20, 2026
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("renders date display", () => {
      const selectedDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={selectedDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Should show date in some format
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
      expect(screen.getByText(/18/)).toBeInTheDocument();
    });

    it("renders day number", () => {
      const selectedDate = new Date("2026-01-18T00:00:00"); // Day 4
      render(
        <TimelineDateNav
          selectedDate={selectedDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText(/Day 4/)).toBeInTheDocument();
    });

    it("renders navigation buttons", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByLabelText("Previous day")).toBeInTheDocument();
      expect(screen.getByLabelText("Next day")).toBeInTheDocument();
    });

    it("shows Today button when not viewing today", () => {
      const pastDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={pastDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("hides Today button when viewing today", () => {
      const today = new Date("2026-01-20T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={today}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.queryByText("Today")).not.toBeInTheDocument();
    });

    it("shows History label for past dates", () => {
      const pastDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={pastDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText(/History/)).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("calls onDateChange with previous date when prev button clicked", () => {
      const selectedDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={selectedDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      fireEvent.click(screen.getByLabelText("Previous day"));

      expect(mockOnDateChange).toHaveBeenCalled();
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(17);
    });

    it("calls onDateChange with next date when next button clicked", () => {
      const selectedDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={selectedDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      fireEvent.click(screen.getByLabelText("Next day"));

      expect(mockOnDateChange).toHaveBeenCalled();
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(19);
    });

    it("calls onDateChange with today when Today button clicked", () => {
      const pastDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={pastDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      fireEvent.click(screen.getByText("Today"));

      expect(mockOnDateChange).toHaveBeenCalled();
      const calledDate = mockOnDateChange.mock.calls[0][0];
      expect(calledDate.getDate()).toBe(20);
    });

    it("disables prev button at plan start date", () => {
      render(
        <TimelineDateNav
          selectedDate={planStartDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      const prevButton = screen.getByLabelText("Previous day");
      expect(prevButton).toBeDisabled();
    });

    it("disables next button when viewing today", () => {
      const today = new Date("2026-01-20T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={today}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      const nextButton = screen.getByLabelText("Next day");
      expect(nextButton).toBeDisabled();
    });

    it("does not navigate when disabled", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
          disabled
        />
      );

      fireEvent.click(screen.getByLabelText("Previous day"));
      fireEvent.click(screen.getByLabelText("Next day"));

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe("calendar picker", () => {
    it("opens calendar when date button clicked", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Find and click the date picker button (has calendar icon)
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      fireEvent.click(dateButton!);

      // Calendar should show month navigation
      expect(screen.getByText(/January 2026/)).toBeInTheDocument();
    });

    it("shows quick action buttons in calendar", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Open calendar
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      fireEvent.click(dateButton!);

      // Should have Today and Day 1 quick actions
      expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    it("calls onDateChange when calendar date selected", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Open calendar
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      fireEvent.click(dateButton!);

      // Click on day 17
      const day17Button = screen.getByText("17");
      fireEvent.click(day17Button);

      expect(mockOnDateChange).toHaveBeenCalled();
    });

    it("disables future dates in calendar", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Open calendar
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      fireEvent.click(dateButton!);

      // Day 25 should be disabled (future)
      const day25Button = screen.getByText("25");
      expect(day25Button).toBeDisabled();
    });

    it("disables dates before plan start in calendar", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      // Open calendar
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      fireEvent.click(dateButton!);

      // Day 10 should be disabled (before plan start on Jan 15)
      const day10Button = screen.getByText("10");
      expect(day10Button).toBeDisabled();
    });
  });
});
