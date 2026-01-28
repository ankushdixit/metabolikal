import { calculateMetabolicImpactFromConditions } from "../use-medical-conditions";
import type { MedicalConditionRow } from "@/lib/database.types";

// Mock conditions matching the database structure
// These represent what would be fetched from the database
const mockConditions: MedicalConditionRow[] = [
  {
    id: "1",
    name: "Hypothyroidism",
    slug: "hypothyroidism",
    impact_percent: 8,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 1,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "2",
    name: "PCOS",
    slug: "pcos",
    impact_percent: 10,
    gender_restriction: "female",
    description: null,
    is_active: true,
    display_order: 2,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "3",
    name: "Type 2 Diabetes",
    slug: "type2-diabetes",
    impact_percent: 12,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 3,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "4",
    name: "Metabolic Syndrome",
    slug: "metabolic-syndrome",
    impact_percent: 15,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 4,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
  {
    id: "5",
    name: "None of the above",
    slug: "none",
    impact_percent: 0,
    gender_restriction: null,
    description: null,
    is_active: true,
    display_order: 100,
    created_at: "2026-01-26T00:00:00Z",
    updated_at: "2026-01-26T00:00:00Z",
  },
];

describe("calculateMetabolicImpactFromConditions", () => {
  it("returns 0 for empty conditions array", () => {
    expect(calculateMetabolicImpactFromConditions([], mockConditions)).toBe(0);
  });

  it("returns 0 when 'none' is selected", () => {
    expect(calculateMetabolicImpactFromConditions(["none"], mockConditions)).toBe(0);
  });

  it("returns 0 when 'none' is selected with other conditions", () => {
    // If "none" is in the array, it should override and return 0
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism", "none"], mockConditions)).toBe(
      0
    );
  });

  it("calculates correct impact for single condition using slug", () => {
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism"], mockConditions)).toBe(8);
    expect(calculateMetabolicImpactFromConditions(["type2-diabetes"], mockConditions)).toBe(12);
    expect(calculateMetabolicImpactFromConditions(["pcos"], mockConditions)).toBe(10);
  });

  it("sums multiple conditions correctly", () => {
    // hypothyroidism (8) + pcos (10) = 18
    expect(calculateMetabolicImpactFromConditions(["hypothyroidism", "pcos"], mockConditions)).toBe(
      18
    );
  });

  it("caps total impact at 30%", () => {
    // hypothyroidism (8) + type2-diabetes (12) + metabolic-syndrome (15) = 35 → capped at 30
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "type2-diabetes", "metabolic-syndrome"],
        mockConditions
      )
    ).toBe(30);
  });

  it("ignores unknown condition slugs", () => {
    expect(calculateMetabolicImpactFromConditions(["unknown-condition"], mockConditions)).toBe(0);
  });

  it("handles mixed known and unknown conditions", () => {
    expect(
      calculateMetabolicImpactFromConditions(
        ["hypothyroidism", "unknown-condition"],
        mockConditions
      )
    ).toBe(8);
  });
});
