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
});
