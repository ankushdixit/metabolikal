/**
 * Tests for TimelineStats component
 */

import { render, screen } from "@testing-library/react";
import { TimelineStats } from "../timeline-stats";
import type {
  CompletionStats,
  StatsByType,
  StreakInfo,
  TrendInfo,
} from "@/lib/utils/completion-stats";

describe("TimelineStats", () => {
  const mockStats: CompletionStats = {
    total: 10,
    completed: 7,
    percentage: 70,
  };

  const mockStatsByType: StatsByType = {
    meal: { total: 4, completed: 3, percentage: 75 },
    supplement: { total: 3, completed: 2, percentage: 67 },
    workout: { total: 2, completed: 2, percentage: 100 },
    lifestyle: { total: 1, completed: 0, percentage: 0 },
  };

  const mockStreak: StreakInfo = {
    current: 5,
    longest: 7,
    lastCompletedDate: "2026-01-20",
  };

  const mockTrend: TrendInfo = {
    direction: "improving",
    percentageChange: 15,
    comparisonPeriod: "7 days",
  };

  describe("full view rendering", () => {
    it("renders overall percentage", () => {
      render(<TimelineStats stats={mockStats} />);

      expect(screen.getByText("70%")).toBeInTheDocument();
    });

    it("renders completion count", () => {
      render(<TimelineStats stats={mockStats} />);

      expect(screen.getByText(/7 of 10 completed/)).toBeInTheDocument();
    });

    it("renders period label", () => {
      render(<TimelineStats stats={mockStats} periodLabel="Today's Progress" />);

      expect(screen.getByText("Today's Progress")).toBeInTheDocument();
    });

    it("renders default period label", () => {
      render(<TimelineStats stats={mockStats} />);

      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("renders stats by type when provided", () => {
      render(<TimelineStats stats={mockStats} statsByType={mockStatsByType} />);

      expect(screen.getByText("Meals")).toBeInTheDocument();
      expect(screen.getByText("Supplements")).toBeInTheDocument();
      expect(screen.getByText("Workouts")).toBeInTheDocument();
      expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    });

    it("renders completion counts for each type", () => {
      render(<TimelineStats stats={mockStats} statsByType={mockStatsByType} />);

      expect(screen.getByText("3/4")).toBeInTheDocument(); // meals
      expect(screen.getByText("2/3")).toBeInTheDocument(); // supplements
      expect(screen.getByText("2/2")).toBeInTheDocument(); // workouts
      expect(screen.getByText("0/1")).toBeInTheDocument(); // lifestyle
    });

    it("renders streak when provided", () => {
      render(<TimelineStats stats={mockStats} streak={mockStreak} />);

      expect(screen.getByText("5 days")).toBeInTheDocument();
    });

    it("does not render streak when zero", () => {
      const zeroStreak: StreakInfo = { current: 0, longest: 0, lastCompletedDate: null };
      render(<TimelineStats stats={mockStats} streak={zeroStreak} />);

      expect(screen.queryByText(/days/)).not.toBeInTheDocument();
    });

    it("renders trend when provided", () => {
      render(<TimelineStats stats={mockStats} trend={mockTrend} />);

      expect(screen.getByText("Improving")).toBeInTheDocument();
    });

    it("renders declining trend correctly", () => {
      const decliningTrend: TrendInfo = {
        direction: "declining",
        percentageChange: -10,
        comparisonPeriod: "7 days",
      };
      render(<TimelineStats stats={mockStats} trend={decliningTrend} />);

      expect(screen.getByText("Room to Grow")).toBeInTheDocument();
    });

    it("renders maintaining trend correctly", () => {
      const maintainingTrend: TrendInfo = {
        direction: "maintaining",
        percentageChange: 2,
        comparisonPeriod: "7 days",
      };
      render(<TimelineStats stats={mockStats} trend={maintainingTrend} />);

      expect(screen.getByText("Maintaining")).toBeInTheDocument();
    });
  });

  describe("compact view rendering", () => {
    it("renders compact view when compact=true", () => {
      render(<TimelineStats stats={mockStats} compact />);

      // Should still show percentage
      expect(screen.getByText("70%")).toBeInTheDocument();
    });

    it("renders period label in compact view", () => {
      render(<TimelineStats stats={mockStats} periodLabel="Today" compact />);

      expect(screen.getByText("Today:")).toBeInTheDocument();
    });

    it("renders completion count in compact view", () => {
      render(<TimelineStats stats={mockStats} compact />);

      expect(screen.getByText("(7/10)")).toBeInTheDocument();
    });

    it("renders streak in compact view when provided", () => {
      render(<TimelineStats stats={mockStats} streak={mockStreak} compact />);

      expect(screen.getByText("5 days")).toBeInTheDocument();
    });

    it("does not render stats by type in compact view", () => {
      render(<TimelineStats stats={mockStats} statsByType={mockStatsByType} compact />);

      // Type labels should not be present in compact view
      expect(screen.queryByText("Meals")).not.toBeInTheDocument();
      expect(screen.queryByText("Supplements")).not.toBeInTheDocument();
    });
  });

  describe("color classes", () => {
    it("uses green for high completion (>=80%)", () => {
      const highStats = { total: 10, completed: 9, percentage: 90 };
      render(<TimelineStats stats={highStats} />);

      // Check for green color class on percentage
      const percentageElement = screen.getByText("90%");
      expect(percentageElement).toHaveClass("text-green-500");
    });

    it("uses yellow for medium completion (50-79%)", () => {
      const mediumStats = { total: 10, completed: 6, percentage: 60 };
      render(<TimelineStats stats={mediumStats} />);

      const percentageElement = screen.getByText("60%");
      expect(percentageElement).toHaveClass("text-yellow-500");
    });

    it("uses red for low completion (<50%)", () => {
      const lowStats = { total: 10, completed: 3, percentage: 30 };
      render(<TimelineStats stats={lowStats} />);

      const percentageElement = screen.getByText("30%");
      expect(percentageElement).toHaveClass("text-red-500");
    });
  });

  describe("edge cases", () => {
    it("handles zero total items", () => {
      const zeroStats = { total: 0, completed: 0, percentage: 0 };
      render(<TimelineStats stats={zeroStats} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText(/0 of 0 completed/)).toBeInTheDocument();
    });

    it("handles 100% completion", () => {
      const fullStats = { total: 10, completed: 10, percentage: 100 };
      render(<TimelineStats stats={fullStats} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      const percentageElement = screen.getByText("100%");
      expect(percentageElement).toHaveClass("text-green-500");
    });

    it("handles 0% completion", () => {
      const emptyStats = { total: 10, completed: 0, percentage: 0 };
      render(<TimelineStats stats={emptyStats} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
      const percentageElement = screen.getByText("0%");
      expect(percentageElement).toHaveClass("text-red-500");
    });
  });
});
