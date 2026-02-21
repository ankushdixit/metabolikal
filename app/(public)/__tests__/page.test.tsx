import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPage from "../page";
import { ModalProvider } from "@/contexts/modal-context";

const _renderWithProvider = (ui: React.ReactElement) => {
  return render(<ModalProvider>{ui}</ModalProvider>);
};

// Spy on the modal context module so we can track openModal/closeModal calls
const mockOpenModal = jest.fn();
const mockCloseModal = jest.fn();

jest.mock("@/contexts/modal-context", () => {
  const actual = jest.requireActual("@/contexts/modal-context");
  return {
    ...actual,
    useModalContext: () => ({
      activeModal: null,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      isOpen: () => false,
    }),
  };
});

// Mock the medical conditions hook to avoid needing Refine context
jest.mock("@/hooks/use-medical-conditions", () => ({
  useMedicalConditions: () => ({
    conditions: [
      {
        id: "1",
        slug: "hypothyroidism",
        name: "Hypothyroidism",
        impact_percent: 8,
        gender_restriction: null,
      },
      {
        id: "2",
        slug: "none",
        name: "None of the above",
        impact_percent: 0,
        gender_restriction: null,
      },
    ],
    allConditions: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  calculateMetabolicImpactFromConditions: jest.fn().mockReturnValue(0),
  DEFAULT_MEDICAL_CONDITIONS: [
    { name: "Hypothyroidism", slug: "hypothyroidism", impact_percent: 8, gender_restriction: null },
    { name: "None of the above", slug: "none", impact_percent: 0, gender_restriction: null },
  ],
}));

// Mock the meal types hook to avoid needing Refine context
jest.mock("@/hooks/use-meal-types", () => ({
  useMealTypes: () => ({
    mealTypes: [
      { id: "1", slug: "breakfast", name: "Breakfast", display_order: 1, is_active: true },
      { id: "2", slug: "lunch", name: "Lunch", display_order: 2, is_active: true },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  DEFAULT_MEAL_TYPES: [
    { name: "Breakfast", slug: "breakfast" },
    { name: "Lunch", slug: "lunch" },
  ],
}));

// Mock the calculator settings hook to avoid needing Refine context
jest.mock("@/hooks/use-calculator-settings", () => {
  const DEFAULT_SETTINGS = {
    id: "default",
    activity_sedentary: 1.2,
    activity_lightly_active: 1.375,
    activity_moderately_active: 1.55,
    activity_very_active: 1.725,
    activity_extremely_active: 1.9,
    goal_fat_loss_adjustment: -550,
    goal_maintain_adjustment: 0,
    goal_muscle_gain_adjustment: 475,
    protein_fat_loss: 2.0,
    protein_maintain: 1.8,
    protein_muscle_gain: 2.2,
    health_score_lifestyle_weight: 60,
    health_score_physical_weight: 40,
    health_score_calorie_bonus: 5,
    health_score_calorie_min: 1200,
    health_score_calorie_max: 3500,
    metabolic_impact_cap: 25,
    lifestyle_multiplier_enabled: true,
    lifestyle_multiplier_divisor: 500,
    physical_score_base: 75,
    physical_score_bmi_optimal: 15,
    physical_score_bmi_acceptable: 10,
    physical_score_bmi_outside: 5,
    physical_score_bodyfat_optimal: 10,
    physical_score_bodyfat_acceptable: 7,
    physical_score_bodyfat_outside: 3,
    bmi_optimal_min: 18.5,
    bmi_optimal_max: 24.9,
    bmi_acceptable_min: 17.0,
    bmi_acceptable_max: 29.9,
    bodyfat_male_optimal_min: 10,
    bodyfat_male_optimal_max: 20,
    bodyfat_male_acceptable_min: 8,
    bodyfat_male_acceptable_max: 24,
    bodyfat_female_optimal_min: 18,
    bodyfat_female_optimal_max: 28,
    bodyfat_female_acceptable_min: 15,
    bodyfat_female_acceptable_max: 32,
    health_score_tiers: [
      { name: "Elite", description: "Outstanding", minScore: 86, maxScore: 100 },
      { name: "Good", description: "Solid foundation", minScore: 71, maxScore: 85 },
      { name: "Moderate", description: "Functional baseline", minScore: 51, maxScore: 70 },
      { name: "Needs Attention", description: "Optimization potential", minScore: 0, maxScore: 50 },
    ],
  };
  return {
    useCalculatorSettings: () => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      getActivityMultiplier: (level: string) => {
        const map: Record<string, number> = {
          sedentary: 1.2,
          lightly_active: 1.375,
          moderately_active: 1.55,
          very_active: 1.725,
          extremely_active: 1.9,
        };
        return map[level] || 1.2;
      },
      getGoalAdjustment: (goal: string) => {
        const map: Record<string, number> = { fat_loss: -550, maintain: 0, muscle_gain: 475 };
        return map[goal] || 0;
      },
      getProteinRatio: (goal: string) => {
        const map: Record<string, number> = { fat_loss: 2.0, maintain: 1.8, muscle_gain: 2.2 };
        return map[goal] || 1.8;
      },
      getHealthScoreTier: () => ({
        name: "Good",
        description: "Solid",
        minScore: 71,
        maxScore: 85,
      }),
      calculatePhysicalScore: () => 85,
      calculateLifestyleMultiplier: () => 1.0,
    }),
    DEFAULT_CALCULATOR_SETTINGS: DEFAULT_SETTINGS,
    getDefaultCalculatorSettings: () => DEFAULT_SETTINGS,
  };
});

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
    onError?: () => void;
  }) {
    return (
      <img alt={props.alt} src={props.src} data-testid="mock-image" className={props.className} />
    );
  },
}));

