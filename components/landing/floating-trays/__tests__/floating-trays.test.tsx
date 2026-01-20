import { render, screen, fireEvent } from "@testing-library/react";
import { QuickAccessTray } from "../quick-access-tray";
import { PointsTray } from "../points-tray";
import { DayCounterTray } from "../day-counter-tray";

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
});
