import { render, screen, fireEvent } from "@testing-library/react";
import { ChallengeHubModal } from "../challenge-hub-modal";
import { UseGamificationReturn } from "@/hooks/use-gamification";

// Mock gamification hook return value
const createMockGamification = (
  overrides?: Partial<UseGamificationReturn>
): UseGamificationReturn => ({
  isLoading: false,
  visitorId: "test-visitor-id",
  currentDay: 1,
  totalPoints: 100,
  dayStreak: 3,
  weekUnlocked: 1,
  completionPercent: 10,
  assessmentPoints: 25,
  calculatorPoints: 25,
  dailyVisitPoints: 10,
  todayProgress: null,
  allProgress: {},
  cumulativeStats: {
    totalSteps: 30000,
    totalWater: 12,
    totalFloors: 45,
    totalProtein: 300,
    totalSleepHours: 24,
    daysCompleted: 3,
  },
  saveTodayProgress: jest.fn(() => true),
  canEditDay: jest.fn(() => true),
  awardAssessmentPoints: jest.fn(),
  awardCalculatorPoints: jest.fn(),
  getDayProgress: jest.fn(() => null),
  isDayUnlocked: jest.fn((day: number) => day <= 7),
  resetChallenge: jest.fn(),
  calculateMetricsPoints: jest.fn(() => 75),
  ...overrides,
});

describe("ChallengeHubModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    gamification: createMockGamification(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when open", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/METABOLI-K-AL/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ChallengeHubModal {...defaultProps} open={false} />);

    expect(screen.queryByText(/30-Day/)).not.toBeInTheDocument();
  });

  it("displays stats bar with correct values", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // totalPoints
    expect(screen.getByText("10%")).toBeInTheDocument(); // completionPercent
  });

  it("renders all three tabs", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Today's Tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Journey So Far/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /30-Day Calendar/i })).toBeInTheDocument();
  });

  it("shows Today's Tasks tab by default", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    expect(screen.getByText(/Day 1 - Daily Tasks/)).toBeInTheDocument();
  });

  it("switches to Journey tab when clicked", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    const journeyTab = screen.getByRole("button", { name: /Journey So Far/i });
    fireEvent.click(journeyTab);

    expect(screen.getByText("Your Journey So Far")).toBeInTheDocument();
  });

  it("switches to Calendar tab when clicked", () => {
    render(<ChallengeHubModal {...defaultProps} />);

    const calendarTab = screen.getByRole("button", { name: /30-Day Calendar/i });
    fireEvent.click(calendarTab);

    // Calendar tab content should be visible (multiple elements with this text is expected)
    expect(screen.getAllByText("30-Day Calendar").length).toBeGreaterThan(0);
  });

  it("displays new user message in Journey tab when no days completed", () => {
    const gamification = createMockGamification({
      cumulativeStats: {
        totalSteps: 0,
        totalWater: 0,
        totalFloors: 0,
        totalProtein: 0,
        totalSleepHours: 0,
        daysCompleted: 0,
      },
    });

    render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

    const journeyTab = screen.getByRole("button", { name: /Journey So Far/i });
    fireEvent.click(journeyTab);

    expect(screen.getByText(/Begins Today!/)).toBeInTheDocument();
  });
});