// Mock IntersectionObserver for YouTube Shorts carousel
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock next/navigation with controllable router and searchParams
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => mockSearchParams,
}));

// Mock the constants to use variant A for consistent testing
jest.mock("@/lib/constants", () => ({
  ACTIVE_HERO_VARIANT: "A",
  HERO_VARIANTS: {
    A: { name: "Problem-Solution", description: "", focus: "" },
    B: { name: "Results-Focused", description: "", focus: "" },
    C: { name: "Identity-Positioning", description: "", focus: "" },
    original: { name: "Original Quote", description: "", focus: "" },
  },
}));

// Mock profile completion hook
const mockRefetchProfileCompletion = jest.fn();
let mockProfileCompletion = {
  isLoading: false,
  isAuthenticated: false,
  user: null as { id: string } | null,
  hasAssessment: false,
  hasCalculator: false,
  isProfileComplete: false,
  calculatorResults: null,
  proteinTarget: null,
  refetch: mockRefetchProfileCompletion,
};

jest.mock("@/hooks/use-profile-completion", () => ({
  useProfileCompletion: () => mockProfileCompletion,
  saveAssessmentResults: jest.fn().mockResolvedValue(undefined),
  saveCalculatorResults: jest.fn().mockResolvedValue(undefined),
}));

// Mock gamification hook
const mockAwardAssessmentPoints = jest.fn();
const mockAwardCalculatorPoints = jest.fn();

jest.mock("@/hooks/use-gamification", () => ({
  useGamification: () => ({
    isLoading: false,
    user: null,
    currentDay: 5,
    totalDays: 30,
    startDate: "2026-01-01",
    isBeforeStart: false,
    daysUntilPlanStart: 0,
    totalPoints: 200,
    dayStreak: 3,
    weekUnlocked: 1,
    completionPercent: 16,
    assessmentPoints: 25,
    calculatorPoints: 25,
    dailyVisitPoints: 10,
    todayProgress: null,
    allProgress: {},
    cumulativeStats: {
      totalSteps: 0,
      totalWater: 0,
      totalFloors: 0,
      totalProtein: 0,
      totalSleepHours: 0,
      daysCompleted: 0,
    },
    saveTodayProgress: jest.fn(() => Promise.resolve(true)),
    saveDayProgress: jest.fn(() => Promise.resolve(true)),
    canEditDay: jest.fn(() => true),
    awardAssessmentPoints: mockAwardAssessmentPoints,
    awardCalculatorPoints: mockAwardCalculatorPoints,
    getDayProgress: jest.fn(() => null),
    isDayUnlocked: jest.fn((day: number) => day <= 7),
    resetChallenge: jest.fn(() => Promise.resolve()),
    calculateMetricsPoints: jest.fn(() => 75),
  }),
}));

