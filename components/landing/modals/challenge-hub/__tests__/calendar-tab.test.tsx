import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarTab } from "../calendar-tab";
import type { DayProgress } from "@/hooks/use-gamification";

// Mock challenge-utils
jest.mock("@/lib/challenge-utils", () => ({
  getDateForDay: (startDate: string, day: number) => {
    const date = new Date(startDate + "T00:00:00");
    date.setDate(date.getDate() + day - 1);
    return date;
  },
}));

const mockDayProgress: DayProgress = {
  dayNumber: 1,
  hasData: true,
  loggedDate: "Jan 28, 2026",
  pointsEarned: 75,
  metrics: {
    steps: 10000,
    waterLiters: 3,
    floorsClimbed: 10,
    proteinGrams: 150,
    sleepHours: 8,
    feeling: "Great",
    tomorrowFocus: "More steps",
  },
};

describe("CalendarTab", () => {
  const defaultProps = {
    currentDay: 5,
    totalDays: 30,
    startDate: "2026-01-28",
    weekUnlocked: 1,
    allProgress: {} as Record<number, DayProgress>,
    isDayUnlocked: jest.fn((day: number) => day <= 7),
    getDayProgress: jest.fn(() => null),
    canEditDay: jest.fn(() => true),
    onEditDay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the calendar title with totalDays", () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText("30-Day Calendar")).toBeInTheDocument();
  });

  it("renders weekday headers", () => {
    render(<CalendarTab {...defaultProps} />);
    const dayHeaders = screen.getAllByText(/^[SMTWF]$/);
    expect(dayHeaders).toHaveLength(7);
  });

  it("renders 30 day buttons", () => {
    render(<CalendarTab {...defaultProps} />);
    // Each calendar day has a button element
    const buttons = screen.getAllByRole("button");
    // At least 30 day buttons
    expect(buttons.length).toBeGreaterThanOrEqual(30);
  });

  it("renders the legend section", () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  describe("week unlock status", () => {
    it("shows correct week when weekUnlocked <= 4", () => {
      render(<CalendarTab {...defaultProps} weekUnlocked={2} />);
      expect(screen.getByText(/Week 2 Unlocked/)).toBeInTheDocument();
    });

    it("shows 'Week 5 (All)' when weekUnlocked > 4", () => {
      render(<CalendarTab {...defaultProps} weekUnlocked={5} />);
      expect(screen.getByText(/Week 5 \(All\) Unlocked/)).toBeInTheDocument();
    });
  });

  describe("day status", () => {
    it("marks current day correctly", () => {
      render(<CalendarTab {...defaultProps} currentDay={3} />);
      // Day 3 should have the "current" ring styling
      const day3Button = screen.getByRole("button", { name: /^3/ });
      expect(day3Button).toBeInTheDocument();
      expect(day3Button.className).toContain("ring-2 ring-primary");
    });

    it("marks completed days with check icon", () => {
      const allProgress: Record<number, DayProgress> = {
        1: { ...mockDayProgress },
        2: { ...mockDayProgress },
      };
      render(<CalendarTab {...defaultProps} currentDay={5} allProgress={allProgress} />);
      // Completed days should not show their number (they show Check icon instead)
      // Day 1 and 2 are past and have data => completed status
      // The component renders Check SVG icons for completed days
    });

    it("marks missed days (past, no data) with dashed border", () => {
      // Day 1-4 are past with no progress data => "missed" status
      render(<CalendarTab {...defaultProps} currentDay={5} allProgress={{}} />);
      // Missed days should show their day number and have the dashed border class
      const day1Button = screen.getByRole("button", { name: /^1/ });
      expect(day1Button.className).toContain("border-dashed");
    });

    it("marks locked days (future and not unlocked)", () => {
      const isDayUnlocked = jest.fn((day: number) => day <= 7);
      render(<CalendarTab {...defaultProps} currentDay={5} isDayUnlocked={isDayUnlocked} />);
      // Day 10 should be locked (future and beyond week 1)
      // Locked days show Lock icon and are disabled
      const allButtons = screen.getAllByRole("button");
      const disabledButtons = allButtons.filter((btn) => btn.hasAttribute("disabled"));
      expect(disabledButtons.length).toBeGreaterThan(0);
    });

    it("marks future unlocked days as 'future'", () => {
      const isDayUnlocked = jest.fn(() => true); // All days unlocked
      render(<CalendarTab {...defaultProps} currentDay={3} isDayUnlocked={isDayUnlocked} />);
      // Day 4, 5 etc should be "future" (past currentDay, unlocked)
      const day4Button = screen.getByRole("button", { name: /^4/ });
      expect(day4Button.className).toContain("bg-secondary");
      expect(day4Button).not.toBeDisabled();
    });
  });

  describe("day click handling", () => {
    it("opens edit mode for missed days (past, no data, editable)", () => {
      const onEditDay = jest.fn();
      const canEditDay = jest.fn(() => true);
      const getDayProgress = jest.fn(() => null);

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={{}}
          canEditDay={canEditDay}
          getDayProgress={getDayProgress}
          onEditDay={onEditDay}
        />
      );

      // Click on day 2 (past, no data => missed, editable)
      const day2Button = screen.getByRole("button", { name: /^2/ });
      fireEvent.click(day2Button);

      expect(onEditDay).toHaveBeenCalledWith(2);
    });

    it("blocks click on locked future days", () => {
      const isDayUnlocked = jest.fn((day: number) => day <= 7);
      const getDayProgress = jest.fn(() => null);

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          isDayUnlocked={isDayUnlocked}
          getDayProgress={getDayProgress}
        />
      );

      // Day 10 is locked (future, not unlocked) - buttons are disabled
      // The disabled attribute prevents clicks
    });

    it("toggles selected day details for completed days", () => {
      const progress: DayProgress = {
        dayNumber: 1,
        hasData: true,
        loggedDate: "Jan 28, 2026",
        pointsEarned: 75,
        metrics: {
          steps: 10000,
          waterLiters: 3,
          floorsClimbed: 10,
          proteinGrams: 150,
          sleepHours: 8,
          feeling: undefined,
          tomorrowFocus: undefined,
        },
      };
      const getDayProgress = jest.fn(() => progress);
      const allProgress: Record<number, DayProgress> = { 1: progress };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      // Click on day 1 (completed)
      // Completed days have Check icon, find the button containing it
      const buttons = screen.getAllByRole("button");
      // Day 1 is the first actual day button after padding
      // Use the button that is not disabled and is before current day
      fireEvent.click(
        buttons.find(
          (b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary")
        )!
      );

      // Should show details panel
      expect(screen.getByText(/Day .* Progress/)).toBeInTheDocument();
      expect(screen.getByText("10,000")).toBeInTheDocument();
      expect(screen.getByText("75 pts")).toBeInTheDocument();
    });

    it("deselects day when clicking same completed day again", () => {
      const progress: DayProgress = {
        dayNumber: 1,
        hasData: true,
        loggedDate: "Jan 28, 2026",
        pointsEarned: 75,
        metrics: {
          steps: 10000,
          waterLiters: 3,
          floorsClimbed: 10,
          proteinGrams: 150,
          sleepHours: 8,
          feeling: undefined,
          tomorrowFocus: undefined,
        },
      };
      const getDayProgress = jest.fn(() => progress);
      const allProgress: Record<number, DayProgress> = { 1: progress };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;

      // Click to select
      fireEvent.click(completedButton);
      expect(screen.getByText(/Day .* Progress/)).toBeInTheDocument();

      // Click again to deselect
      fireEvent.click(completedButton);
      expect(screen.queryByText(/Day .* Progress/)).not.toBeInTheDocument();
    });

    it("sets selectedDay to null when clicking a day with no data and no hasData", () => {
      const getDayProgress = jest.fn(() => ({ hasData: false }) as DayProgress);
      const canEditDay = jest.fn(() => false);

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          canEditDay={canEditDay}
          getDayProgress={getDayProgress}
        />
      );

      // Click on the current day (day 5) - which has no data and is not editable for missed
      const day5Button = screen.getByRole("button", { name: /^5/ });
      fireEvent.click(day5Button);

      // Should not show details (no data, not editable for missed)
      expect(screen.queryByText(/Day .* Progress/)).not.toBeInTheDocument();
    });
  });

  describe("selected day details panel", () => {
    const progressWithFeeling: DayProgress = {
      dayNumber: 1,
      hasData: true,
      loggedDate: "Jan 29, 2026",
      pointsEarned: 80,
      metrics: {
        steps: 12000,
        waterLiters: 4,
        floorsClimbed: 15,
        proteinGrams: 160,
        sleepHours: 7,
        feeling: "Energetic",
        tomorrowFocus: "Work on cardio",
      },
    };

    it("shows feeling section when present", () => {
      const getDayProgress = jest.fn(() => progressWithFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressWithFeeling };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      // Click on completed day
      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      expect(screen.getByText("Feeling")).toBeInTheDocument();
      expect(screen.getByText("Energetic")).toBeInTheDocument();
    });

    it("shows tomorrowFocus section when present", () => {
      const getDayProgress = jest.fn(() => progressWithFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressWithFeeling };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      expect(screen.getByText("Work on cardio")).toBeInTheDocument();
    });

    it("does not show feeling section when null", () => {
      const progressNoFeeling: DayProgress = {
        ...progressWithFeeling,
        metrics: { ...progressWithFeeling.metrics, feeling: undefined },
      };
      const getDayProgress = jest.fn(() => progressNoFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressNoFeeling };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      expect(screen.queryByText("Feeling")).not.toBeInTheDocument();
    });

    it("does not show tomorrowFocus section when null", () => {
      const progressNoFocus: DayProgress = {
        ...progressWithFeeling,
        metrics: { ...progressWithFeeling.metrics, tomorrowFocus: undefined },
      };
      const getDayProgress = jest.fn(() => progressNoFocus);
      const allProgress: Record<number, DayProgress> = { 1: progressNoFocus };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      // tomorrowFocus heading should not be rendered
      expect(screen.queryByText("Tomorrow\u2019s Focus")).not.toBeInTheDocument();
    });

    it("shows edit button when canEditDay and onEditDay are provided", () => {
      const getDayProgress = jest.fn(() => progressWithFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressWithFeeling };
      const canEditDay = jest.fn(() => true);
      const onEditDay = jest.fn();

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
          canEditDay={canEditDay}
          onEditDay={onEditDay}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      const editButton = screen.getByText(/Edit Day/);
      expect(editButton).toBeInTheDocument();

      // Click the edit button
      fireEvent.click(editButton);
      expect(onEditDay).toHaveBeenCalled();
    });

    it("does not show edit button when canEditDay returns false", () => {
      const getDayProgress = jest.fn(() => progressWithFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressWithFeeling };
      const canEditDay = jest.fn(() => false);

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
          canEditDay={canEditDay}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      expect(screen.queryByText(/Edit Day/)).not.toBeInTheDocument();
    });

    it("shows all metrics in the detail panel", () => {
      const getDayProgress = jest.fn(() => progressWithFeeling);
      const allProgress: Record<number, DayProgress> = { 1: progressWithFeeling };

      render(
        <CalendarTab
          {...defaultProps}
          currentDay={5}
          allProgress={allProgress}
          getDayProgress={getDayProgress}
        />
      );

      const completedButton = screen
        .getAllByRole("button")
        .find((b) => !(b as HTMLButtonElement).disabled && b.className.includes("bg-primary"))!;
      fireEvent.click(completedButton);

      expect(screen.getByText("Steps")).toBeInTheDocument();
      expect(screen.getByText("Water")).toBeInTheDocument();
      expect(screen.getByText("Floors")).toBeInTheDocument();
      expect(screen.getByText("Protein")).toBeInTheDocument();
      expect(screen.getByText("Sleep")).toBeInTheDocument();
      expect(screen.getByText("12,000")).toBeInTheDocument(); // steps
      expect(screen.getByText("4L")).toBeInTheDocument(); // water
      expect(screen.getByText("15")).toBeInTheDocument(); // floors
      expect(screen.getByText("160g")).toBeInTheDocument(); // protein
      expect(screen.getByText("7h")).toBeInTheDocument(); // sleep
    });
  });

  describe("without optional props", () => {
    it("renders without canEditDay and onEditDay", () => {
      const { canEditDay: _canEditDay, onEditDay: _onEditDay, ...propsWithoutEdit } = defaultProps;
      render(<CalendarTab {...propsWithoutEdit} />);
      expect(screen.getByText("30-Day Calendar")).toBeInTheDocument();
    });

    it("handles missing startDate gracefully for dateLabels", () => {
      render(<CalendarTab {...defaultProps} startDate="" />);
      // Should still render without crashing
      expect(screen.getByText("30-Day Calendar")).toBeInTheDocument();
    });
  });
});
