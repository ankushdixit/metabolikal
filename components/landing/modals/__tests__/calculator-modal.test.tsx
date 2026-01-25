import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorModal } from "../calculator-modal";

// Mock the medical conditions hook to avoid needing Refine context
jest.mock("@/hooks/use-medical-conditions", () => {
  const mockConditions = [
    {
      id: "1",
      slug: "hypothyroidism",
      name: "Hypothyroidism",
      impact_percent: 8,
      gender_restriction: null,
    },
    { id: "2", slug: "pcos", name: "PCOS", impact_percent: 10, gender_restriction: "female" },
    {
      id: "3",
      slug: "type2-diabetes",
      name: "Type 2 Diabetes",
      impact_percent: 12,
      gender_restriction: null,
    },
    {
      id: "4",
      slug: "insulin-resistance",
      name: "Insulin Resistance",
      impact_percent: 10,
      gender_restriction: null,
    },
    {
      id: "5",
      slug: "sleep-apnea",
      name: "Sleep Apnea",
      impact_percent: 7,
      gender_restriction: null,
    },
    {
      id: "6",
      slug: "metabolic-syndrome",
      name: "Metabolic Syndrome",
      impact_percent: 15,
      gender_restriction: null,
    },
    {
      id: "7",
      slug: "thyroid-managed",
      name: "Thyroid Medication Managed",
      impact_percent: 3,
      gender_restriction: null,
    },
    {
      id: "8",
      slug: "chronic-fatigue",
      name: "Chronic Fatigue Syndrome",
      impact_percent: 8,
      gender_restriction: null,
    },
    {
      id: "9",
      slug: "none",
      name: "None of the above",
      impact_percent: 0,
      gender_restriction: null,
    },
  ];
  return {
    useMedicalConditions: () => ({
      conditions: mockConditions,
      allConditions: mockConditions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    }),
    calculateMetabolicImpactFromConditions: jest.fn().mockReturnValue(0),
    DEFAULT_MEDICAL_CONDITIONS: mockConditions,
  };
});

describe("CalculatorModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onCalculate: jest.fn(),
    onOpenBodyFatGuide: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Metabolic Calculator/i })).toBeInTheDocument();
  });

  it("renders Your Metrics section", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText("Your Metrics")).toBeInTheDocument();
  });

  it("renders Gender select field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Gender/i)).toBeInTheDocument();
  });

  it("renders Age input field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/^Age$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter age/i)).toBeInTheDocument();
  });

  it("renders Current Weight input field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Current Weight \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter weight/i)).toBeInTheDocument();
  });

  it("renders Height input field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Height \(cm\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter height/i)).toBeInTheDocument();
  });

  it("renders Body Fat % input field with View guide link", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Body Fat % \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/View guide/i)).toBeInTheDocument();
  });

  it("renders Goal Weight input field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Goal Weight \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter goal weight/i)).toBeInTheDocument();
  });

  it("renders Activity & Goals section", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText("Activity & Goals")).toBeInTheDocument();
  });

  it("renders Activity Level select field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Activity Level/i)).toBeInTheDocument();
  });

  it("renders Your Goal select field", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Your Goal/i)).toBeInTheDocument();
  });

  it("renders Medical Conditions section", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText("Medical Conditions")).toBeInTheDocument();
    expect(screen.getByText(/Select any conditions that apply/i)).toBeInTheDocument();
  });

  it("renders medical condition checkboxes", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
    expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
    expect(screen.getByText("Insulin Resistance")).toBeInTheDocument();
    expect(screen.getByText("Sleep Apnea")).toBeInTheDocument();
    expect(screen.getByText("Metabolic Syndrome")).toBeInTheDocument();
    expect(screen.getByText("Thyroid Medication Managed")).toBeInTheDocument();
    expect(screen.getByText("Chronic Fatigue Syndrome")).toBeInTheDocument();
    expect(screen.getByText("None of the above")).toBeInTheDocument();
  });

  it("renders Estimated Metabolic Impact display", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText("Estimated Metabolic Impact")).toBeInTheDocument();
    expect(screen.getByText("-0%")).toBeInTheDocument();
  });

  it("renders privacy notice", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Privacy:/i)).toBeInTheDocument();
  });

  it("renders disclaimer", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByText(/Disclaimer:/i)).toBeInTheDocument();
  });

  it("renders Calculate Results button", () => {
    render(<CalculatorModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Calculate Results/i })).toBeInTheDocument();
  });

  it("calls onOpenBodyFatGuide when View guide is clicked", async () => {
    const user = userEvent.setup();
    render(<CalculatorModal {...defaultProps} />);

    const viewGuideButton = screen.getByText(/View guide/i);
    await user.click(viewGuideButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenBodyFatGuide).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<CalculatorModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Metabolic Calculator")).not.toBeInTheDocument();
  });
});