// Mock assessment storage hook
jest.mock("@/hooks/use-assessment-storage", () => ({
  useAssessmentStorage: () => ({
    getPreviousAssessment: jest.fn().mockReturnValue(null),
    saveAssessmentWithHealthScore: jest.fn(),
    saveCalculator: jest.fn(),
    getCalculatorHistory: jest.fn().mockReturnValue([]),
    getAssessmentHistory: jest.fn().mockReturnValue([]),
  }),
  StoredAssessment: {},
}));

describe("Landing Page", () => {
  // Use fake timers for animations
  beforeEach(() => {
    jest.useFakeTimers();
    mockOpenModal.mockClear();
    mockCloseModal.mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
    mockSearchParams = new URLSearchParams();
    mockProfileCompletion = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
      hasAssessment: false,
      hasCalculator: false,
      isProfileComplete: false,
      calculatorResults: null,
      proteinTarget: null,
      refetch: mockRefetchProfileCompletion,
    };
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Hero Section (Variant A - Problem-Solution)", () => {
    it("renders the hero section with aria-label", () => {
      render(<LandingPage />);
      expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
    });

    it("renders the eyebrow text for target audience", () => {
      render(<LandingPage />);
      expect(screen.getByText(/For High-Performing Professionals/i)).toBeInTheDocument();
    });

    it("renders the problem-focused headline", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Tired of Diets That Ignore Your/i)).toBeInTheDocument();
      expect(screen.getByText(/Demanding Schedule/i)).toBeInTheDocument();
    });

    it("renders the science-based coaching description", () => {
      render(<LandingPage />);
      expect(screen.getByText(/science-based metabolic coaching/i)).toBeInTheDocument();
    });

    it("renders two CTA buttons", () => {
      render(<LandingPage />);
      expect(screen.getByRole("button", { name: /Book.*(free|strategy)/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Take.*assessment/i })).toBeInTheDocument();
    });

    it("renders program overview stats", () => {
      render(<LandingPage />);
      expect(screen.getByText("Program Overview")).toBeInTheDocument();
      expect(screen.getByText(/Complete Program/i)).toBeInTheDocument();
    });
  });

  describe("Transformations Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = render(<LandingPage />);
      const section = container.querySelector("#transformations");
      expect(section).toBeInTheDocument();
    });

    it("renders the section title", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Real People/i)).toBeInTheDocument();
      // "Real Transformations" appears multiple times on the page (section title and elsewhere)
      expect(screen.getAllByText(/Real Transformations/i).length).toBeGreaterThan(0);
    });

    it("renders YouTube Shorts carousel", () => {
      render(<LandingPage />);
      // The carousel should be present with its aria-label
      expect(
        screen.getByRole("region", { name: /client transformation video stories/i })
      ).toBeInTheDocument();
    });

    it("renders Before & After carousel", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("region", { name: /before and after transformation gallery/i })
      ).toBeInTheDocument();
    });
  });

  describe("Revelation Section", () => {
    it("renders THE REVELATION badge", () => {
      render(<LandingPage />);
      expect(screen.getByText("The Revelation")).toBeInTheDocument();
    });

    it("renders the revelation title", () => {
      render(<LandingPage />);
      expect(screen.getByText(/You don't lack discipline/i)).toBeInTheDocument();
      expect(screen.getByText(/Your system lacks calibration/i)).toBeInTheDocument();
    });

    it("renders two revelation buttons", () => {
      render(<LandingPage />);
      expect(screen.getByRole("button", { name: /The High-Performer Trap/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /See Who We Work With/i })).toBeInTheDocument();
    });
  });

  describe("About Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = render(<LandingPage />);
      const section = container.querySelector("#about");
      expect(section).toBeInTheDocument();
    });

    it("renders ABOUT METABOLI-K-AL title", () => {
      render(<LandingPage />);
      // Multiple "About" texts exist (section title, nav badge)
      const aboutTexts = screen.getAllByText(/About/);
      expect(aboutTexts.length).toBeGreaterThan(0);
      // Multiple Metaboli-k-al texts exist
      const metaboliTexts = screen.getAllByText(/Metaboli-k-al/i);
      expect(metaboliTexts.length).toBeGreaterThan(0);
    });

    it("renders three quick link buttons", () => {
      render(<LandingPage />);
      expect(screen.getByRole("button", { name: /Meet the Expert/i })).toBeInTheDocument();
      // Use getAllByRole since Quick Access tray also contains "The Method" button
      expect(screen.getAllByRole("button", { name: /The Method/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Elite Programs/i }).length).toBeGreaterThan(0);
    });

    it("renders THE DISCOVERY accordion", () => {
      render(<LandingPage />);
      expect(screen.getByText("The Discovery")).toBeInTheDocument();
    });

    it("renders WHY WE'RE METABOLI-K-AL accordion", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Why We're Metaboli-k-al/i)).toBeInTheDocument();
    });
  });

  describe("Difference Section", () => {
    it("renders THE METABOLI-K-AL DIFFERENCE title", () => {
      render(<LandingPage />);
      expect(screen.getByText(/The Metaboli-k-al/i)).toBeInTheDocument();
      expect(screen.getByText(/Difference/)).toBeInTheDocument();
    });

    it("renders three difference cards", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Personal, Not Automated/i)).toBeInTheDocument();
      expect(screen.getByText(/Science-Based, Tested/i)).toBeInTheDocument();
      expect(screen.getByText(/Built for Elite Lifestyles/i)).toBeInTheDocument();
    });

    it("renders the bottom statement", () => {
      render(<LandingPage />);
      expect(screen.getByText(/You don't need more hustle/i)).toBeInTheDocument();
      expect(screen.getByText(/You need rhythm/i)).toBeInTheDocument();
    });
  });

  describe("Challenge Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = render(<LandingPage />);
      const section = container.querySelector("#challenge");
      expect(section).toBeInTheDocument();
    });

    it("renders STILL NOT SURE badge", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Still Not Sure\? Take the Challenge/i)).toBeInTheDocument();
    });

    it("renders two challenge buttons", () => {
      render(<LandingPage />);
      expect(screen.getByRole("button", { name: /How It Works/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Launch Challenge Hub/i })).toBeInTheDocument();
    });

    it("renders challenge tags", () => {
      render(<LandingPage />);
      expect(screen.getByText("Science-Backed")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
      expect(screen.getByText("Sustainable")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all buttons are accessible", () => {
      render(<LandingPage />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("accordions are implemented with details/summary for accessibility", () => {
      const { container } = render(<LandingPage />);
      const detailsElements = container.querySelectorAll("details");
      expect(detailsElements.length).toBe(2); // The Discovery and Why We're Metaboli-k-al
    });
  });

  describe("Button click handlers - modal triggers", () => {
    it("opens high-performer-trap modal when The High-Performer Trap button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /The High-Performer Trap/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("high-performer-trap");
    });

    it("opens elite-lifestyles modal when See Who We Work With button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /See Who We Work With/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("elite-lifestyles");
    });

    it("opens meet-expert modal when Meet the Expert button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /Meet the Expert/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("meet-expert");
    });

    it("opens method modal when The Method button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      // There are two "The Method" buttons (about section + quick access tray)
      const buttons = screen.getAllByRole("button", { name: /The Method/i });
      await user.click(buttons[0]);

      expect(mockOpenModal).toHaveBeenCalledWith("method");
    });

    it("opens elite-programs modal when Elite Programs button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const buttons = screen.getAllByRole("button", { name: /Elite Programs/i });
      await user.click(buttons[0]);

      expect(mockOpenModal).toHaveBeenCalledWith("elite-programs");
    });

    it("opens user-guide modal when How It Works button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /How It Works/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("user-guide");
    });
  });

  describe("handleOpenChallengeHub - auth and profile gating", () => {
    it("opens login-required modal when user is not authenticated", async () => {
      mockProfileCompletion.isAuthenticated = false;
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /Launch Challenge Hub/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("login-required");
    });

    it("opens profile-incomplete modal when authenticated but profile incomplete", async () => {
      mockProfileCompletion.isAuthenticated = true;
      mockProfileCompletion.isProfileComplete = false;
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /Launch Challenge Hub/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("profile-incomplete");
    });

    it("opens challenge-hub modal when authenticated and profile is complete", async () => {
      mockProfileCompletion.isAuthenticated = true;
      mockProfileCompletion.isProfileComplete = true;
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<LandingPage />);

      const button = screen.getByRole("button", { name: /Launch Challenge Hub/i });
      await user.click(button);

      expect(mockOpenModal).toHaveBeenCalledWith("challenge-hub");
    });
  });

  describe("handleScrollToTransformations", () => {
    it("scrolls to transformations section when Real Results button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const scrollIntoViewMock = jest.fn();

      render(<LandingPage />);

      // Attach a spy to the transformations section element
      const transformations = document.getElementById("transformations");
      if (transformations) {
        transformations.scrollIntoView = scrollIntoViewMock;
      }

      // The Quick Access tray has a "Real Results" button
      const realResultsButtons = screen.getAllByRole("button", { name: /Real Results/i });
      if (realResultsButtons.length > 0) {
        await user.click(realResultsButtons[0]);
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
      }
    });
  });

  describe("Instagram section", () => {
    it("renders all three Instagram cards", () => {
      render(<LandingPage />);

      expect(screen.getByText("Before & After Stories")).toBeInTheDocument();
      expect(screen.getByText("Client Wins")).toBeInTheDocument();
      expect(screen.getByText("Learn & Level Up")).toBeInTheDocument();
    });

    it("renders Instagram follow link with correct href", () => {
      render(<LandingPage />);

      const followLink = screen.getByRole("link", { name: /Follow @metabolikal/i });
      expect(followLink).toBeInTheDocument();
      expect(followLink).toHaveAttribute("href", "https://www.instagram.com/metabolikal");
      expect(followLink).toHaveAttribute("target", "_blank");
      expect(followLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Auth redirect on hash tokens", () => {
    it("shows loading state when auth tokens are in URL hash", () => {
      // Use the setter for hash (JSDOM supports this)
      const originalHash = window.location.hash;
      window.location.hash = "#access_token=test123&refresh_token=test456";

      render(<LandingPage />);

      expect(screen.getByText("Processing authentication...")).toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("/auth/callback/client#access_token=")
      );

      // Restore
      window.location.hash = originalHash;
    });
  });

  describe("Modal query parameter", () => {
    it("opens assessment modal when ?modal=assessment is in URL", () => {
      mockSearchParams = new URLSearchParams("modal=assessment");

      render(<LandingPage />);

      expect(mockOpenModal).toHaveBeenCalledWith("assessment");
    });

    it("does not open modal when no modal param is present", () => {
      mockSearchParams = new URLSearchParams();

      render(<LandingPage />);

      // openModal may be called for other reasons, but not with "assessment" from the param handler
      const assessmentCalls = mockOpenModal.mock.calls.filter(
        (call: string[]) => call[0] === "assessment"
      );
      expect(assessmentCalls.length).toBe(0);
    });
  });
});
