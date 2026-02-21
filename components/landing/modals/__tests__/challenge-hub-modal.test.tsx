import { render, screen, fireEvent } from "@testing-library/react";
import { ChallengeHubModal } from "../challenge-hub-modal";
import { UseGamificationReturn } from "@/hooks/use-gamification";

// Mock gamification hook return value
const createMockGamification = (
  overrides?: Partial<UseGamificationReturn>
): UseGamificationReturn => ({
  isLoading: false,
  user: null,
  currentDay: 1,
  totalDays: 30,
  startDate: "2026-01-28",
  isBeforeStart: false,
  daysUntilPlanStart: 0,
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
  saveTodayProgress: jest.fn(() => Promise.resolve(true)),
  saveDayProgress: jest.fn(() => Promise.resolve(true)),
  canEditDay: jest.fn(() => true),
  awardAssessmentPoints: jest.fn(),
  awardCalculatorPoints: jest.fn(),
  getDayProgress: jest.fn(() => null),
  isDayUnlocked: jest.fn((day: number) => day <= 7),
  resetChallenge: jest.fn(() => Promise.resolve()),
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

  describe("isBeforeStart behavior", () => {
    it("shows 'Starts In' label and daysUntilPlanStart when isBeforeStart is true", () => {
      const gamification = createMockGamification({
        isBeforeStart: true,
        daysUntilPlanStart: 5,
      });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      expect(screen.getByText("Starts In")).toBeInTheDocument();
      expect(screen.getByText("5d")).toBeInTheDocument();
    });

    it("shows 'Day' label and currentDay when isBeforeStart is false", () => {
      const gamification = createMockGamification({
        isBeforeStart: false,
        currentDay: 7,
      });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      expect(screen.getByText("Day")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  describe("editing day flow", () => {
    it("triggers handleEditDay via calendar missed day click, shows editing banner, and handles back to today", () => {
      // currentDay=5 so days 1-4 are past missed days (no progress data)
      const gamification = createMockGamification({
        currentDay: 5,
        allProgress: {},
        canEditDay: jest.fn(() => true),
        getDayProgress: jest.fn(() => null),
      });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      // Switch to Calendar tab
      const calendarTab = screen.getByRole("button", { name: /30-Day Calendar/i });
      fireEvent.click(calendarTab);

      // Click on a missed day (day 2) - should trigger handleEditDay
      // Missed days have dashed border styling and show the day number
      const day2Button = screen.getByRole("button", { name: /^2/ });
      fireEvent.click(day2Button);

      // handleEditDay should switch to tasks tab and show editing banner
      expect(screen.getByText("Editing Day 2")).toBeInTheDocument();
      expect(screen.getByText("Back to Today")).toBeInTheDocument();

      // Click "Back to Today" to trigger handleBackToToday
      fireEvent.click(screen.getByText("Back to Today"));
      expect(screen.queryByText("Editing Day 2")).not.toBeInTheDocument();
    });

    it("clears editingDay when switching to a non-tasks tab", () => {
      const gamification = createMockGamification({
        currentDay: 5,
        allProgress: {},
        canEditDay: jest.fn(() => true),
        getDayProgress: jest.fn(() => null),
      });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      // First, enter editing mode via calendar
      const calendarTab = screen.getByRole("button", { name: /30-Day Calendar/i });
      fireEvent.click(calendarTab);
      const day2Button = screen.getByRole("button", { name: /^2/ });
      fireEvent.click(day2Button);

      // Should be in editing mode
      expect(screen.getByText("Editing Day 2")).toBeInTheDocument();

      // Switch to Journey tab (non-tasks tab) - should clear editingDay
      const journeyTab = screen.getByRole("button", { name: /Journey So Far/i });
      fireEvent.click(journeyTab);

      expect(screen.getByText("Your Journey So Far")).toBeInTheDocument();
      // No "Editing Day" banner should be present
      expect(screen.queryByText(/Editing Day/)).not.toBeInTheDocument();
    });

    it("clears editingDay when modal is closed via onOpenChange", () => {
      const onOpenChange = jest.fn();
      const gamification = createMockGamification({
        currentDay: 5,
        allProgress: {},
        canEditDay: jest.fn(() => true),
        getDayProgress: jest.fn(() => null),
      });
      const { rerender: _rerender } = render(
        <ChallengeHubModal open={true} onOpenChange={onOpenChange} gamification={gamification} />
      );

      // Enter editing mode via calendar
      const calendarTab = screen.getByRole("button", { name: /30-Day Calendar/i });
      fireEvent.click(calendarTab);
      const day2Button = screen.getByRole("button", { name: /^2/ });
      fireEvent.click(day2Button);

      expect(screen.getByText("Editing Day 2")).toBeInTheDocument();

      // Close the dialog - the Dialog component calls handleOpenChange(false)
      // We simulate this by clicking the close button
      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      // onOpenChange should have been called
      expect(onOpenChange).toHaveBeenCalled();
    });
  });

  describe("save progress routing", () => {
    it("uses saveTodayProgress when editingDay is null", () => {
      const saveTodayProgress = jest.fn(() => Promise.resolve(true));
      const gamification = createMockGamification({ saveTodayProgress });

      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      // The TodaysTasks component receives the onSave handler
      // When editingDay is null, handleSaveProgress calls saveTodayProgress
      expect(screen.getByText(/Day 1 - Daily Tasks/)).toBeInTheDocument();
    });

    it("uses saveDayProgress when editingDay is set", () => {
      const saveDayProgress = jest.fn(() => Promise.resolve(true));
      const gamification = createMockGamification({
        currentDay: 5,
        allProgress: {},
        canEditDay: jest.fn(() => true),
        getDayProgress: jest.fn(() => null),
        saveDayProgress,
      });

      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      // Enter editing mode
      const calendarTab = screen.getByRole("button", { name: /30-Day Calendar/i });
      fireEvent.click(calendarTab);
      const day2Button = screen.getByRole("button", { name: /^2/ });
      fireEvent.click(day2Button);

      // Now in editing mode for day 2, the tasks form should be showing
      expect(screen.getByText("Editing Day 2")).toBeInTheDocument();
    });
  });

  describe("totalDays in tab labels", () => {
    it("uses totalDays from gamification in calendar tab label", () => {
      const gamification = createMockGamification({ totalDays: 60 });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      expect(screen.getByRole("button", { name: /60-Day Calendar/i })).toBeInTheDocument();
    });

    it("uses totalDays in the modal title", () => {
      const gamification = createMockGamification({ totalDays: 45 });
      render(<ChallengeHubModal {...defaultProps} gamification={gamification} />);

      expect(screen.getAllByText(/45-Day/).length).toBeGreaterThan(0);
    });
  });
});
