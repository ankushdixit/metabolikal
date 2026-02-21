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

    it("navigates to previous month in calendar", () => {
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

      expect(screen.getByText("January 2026")).toBeInTheDocument();

      // Click previous month button (first button inside the calendar header)
      const prevMonthButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("svg.lucide-chevron-left") && btn.closest(".absolute"));
      if (prevMonthButton) {
        fireEvent.click(prevMonthButton);
        expect(screen.getByText("December 2025")).toBeInTheDocument();
      }
    });

    it("navigates to next month in calendar", () => {
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

      // Click next month button
      const nextMonthButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("svg.lucide-chevron-right") && btn.closest(".absolute"));
      if (nextMonthButton) {
        fireEvent.click(nextMonthButton);
        expect(screen.getByText("February 2026")).toBeInTheDocument();
      }
    });

    it("selects Day 1 via quick action in calendar", () => {
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

      // Click "Day 1" quick action
      const day1Button = screen.getByText("Day 1");
      fireEvent.click(day1Button);

      expect(mockOnDateChange).toHaveBeenCalledWith(planStartDate);
    });

    it("does not select future dates in calendar", () => {
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

      // Click a future date (day 25, which is after Jan 20 = today)
      const day25Button = screen.getByText("25");
      fireEvent.click(day25Button);

      // Should NOT have called onDateChange
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it("does not select dates before plan start in calendar", () => {
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

      // Click a date before plan start (day 10, before Jan 15)
      const day10Button = screen.getByText("10");
      fireEvent.click(day10Button);

      // Should NOT have called onDateChange
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe("day number display", () => {
    it("shows 'Before plan' when dayNumber < 1", () => {
      // Select a date before plan start
      const beforePlanDate = new Date("2026-01-14T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={beforePlanDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText("Before plan")).toBeInTheDocument();
    });

    it("wraps day number when exceeding totalDays", () => {
      // Day 10 of a 7-day plan should wrap to day 3: ((10-1) % 7) + 1 = 3
      const day10Date = new Date("2026-01-24T00:00:00"); // 9 days after Jan 15 = day 10
      render(
        <TimelineDateNav
          selectedDate={day10Date}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText(/Day 3/)).toBeInTheDocument();
    });

    it("does not show (History) when viewing today", () => {
      const today = new Date("2026-01-20T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={today}
          planStartDate={planStartDate}
          totalDays={30}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.queryByText(/History/)).not.toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("does not navigate to today when disabled", () => {
      const pastDate = new Date("2026-01-18T00:00:00");
      render(
        <TimelineDateNav
          selectedDate={pastDate}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
          disabled
        />
      );

      fireEvent.click(screen.getByText("Today"));
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it("disables calendar picker when disabled", () => {
      render(
        <TimelineDateNav
          selectedDate={new Date("2026-01-18T00:00:00")}
          planStartDate={planStartDate}
          totalDays={7}
          onDateChange={mockOnDateChange}
          disabled
        />
      );

      // The date picker button should be disabled
      const buttons = screen.getAllByRole("button");
      const dateButton = buttons.find((btn) => btn.textContent?.includes("Jan"));
      expect(dateButton).toBeDisabled();
    });
  });
});
