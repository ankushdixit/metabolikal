import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConditionSelector } from "../condition-selector";

// Mock the useMedicalConditions hook
jest.mock("@/hooks/use-medical-conditions", () => ({
  useMedicalConditions: jest.fn(() => ({
    conditions: [
      {
        id: "cond-1",
        name: "Type 2 Diabetes",
        slug: "type2-diabetes",
        impact_percent: 12,
      },
      {
        id: "cond-2",
        name: "Hypothyroidism",
        slug: "hypothyroidism",
        impact_percent: 8,
      },
      {
        id: "cond-3",
        name: "PCOS",
        slug: "pcos",
        impact_percent: 10,
      },
    ],
    isLoading: false,
    error: null,
  })),
  DEFAULT_MEDICAL_CONDITIONS: [
    {
      name: "Type 2 Diabetes",
      slug: "type2-diabetes",
      impact_percent: 12,
      gender_restriction: null,
    },
    { name: "Hypothyroidism", slug: "hypothyroidism", impact_percent: 8, gender_restriction: null },
  ],
}));

describe("ConditionSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all conditions from database", () => {
    render(<ConditionSelector selectedConditionIds={[]} onChange={mockOnChange} />);

    expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
    expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
    expect(screen.getByText("PCOS")).toBeInTheDocument();
  });

  it("shows impact percentage for each condition", () => {
    render(<ConditionSelector selectedConditionIds={[]} onChange={mockOnChange} />);

    expect(screen.getByText("-12% metabolic impact")).toBeInTheDocument();
    expect(screen.getByText("-8% metabolic impact")).toBeInTheDocument();
    expect(screen.getByText("-10% metabolic impact")).toBeInTheDocument();
  });

  it("shows selected conditions with checkmark", () => {
    render(<ConditionSelector selectedConditionIds={["cond-1"]} onChange={mockOnChange} />);

    // The selected condition card should have bg-primary/10 class
    const diabetesButton = screen.getByRole("button", { name: /type 2 diabetes/i });
    expect(diabetesButton).toHaveClass("bg-primary/10");
  });

  it("calls onChange when condition is toggled on", async () => {
    render(<ConditionSelector selectedConditionIds={[]} onChange={mockOnChange} />);

    // Click the button role element (the card)
    const diabetesButton = screen.getByRole("button", { name: /type 2 diabetes/i });
    fireEvent.click(diabetesButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(["cond-1"]);
    });
  });

  it("calls onChange when condition is toggled off", async () => {
    render(
      <ConditionSelector selectedConditionIds={["cond-1", "cond-2"]} onChange={mockOnChange} />
    );

    const diabetesButton = screen.getByRole("button", { name: /type 2 diabetes/i });
    fireEvent.click(diabetesButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(["cond-2"]);
    });
  });

  it("shows count of selected conditions", () => {
    render(
      <ConditionSelector selectedConditionIds={["cond-1", "cond-2"]} onChange={mockOnChange} />
    );

    expect(screen.getByText("2 conditions selected")).toBeInTheDocument();
  });

  it("shows singular form when one condition is selected", () => {
    render(<ConditionSelector selectedConditionIds={["cond-1"]} onChange={mockOnChange} />);

    expect(screen.getByText("1 condition selected")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    const { useMedicalConditions } = require("@/hooks/use-medical-conditions");
    useMedicalConditions.mockReturnValueOnce({
      conditions: [],
      isLoading: true,
      error: null,
    });

    render(<ConditionSelector selectedConditionIds={[]} onChange={mockOnChange} />);

    expect(screen.getByText("Loading conditions...")).toBeInTheDocument();
  });

  it("shows warning when using fallback conditions", () => {
    const { useMedicalConditions } = require("@/hooks/use-medical-conditions");
    useMedicalConditions.mockReturnValueOnce({
      conditions: [],
      isLoading: false,
      error: new Error("Database error"),
    });

    render(<ConditionSelector selectedConditionIds={[]} onChange={mockOnChange} />);

    expect(screen.getByText("Using default conditions (database unavailable)")).toBeInTheDocument();
  });
});
