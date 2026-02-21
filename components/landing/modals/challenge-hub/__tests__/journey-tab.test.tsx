import { render, screen } from "@testing-library/react";
import { JourneyTab } from "../journey-tab";

const defaultCumulativeStats = {
  totalSteps: 30000,
  totalWater: 12,
  totalFloors: 45,
  totalProtein: 300,
  totalSleepHours: 24,
  daysCompleted: 3,
};

const defaultProps = {
  dayStreak: 3,
  totalDays: 30,
  totalPoints: 100,
  cumulativeStats: defaultCumulativeStats,
};

describe("JourneyTab", () => {
  it("renders the section title", () => {
    render(<JourneyTab {...defaultProps} />);
    expect(screen.getByText("Your Journey So Far")).toBeInTheDocument();
  });

  it("renders new user encouragement when daysCompleted is 0", () => {
    render(
      <JourneyTab
        {...defaultProps}
        cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 0 }}
      />
    );
    expect(screen.getByText(/Begins Today!/)).toBeInTheDocument();
    expect(screen.getByText(/Day 1 Awaits/)).toBeInTheDocument();
  });

  it("renders stats and detailed metrics when days are completed", () => {
    render(<JourneyTab {...defaultProps} />);
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("Days Completed")).toBeInTheDocument();
    expect(screen.getByText("Cumulative Metrics")).toBeInTheDocument();
  });

  // ---- getProgressMessage branch coverage ----

  describe("getProgressMessage branches", () => {
    it("shows 'Almost There!' when pct >= 0.83", () => {
      render(
        <JourneyTab
          {...defaultProps}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 25 }}
        />
      );
      expect(screen.getByText("Almost There!")).toBeInTheDocument();
    });

    it("shows 'Final Stretch!' when pct >= 0.67", () => {
      render(
        <JourneyTab
          {...defaultProps}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 21 }}
        />
      );
      expect(screen.getByText("Final Stretch!")).toBeInTheDocument();
    });

    it("shows 'Halfway Champion!' when pct >= 0.5", () => {
      render(
        <JourneyTab
          {...defaultProps}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 15 }}
        />
      );
      expect(screen.getByText("Halfway Champion!")).toBeInTheDocument();
    });

    it("shows 'Building Momentum!' when pct >= 0.33", () => {
      render(
        <JourneyTab
          {...defaultProps}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 10 }}
        />
      );
      expect(screen.getByText("Building Momentum!")).toBeInTheDocument();
    });

    it("shows 'Week One Complete!' when pct >= 0.23", () => {
      render(
        <JourneyTab
          {...defaultProps}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 7 }}
        />
      );
      expect(screen.getByText("Week One Complete!")).toBeInTheDocument();
    });

    it("shows 'Streak Master!' when streak >= 5 and low pct", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={5}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 5 }}
        />
      );
      expect(screen.getByText("Streak Master!")).toBeInTheDocument();
    });

    it("shows 'Consistency King!' when streak >= 3 and low pct", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={3}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 3 }}
        />
      );
      expect(screen.getByText("Consistency King!")).toBeInTheDocument();
    });

    it("shows 'Great Start!' when daysCompleted >= 3 and low streak", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={0}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 4 }}
        />
      );
      expect(screen.getByText("Great Start!")).toBeInTheDocument();
    });

    it("shows 'Keep Going!' as fallback", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={1}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 2 }}
        />
      );
      expect(screen.getByText("Keep Going!")).toBeInTheDocument();
    });
  });

  // ---- getProgressDescription branch coverage ----

  describe("getProgressDescription branches", () => {
    it("shows remaining days text when pct >= 0.83", () => {
      render(
        <JourneyTab
          {...defaultProps}
          totalPoints={500}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 25 }}
        />
      );
      expect(screen.getByText(/Just 5 more days to finish/)).toBeInTheDocument();
    });

    it("shows halfway progress text when pct >= 0.5", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={5}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 15 }}
        />
      );
      expect(screen.getByText(/over halfway through/)).toBeInTheDocument();
    });

    it("shows week one text when pct >= 0.23", () => {
      render(
        <JourneyTab
          {...defaultProps}
          totalPoints={200}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 7 }}
        />
      );
      expect(screen.getByText(/One week down!/)).toBeInTheDocument();
    });

    it("shows streak commitment text when streak >= 3 and pct < 0.23", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={4}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 4 }}
        />
      );
      expect(screen.getByText(/4-day streak shows real commitment/)).toBeInTheDocument();
    });

    it("shows singular 'day' when daysCompleted is 1", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={1}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 1 }}
        />
      );
      expect(screen.getByText(/1 day so far/)).toBeInTheDocument();
    });

    it("shows plural 'days' when daysCompleted > 1 (fallback)", () => {
      render(
        <JourneyTab
          {...defaultProps}
          dayStreak={1}
          cumulativeStats={{ ...defaultCumulativeStats, daysCompleted: 2 }}
        />
      );
      expect(screen.getByText(/2 days so far/)).toBeInTheDocument();
    });
  });
});
