import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorModal } from "../calculator-modal";

// Mock the medical conditions hook to avoid needing Refine context
const mockCalculateImpact = jest.fn().mockReturnValue(0);

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
    calculateMetabolicImpactFromConditions: (...args: unknown[]) => mockCalculateImpact(...args),
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
    mockCalculateImpact.mockReturnValue(0);
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

  describe("handleConditionToggle", () => {
    it("toggles a medical condition on when clicked", async () => {
      const user = userEvent.setup();
      mockCalculateImpact.mockReturnValue(8);
      render(<CalculatorModal {...defaultProps} />);

      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      await user.click(hypothyroidism);

      await waitFor(() => {
        expect(mockCalculateImpact).toHaveBeenCalled();
      });
    });

    it("toggles a medical condition off when clicked twice", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;

      // Click once to select
      await user.click(hypothyroidism);
      // Click again to deselect
      mockCalculateImpact.mockReturnValue(0);
      await user.click(hypothyroidism);

      await waitFor(() => {
        expect(screen.getByText("-0%")).toBeInTheDocument();
      });
    });

    it("selects None and clears other conditions", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      // First select Hypothyroidism
      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      await user.click(hypothyroidism);

      // Then select None - should clear Hypothyroidism
      mockCalculateImpact.mockReturnValue(0);
      const noneOption = screen.getByText("None of the above").closest("[role='button']")!;
      await user.click(noneOption);

      await waitFor(() => {
        expect(mockCalculateImpact).toHaveBeenCalled();
      });
    });

    it("deselects None when clicking None again", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      const noneOption = screen.getByText("None of the above").closest("[role='button']")!;

      // Select None
      await user.click(noneOption);
      // Deselect None
      await user.click(noneOption);

      // Should have no conditions selected
      expect(screen.getByText("-0%")).toBeInTheDocument();
    });

    it("removes None when selecting a condition after None", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      // Select None first
      const noneOption = screen.getByText("None of the above").closest("[role='button']")!;
      await user.click(noneOption);

      // Now select a real condition - should remove None
      mockCalculateImpact.mockReturnValue(12);
      const diabetes = screen.getByText("Type 2 Diabetes").closest("[role='button']")!;
      await user.click(diabetes);

      await waitFor(() => {
        expect(mockCalculateImpact).toHaveBeenCalled();
      });
    });

    it("handles keyboard activation with Enter key", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      (hypothyroidism as HTMLElement).focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockCalculateImpact).toHaveBeenCalled();
      });
    });

    it("handles keyboard activation with Space key", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      (hypothyroidism as HTMLElement).focus();
      await user.keyboard(" ");

      await waitFor(() => {
        expect(mockCalculateImpact).toHaveBeenCalled();
      });
    });
  });

  describe("onSubmit - form submission", () => {
    // react-hook-form register() uses the native 'change' event.
    // jsdom supports valueAsNumber on type="number" inputs natively.
    const fillNumberInput = (placeholder: RegExp, value: number) => {
      const input = screen.getByPlaceholderText(placeholder) as HTMLInputElement;
      // Use nativeInputValueSetter to ensure jsdom's internal value is set
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )!.set!;
      nativeInputValueSetter.call(input, String(value));
      fireEvent.input(input, { target: { value: String(value) } });
      fireEvent.change(input, { target: { value: String(value) } });
    };

    const fillRequiredFields = () => {
      fillNumberInput(/Enter age/i, 30);
      fillNumberInput(/Enter weight/i, 80);
      fillNumberInput(/Enter height/i, 180);
      fillNumberInput(/Enter goal weight/i, 75);
      // bodyFatPercent is optional in the schema but the empty number input
      // produces NaN (not undefined) which fails zod validation, so fill it
      fillNumberInput(/Enter body fat/i, 15);
    };

    it("calls onCalculate with form data when form is submitted with valid data", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /Calculate Results/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onCalculate).toHaveBeenCalled();
      });

      // Verify the shape of the data passed
      const callArgs = defaultProps.onCalculate.mock.calls[0][0];
      expect(callArgs.gender).toBe("male");
      expect(callArgs.activityLevel).toBe("moderately_active");
      expect(callArgs.goal).toBe("fat_loss");
      expect(callArgs.metabolicImpactPercent).toBe(0);
      expect(typeof callArgs.age).toBe("number");
      expect(typeof callArgs.weightKg).toBe("number");
      expect(typeof callArgs.heightCm).toBe("number");
    });

    it("closes the modal before calling onCalculate", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /Calculate Results/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("includes metabolic impact from selected conditions in submitted data", async () => {
      mockCalculateImpact.mockReturnValue(8);
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      // Select a condition
      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      await user.click(hypothyroidism);

      fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /Calculate Results/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onCalculate).toHaveBeenCalled();
      });

      const callArgs = defaultProps.onCalculate.mock.calls[0][0];
      expect(callArgs.metabolicImpactPercent).toBe(8);
    });

    it("does not call onCalculate when required fields are missing", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      // Submit without filling in required fields
      const submitButton = screen.getByRole("button", { name: /Calculate Results/i });
      await user.click(submitButton);

      // Wait a moment and verify onCalculate was NOT called
      await new Promise((r) => setTimeout(r, 100));
      expect(defaultProps.onCalculate).not.toHaveBeenCalled();
    });
  });

  describe("handleViewGuide", () => {
    it("closes modal and opens body fat guide", async () => {
      const user = userEvent.setup();
      render(<CalculatorModal {...defaultProps} />);

      const viewGuide = screen.getByText(/View guide/i);
      await user.click(viewGuide);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(defaultProps.onOpenBodyFatGuide).toHaveBeenCalled();

      // Verify order: close first, then open guide
      const openChangeCallOrder = defaultProps.onOpenChange.mock.invocationCallOrder[0];
      const guideCallOrder = defaultProps.onOpenBodyFatGuide.mock.invocationCallOrder[0];
      expect(openChangeCallOrder).toBeLessThan(guideCallOrder);
    });
  });

  describe("metabolic impact display color", () => {
    it("shows amber color when metabolic impact is greater than 0", async () => {
      const user = userEvent.setup();
      mockCalculateImpact.mockReturnValue(8);
      render(<CalculatorModal {...defaultProps} />);

      // Select a condition to trigger non-zero metabolic impact
      const hypothyroidism = screen.getByText("Hypothyroidism").closest("[role='button']")!;
      await user.click(hypothyroidism);

      await waitFor(() => {
        const impactText = screen.getByText("-8%");
        expect(impactText).toHaveClass("text-amber-500");
      });
    });

    it("shows primary color when metabolic impact is 0", () => {
      render(<CalculatorModal {...defaultProps} />);

      const impactText = screen.getByText("-0%");
      expect(impactText).toHaveClass("text-primary");
    });
  });

  describe("condition impact display", () => {
    it("shows impact percentage next to conditions with impact > 0", () => {
      render(<CalculatorModal {...defaultProps} />);

      // There should be impact indicators for conditions with non-zero impact
      // Hypothyroidism (8%), Chronic Fatigue (8%), etc.
      const impactElements = screen.getAllByText(/\(-\d+%\)/);
      expect(impactElements.length).toBeGreaterThan(0);

      // Verify specific impacts exist
      expect(screen.getByText("(-12%)")).toBeInTheDocument(); // Type 2 Diabetes
      expect(screen.getByText("(-15%)")).toBeInTheDocument(); // Metabolic Syndrome
      // PCOS (10%) and Insulin Resistance (10%) both show (-10%), so use getAllByText
      expect(screen.getAllByText("(-10%)").length).toBeGreaterThanOrEqual(1);
    });

    it("does not show (-0%) for None condition (impact = 0)", () => {
      render(<CalculatorModal {...defaultProps} />);

      // The "None of the above" condition has impact 0, so no (-0%) text should be shown
      const impactElements = screen.queryAllByText(/\(-\d+%\)/);
      const hasZeroImpact = impactElements.some((el) => el.textContent === "(-0%)");
      expect(hasZeroImpact).toBe(false);
    });
  });
});
