import { render, screen } from "@testing-library/react";
import { ProfilePlanCard } from "../profile-plan-card";
import type { PlanInfo } from "@/hooks/use-client-profile-data";

describe("ProfilePlanCard", () => {
  describe("Loading State", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<ProfilePlanCard planInfo={{ isConfigured: false }} isLoading={true} />);

      expect(screen.getByText(/My Plan/i)).toBeInTheDocument();
      // Should show skeleton elements (animated pulse divs)
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Not Configured State", () => {
    it("shows not configured message when plan is not set up", () => {
      render(<ProfilePlanCard planInfo={{ isConfigured: false }} isLoading={false} />);

      expect(screen.getByText(/My Plan/i)).toBeInTheDocument();
      expect(screen.getByText(/Your plan has not been configured yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Your coach will set this up for you/i)).toBeInTheDocument();
    });
  });

  describe("Active Plan Display", () => {
    const activePlanInfo: PlanInfo = {
      isConfigured: true,
      startDate: new Date("2026-01-10T00:00:00"),
      endDate: new Date("2026-02-06T00:00:00"),
      durationDays: 28,
      dayNumber: 6,
      daysRemaining: 22,
      progressPercent: 21,
      isBeforeStart: false,
      isCompleted: false,
    };

    it("displays plan start date", () => {
      render(<ProfilePlanCard planInfo={activePlanInfo} isLoading={false} />);

      expect(screen.getByText(/January 10, 2026/i)).toBeInTheDocument();
    });

    it("displays plan duration", () => {
      render(<ProfilePlanCard planInfo={activePlanInfo} isLoading={false} />);

      expect(screen.getByText(/28 days/i)).toBeInTheDocument();
    });

    it("displays current day progress", () => {
      render(<ProfilePlanCard planInfo={activePlanInfo} isLoading={false} />);

      expect(screen.getByText(/Day 6 of 28/i)).toBeInTheDocument();
      expect(screen.getByText(/21%/i)).toBeInTheDocument();
    });

    it("displays end date and days remaining", () => {
      render(<ProfilePlanCard planInfo={activePlanInfo} isLoading={false} />);

      expect(screen.getByText(/February 6, 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/22 days remaining/i)).toBeInTheDocument();
    });

    it("renders progress bar with correct width", () => {
      render(<ProfilePlanCard planInfo={activePlanInfo} isLoading={false} />);

      // Find the progress bar element
      const progressBar = document.querySelector('[style*="width: 21%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("Starting Soon State", () => {
    const futurePlanInfo: PlanInfo = {
      isConfigured: true,
      startDate: new Date("2026-01-20T00:00:00"),
      endDate: new Date("2026-02-02T00:00:00"),
      durationDays: 14,
      dayNumber: 1,
      daysRemaining: 14,
      progressPercent: 0,
      isBeforeStart: true,
      isCompleted: false,
    };

    it("shows STARTING SOON badge", () => {
      render(<ProfilePlanCard planInfo={futurePlanInfo} isLoading={false} />);

      expect(screen.getByText(/STARTING SOON/i)).toBeInTheDocument();
    });

    it("does not show COMPLETED badge", () => {
      render(<ProfilePlanCard planInfo={futurePlanInfo} isLoading={false} />);

      expect(screen.queryByText(/COMPLETED/i)).not.toBeInTheDocument();
    });
  });

  describe("Completed State", () => {
    const completedPlanInfo: PlanInfo = {
      isConfigured: true,
      startDate: new Date("2026-01-01T00:00:00"),
      endDate: new Date("2026-01-07T00:00:00"),
      durationDays: 7,
      dayNumber: 15,
      daysRemaining: 0,
      progressPercent: 100,
      isBeforeStart: false,
      isCompleted: true,
    };

    it("shows COMPLETED badge", () => {
      render(<ProfilePlanCard planInfo={completedPlanInfo} isLoading={false} />);

      // The badge has exact text "COMPLETED"
      const completedElements = screen.getAllByText(/COMPLETED/i);
      expect(completedElements.length).toBeGreaterThanOrEqual(1);
      // Check the badge specifically
      const badge = completedElements.find(
        (el) => el.tagName === "SPAN" && el.textContent === "COMPLETED"
      );
      expect(badge).toBeInTheDocument();
    });

    it("shows completed message for end date", () => {
      render(<ProfilePlanCard planInfo={completedPlanInfo} isLoading={false} />);

      expect(screen.getByText(/Completed on/i)).toBeInTheDocument();
    });

    it("shows full progress (100%)", () => {
      render(<ProfilePlanCard planInfo={completedPlanInfo} isLoading={false} />);

      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });

    it("does not show STARTING SOON badge", () => {
      render(<ProfilePlanCard planInfo={completedPlanInfo} isLoading={false} />);

      expect(screen.queryByText(/STARTING SOON/i)).not.toBeInTheDocument();
    });
  });

  describe("Section Headers", () => {
    const planInfo: PlanInfo = {
      isConfigured: true,
      startDate: new Date("2026-01-10T00:00:00"),
      endDate: new Date("2026-02-06T00:00:00"),
      durationDays: 28,
      dayNumber: 6,
      daysRemaining: 22,
      progressPercent: 21,
      isBeforeStart: false,
      isCompleted: false,
    };

    it("displays Started label", () => {
      render(<ProfilePlanCard planInfo={planInfo} isLoading={false} />);
      expect(screen.getByText(/Started/i)).toBeInTheDocument();
    });

    it("displays Duration label", () => {
      render(<ProfilePlanCard planInfo={planInfo} isLoading={false} />);
      expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    });

    it("displays Progress label", () => {
      render(<ProfilePlanCard planInfo={planInfo} isLoading={false} />);
      expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    });

    it("displays Ends label", () => {
      render(<ProfilePlanCard planInfo={planInfo} isLoading={false} />);
      expect(screen.getByText(/Ends/i)).toBeInTheDocument();
    });
  });
});
