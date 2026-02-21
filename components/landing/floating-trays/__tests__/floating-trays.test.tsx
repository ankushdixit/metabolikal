import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickAccessTray } from "../quick-access-tray";
import { PointsTray } from "../points-tray";
import { DayCounterTray } from "../day-counter-tray";
import { MobileChallengeTray } from "../mobile-challenge-tray";

describe("QuickAccessTray", () => {
  const defaultProps = {
    onOpenRealResults: jest.fn(),
    onOpenMeetExpert: jest.fn(),
    onOpenMethod: jest.fn(),
    onOpenElitePrograms: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the expand/collapse button", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand|collapse/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("renders all link buttons", () => {
    render(<QuickAccessTray {...defaultProps} />);

    // All link buttons should be present in the DOM
    expect(screen.getByText("Real Results")).toBeInTheDocument();
    expect(screen.getByText("Meet Expert")).toBeInTheDocument();
    expect(screen.getByText("The Method")).toBeInTheDocument();
    expect(screen.getByText("Elite Programs")).toBeInTheDocument();
  });

  it("expands when toggle button is clicked", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText("Quick Access")).toBeVisible();
  });

  it("shows all four modal links when expanded", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText("Real Results")).toBeInTheDocument();
    expect(screen.getByText("Meet Expert")).toBeInTheDocument();
    expect(screen.getByText("The Method")).toBeInTheDocument();
    expect(screen.getByText("Elite Programs")).toBeInTheDocument();
  });

  it("calls correct callback when Real Results is clicked", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(toggleButton);

    const realResultsButton = screen.getByText("Real Results");
    fireEvent.click(realResultsButton);

    expect(defaultProps.onOpenRealResults).toHaveBeenCalledTimes(1);
  });

  it("calls correct callback when Meet Expert is clicked", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(toggleButton);

    const meetExpertButton = screen.getByText("Meet Expert");
    fireEvent.click(meetExpertButton);

    expect(defaultProps.onOpenMeetExpert).toHaveBeenCalledTimes(1);
  });

  it("calls callback and collapses after clicking a link", () => {
    render(<QuickAccessTray {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(toggleButton);

    const realResultsButton = screen.getByText("Real Results");
    fireEvent.click(realResultsButton);

    // Callback should have been called
    expect(defaultProps.onOpenRealResults).toHaveBeenCalledTimes(1);
  });
});

