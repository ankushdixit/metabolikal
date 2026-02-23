/**
 * Tests for TimelineItemSheet component
 *
 * Tests rendering, completion toggling, read-only mode, and all item type
 * content views (meal, supplement, workout, lifestyle).
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineItemSheet } from "../timeline-item-sheet";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

// Mock vaul's Drawer component
jest.mock("vaul", () => ({
  Drawer: {
    Root: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open: boolean;
      onOpenChange?: (open: boolean) => void;
    }) =>
      open ? (
        <div data-testid="drawer-root" data-on-open-change={!!onOpenChange}>
          {children}
        </div>
      ) : null,
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="drawer-portal">{children}</div>
    ),
    Overlay: ({ className }: { className: string }) => (
      <div data-testid="drawer-overlay" className={className} />
    ),
    Content: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className: string;
      "aria-describedby"?: undefined;
    }) => (
      <div data-testid="drawer-content" className={className}>
        {children}
      </div>
    ),
    Title: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <h2 data-testid="drawer-title" className={className}>
        {children}
      </h2>
    ),
  },
}));

// Mock quantity utility
jest.mock("@/lib/utils/quantity", () => {
  const actual = jest.requireActual("@/lib/utils/quantity");
  return {
    formatQuantityDisplayWithEquivalent: jest.fn(() => null),
    formatLegacyQuantityDisplay: actual.formatLegacyQuantityDisplay,
  };
});

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

function createMockMealItem(overrides?: Partial<ExtendedTimelineItem>): ExtendedTimelineItem {
  return {
    id: "meal-1",
    type: "meal",
    title: "Breakfast",
    subtitle: "Morning meal",
    sourceId: "source-1",
    sourceType: "diet_plan",
    dayNumber: 1,
    scheduling: {
      time_type: "fixed",
      time_start: "08:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {
      calories: 450,
      protein: 25,
    },
    groupedSourceIds: ["source-1", "source-2"],
    groupedItems: [
      {
        id: "source-1",
        client_id: "client-1",
        food_item_id: "food-1",
        day_number: 1,
        meal_category: "breakfast",
        serving_multiplier: 1,
        quantity_grams: null,
        quantity_type: null,
        quantity_note: null,
        time_type: "fixed",
        time_start: "08:00",
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
        display_order: 1,
        notes: null,
        food_items: {
          id: "food-1",
          name: "Eggs",
          calories: 200,
          protein: 12,
          carbs: 2,
          fats: 14,
          serving_size: "2 eggs",
          category: "protein",
          is_active: true,
          is_vegetarian: true,
          raw_quantity: null,
          cooked_quantity: null,
        },
      },
      {
        id: "source-2",
        client_id: "client-1",
        food_item_id: "food-2",
        day_number: 1,
        meal_category: "breakfast",
        serving_multiplier: 1,
        quantity_grams: null,
        quantity_type: null,
        quantity_note: null,
        time_type: "fixed",
        time_start: "08:00",
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
        display_order: 2,
        notes: null,
        food_items: {
          id: "food-2",
          name: "Toast",
          calories: 250,
          protein: 13,
          carbs: 30,
          fats: 5,
          serving_size: "2 slices",
          category: "carbs",
          is_active: true,
          is_vegetarian: true,
          raw_quantity: null,
          cooked_quantity: null,
        },
      },
    ],
    ...overrides,
  } as unknown as ExtendedTimelineItem;
}

function createMockSupplementItem(overrides?: Partial<ExtendedTimelineItem>): ExtendedTimelineItem {
  return {
    id: "supp-1",
    type: "supplement",
    title: "Morning Supplements",
    subtitle: "2 supplements",
    sourceId: "supp-source-1",
    sourceType: "supplement_plan",
    dayNumber: 1,
    scheduling: {
      time_type: "fixed",
      time_start: "07:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {},
    groupedSourceIds: ["supp-source-1", "supp-source-2"],
    groupedItems: [
      {
        id: "supp-source-1",
        client_id: "client-1",
        supplement_id: "supplement-1",
        dosage: 1000,
        notes: "Take with food",
        supplements: {
          id: "supplement-1",
          name: "Vitamin D",
          dosage_unit: "IU",
          instructions: "Take with fatty food for better absorption",
        },
      },
      {
        id: "supp-source-2",
        client_id: "client-1",
        supplement_id: "supplement-2",
        dosage: 500,
        notes: null,
        supplements: {
          id: "supplement-2",
          name: "Magnesium",
          dosage_unit: "mg",
          instructions: null,
        },
      },
    ],
    ...overrides,
  } as unknown as ExtendedTimelineItem;
}

function createMockWorkoutItem(overrides?: Partial<ExtendedTimelineItem>): ExtendedTimelineItem {
  return {
    id: "workout-1",
    type: "workout",
    title: "Upper Body",
    subtitle: "3 exercises",
    sourceId: "workout-source-1",
    sourceType: "workout_plan",
    dayNumber: 1,
    scheduling: {
      time_type: "fixed",
      time_start: "17:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {
      duration: 45,
    },
    groupedSourceIds: ["workout-source-1", "workout-source-2"],
    groupedItems: [
      {
        id: "workout-source-1",
        client_id: "client-1",
        exercise_id: "exercise-1",
        exercise_name: null,
        section: "warmup",
        sets: 3,
        reps: "12",
        duration_minutes: null,
        rest_seconds: 60,
        instructions: "Slow and controlled",
        exercises: {
          id: "exercise-1",
          name: "Push Ups",
        },
      },
      {
        id: "workout-source-2",
        client_id: "client-1",
        exercise_id: "exercise-2",
        exercise_name: "Bench Press",
        section: "main",
        sets: 4,
        reps: "8",
        duration_minutes: null,
        rest_seconds: 90,
        instructions: null,
        exercises: null,
      },
    ],
    ...overrides,
  } as unknown as ExtendedTimelineItem;
}

function createMockLifestyleItem(overrides?: Partial<ExtendedTimelineItem>): ExtendedTimelineItem {
  return {
    id: "lifestyle-1",
    type: "lifestyle",
    title: "Daily Habits",
    subtitle: "2 activities",
    sourceId: "lifestyle-source-1",
    sourceType: "lifestyle_activity_plan",
    dayNumber: 1,
    scheduling: {
      time_type: "period",
      time_start: null,
      time_end: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: {},
    groupedSourceIds: ["lifestyle-source-1", "lifestyle-source-2"],
    groupedItems: [
      {
        id: "lifestyle-source-1",
        client_id: "client-1",
        target_value: 10000,
        custom_rationale: null,
        notes: "Use a pedometer",
        lifestyle_activity_types: {
          id: "type-1",
          name: "Steps",
          category: "movement",
          target_unit: "steps",
          default_target_value: 8000,
          rationale: "Walking improves cardiovascular health",
        },
      },
      {
        id: "lifestyle-source-2",
        client_id: "client-1",
        target_value: null,
        custom_rationale: "Helps digestion",
        notes: null,
        lifestyle_activity_types: {
          id: "type-2",
          name: "Hydration",
          category: "nutrition",
          target_unit: "glasses",
          default_target_value: 8,
          rationale: null,
        },
      },
    ],
    ...overrides,
  } as unknown as ExtendedTimelineItem;
}

// =============================================================================
// DEFAULT PROPS
// =============================================================================

const defaultProps = {
  item: createMockMealItem(),
  isOpen: true,
  onClose: jest.fn(),
  isCompleted: false,
  completionStatus: { completed: 0, total: 2 },
  isSourceItemCompleted: jest.fn().mockReturnValue(false),
  onMarkComplete: jest.fn(),
  onMarkUncomplete: jest.fn(),
  onMarkSourceItemComplete: jest.fn(),
  onMarkSourceItemUncomplete: jest.fn(),
  isMarking: false,
  readOnly: false,
};

// =============================================================================
// TESTS
// =============================================================================

describe("TimelineItemSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("rendering", () => {
    it("should render nothing when item is null", () => {
      const { container } = render(<TimelineItemSheet {...defaultProps} item={null} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when not open", () => {
      const { container } = render(<TimelineItemSheet {...defaultProps} isOpen={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render drawer when open with item", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByTestId("drawer-root")).toBeInTheDocument();
    });

    it("should display item title in drawer title", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByTestId("drawer-title")).toHaveTextContent("Breakfast");
    });

    it("should display item subtitle", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("Morning meal")).toBeInTheDocument();
    });

    it("should display time text from scheduling", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      // "08:00" in fixed time => "8:00 AM"
      expect(screen.getByText("8:00 AM")).toBeInTheDocument();
    });

    it("should render overlay and content elements", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByTestId("drawer-overlay")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-content")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // MEAL CONTENT
  // ===========================================================================

  describe("meal content", () => {
    it("should display grouped food items for meal", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("Eggs")).toBeInTheDocument();
      expect(screen.getByText("Toast")).toBeInTheDocument();
    });

    it("should display total calories", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("450 cal")).toBeInTheDocument();
    });

    it("should display macro totals (protein, carbs, fats)", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      // Total protein: 12 + 13 = 25g
      expect(screen.getByText("25g")).toBeInTheDocument();
      // Total carbs: 2 + 30 = 32g
      expect(screen.getByText("32g")).toBeInTheDocument();
      // Total fats: 14 + 5 = 19g
      expect(screen.getByText("19g")).toBeInTheDocument();
    });

    it("should display individual food item calories and macros", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      // Individual macros are also rendered
      expect(screen.getByText("200")).toBeInTheDocument(); // Eggs calories
      expect(screen.getByText("250")).toBeInTheDocument(); // Toast calories
    });

    it("should apply serving_multiplier to calories", () => {
      const item = createMockMealItem();
      // Modify first grouped item to have multiplier 2
      (item.groupedItems as Array<{ serving_multiplier: number }>)[0].serving_multiplier = 2;

      render(<TimelineItemSheet {...defaultProps} item={item} />);

      // Eggs: 200 * 2 = 400
      expect(screen.getByText("400")).toBeInTheDocument();
    });

    it("should display serving size for food items", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("2 eggs")).toBeInTheDocument();
      expect(screen.getByText("2 slices")).toBeInTheDocument();
    });

    it("should show swap button when onSwapFood is provided and not readOnly", () => {
      const onSwapFood = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onSwapFood={onSwapFood} />);

      const swapButtons = screen.getAllByTitle("Swap food item");
      expect(swapButtons.length).toBe(2); // One for each food item
    });

    it("should not show swap button when readOnly", () => {
      const onSwapFood = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onSwapFood={onSwapFood} readOnly={true} />);

      expect(screen.queryByTitle("Swap food item")).not.toBeInTheDocument();
    });

    it("should not show swap button when onSwapFood is not provided", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.queryByTitle("Swap food item")).not.toBeInTheDocument();
    });

    it("should call onSwapFood with diet plan id when swap button clicked", () => {
      const onSwapFood = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onSwapFood={onSwapFood} />);

      const swapButtons = screen.getAllByTitle("Swap food item");
      fireEvent.click(swapButtons[0]);

      expect(onSwapFood).toHaveBeenCalledWith("source-1");
    });

    it("should show completion styling for completed food items", () => {
      const isSourceItemCompleted = jest.fn((id: string) => id === "source-1");
      render(<TimelineItemSheet {...defaultProps} isSourceItemCompleted={isSourceItemCompleted} />);

      // Completed item should have line-through
      const eggsText = screen.getByText("Eggs");
      expect(eggsText).toHaveClass("line-through");
    });

    it("should show computed quantities with units when no quantityDisplay", () => {
      const item = createMockMealItem();
      // Add raw/cooked quantities to food items
      const groupedItems = item.groupedItems as Array<{
        food_items: { raw_quantity: string | null; cooked_quantity: string | null };
      }>;
      groupedItems[0].food_items.cooked_quantity = "150";
      groupedItems[0].food_items.raw_quantity = "200";

      render(<TimelineItemSheet {...defaultProps} item={item} />);

      // Should show clean format with units, not "Cooked: X | Raw: Y"
      expect(screen.getByText(/150g \(cooked\) \/ 200g \(raw\)/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // SUPPLEMENT CONTENT
  // ===========================================================================

  describe("supplement content", () => {
    it("should display supplement names", () => {
      const item = createMockSupplementItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Vitamin D")).toBeInTheDocument();
      expect(screen.getByText("Magnesium")).toBeInTheDocument();
    });

    it("should display dosage and unit", () => {
      const item = createMockSupplementItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("1000 IU")).toBeInTheDocument();
      expect(screen.getByText("500 mg")).toBeInTheDocument();
    });

    it("should display supplement instructions", () => {
      const item = createMockSupplementItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Take with fatty food for better absorption")).toBeInTheDocument();
    });

    it("should display supplement notes", () => {
      const item = createMockSupplementItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText(/Note: Take with food/)).toBeInTheDocument();
    });

    it("should toggle supplement completion on click", () => {
      const item = createMockSupplementItem();
      const onMarkSourceItemComplete = jest.fn();
      const isSourceItemCompleted = jest.fn().mockReturnValue(false);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      // Supplement items are rendered as buttons, click the first supplement row
      const supplementButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Vitamin D"));
      if (supplementButtons.length > 0) {
        fireEvent.click(supplementButtons[0]);
        expect(onMarkSourceItemComplete).toHaveBeenCalledWith("supp-source-1");
      }
    });

    it("should call onMarkSourceItemUncomplete for already completed supplement", () => {
      const item = createMockSupplementItem();
      const onMarkSourceItemUncomplete = jest.fn();
      const isSourceItemCompleted = jest.fn().mockReturnValue(true);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 2, total: 2 }}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemUncomplete={onMarkSourceItemUncomplete}
        />
      );

      const supplementButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Vitamin D"));
      if (supplementButtons.length > 0) {
        fireEvent.click(supplementButtons[0]);
        expect(onMarkSourceItemUncomplete).toHaveBeenCalledWith("supp-source-1");
      }
    });
  });

  // ===========================================================================
  // WORKOUT CONTENT
  // ===========================================================================

  describe("workout content", () => {
    it("should display exercise names", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Push Ups")).toBeInTheDocument();
      // Uses exercise_name field when exercises is null
      expect(screen.getByText("Bench Press")).toBeInTheDocument();
    });

    it("should display sets and reps", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      // Push Ups: 3 x 12, rendered as "3 \u00d7 12" or similar
      // Bench Press: 4 x 8
      expect(screen.getAllByText(/\d+ × \d+/).length).toBeGreaterThanOrEqual(2);
    });

    it("should display exercise section", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("warmup")).toBeInTheDocument();
      expect(screen.getByText("main")).toBeInTheDocument();
    });

    it("should display rest seconds", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("60s rest")).toBeInTheDocument();
      expect(screen.getByText("90s rest")).toBeInTheDocument();
    });

    it("should display exercise instructions", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Slow and controlled")).toBeInTheDocument();
    });

    it("should display total duration", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText(/~45 min/)).toBeInTheDocument();
    });

    it("should display duration_minutes for individual exercises when set", () => {
      const item = createMockWorkoutItem();
      const groupedItems = item.groupedItems as Array<{
        duration_minutes: number | null;
        sets: number | null;
        reps: string | null;
      }>;
      // Replace sets/reps with duration for cardio-style exercise
      groupedItems[0].sets = null;
      groupedItems[0].reps = null;
      groupedItems[0].duration_minutes = 20;

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("20 min")).toBeInTheDocument();
    });

    it("should toggle workout exercise completion on click", () => {
      const item = createMockWorkoutItem();
      const onMarkSourceItemComplete = jest.fn();
      const isSourceItemCompleted = jest.fn().mockReturnValue(false);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      const exerciseButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Push Ups"));
      if (exerciseButtons.length > 0) {
        fireEvent.click(exerciseButtons[0]);
        expect(onMarkSourceItemComplete).toHaveBeenCalledWith("workout-source-1");
      }
    });
  });

  // ===========================================================================
  // LIFESTYLE CONTENT
  // ===========================================================================

  describe("lifestyle content", () => {
    it("should display activity type names", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Steps")).toBeInTheDocument();
      expect(screen.getByText("Hydration")).toBeInTheDocument();
    });

    it("should display activity categories", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("movement")).toBeInTheDocument();
      expect(screen.getByText("nutrition")).toBeInTheDocument();
    });

    it("should display target value and unit", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText(/10,000/)).toBeInTheDocument();
      expect(screen.getByText(/steps/)).toBeInTheDocument();
    });

    it("should use default_target_value when target_value is null", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      // Hydration has target_value=null, default_target_value=8
      expect(screen.getByText(/8/)).toBeInTheDocument();
      expect(screen.getByText(/glasses/)).toBeInTheDocument();
    });

    it("should display rationale from activity type", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Walking improves cardiovascular health")).toBeInTheDocument();
    });

    it("should display custom_rationale when available", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Helps digestion")).toBeInTheDocument();
    });

    it("should display notes for lifestyle items", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText(/Note: Use a pedometer/)).toBeInTheDocument();
    });

    it("should toggle lifestyle activity completion on click", () => {
      const item = createMockLifestyleItem();
      const onMarkSourceItemComplete = jest.fn();
      const isSourceItemCompleted = jest.fn().mockReturnValue(false);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      const activityButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("Steps"));
      if (activityButtons.length > 0) {
        fireEvent.click(activityButtons[0]);
        expect(onMarkSourceItemComplete).toHaveBeenCalledWith("lifestyle-source-1");
      }
    });
  });

  // ===========================================================================
  // COMPLETION STATUS
  // ===========================================================================

  describe("completion status", () => {
    it("should show completion count for grouped items", () => {
      render(<TimelineItemSheet {...defaultProps} completionStatus={{ completed: 1, total: 2 }} />);

      expect(screen.getByText(/1\/2 done/)).toBeInTheDocument();
    });

    it("should show all items done count when fully completed", () => {
      render(
        <TimelineItemSheet
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 2, total: 2 }}
        />
      );

      expect(screen.getByText(/2\/2 done/)).toBeInTheDocument();
    });

    it("should show 'Completed' text for single completed item", () => {
      const singleItem = createMockMealItem();
      singleItem.groupedSourceIds = ["source-1"];
      (singleItem.groupedItems as unknown[]).splice(1); // Remove second item

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={singleItem}
          isCompleted={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should not show completion status for single incomplete item", () => {
      const singleItem = createMockMealItem();
      singleItem.groupedSourceIds = ["source-1"];
      (singleItem.groupedItems as unknown[]).splice(1);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={singleItem}
          isCompleted={false}
          completionStatus={{ completed: 0, total: 1 }}
        />
      );

      expect(screen.queryByText("Completed")).not.toBeInTheDocument();
      expect(screen.queryByText(/done/)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  describe("actions", () => {
    it("should have a close button", () => {
      const onClose = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onClose={onClose} />);

      const buttons = screen.getAllByRole("button");
      const closeButton = buttons.find((btn) => btn.querySelector("svg.lucide-x"));
      expect(closeButton).toBeTruthy();

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it("should call onMarkComplete when Complete All button clicked", () => {
      const onMarkComplete = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onMarkComplete={onMarkComplete} />);

      const completeButton = screen.getByRole("button", { name: /complete all/i });
      fireEvent.click(completeButton);

      expect(onMarkComplete).toHaveBeenCalled();
    });

    it("should call onMarkUncomplete when Clear All button clicked", () => {
      const onMarkUncomplete = jest.fn();
      render(
        <TimelineItemSheet
          {...defaultProps}
          completionStatus={{ completed: 2, total: 2 }}
          onMarkUncomplete={onMarkUncomplete}
        />
      );

      const clearButton = screen.getByRole("button", { name: /clear all/i });
      fireEvent.click(clearButton);

      expect(onMarkUncomplete).toHaveBeenCalled();
    });

    it("should show both Complete All and Clear All when partially completed", () => {
      render(<TimelineItemSheet {...defaultProps} completionStatus={{ completed: 1, total: 2 }} />);

      expect(screen.getByRole("button", { name: /complete all/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
    });

    it("should only show Clear All when fully completed", () => {
      render(
        <TimelineItemSheet
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 2, total: 2 }}
        />
      );

      expect(screen.queryByRole("button", { name: /complete all/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
    });

    it("should show 'Mark as Complete' for single incomplete item", () => {
      const singleItem = createMockMealItem();
      singleItem.groupedSourceIds = ["source-1"];
      (singleItem.groupedItems as unknown[]).splice(1);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={singleItem}
          isCompleted={false}
          completionStatus={{ completed: 0, total: 1 }}
        />
      );

      expect(screen.getByRole("button", { name: /mark as complete/i })).toBeInTheDocument();
    });

    it("should show 'Mark as Incomplete' for single completed item", () => {
      const singleItem = createMockMealItem();
      singleItem.groupedSourceIds = ["source-1"];
      (singleItem.groupedItems as unknown[]).splice(1);

      render(
        <TimelineItemSheet
          {...defaultProps}
          item={singleItem}
          isCompleted={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      expect(screen.getByRole("button", { name: /mark as incomplete/i })).toBeInTheDocument();
    });

    it("should disable buttons when isMarking is true", () => {
      render(<TimelineItemSheet {...defaultProps} isMarking={true} />);

      const completeButton = screen.getByRole("button", { name: /complete all/i });
      expect(completeButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // READ-ONLY MODE
  // ===========================================================================

  describe("read-only mode", () => {
    it("should show read-only message when readOnly is true", () => {
      render(<TimelineItemSheet {...defaultProps} readOnly={true} />);

      expect(screen.getByText(/completions can only be tracked/i)).toBeInTheDocument();
    });

    it("should not show action buttons when readOnly is true", () => {
      render(<TimelineItemSheet {...defaultProps} readOnly={true} />);

      expect(screen.queryByRole("button", { name: /complete all/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /mark as complete/i })).not.toBeInTheDocument();
    });

    it("should disable individual item checkboxes in read-only mode", () => {
      render(<TimelineItemSheet {...defaultProps} readOnly={true} />);

      // The food item toggle buttons should be disabled
      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      expect(checkboxButton).toBeDisabled();
    });

    it("should not toggle items in read-only mode even when clicked", () => {
      const onMarkSourceItemComplete = jest.fn();

      render(
        <TimelineItemSheet
          {...defaultProps}
          readOnly={true}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(onMarkSourceItemComplete).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // INDIVIDUAL ITEM COMPLETION
  // ===========================================================================

  describe("individual item completion", () => {
    it("should call onMarkSourceItemComplete when toggling uncompleted item", () => {
      const isSourceItemCompleted = jest.fn().mockReturnValue(false);
      const onMarkSourceItemComplete = jest.fn();

      render(
        <TimelineItemSheet
          {...defaultProps}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(onMarkSourceItemComplete).toHaveBeenCalledWith("source-1");
    });

    it("should call onMarkSourceItemUncomplete when toggling completed item", () => {
      const isSourceItemCompleted = jest.fn((id: string) => id === "source-1");
      const onMarkSourceItemUncomplete = jest.fn();

      render(
        <TimelineItemSheet
          {...defaultProps}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemUncomplete={onMarkSourceItemUncomplete}
        />
      );

      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(onMarkSourceItemUncomplete).toHaveBeenCalledWith("source-1");
    });
  });

  // ===========================================================================
  // TYPE-SPECIFIC STYLING
  // ===========================================================================

  describe("type-specific styling", () => {
    it("should apply meal styling (orange) for meal items", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      const content = screen.getByTestId("drawer-content");
      const header = content.querySelector(".bg-orange-500\\/20");
      expect(header).toBeTruthy();
    });

    it("should apply supplement styling (green) for supplement items", () => {
      const item = createMockSupplementItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      const content = screen.getByTestId("drawer-content");
      const header = content.querySelector(".bg-green-500\\/20");
      expect(header).toBeTruthy();
    });

    it("should apply workout styling (blue) for workout items", () => {
      const item = createMockWorkoutItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      const content = screen.getByTestId("drawer-content");
      const header = content.querySelector(".bg-blue-500\\/20");
      expect(header).toBeTruthy();
    });

    it("should apply lifestyle styling (purple) for lifestyle items", () => {
      const item = createMockLifestyleItem();
      render(
        <TimelineItemSheet
          {...defaultProps}
          item={item}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      const content = screen.getByTestId("drawer-content");
      const header = content.querySelector(".bg-purple-500\\/20");
      expect(header).toBeTruthy();
    });
  });
});
