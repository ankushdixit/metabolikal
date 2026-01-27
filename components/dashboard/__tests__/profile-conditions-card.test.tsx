import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileConditionsCard } from "../profile-conditions-card";
import type { ClientConditionWithDetails } from "@/hooks/use-client-profile-data";

// Helper to create mock condition
function createMockCondition(
  overrides: Partial<ClientConditionWithDetails> = {}
): ClientConditionWithDetails {
  return {
    id: "cc-1",
    client_id: "client-1",
    condition_id: "cond-1",
    diagnosed_at: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    medical_conditions: {
      id: "cond-1",
      name: "Hypothyroidism",
      description: "A condition where the thyroid gland does not produce enough hormones.",
      impact_percent: 8,
    },
    ...overrides,
  };
}

describe("ProfileConditionsCard", () => {
  describe("Loading State", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<ProfileConditionsCard conditions={[]} isLoading={true} />);

      expect(screen.getByText(/Health Conditions/i)).toBeInTheDocument();
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no conditions", () => {
      render(<ProfileConditionsCard conditions={[]} isLoading={false} />);

      expect(screen.getByText(/No conditions on file/i)).toBeInTheDocument();
    });

    it("still shows footer note when empty", () => {
      render(<ProfileConditionsCard conditions={[]} isLoading={false} />);

      expect(screen.getByText(/Conditions are managed by your coach/i)).toBeInTheDocument();
    });
  });

  describe("Conditions Display", () => {
    const mockConditions: ClientConditionWithDetails[] = [
      createMockCondition({
        id: "cc-1",
        condition_id: "cond-1",
        medical_conditions: {
          id: "cond-1",
          name: "Hypothyroidism",
          description: "A thyroid condition affecting metabolism.",
          impact_percent: 8,
        },
      }),
      createMockCondition({
        id: "cc-2",
        condition_id: "cond-2",
        medical_conditions: {
          id: "cond-2",
          name: "PCOS",
          description: "Polycystic ovary syndrome affecting hormones.",
          impact_percent: 10,
        },
      }),
    ];

    it("displays all condition names", () => {
      render(<ProfileConditionsCard conditions={mockConditions} isLoading={false} />);

      expect(screen.getByText("Hypothyroidism")).toBeInTheDocument();
      expect(screen.getByText("PCOS")).toBeInTheDocument();
    });

    it("shows footer note about coach management", () => {
      render(<ProfileConditionsCard conditions={mockConditions} isLoading={false} />);

      expect(screen.getByText(/Conditions are managed by your coach/i)).toBeInTheDocument();
    });
  });

  describe("Expandable Descriptions", () => {
    const conditionWithDescription: ClientConditionWithDetails[] = [
      createMockCondition({
        id: "cc-1",
        medical_conditions: {
          id: "cond-1",
          name: "Hypothyroidism",
          description: "A condition where the thyroid gland is underactive.",
          impact_percent: 8,
        },
      }),
    ];

    it("description is hidden by default", () => {
      render(<ProfileConditionsCard conditions={conditionWithDescription} isLoading={false} />);

      expect(
        screen.queryByText(/A condition where the thyroid gland is underactive/i)
      ).not.toBeInTheDocument();
    });

    it("expands to show description when clicked", () => {
      render(<ProfileConditionsCard conditions={conditionWithDescription} isLoading={false} />);

      // Click on the condition item
      fireEvent.click(screen.getByText("Hypothyroidism"));

      expect(
        screen.getByText(/A condition where the thyroid gland is underactive/i)
      ).toBeInTheDocument();
    });

    it("collapses description when clicked again", () => {
      render(<ProfileConditionsCard conditions={conditionWithDescription} isLoading={false} />);

      const conditionButton = screen.getByText("Hypothyroidism");

      // Expand
      fireEvent.click(conditionButton);
      expect(
        screen.getByText(/A condition where the thyroid gland is underactive/i)
      ).toBeInTheDocument();

      // Collapse
      fireEvent.click(conditionButton);
      expect(
        screen.queryByText(/A condition where the thyroid gland is underactive/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Conditions Without Description", () => {
    const conditionWithoutDescription: ClientConditionWithDetails[] = [
      createMockCondition({
        id: "cc-1",
        medical_conditions: {
          id: "cond-1",
          name: "Sleep Apnea",
          description: null,
          impact_percent: 7,
        },
      }),
    ];

    it("does not show expand indicator when no description", () => {
      render(<ProfileConditionsCard conditions={conditionWithoutDescription} isLoading={false} />);

      expect(screen.getByText("Sleep Apnea")).toBeInTheDocument();
      // Should not have chevron icons for expandable state
      const conditionItem = screen.getByText("Sleep Apnea").closest("button");
      expect(conditionItem).toBeDisabled();
    });
  });

  describe("Filtering Invalid Conditions", () => {
    it("filters out conditions with null medical_conditions", () => {
      const mixedConditions: ClientConditionWithDetails[] = [
        createMockCondition({
          id: "cc-1",
          medical_conditions: {
            id: "cond-1",
            name: "Valid Condition",
            description: null,
            impact_percent: 5,
          },
        }),
        createMockCondition({
          id: "cc-2",
          medical_conditions: null,
        }),
      ];

      render(<ProfileConditionsCard conditions={mixedConditions} isLoading={false} />);

      expect(screen.getByText("Valid Condition")).toBeInTheDocument();
      // Should not crash and should only show valid condition
    });
  });

  describe("Section Header", () => {
    it("displays Health Conditions title", () => {
      render(<ProfileConditionsCard conditions={[]} isLoading={false} />);
      expect(screen.getByText(/Health Conditions/i)).toBeInTheDocument();
    });
  });
});
