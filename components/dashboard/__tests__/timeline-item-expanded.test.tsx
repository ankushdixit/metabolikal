/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for TimelineItemExpanded component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineItemExpanded } from "../timeline-item-expanded";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

describe("TimelineItemExpanded", () => {
  const mockOnMarkComplete = jest.fn();
  const mockOnMarkUncomplete = jest.fn();
  const mockOnMarkSourceItemComplete = jest.fn();
  const mockOnMarkSourceItemUncomplete = jest.fn();
  const mockOnClose = jest.fn();
  const mockIsSourceItemCompleted = jest.fn().mockReturnValue(false);

  const defaultProps = {
    onMarkComplete: mockOnMarkComplete,
    onMarkUncomplete: mockOnMarkUncomplete,
    onMarkSourceItemComplete: mockOnMarkSourceItemComplete,
    onMarkSourceItemUncomplete: mockOnMarkSourceItemUncomplete,
    onClose: mockOnClose,
    isSourceItemCompleted: mockIsSourceItemCompleted,
    completionStatus: { completed: 0, total: 1 },
    isCompleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSourceItemCompleted.mockReturnValue(false);
  });

  const createMealItem = (): ExtendedTimelineItem => ({
    id: "meal-1",
    type: "meal",
    title: "Breakfast",
    subtitle: "2 items",
    scheduling: {
      time_type: "fixed",
      time_start: "08:00",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { calories: 400, protein: 30 },
    sourceType: "diet_plan",
    sourceId: "plan-1",
    dayNumber: 1,
    isGrouped: true,
    groupedItems: [
      {
        id: "plan-1",
        client_id: "client-1",
        day_number: 1,
        meal_category: "breakfast",
        food_item_id: "food-1",
        serving_multiplier: 1,
        notes: null,
        time_type: "fixed",
        time_start: "08:00",
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
        display_order: 1,
        quantity_grams: null,
        quantity_type: null,
        quantity_note: null,
        created_at: "",
        updated_at: "",
        food_items: {
          id: "food-1",
          name: "Oatmeal",
          calories: 200,
          protein: 8,
          carbs: 40,
          fats: 4,
          serving_size: "1 cup",
          is_vegetarian: true,
          meal_types: null,
          raw_quantity: null,
          cooked_quantity: null,
          created_at: "",
          updated_at: "",
        },
      },
    ],
    itemNames: ["Oatmeal"],
  });

  const createSupplementItem = (): ExtendedTimelineItem => ({
    id: "supp-1",
    type: "supplement",
    title: "Supplements",
    subtitle: "1 supplement",
    scheduling: {
      time_type: "relative",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: "breakfast",
      relative_offset_minutes: 30,
    },
    metadata: { dosage: 1000, dosageUnit: "mg" },
    sourceType: "supplement_plan",
    sourceId: "supp-plan-1",
    dayNumber: 1,
    isGrouped: true,
    groupedItems: [
      {
        id: "supp-plan-1",
        client_id: "client-1",
        supplement_id: "supp-1",
        day_number: 1,
        dosage: 1000,
        time_type: "relative",
        time_start: null,
        time_end: null,
        time_period: null,
        relative_anchor: "breakfast",
        relative_offset_minutes: 30,
        notes: "Take with food",
        is_active: true,
        display_order: 1,
        created_at: "",
        updated_at: "",
        supplements: {
          id: "supp-1",
          name: "Fish Oil",
          category: "fatty_acid",
          default_dosage: 1000,
          dosage_unit: "mg",
          instructions: "Take with meals for better absorption",
          notes: null,
          is_active: true,
          display_order: 1,
          created_at: "",
          updated_at: "",
        },
      },
    ],
    itemNames: ["Fish Oil"],
  });

  const createWorkoutItem = (): ExtendedTimelineItem => ({
    id: "workout-1",
    type: "workout",
    title: "Workout Session",
    subtitle: "2 exercises",
    scheduling: {
      time_type: "period",
      time_start: null,
      time_end: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    },
    metadata: { duration: 45 },
    sourceType: "workout_plan",
    sourceId: "workout-plan-1",
    dayNumber: 1,
    isGrouped: true,
    groupedItems: [
      {
        id: "workout-plan-1",
        client_id: "client-1",
        day_number: 1,
        exercise_name: "Push-ups",
        sets: 3,
        reps: 12,
        duration_minutes: null,
        rest_seconds: 60,
        instructions: "Keep your core tight",
        video_url: null,
        section: "main",
        display_order: 1,
        exercise_id: null,
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
        scheduled_duration_minutes: 20,
        created_at: "",
        updated_at: "",
        exercises: null,
      },
    ],
    itemNames: ["Push-ups"],
  });

  describe("meal item", () => {
    it("should render meal details", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
      expect(screen.getByText("Oatmeal")).toBeInTheDocument();
      // Macros are displayed in a grid with value and label separate
      expect(screen.getByText("200")).toBeInTheDocument(); // calories for first item
      // Multiple items may have same protein value
      expect(screen.getAllByText("8g").length).toBeGreaterThan(0);
    });

    it("should show total calories and protein", () => {
      const item = createMealItem();

      const { container } = render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Total")).toBeInTheDocument();
      // Total row contains calories value (calculated from mock: 200 cal)
      expect(container.textContent).toContain("cal");
    });
  });

  describe("supplement item", () => {
    it("should render supplement details", () => {
      const item = createSupplementItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Supplements")).toBeInTheDocument();
      expect(screen.getByText("Fish Oil")).toBeInTheDocument();
      expect(screen.getByText("1000 mg")).toBeInTheDocument();
      expect(screen.getByText("Take with meals for better absorption")).toBeInTheDocument();
    });

    it("should show notes", () => {
      const item = createSupplementItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Note: Take with food")).toBeInTheDocument();
    });
  });

  describe("workout item", () => {
    it("should render workout details", () => {
      const item = createWorkoutItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Workout Session")).toBeInTheDocument();
      expect(screen.getByText("Push-ups")).toBeInTheDocument();
      expect(screen.getByText("3 × 12")).toBeInTheDocument();
      expect(screen.getByText("Keep your core tight")).toBeInTheDocument();
    });

    it("should show total duration", () => {
      const item = createWorkoutItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Total Duration")).toBeInTheDocument();
      expect(screen.getByText("~45 min")).toBeInTheDocument();
    });
  });

  describe("completion actions", () => {
    it("should show Mark as Complete button when not completed (single item)", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Mark as Complete")).toBeInTheDocument();
    });

    it("should call onMarkComplete when button clicked", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      fireEvent.click(screen.getByText("Mark as Complete"));

      expect(mockOnMarkComplete).toHaveBeenCalledTimes(1);
    });

    it("should show Mark as Incomplete button when completed (single item)", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      expect(screen.getByText("Mark as Incomplete")).toBeInTheDocument();
    });

    it("should call onMarkUncomplete when button clicked", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      fireEvent.click(screen.getByText("Mark as Incomplete"));

      expect(mockOnMarkUncomplete).toHaveBeenCalledTimes(1);
    });

    it("should show Completed status when completed (single item)", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should show Complete All and Clear All buttons for multiple items", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          completionStatus={{ completed: 1, total: 2 }}
        />
      );

      expect(screen.getByText("Complete All")).toBeInTheDocument();
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("should show partial completion status for multiple items", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          completionStatus={{ completed: 1, total: 3 }}
        />
      );

      expect(screen.getByText("1/3 done")).toBeInTheDocument();
    });
  });

  describe("close functionality", () => {
    it("should call onClose when close button clicked", () => {
      const item = createMealItem();

      const { container } = render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Find the close button (the button in the header with the X icon)
      const headerButtons = container.querySelectorAll(".sticky button");
      const closeButton = headerButtons[0]; // First button in sticky header is close
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop clicked", () => {
      const item = createMealItem();

      const { container } = render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Click on the backdrop (first child)
      const backdrop = container.firstChild as Element;
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading state", () => {
    it("should disable buttons when marking", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} isMarking={true} />);

      const button = screen.getByRole("button", { name: /Mark as Complete/i });
      expect(button).toBeDisabled();
    });
  });

  describe("individual item completion", () => {
    it("should toggle individual item when checkbox clicked", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Find the food item row and click on the checkbox toggle button (first button in the row)
      const foodItemRow = screen.getByText("Oatmeal").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      // Should call onMarkSourceItemComplete with the plan id
      expect(mockOnMarkSourceItemComplete).toHaveBeenCalledWith("plan-1");
    });

    it("should uncomplete individual item when already completed", () => {
      const item = createMealItem();
      mockIsSourceItemCompleted.mockReturnValue(true);

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      // Find the food item row and click on the checkbox toggle button
      const foodItemRow = screen.getByText("Oatmeal").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      // Should call onMarkSourceItemUncomplete with the plan id
      expect(mockOnMarkSourceItemUncomplete).toHaveBeenCalledWith("plan-1");
    });
  });

  describe("lifestyle item", () => {
    const createLifestyleItem = (): ExtendedTimelineItem => ({
      id: "lifestyle-1",
      type: "lifestyle",
      title: "Daily Steps",
      subtitle: "1 activity",
      scheduling: {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "anytime" as any,
        relative_anchor: null,
        relative_offset_minutes: 0,
      },
      metadata: {},
      sourceType: "lifestyle_activity_plan",
      sourceId: "lifestyle-plan-1",
      dayNumber: 1,
      isGrouped: true,
      groupedItems: [
        {
          id: "lifestyle-plan-1",
          client_id: "client-1",
          day_number: 1,
          activity_type_id: "type-1",
          target_value: 10000,
          custom_rationale: "Important for cardiovascular health",
          notes: "Try to walk outside",
          time_type: "period",
          time_start: null,
          time_end: null,
          time_period: "anytime" as any,
          relative_anchor: null,
          relative_offset_minutes: 0,
          is_active: true,
          display_order: 1,
          created_at: "",
          updated_at: "",
          lifestyle_activity_types: {
            id: "type-1",
            name: "Walking",
            category: "movement",
            default_target_value: 8000,
            target_unit: "steps",
            description: "Daily walking target",
            rationale: "Walking improves metabolic health",
            icon: "footprints",
            is_active: true,
            display_order: 1,
            created_at: "",
            updated_at: "",
          },
        },
      ],
      itemNames: ["Walking"],
    });

    it("should render lifestyle item details", () => {
      const item = createLifestyleItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Daily Steps")).toBeInTheDocument();
      expect(screen.getByText("Walking")).toBeInTheDocument();
      expect(screen.getByText("movement")).toBeInTheDocument();
      expect(screen.getByText("10,000 steps")).toBeInTheDocument();
    });

    it("should show custom rationale", () => {
      const item = createLifestyleItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Important for cardiovascular health")).toBeInTheDocument();
    });

    it("should show notes", () => {
      const item = createLifestyleItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("Note: Try to walk outside")).toBeInTheDocument();
    });
  });

  describe("readOnly mode", () => {
    it("should show read-only message instead of action buttons", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} readOnly={true} />);

      expect(
        screen.getByText(/Completions can only be tracked for today and past days/)
      ).toBeInTheDocument();
      expect(screen.queryByText("Mark as Complete")).not.toBeInTheDocument();
    });

    it("should not toggle items when readOnly", () => {
      const item = createMealItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} readOnly={true} />);

      const foodItemRow = screen.getByText("Oatmeal").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(mockOnMarkSourceItemComplete).not.toHaveBeenCalled();
      expect(mockOnMarkSourceItemUncomplete).not.toHaveBeenCalled();
    });
  });

  describe("swap food button", () => {
    it("should show swap button for meal items when onSwapFood provided", () => {
      const item = createMealItem();
      const onSwapFood = jest.fn();

      render(<TimelineItemExpanded item={item} {...defaultProps} onSwapFood={onSwapFood} />);

      const swapButton = screen.getByTitle("Swap food item");
      expect(swapButton).toBeInTheDocument();
    });

    it("should call onSwapFood with diet plan id when clicked", () => {
      const item = createMealItem();
      const onSwapFood = jest.fn();

      render(<TimelineItemExpanded item={item} {...defaultProps} onSwapFood={onSwapFood} />);

      const swapButton = screen.getByTitle("Swap food item");
      fireEvent.click(swapButton);

      expect(onSwapFood).toHaveBeenCalledWith("plan-1");
    });

    it("should not show swap button when readOnly", () => {
      const item = createMealItem();
      const onSwapFood = jest.fn();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          readOnly={true}
          onSwapFood={onSwapFood}
        />
      );

      expect(screen.queryByTitle("Swap food item")).not.toBeInTheDocument();
    });
  });

  describe("multi-item completion actions", () => {
    it("should only show Clear All when all items completed", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 2, total: 2 }}
        />
      );

      expect(screen.queryByText("Complete All")).not.toBeInTheDocument();
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("should only show Complete All when no items completed (multi-item)", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          completionStatus={{ completed: 0, total: 2 }}
        />
      );

      expect(screen.getByText("Complete All")).toBeInTheDocument();
      expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    });

    it("should show spinner icons when isMarking is true for multi-item", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isMarking={true}
          completionStatus={{ completed: 1, total: 2 }}
        />
      );

      // Both Complete All and Clear All should be disabled
      const completeBtn = screen.getByText("Complete All").closest("button");
      const clearBtn = screen.getByText("Clear All").closest("button");
      expect(completeBtn).toBeDisabled();
      expect(clearBtn).toBeDisabled();
    });

    it("should show 0/3 done when no items completed in multi-item", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          completionStatus={{ completed: 0, total: 3 }}
        />
      );

      expect(screen.getByText("0/3 done")).toBeInTheDocument();
    });
  });

  describe("workout without duration metadata", () => {
    it("should not show total duration when metadata.duration is absent", () => {
      const item = createWorkoutItem();
      item.metadata = {}; // no duration

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.queryByText("Total Duration")).not.toBeInTheDocument();
    });
  });

  describe("workout rest and duration details", () => {
    it("should show rest seconds when > 0", () => {
      const item = createWorkoutItem();

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("60s rest")).toBeInTheDocument();
    });

    it("should show duration_minutes when specified", () => {
      const item = createWorkoutItem();
      (item.groupedItems as any[])[0].duration_minutes = 30;
      (item.groupedItems as any[])[0].sets = null;
      (item.groupedItems as any[])[0].reps = null;

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.getByText("30 min")).toBeInTheDocument();
    });

    it("should not show sets x reps when sets or reps are null", () => {
      const item = createWorkoutItem();
      (item.groupedItems as any[])[0].sets = null;
      (item.groupedItems as any[])[0].reps = null;
      (item.groupedItems as any[])[0].rest_seconds = 0;

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.queryByText(/×/)).not.toBeInTheDocument();
      expect(screen.queryByText(/rest/)).not.toBeInTheDocument();
    });
  });

  describe("isMarking spinner for single item", () => {
    it("should show spinner when marking completed single item as incomplete", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={true}
          isMarking={true}
          completionStatus={{ completed: 1, total: 1 }}
        />
      );

      const button = screen.getByRole("button", { name: /Mark as Incomplete/i });
      expect(button).toBeDisabled();
    });
  });

  describe("completed individual source items", () => {
    it("should show completed styling for supplement when isSourceItemCompleted returns true", () => {
      const item = createSupplementItem();
      const mockCompleted = jest.fn().mockReturnValue(true);

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isSourceItemCompleted={mockCompleted}
          completionStatus={{ completed: 1, total: 1 }}
          isCompleted={true}
        />
      );

      // Supplement name should have line-through when completed
      const nameEl = screen.getByText("Fish Oil");
      expect(nameEl).toHaveClass("line-through");
    });

    it("should show completed styling for workout when isSourceItemCompleted returns true", () => {
      const item = createWorkoutItem();
      const mockCompleted = jest.fn().mockReturnValue(true);

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isSourceItemCompleted={mockCompleted}
          completionStatus={{ completed: 1, total: 1 }}
          isCompleted={true}
        />
      );

      const nameEl = screen.getByText("Push-ups");
      expect(nameEl).toHaveClass("line-through");
    });

    it("should show completed styling for lifestyle when isSourceItemCompleted returns true", () => {
      const createLifestyleItem = (): ExtendedTimelineItem => ({
        id: "lifestyle-1",
        type: "lifestyle",
        title: "Daily Steps",
        subtitle: "1 activity",
        scheduling: {
          time_type: "period",
          time_start: null,
          time_end: null,
          time_period: "anytime" as any,
          relative_anchor: null,
          relative_offset_minutes: 0,
        },
        metadata: {},
        sourceType: "lifestyle_activity_plan",
        sourceId: "lifestyle-plan-1",
        dayNumber: 1,
        isGrouped: true,
        groupedItems: [
          {
            id: "lifestyle-plan-1",
            client_id: "client-1",
            day_number: 1,
            activity_type_id: "type-1",
            target_value: 10000,
            custom_rationale: null,
            notes: null,
            time_type: "period",
            time_start: null,
            time_end: null,
            time_period: "anytime" as any,
            relative_anchor: null,
            relative_offset_minutes: 0,
            is_active: true,
            display_order: 1,
            created_at: "",
            updated_at: "",
            lifestyle_activity_types: {
              id: "type-1",
              name: "Walking",
              category: "movement",
              default_target_value: 8000,
              target_unit: "steps",
              description: null,
              rationale: "Good for health",
              icon: null,
              is_active: true,
              display_order: 1,
              created_at: "",
              updated_at: "",
            },
          },
        ],
        itemNames: ["Walking"],
      });

      const item = createLifestyleItem();
      const mockCompleted = jest.fn().mockReturnValue(true);

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isSourceItemCompleted={mockCompleted}
          completionStatus={{ completed: 1, total: 1 }}
          isCompleted={true}
        />
      );

      const nameEl = screen.getByText("Walking");
      expect(nameEl).toHaveClass("line-through");
    });
  });

  describe("meal item edge cases", () => {
    it("should handle meal item with no groupedItems", () => {
      const item: ExtendedTimelineItem = {
        ...createMealItem(),
        groupedItems: undefined,
      };

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Should still render without crashing, showing the totals row
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("0 cal")).toBeInTheDocument();
    });

    it("should handle food item with multiplier != 1", () => {
      const item = createMealItem();
      (item.groupedItems as any[])[0].serving_multiplier = 2;

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Calories should be doubled: 200 * 2 = 400
      expect(screen.getByText("400")).toBeInTheDocument();
    });

    it("should show cooked and raw quantity fallback when no quantityDisplay", () => {
      const item = createMealItem();
      // Set cooked_quantity and raw_quantity on food but no quantity_grams on plan
      (item.groupedItems as any[])[0].food_items.cooked_quantity = "150g";
      (item.groupedItems as any[])[0].food_items.raw_quantity = "200g";

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Should show computed quantities with units in clean format
      expect(screen.getByText(/150g \(cooked\) \/ 200g \(raw\)/)).toBeInTheDocument();
    });

    it("should show computed quantity when multiplier is not 1 and no quantityDisplay", () => {
      const item = createMealItem();
      (item.groupedItems as any[])[0].serving_multiplier = 1.5;
      (item.groupedItems as any[])[0].quantity_grams = null;
      (item.groupedItems as any[])[0].quantity_type = null;
      (item.groupedItems as any[])[0].quantity_note = null;
      // Add reference quantities so the multiplier can compute actual amounts
      (item.groupedItems as any[])[0].food_items.cooked_quantity = "100";
      (item.groupedItems as any[])[0].food_items.raw_quantity = "80";

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // Should show computed actual quantities, not "× 1.5"
      expect(screen.getByText(/150g \(cooked\) \/ 120g \(raw\)/)).toBeInTheDocument();
    });
  });

  describe("supplement item edge cases", () => {
    it("should handle supplement with no instructions", () => {
      const item = createSupplementItem();
      (item.groupedItems as any[])[0].supplements.instructions = null;

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      // instructions paragraph should not be rendered
      expect(screen.queryByText("Take with meals for better absorption")).not.toBeInTheDocument();
    });

    it("should handle supplement with no notes", () => {
      const item = createSupplementItem();
      (item.groupedItems as any[])[0].notes = null;

      render(<TimelineItemExpanded item={item} {...defaultProps} />);

      expect(screen.queryByText(/^Note:/)).not.toBeInTheDocument();
    });
  });

  describe("single item not completed status", () => {
    it("should not show Completed text for single incomplete item with hasMultipleItems false", () => {
      const item = createMealItem();

      render(
        <TimelineItemExpanded
          item={item}
          {...defaultProps}
          isCompleted={false}
          completionStatus={{ completed: 0, total: 1 }}
        />
      );

      expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    });
  });
});
