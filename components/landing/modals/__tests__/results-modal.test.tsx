import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsModal } from "../results-modal";
import { CalculatorResults } from "@/hooks/use-calculator";

describe("ResultsModal", () => {
  const defaultResults: CalculatorResults = {
    bmr: 1780,
    tdee: 2759,
    adjustedTdee: 2538,
    targetCalories: 2038,
    proteinGrams: 160,
    metabolicImpactPercent: 8,
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    results: defaultResults,
    lifestyleScore: 65,
    healthScore: 72,
    goal: "fat_loss" as const,
    onBookCall: jest.fn(),
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

  it("renders Your Health Score section", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Your Health Score")).toBeInTheDocument();
  });

  it("displays Metabolic Health Score", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Metabolic Health Score")).toBeInTheDocument();
  });

  it("displays Lifestyle Score", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle Score")).toBeInTheDocument();
  });

  it("renders Your Metabolic Numbers section", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("Your Metabolic Numbers")).toBeInTheDocument();
  });

  it("displays BMR value", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("BMR")).toBeInTheDocument();
    expect(screen.getByText("1,780")).toBeInTheDocument();
  });

  it("displays TDEE value", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText("TDEE")).toBeInTheDocument();
    expect(screen.getByText("2,759")).toBeInTheDocument();
  });

  it("displays Target Calories with goal label", () => {
    render(<ResultsModal {...defaultProps} />);
    expect(screen.getByText(/Target \(Fat Loss\)/i)).toBeInTheDocument();
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

  describe("Insights based on health score", () => {
    it("shows urgent messaging for score < 50", () => {
      render(<ResultsModal {...defaultProps} healthScore={45} />);
      expect(screen.getByText("Metabolic Reset Recommended")).toBeInTheDocument();
      expect(screen.getByText(/urgent attention/i)).toBeInTheDocument();
    });

    it("shows moderate messaging for score 50-70", () => {
      render(<ResultsModal {...defaultProps} healthScore={60} />);
      expect(screen.getByText("Optimization Opportunity")).toBeInTheDocument();
      expect(screen.getByText(/optimization opportunities/i)).toBeInTheDocument();
    });

    it("shows positive messaging for score > 70", () => {
      render(<ResultsModal {...defaultProps} healthScore={80} />);
      expect(screen.getByText("Strong Foundation")).toBeInTheDocument();
      expect(screen.getByText(/foundation is solid/i)).toBeInTheDocument();
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

  it("displays correct goal label for maintain", () => {
    render(<ResultsModal {...defaultProps} goal="maintain" />);
    expect(screen.getByText(/Target \(Maintain Weight\)/i)).toBeInTheDocument();
  });

  it("displays correct goal label for muscle gain", () => {
    render(<ResultsModal {...defaultProps} goal="muscle_gain" />);
    expect(screen.getByText(/Target \(Muscle Gain\)/i)).toBeInTheDocument();
  });
});
