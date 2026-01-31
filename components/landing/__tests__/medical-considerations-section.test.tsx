import { render, screen } from "@testing-library/react";
import {
  MedicalConsiderationsSection,
  MedicalConditionDisplay,
} from "../medical-considerations-section";

describe("MedicalConsiderationsSection", () => {
  const mockConditions: MedicalConditionDisplay[] = [
    { name: "Hypothyroidism", slug: "hypothyroidism", impactPercent: 8 },
    { name: "Type 2 Diabetes", slug: "type-2-diabetes", impactPercent: 12 },
  ];

  it("renders nothing when conditions array is empty", () => {
    const { container } = render(
      <MedicalConsiderationsSection
        conditions={[]}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={0}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when totalImpactPercent is 0", () => {
    const { container } = render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1750}
        totalImpactPercent={0}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders section header", () => {
    render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={20}
      />
    );

    expect(screen.getByText("Medical Considerations")).toBeInTheDocument();
  });

  it("renders all conditions with their impact percentages", () => {
    render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={20}
      />
    );

    expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
    expect(screen.getByText("-8%")).toBeInTheDocument();
    expect(screen.getByText("Type 2 Diabetes")).toBeInTheDocument();
    expect(screen.getByText("-12%")).toBeInTheDocument();
  });

  it("renders BMR comparison values", () => {
    render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={20}
      />
    );

    expect(screen.getByText("Base BMR")).toBeInTheDocument();
    expect(screen.getByText("1,750")).toBeInTheDocument();
    expect(screen.getByText("Your BMR")).toBeInTheDocument();
    expect(screen.getByText("1,400")).toBeInTheDocument();
  });

  it("renders total impact summary with calorie reduction", () => {
    render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={20}
      />
    );

    // Daily reduction = 1750 - 1400 = 350
    expect(screen.getByText(/Your conditions reduce BMR by ~350 cal\/day/)).toBeInTheDocument();
  });

  it("renders healthcare disclaimer", () => {
    render(
      <MedicalConsiderationsSection
        conditions={mockConditions}
        baseBmr={1750}
        adjustedBmr={1400}
        totalImpactPercent={20}
      />
    );

    expect(screen.getByText(/Continue working with your healthcare provider/)).toBeInTheDocument();
  });

  it("handles single condition correctly", () => {
    const singleCondition: MedicalConditionDisplay[] = [
      { name: "PCOS", slug: "pcos", impactPercent: 10 },
    ];

    render(
      <MedicalConsiderationsSection
        conditions={singleCondition}
        baseBmr={1600}
        adjustedBmr={1440}
        totalImpactPercent={10}
      />
    );

    expect(screen.getByText("PCOS")).toBeInTheDocument();
    expect(screen.getByText("-10%")).toBeInTheDocument();
    expect(screen.getByText("1,600")).toBeInTheDocument();
    expect(screen.getByText("1,440")).toBeInTheDocument();
  });
});
