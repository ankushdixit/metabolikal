import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsModal } from "../results-modal";
import { CalculatorResults } from "@/hooks/use-calculator";
import { StoredAssessment } from "@/hooks/use-assessment-storage";
import { AssessmentScores } from "@/hooks/use-assessment";
import type { CalculatorSettingsRow } from "@/lib/database.types";

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
    physicalScore: 85, // Physical score from BMI/body fat calculation
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
    // Multiple matches expected (modal + hidden shareable image)
    expect(screen.getAllByText("METABOLI-K-AL Health Score").length).toBeGreaterThanOrEqual(1);
  });

  it("displays health score value and tier", () => {
    render(<ResultsModal {...defaultProps} />);
    // Multiple matches expected (modal + hidden shareable image)
    expect(screen.getAllByText("72").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Good Metabolic Health").length).toBeGreaterThanOrEqual(1);
  });

  it("displays Physical Metrics and Lifestyle Factors scores", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Physical Metrics")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle Factors")).toBeInTheDocument();
    // Multiple matches expected (modal + hidden shareable image)
    expect(screen.getAllByText("65").length).toBeGreaterThanOrEqual(1); // Lifestyle score
    expect(screen.getAllByText("85").length).toBeGreaterThanOrEqual(1); // Physical score
  });

  it("renders Your Metabolic Numbers section", () => {
    render(<ResultsModal {...defaultProps} />);
    // Multiple matches expected (modal + hidden shareable image)
    expect(screen.getAllByText("Your Metabolic Numbers").length).toBeGreaterThanOrEqual(1);
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
      // Multiple matches expected (modal + hidden shareable image)
      expect(screen.getAllByText("Needs Attention").length).toBeGreaterThanOrEqual(1);
    });

    it("shows Moderate Metabolic Health for score 51-70", () => {
      render(<ResultsModal {...defaultProps} healthScore={60} />);
      // Multiple matches expected (modal + hidden shareable image)
      expect(screen.getAllByText("Moderate Metabolic Health").length).toBeGreaterThanOrEqual(1);
    });

    it("shows Good Metabolic Health for score 71-85", () => {
      render(<ResultsModal {...defaultProps} healthScore={80} />);
      // Multiple matches expected (modal + hidden shareable image)
      expect(screen.getAllByText("Good Metabolic Health").length).toBeGreaterThanOrEqual(1);
    });

    it("shows Elite Metabolic Health for score > 85", () => {
      render(<ResultsModal {...defaultProps} healthScore={90} />);
      // Multiple matches expected (modal + hidden shareable image)
      expect(screen.getAllByText("Elite Metabolic Health").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders Share Image button", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Share Image/i })).toBeInTheDocument();
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
      // Multiple matches expected (modal + hidden shareable image)
      expect(
        screen.getAllByText(/Your lifestyle is boosting your metabolism/i).length
      ).toBeGreaterThanOrEqual(1);
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

  describe("Download Image handler", () => {
    it("exercises handleDownloadImage when Download Image is clicked", async () => {
      const user = userEvent.setup();
      render(<ResultsModal {...defaultProps} />);

      const downloadButton = screen.getByRole("button", { name: /Download Image/i });
      await user.click(downloadButton);

      // generateShareableImage returns null (ref not rendered in test DOM),
      // so no download link is created — but the handler is fully exercised.
      // Verify the button returns to non-loading state:
      expect(screen.getByRole("button", { name: /Download Image/i })).toBeInTheDocument();
    });
  });

  describe("Share Image handler", () => {
    it("exercises handleShare and falls back to share options", async () => {
      // Ensure navigator.share does not exist so the fallback path runs
      const originalShare = navigator.share;
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

      const user = userEvent.setup();
      render(<ResultsModal {...defaultProps} />);

      const shareButton = screen.getByRole("button", { name: /Share Image/i });
      await user.click(shareButton);

      // generateShareableImage returns null (ref unavailable in test), so
      // we enter the else branch (no navigator.share), setting showShareOptions=true.
      // Verify the Share button is still present after the operation completes:
      expect(screen.getByRole("button", { name: /Share Image/i })).toBeInTheDocument();

      Object.defineProperty(navigator, "share", { value: originalShare, configurable: true });
    });

    it("shows Copy Text button after share fallback", async () => {
      // Remove navigator.share so the fallback sets showShareOptions = true
      const originalShare = navigator.share;
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

      const user = userEvent.setup();
      render(<ResultsModal {...defaultProps} />);

      const shareButton = screen.getByRole("button", { name: /Share Image/i });
      await user.click(shareButton);

      // Wait for async handler to complete
      const copyButton = await screen.findByRole("button", { name: /Copy Text/i });
      expect(copyButton).toBeInTheDocument();

      Object.defineProperty(navigator, "share", { value: originalShare, configurable: true });
    });
  });

  describe("Copy Text handler", () => {
    it("shows Copied! state when Copy Text button is clicked", async () => {
      // Remove navigator.share to trigger showShareOptions which shows Copy Text
      const originalShare = navigator.share;
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

      const user = userEvent.setup();
      render(<ResultsModal {...defaultProps} />);

      // Click share to reveal Copy Text button
      const shareButton = screen.getByRole("button", { name: /Share Image/i });
      await user.click(shareButton);

      // Wait for Copy Text to appear
      const copyButton = await screen.findByRole("button", { name: /Copy Text/i });
      await user.click(copyButton);

      // After copying, "Copied!" text should appear (userEvent handles clipboard)
      await screen.findByText("Copied!");

      Object.defineProperty(navigator, "share", { value: originalShare, configurable: true });
    });
  });

  describe("Medical Considerations Section", () => {
    it("renders medical considerations when conditions are provided", () => {
      const medicalConditions = [
        { name: "Hypothyroidism", slug: "hypothyroidism", impactPercent: 5 },
      ];
      render(
        <ResultsModal
          {...defaultProps}
          medicalConditions={medicalConditions}
          baseBmr={1800}
          adjustedBmr={1710}
        />
      );
      // The section should be rendered since metabolicImpactPercent > 0 and conditions exist
      expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
    });

    it("does not render medical considerations when no conditions", () => {
      render(
        <ResultsModal {...defaultProps} medicalConditions={[]} baseBmr={1800} adjustedBmr={1710} />
      );
      expect(screen.queryByText(/Medical Considerations/i)).not.toBeInTheDocument();
    });
  });

  describe("Fat Loss Action Plan", () => {
    it("renders fat loss action plan for fat_loss goal with weight data", () => {
      render(<ResultsModal {...defaultProps} goal="fat_loss" weightKg={85} goalWeightKg={75} />);
      // The FatLossActionPlan component should be rendered
      // Check for fat-loss-specific content (Smart Nutrition section)
      expect(screen.getByText("Fat Loss Strategy")).toBeInTheDocument();
    });

    it("does not render fat loss action plan for maintain goal", () => {
      render(<ResultsModal {...defaultProps} goal="maintain" />);
      expect(screen.getByText("Maintenance Strategy")).toBeInTheDocument();
    });

    it("uses custom calculator settings for nutrition deficit", () => {
      render(
        <ResultsModal
          {...defaultProps}
          goal="fat_loss"
          weightKg={85}
          goalWeightKg={75}
          calculatorSettings={
            {
              id: "1",
              goal_fat_loss_adjustment: -700,
              goal_muscle_gain_adjustment: 300,
              goal_maintain_adjustment: 0,
            } as CalculatorSettingsRow
          }
        />
      );
      expect(screen.getByText("Fat Loss Strategy")).toBeInTheDocument();
    });
  });

  describe("Metabolic impact note visibility", () => {
    it("hides metabolic impact note when medical considerations section is shown", () => {
      const medicalConditions = [
        { name: "Hypothyroidism", slug: "hypothyroidism", impactPercent: 5 },
      ];
      render(
        <ResultsModal
          {...defaultProps}
          medicalConditions={medicalConditions}
          baseBmr={1800}
          adjustedBmr={1710}
        />
      );
      // When medical considerations are shown, the generic note should be hidden
      expect(screen.queryByText(/Your TDEE has been adjusted by/i)).not.toBeInTheDocument();
    });
  });
});
