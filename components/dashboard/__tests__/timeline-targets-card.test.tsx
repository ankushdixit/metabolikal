/**
 * Tests for TimelineTargetsCard component
 */

import { render, screen } from "@testing-library/react";
import { TimelineTargetsCard } from "../timeline-targets-card";
import type { MacroTargets, ConsumedTotals, PlanProgress } from "@/hooks/use-client-timeline";

describe("TimelineTargetsCard", () => {
  const defaultTargets: MacroTargets = {
    calories: 2000,
    proteinMin: 120,
    proteinMax: 150,
    carbsMin: 200,
    carbsMax: 250,
    fatsMin: 60,
    fatsMax: 80,
    hasLimits: true,
  };

  const defaultConsumed: ConsumedTotals = {
    calories: 500,
    protein: 30,
    carbs: 60,
    fats: 15,
  };

  const defaultPlanProgress: PlanProgress = {
    dayNumber: 8,
    totalDays: 28,
    progressPercent: 28.57,
    daysRemaining: 21,
    weekNumber: 2,
    isExtended: false,
  };

  describe("with configured limits", () => {
    it("should render the header", () => {
      render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      expect(screen.getByText("Today's Targets")).toBeInTheDocument();
    });

    it("should show day progress", () => {
      render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      expect(screen.getByText("Day 8 of 28")).toBeInTheDocument();
    });

    it("should show calories progress", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      // In compact version, label is "Cal" not "Calories"
      expect(screen.getByText("Cal")).toBeInTheDocument();
      // Shows consumed / target format
      expect(container.textContent).toContain("500");
      expect(container.textContent).toContain("2000");
    });

    it("should show protein progress with range", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      expect(screen.getByText("Protein")).toBeInTheDocument();
      // Protein shows as "30 / 120-150g"
      expect(container.textContent).toContain("30");
      expect(container.textContent).toContain("120-150g");
    });

    it("should show carbs progress when target exists", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      expect(screen.getByText("Carbs")).toBeInTheDocument();
      expect(container.textContent).toContain("200-250g");
    });

    it("should show fats progress when target exists", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      expect(screen.getByText("Fats")).toBeInTheDocument();
      expect(container.textContent).toContain("60-80g");
    });

    it("should show Extended badge when plan is extended", () => {
      const extendedProgress: PlanProgress = {
        ...defaultPlanProgress,
        isExtended: true,
      };

      render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={extendedProgress}
        />
      );

      expect(screen.getByText("Extended")).toBeInTheDocument();
    });
  });

  describe("without configured limits", () => {
    it("should show warning when no limits configured", () => {
      const noLimits: MacroTargets = {
        calories: null,
        proteinMin: null,
        proteinMax: null,
        carbsMin: null,
        carbsMax: null,
        fatsMin: null,
        fatsMax: null,
        hasLimits: false,
      };

      render(
        <TimelineTargetsCard targets={noLimits} consumed={defaultConsumed} planProgress={null} />
      );

      expect(screen.getByText("No macro targets configured")).toBeInTheDocument();
      // Compact version just says "Contact your coach"
      expect(screen.getByText("Contact your coach")).toBeInTheDocument();
    });
  });

  describe("partial limits", () => {
    it("should only show calories when only calories are set", () => {
      const partialTargets: MacroTargets = {
        calories: 2000,
        proteinMin: null,
        proteinMax: null,
        carbsMin: null,
        carbsMax: null,
        fatsMin: null,
        fatsMax: null,
        hasLimits: true,
      };

      render(
        <TimelineTargetsCard
          targets={partialTargets}
          consumed={defaultConsumed}
          planProgress={null}
        />
      );

      // Compact version uses "Cal" instead of "Calories"
      expect(screen.getByText("Cal")).toBeInTheDocument();
      expect(screen.queryByText("Protein")).not.toBeInTheDocument();
      expect(screen.queryByText("Carbs")).not.toBeInTheDocument();
      expect(screen.queryByText("Fats")).not.toBeInTheDocument();
    });

    it("should show protein when min is set", () => {
      const partialTargets: MacroTargets = {
        calories: 2000,
        proteinMin: 120,
        proteinMax: null,
        carbsMin: null,
        carbsMax: null,
        fatsMin: null,
        fatsMax: null,
        hasLimits: true,
      };

      render(
        <TimelineTargetsCard
          targets={partialTargets}
          consumed={defaultConsumed}
          planProgress={null}
        />
      );

      expect(screen.getByText("Protein")).toBeInTheDocument();
    });
  });

  describe("progress display", () => {
    it("should show consumed values", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      // Compact version shows consumed / target format
      expect(container.textContent).toContain("500");
      expect(container.textContent).toContain("2000");
    });

    it("should render progress bars", () => {
      const { container } = render(
        <TimelineTargetsCard
          targets={defaultTargets}
          consumed={defaultConsumed}
          planProgress={defaultPlanProgress}
        />
      );

      // Should have progress bar elements
      const progressBars = container.querySelectorAll(".bg-green-500, .bg-yellow-500, .bg-red-500");
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });
});
