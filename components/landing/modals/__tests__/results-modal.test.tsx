import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsModal } from "../results-modal";
import { CalculatorResults } from "@/hooks/use-calculator";
import { StoredAssessment } from "@/hooks/use-assessment-storage";
import { AssessmentScores } from "@/hooks/use-assessment";

describe("ResultsModal", () => {
  const defaultResults: CalculatorResults = {
    bmr: 1780,
    tdee: 2759,
    adjustedTdee: 2538,
    targetCalories: 2038,
    proteinGrams: 160,
    metabolicImpactPercent: 8,
  };

  const defaultAssessmentScores: AssessmentScores = {
    sleep: 5,
    body: 6,
    nutrition: 7,
    mental: 4,
    stress: 5,
    support: 6,
    hydration: 8,
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    results: defaultResults,
    lifestyleScore: 65,
    healthScore: 72,
    goal: "fat_loss" as const,
    onBookCall: jest.fn(),
    assessmentScores: defaultAssessmentScores,
  };

  const mockPreviousAssessment: StoredAssessment = {
    date: "2026-01-20T10:00:00.000Z",
    scores: {
      sleep: 7,
      body: 6,
      nutrition: 8,
      mental: 5,
      stress: 6,
      support: 7,
      hydration: 8,
    },
    totalScore: 70,
    lifestyleScore: 67,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Title contains "Your" and "Results" - use level 2 for the main title
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders nothing when results is null", () => {
    render(<ResultsModal {...defaultProps} results={null} />);
    expect(screen.queryByText(/Your.*Results/i)).not.toBeInTheDocument();
  });

  it("renders METABOLI-K-AL Health Score section", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("METABOLI-K-AL Health Score")).toBeInTheDocument();
  });

  it("displays health score value and tier", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Good Metabolic Health")).toBeInTheDocument();
  });

  it("displays Physical Metrics and Lifestyle Factors scores", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Physical Metrics")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle Factors")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument(); // Lifestyle score
  });

  it("renders Your Metabolic Numbers section", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Your Metabolic Numbers")).toBeInTheDocument();
  });

  it("displays BMR value", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("BMR")).toBeInTheDocument();
    // BMR appears in both Metabolic Profile and Metabolic Numbers sections
    expect(screen.getAllByText("1,780").length).toBeGreaterThanOrEqual(1);
  });

  it("displays TDEE value", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("TDEE")).toBeInTheDocument();
    // TDEE appears in both Metabolic Profile and Metabolic Numbers sections
    expect(screen.getAllByText("2,759").length).toBeGreaterThanOrEqual(1);
  });

  it("displays Target Calories", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(screen.getByText("2,038")).toBeInTheDocument();
  });

  it("displays Protein recommendation", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();
    expect(screen.getByText("grams/day")).toBeInTheDocument();
  });

  it("displays metabolic impact note when impact > 0", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText(/Your TDEE has been adjusted by -8%/i)).toBeInTheDocument();
  });

  it("does not display metabolic impact note when impact is 0", () => {
    const resultsWithoutImpact: CalculatorResults = {
      ...defaultResults,
      metabolicImpactPercent: 0,
    };
    render(<ResultsModal {...defaultProps} results={resultsWithoutImpact} />);
    expect(screen.queryByText(/Your TDEE has been adjusted/i)).not.toBeInTheDocument();
  });

  describe("Health Score Tiers", () => {
    it("shows Needs Attention for score < 51", () => {
      render(<ResultsModal {...defaultProps} healthScore={45} />);
      expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    });

    it("shows Moderate Metabolic Health for score 51-70", () => {
      render(<ResultsModal {...defaultProps} healthScore={60} />);
      expect(screen.getByText("Moderate Metabolic Health")).toBeInTheDocument();
    });

    it("shows Good Metabolic Health for score 71-85", () => {
      render(<ResultsModal {...defaultProps} healthScore={80} />);
      expect(screen.getByText("Good Metabolic Health")).toBeInTheDocument();
    });

    it("shows Elite Metabolic Health for score > 85", () => {
      render(<ResultsModal {...defaultProps} healthScore={90} />);
      expect(screen.getByText("Elite Metabolic Health")).toBeInTheDocument();
    });
  });

  it("renders Share Results button", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Share Results/i })).toBeInTheDocument();
  });

  it("renders Share Your Results section", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Share Your Results")).toBeInTheDocument();
  });

  it("renders Book Metabolic Breakthrough Call button", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Book Metabolic Breakthrough Call/i })
    ).toBeInTheDocument();
  });

  it("calls onBookCall when Book Call button is clicked", async () => {
    const user = userEvent.setup();
    render(<ResultsModal {...defaultProps} />);

    const bookCallButton = screen.getByRole("button", {
      name: /Book Metabolic Breakthrough Call/i,
    });
    await user.click(bookCallButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onBookCall).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<ResultsModal {...defaultProps} open={false} />);
    expect(screen.queryByText(/Your.*Results/i)).not.toBeInTheDocument();
  });

  describe("Action Plan Section", () => {
    it("displays Fat Loss Strategy for fat_loss goal", () => {
      render(<ResultsModal {...defaultProps} goal="fat_loss" />);
      expect(screen.getByText("Fat Loss Strategy")).toBeInTheDocument();
    });

    it("displays Maintenance Strategy for maintain goal", () => {
      render(<ResultsModal {...defaultProps} goal="maintain" />);
      expect(screen.getByText("Maintenance Strategy")).toBeInTheDocument();
    });

    it("displays Muscle Building Strategy for muscle_gain goal", () => {
      render(<ResultsModal {...defaultProps} goal="muscle_gain" />);
      expect(screen.getByText("Muscle Building Strategy")).toBeInTheDocument();
    });

    it("shows Target, Focus, Training, Goal fields", () => {
      render(<ResultsModal {...defaultProps} />);
      expect(screen.getByText("Target:")).toBeInTheDocument();
      expect(screen.getByText("Focus:")).toBeInTheDocument();
      expect(screen.getByText("Training:")).toBeInTheDocument();
      expect(screen.getByText("Goal:")).toBeInTheDocument();
    });
  });

  describe("Personalized Metabolic Profile", () => {
    it("renders the metabolic profile section", () => {
      render(<ResultsModal {...defaultProps} />);
      expect(screen.getByText("Your Personalized Metabolic Profile")).toBeInTheDocument();
    });

    it("displays Base Metabolism and Lifestyle-Adjusted values", () => {
      render(<ResultsModal {...defaultProps} />);
      expect(screen.getByText("Base Metabolism")).toBeInTheDocument();
      expect(screen.getByText("Lifestyle-Adjusted")).toBeInTheDocument();
    });

    it("shows lifestyle boost calculation", () => {
      render(<ResultsModal {...defaultProps} />);
      expect(screen.getByText(/Your lifestyle is boosting your metabolism/i)).toBeInTheDocument();
    });
  });

  describe("Priority Action Plan", () => {
    it("renders priority recommendations when assessment scores provided", () => {
      render(<ResultsModal {...defaultProps} />);
      expect(screen.getByText("Your Priority Action Plan")).toBeInTheDocument();
      expect(screen.getByText("Priority 1")).toBeInTheDocument();
      expect(screen.getByText("Priority 2")).toBeInTheDocument();
      expect(screen.getByText("Priority 3")).toBeInTheDocument();
    });

    it("does not render priority recommendations when no assessment scores", () => {
      render(<ResultsModal {...defaultProps} assessmentScores={undefined} />);
      expect(screen.queryByText("Your Priority Action Plan")).not.toBeInTheDocument();
    });

    it("shows Impact and Timeline for each recommendation", () => {
      render(<ResultsModal {...defaultProps} />);
      const impactElements = screen.getAllByText("Impact:");
      expect(impactElements.length).toBe(3);
      const timelineElements = screen.getAllByText(/Timeline:/i);
      expect(timelineElements.length).toBe(3);
    });
  });

  describe("Score Comparison", () => {
    it("does not show score comparison when no previous assessment", () => {
      render(<ResultsModal {...defaultProps} previousAssessment={null} />);
      expect(screen.queryByText(/Amazing Progress!/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Consistent Performance!/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Room to Grow!/i)).not.toBeInTheDocument();
    });

    it("shows Amazing Progress when score improved", () => {
      // Current healthScore is 72, previous totalScore is 70
      render(<ResultsModal {...defaultProps} previousAssessment={mockPreviousAssessment} />);
      expect(screen.getByText(/Amazing Progress!/i)).toBeInTheDocument();
      expect(screen.getByText(/\+2 points/i)).toBeInTheDocument();
    });

    it("shows Consistent Performance when score is same", () => {
      // Set healthScore to 70 to match previous
      render(
        <ResultsModal
          {...defaultProps}
          healthScore={70}
          previousAssessment={mockPreviousAssessment}
        />
      );
      expect(screen.getByText(/Consistent Performance!/i)).toBeInTheDocument();
      // The message contains "maintained your score" - look for it in paragraph text
      expect(screen.getByText(/maintained your score/i)).toBeInTheDocument();
    });

    it("shows Room to Grow when score decreased", () => {
      // Set healthScore to 65, below previous 70
      render(
        <ResultsModal
          {...defaultProps}
          healthScore={65}
          previousAssessment={mockPreviousAssessment}
        />
      );
      expect(screen.getByText(/Room to Grow!/i)).toBeInTheDocument();
      expect(screen.getByText(/baseline is set/i)).toBeInTheDocument();
    });
  });
});