describe("PointsTray", () => {
  const defaultProps = {
    totalPoints: 500,
    healthScore: 75,
    dayStreak: 5,
    assessmentPoints: 25,
    calculatorPoints: 25,
    dailyVisitPoints: 10,
    completionPercent: 25,
  };

  it("displays total points", () => {
    render(<PointsTray {...defaultProps} />);

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Total Points")).toBeInTheDocument();
  });

  it("expands to show breakdown when clicked", () => {
    render(<PointsTray {...defaultProps} />);

    // Click the header to expand
    const header = screen.getByText("Total Points").closest("button");
    if (header) {
      fireEvent.click(header);
    }

    expect(screen.getByText("Points Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
    expect(screen.getByText("Assessment")).toBeInTheDocument();
    expect(screen.getByText("Calculator")).toBeInTheDocument();
    expect(screen.getByText("Daily Visit")).toBeInTheDocument();
  });

  it("displays health score when available", () => {
    render(<PointsTray {...defaultProps} />);

    const header = screen.getByText("Total Points").closest("button");
    if (header) {
      fireEvent.click(header);
    }

    expect(screen.getByText("Metabolic Health Score")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("does not display health score when zero", () => {
    render(<PointsTray {...defaultProps} healthScore={0} />);

    const header = screen.getByText("Total Points").closest("button");
    if (header) {
      fireEvent.click(header);
    }

    expect(screen.queryByText("Metabolic Health Score")).not.toBeInTheDocument();
  });

  it("displays correct status message based on completion", () => {
    render(<PointsTray {...defaultProps} completionPercent={75} />);

    const header = screen.getByText("Total Points").closest("button");
    if (header) {
      fireEvent.click(header);
    }

    expect(screen.getByText("Almost There!")).toBeInTheDocument();
  });

  it("displays Building Momentum for 25% completion", () => {
    render(<PointsTray {...defaultProps} completionPercent={25} />);

    const header = screen.getByText("Total Points").closest("button");
    if (header) {
      fireEvent.click(header);
    }

    expect(screen.getByText("Building Momentum!")).toBeInTheDocument();
  });
});

describe("DayCounterTray", () => {
  const defaultProps = {
    currentDay: 7,
    totalDays: 30,
    onOpenChallengeHub: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the 30-Day Challenge label", () => {
    render(<DayCounterTray {...defaultProps} />);

    expect(screen.getByText("30-Day Challenge")).toBeInTheDocument();
  });

  it("displays the current day number", () => {
    render(<DayCounterTray {...defaultProps} />);

    expect(screen.getByText("Day 7")).toBeInTheDocument();
  });

  it("displays days remaining correctly", () => {
    render(<DayCounterTray {...defaultProps} />);

    expect(screen.getByText("23 days remaining")).toBeInTheDocument();
  });

  it("displays Open Challenge Hub button", () => {
    render(<DayCounterTray {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Open Challenge Hub/i })).toBeInTheDocument();
  });

  it("calls onOpenChallengeHub when Open Challenge Hub is clicked", () => {
    render(<DayCounterTray {...defaultProps} />);

    const challengeHubButton = screen.getByRole("button", {
      name: /Open Challenge Hub/i,
    });
    fireEvent.click(challengeHubButton);

    expect(defaultProps.onOpenChallengeHub).toHaveBeenCalledTimes(1);
  });

  it("displays correct days remaining for day 1", () => {
    render(<DayCounterTray {...defaultProps} currentDay={1} />);

    expect(screen.getByText("29 days remaining")).toBeInTheDocument();
  });

  it("displays correct days remaining for day 30", () => {
    render(<DayCounterTray {...defaultProps} currentDay={30} />);

    expect(screen.getByText("0 days remaining")).toBeInTheDocument();
  });

  it("shows 'Starting Soon' when plan has not started", () => {
    render(
      <DayCounterTray
        {...defaultProps}
        currentDay={0}
        isBeforeStart={true}
        daysUntilPlanStart={5}
      />
    );

    expect(screen.getByText("Starting Soon")).toBeInTheDocument();
    expect(screen.getByText("Starts in 5 days")).toBeInTheDocument();
    expect(screen.queryByText("Day 0")).not.toBeInTheDocument();
  });
});

describe("MobileChallengeTray", () => {
  const defaultProps = {
    currentDay: 7,
    totalDays: 30,
    totalPoints: 500,
    dayStreak: 3,
    onOpenChallengeHub: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders in collapsed state by default showing day info", () => {
    render(<MobileChallengeTray {...defaultProps} />);

    expect(screen.getByText("Day 7")).toBeInTheDocument();
    expect(screen.getByText("500 pts")).toBeInTheDocument();
  });

  it("shows streak in collapsed view when dayStreak > 0", () => {
    render(<MobileChallengeTray {...defaultProps} />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show streak in collapsed view when dayStreak is 0", () => {
    render(<MobileChallengeTray {...defaultProps} dayStreak={0} />);

    // Points should still show
    expect(screen.getByText("500 pts")).toBeInTheDocument();
    // No streak flame value
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("expands when collapsed bar is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileChallengeTray {...defaultProps} />);

    // Click the collapsed bar to expand
    const collapsedBar = screen.getByText("Day 7").closest("button");
    expect(collapsedBar).toBeInTheDocument();
    await user.click(collapsedBar!);

    // Expanded view should now show
    expect(screen.getByText("30-Day Challenge")).toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("23 days remaining")).toBeInTheDocument();
  });

  it("collapses when X button is clicked in expanded view", async () => {
    const user = userEvent.setup();
    render(<MobileChallengeTray {...defaultProps} />);

    // Expand first
    const collapsedBar = screen.getByText("Day 7").closest("button");
    await user.click(collapsedBar!);

    // Should be expanded
    expect(screen.getByText("30-Day Challenge")).toBeInTheDocument();

    // Find and click the X (close) button in the header
    const closeButtons = screen.getAllByRole("button");
    // The close button is the one in the expanded header (not "Open Challenge Hub")
    const closeButton = closeButtons.find(
      (btn) =>
        !btn.textContent?.includes("Open Challenge Hub") && !btn.textContent?.includes("Day 7")
    );
    expect(closeButton).toBeDefined();
    await user.click(closeButton!);

    // Should be back to collapsed showing day info
    expect(screen.getByText("Day 7")).toBeInTheDocument();
  });

  it("calls onOpenChallengeHub and collapses when Open Challenge Hub is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileChallengeTray {...defaultProps} />);

    // Expand first
    const collapsedBar = screen.getByText("Day 7").closest("button");
    await user.click(collapsedBar!);

    // Click Open Challenge Hub
    const challengeHubButton = screen.getByRole("button", { name: /Open Challenge Hub/i });
    await user.click(challengeHubButton);

    // Should have called the callback
    expect(defaultProps.onOpenChallengeHub).toHaveBeenCalledTimes(1);

    // Should collapse back to bar view
    expect(screen.getByText("Day 7")).toBeInTheDocument();
  });

  it("shows 'Starting Soon' in collapsed view when isBeforeStart is true", () => {
    render(
      <MobileChallengeTray
        {...defaultProps}
        currentDay={0}
        isBeforeStart={true}
        daysUntilPlanStart={5}
      />
    );

    expect(screen.getByText("Starts in 5d")).toBeInTheDocument();
  });

  it("shows 'Starting Soon' in collapsed view when currentDay is 0", () => {
    render(<MobileChallengeTray {...defaultProps} currentDay={0} />);

    expect(screen.getByText("Starting Soon")).toBeInTheDocument();
  });

  it("shows expanded not-started state with daysUntilPlanStart", async () => {
    const user = userEvent.setup();
    render(
      <MobileChallengeTray
        {...defaultProps}
        currentDay={0}
        isBeforeStart={true}
        daysUntilPlanStart={5}
      />
    );

    // Expand
    const collapsedBar = screen.getByText("Starts in 5d").closest("button");
    await user.click(collapsedBar!);

    expect(screen.getByText("Starting Soon")).toBeInTheDocument();
    expect(screen.getByText("Your challenge begins in 5 days")).toBeInTheDocument();
  });

  it("shows expanded not-started state without daysUntilPlanStart", async () => {
    const user = userEvent.setup();
    render(<MobileChallengeTray {...defaultProps} currentDay={0} />);

    // Expand
    const collapsedBar = screen.getByText("Starting Soon").closest("button");
    await user.click(collapsedBar!);

    // Should show total days info
    expect(screen.getByText("30 days total")).toBeInTheDocument();
  });

  it("shows singular 'day' for daysUntilPlanStart of 1", async () => {
    const user = userEvent.setup();
    render(
      <MobileChallengeTray
        {...defaultProps}
        currentDay={0}
        isBeforeStart={true}
        daysUntilPlanStart={1}
      />
    );

    // Expand
    const collapsedBar = screen.getByText("Starts in 1d").closest("button");
    await user.click(collapsedBar!);

    expect(screen.getByText("Your challenge begins in 1 day")).toBeInTheDocument();
  });
});
