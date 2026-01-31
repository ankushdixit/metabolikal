import { render, screen, act } from "@testing-library/react";
import LandingPage from "../page";
import { ModalProvider } from "@/contexts/modal-context";

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ModalProvider>{ui}</ModalProvider>);
};

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

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
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

describe("Landing Page", () => {
  // Use fake timers for animations
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Hero Section (Variant A - Problem-Solution)", () => {
    it("renders the hero section with aria-label", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
    });

    it("renders the eyebrow text for target audience", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/For High-Performing Professionals/i)).toBeInTheDocument();
    });

    it("renders the problem-focused headline", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Tired of Diets That Ignore Your/i)).toBeInTheDocument();
      expect(screen.getByText(/Demanding Schedule/i)).toBeInTheDocument();
    });

    it("renders the science-based coaching description", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/science-based metabolic coaching/i)).toBeInTheDocument();
    });

    it("renders two CTA buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /Book.*(free|strategy)/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Take.*assessment/i })).toBeInTheDocument();
    });

    it("renders program overview stats", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("Program Overview")).toBeInTheDocument();
      expect(screen.getByText(/Complete Program/i)).toBeInTheDocument();
    });
  });

  describe("Transformations Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#transformations");
      expect(section).toBeInTheDocument();
    });

    it("renders the section title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Real People/i)).toBeInTheDocument();
      // "Real Transformations" appears multiple times on the page (section title and elsewhere)
      expect(screen.getAllByText(/Real Transformations/i).length).toBeGreaterThan(0);
    });

    it("renders YouTube Shorts carousel", () => {
      renderWithProvider(<LandingPage />);
      // The carousel should be present with its aria-label
      expect(
        screen.getByRole("region", { name: /client transformation video stories/i })
      ).toBeInTheDocument();
    });

    it("renders Before & After carousel", () => {
      renderWithProvider(<LandingPage />);
      expect(
        screen.getByRole("region", { name: /before and after transformation gallery/i })
      ).toBeInTheDocument();
    });
  });

  describe("Revelation Section", () => {
    it("renders THE REVELATION badge", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("The Revelation")).toBeInTheDocument();
    });

    it("renders the revelation title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/You don't lack discipline/i)).toBeInTheDocument();
      expect(screen.getByText(/Your system lacks calibration/i)).toBeInTheDocument();
    });

    it("renders two revelation buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /The High-Performer Trap/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /See Who We Work With/i })).toBeInTheDocument();
    });
  });

  describe("About Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#about");
      expect(section).toBeInTheDocument();
    });

    it("renders ABOUT METABOLI-K-AL title", () => {
      renderWithProvider(<LandingPage />);
      // Multiple "About" texts exist (section title, nav badge)
      const aboutTexts = screen.getAllByText(/About/);
      expect(aboutTexts.length).toBeGreaterThan(0);
      // Multiple Metaboli-k-al texts exist
      const metaboliTexts = screen.getAllByText(/Metaboli-k-al/i);
      expect(metaboliTexts.length).toBeGreaterThan(0);
    });

    it("renders three quick link buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /Meet the Expert/i })).toBeInTheDocument();
      // Use getAllByRole since Quick Access tray also contains "The Method" button
      expect(screen.getAllByRole("button", { name: /The Method/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Elite Programs/i }).length).toBeGreaterThan(0);
    });

    it("renders THE DISCOVERY accordion", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("The Discovery")).toBeInTheDocument();
    });

    it("renders WHY WE'RE METABOLI-K-AL accordion", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Why We're Metaboli-k-al/i)).toBeInTheDocument();
    });
  });

  describe("Difference Section", () => {
    it("renders THE METABOLI-K-AL DIFFERENCE title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/The Metaboli-k-al/i)).toBeInTheDocument();
      expect(screen.getByText(/Difference/)).toBeInTheDocument();
    });

    it("renders three difference cards", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Personal, Not Automated/i)).toBeInTheDocument();
      expect(screen.getByText(/Science-Based, Tested/i)).toBeInTheDocument();
      expect(screen.getByText(/Built for Elite Lifestyles/i)).toBeInTheDocument();
    });

    it("renders the bottom statement", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/You don't need more hustle/i)).toBeInTheDocument();
      expect(screen.getByText(/You need rhythm/i)).toBeInTheDocument();
    });
  });

  describe("Challenge Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#challenge");
      expect(section).toBeInTheDocument();
    });

    it("renders STILL NOT SURE badge", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Still Not Sure\? Take the Challenge/i)).toBeInTheDocument();
    });

    it("renders two challenge buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /How It Works/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Launch Challenge Hub/i })).toBeInTheDocument();
    });

    it("renders challenge tags", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("Science-Backed")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
      expect(screen.getByText("Sustainable")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all buttons are accessible", () => {
      renderWithProvider(<LandingPage />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("accordions are implemented with details/summary for accessibility", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const detailsElements = container.querySelectorAll("details");
      expect(detailsElements.length).toBe(2); // The Discovery and Why We're Metaboli-k-al
    });
  });
});
