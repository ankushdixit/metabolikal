import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssessmentModal } from "../assessment-modal";
import { AssessmentScores, ASSESSMENT_CATEGORIES } from "@/hooks/use-assessment";
import { StoredAssessment } from "@/hooks/use-assessment-storage";

describe("AssessmentModal", () => {
  const defaultScores: AssessmentScores = {
    sleep: 5,
    body: 5,
    nutrition: 5,
    mental: 5,
    stress: 5,
    support: 5,
    hydration: 5,
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    scores: defaultScores,
    onScoreChange: jest.fn(),
    onContinue: jest.fn(),
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
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Title contains "METABOLI-K-AL" and "Assessment"
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders intro text explaining the assessment", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText(/Rate each area of your lifestyle/i)).toBeInTheDocument();
  });

  it("renders all 7 lifestyle assessment sliders", () => {
    render(<AssessmentModal {...defaultProps} />);

    ASSESSMENT_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.label)).toBeInTheDocument();
    });
  });

  it("renders Sleep & Recovery slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Sleep & Recovery")).toBeInTheDocument();
    expect(screen.getByText("Tossing, turning, waking tired")).toBeInTheDocument();
    expect(screen.getByText("8h deep sleep, wake refreshed")).toBeInTheDocument();
  });

  it("renders Body Confidence slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Body Confidence")).toBeInTheDocument();
    expect(screen.getByText("Avoid mirrors, hide body")).toBeInTheDocument();
    expect(screen.getByText("Command presence")).toBeInTheDocument();
  });

  it("renders Nutrition Strategy Mastery slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Nutrition Strategy Mastery")).toBeInTheDocument();
    expect(screen.getByText("Stress eating, guilt cycles")).toBeInTheDocument();
    expect(screen.getByText("Fuel for performance")).toBeInTheDocument();
  });

  it("renders Mental Clarity slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Mental Clarity")).toBeInTheDocument();
    expect(screen.getByText("Foggy, slow decisions")).toBeInTheDocument();
    expect(screen.getByText("Laser-sharp execution")).toBeInTheDocument();
  });

  it("renders Stress Management slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Stress Management")).toBeInTheDocument();
    expect(screen.getByText("Reactive, overwhelmed")).toBeInTheDocument();
    expect(screen.getByText("Calm under pressure")).toBeInTheDocument();
  });

  it("renders Support System slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Support System")).toBeInTheDocument();
    expect(screen.getByText("Isolated, going solo")).toBeInTheDocument();
    expect(screen.getByText("Elite peer support")).toBeInTheDocument();
  });

  it("renders Hydration slider with correct labels", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByText("Hydration")).toBeInTheDocument();
    expect(screen.getByText("Barely drinking, dehydrated")).toBeInTheDocument();
    expect(screen.getByText(/Optimal hydration/i)).toBeInTheDocument();
  });

  it("displays current score values", () => {
    const customScores: AssessmentScores = {
      sleep: 8,
      body: 3,
      nutrition: 7,
      mental: 5,
      stress: 6,
      support: 4,
      hydration: 9,
    };

    render(<AssessmentModal {...defaultProps} scores={customScores} />);

    // Each score should be displayed
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("renders Continue to Calculator button", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Continue to Calculator/i })).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    render(<AssessmentModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("calls onContinue when Continue button is clicked", async () => {
    const user = userEvent.setup();
    render(<AssessmentModal {...defaultProps} />);

    const continueButton = screen.getByRole("button", { name: /Continue to Calculator/i });
    await user.click(continueButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onContinue).toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<AssessmentModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when closed", () => {
    render(<AssessmentModal {...defaultProps} open={false} />);
    expect(screen.queryByText(/METABOLI-K-AL Assessment/i)).not.toBeInTheDocument();
  });

  describe("Welcome Back banner", () => {
    it("does not show Welcome Back banner when no previous assessment", () => {
      render(<AssessmentModal {...defaultProps} previousAssessment={null} />);
      expect(screen.queryByText(/Welcome Back/i)).not.toBeInTheDocument();
    });

    it("shows Welcome Back banner when previous assessment exists", () => {
      render(<AssessmentModal {...defaultProps} previousAssessment={mockPreviousAssessment} />);
      expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument();
    });

    it("displays last assessment date formatted correctly", () => {
      render(<AssessmentModal {...defaultProps} previousAssessment={mockPreviousAssessment} />);
      expect(screen.getByText(/01\/20\/2026/)).toBeInTheDocument();
    });

    it("displays previous score with trophy emoji", () => {
      render(<AssessmentModal {...defaultProps} previousAssessment={mockPreviousAssessment} />);
      expect(screen.getByText(/70\/100/)).toBeInTheDocument();
    });

    it("displays encouraging progress text", () => {
      render(<AssessmentModal {...defaultProps} previousAssessment={mockPreviousAssessment} />);
      expect(screen.getByText(/Let's see your progress!/i)).toBeInTheDocument();
    });
  });
});
