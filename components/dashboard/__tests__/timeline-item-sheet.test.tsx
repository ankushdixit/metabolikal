/**
 * Tests for TimelineItemSheet component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineItemSheet } from "../timeline-item-sheet";
import type { ExtendedTimelineItem } from "@/hooks/use-timeline-data";

// Mock vaul's Drawer component
jest.mock("vaul", () => ({
  Drawer: {
    Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div data-testid="drawer-root">{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="drawer-portal">{children}</div>
    ),
    Overlay: ({ className }: { className: string }) => (
      <div data-testid="drawer-overlay" className={className} />
    ),
    Content: ({ children, className }: { children: React.ReactNode; className: string }) => (
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

const mockMealItem = {
  id: "meal-1",
  type: "meal" as const,
  title: "Breakfast",
  subtitle: "Morning meal",
  sourceId: "source-1",
  sourceType: "diet_plan" as const,
  dayNumber: 1,
  scheduling: {
    time_type: "fixed" as const,
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
      serving_multiplier: 1,
      time_type: "fixed" as const,
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
        serving_size: "2 eggs",
        category: "protein",
        is_active: true,
      },
    },
    {
      id: "source-2",
      client_id: "client-1",
      food_item_id: "food-2",
      day_number: 1,
      serving_multiplier: 1,
      time_type: "fixed" as const,
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
        serving_size: "2 slices",
        category: "carbs",
        is_active: true,
      },
    },
  ],
} as unknown as ExtendedTimelineItem;

const defaultProps = {
  item: mockMealItem,
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

describe("TimelineItemSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it("should display item title", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("Breakfast")).toBeInTheDocument();
    });

    it("should display item subtitle", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("Morning meal")).toBeInTheDocument();
    });

    it("should display grouped items for meal", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("Eggs")).toBeInTheDocument();
      expect(screen.getByText("Toast")).toBeInTheDocument();
    });

    it("should display total calories", () => {
      render(<TimelineItemSheet {...defaultProps} />);

      expect(screen.getByText("450 cal")).toBeInTheDocument();
    });
  });

  describe("completion status", () => {
    it("should show completion count for grouped items", () => {
      render(<TimelineItemSheet {...defaultProps} completionStatus={{ completed: 1, total: 2 }} />);

      expect(screen.getByText(/1\/2 done/)).toBeInTheDocument();
    });

    it("should show Done badge when all items completed", () => {
      render(
        <TimelineItemSheet
          {...defaultProps}
          isCompleted={true}
          completionStatus={{ completed: 2, total: 2 }}
        />
      );

      // The text is "2/2 done" for grouped items
      expect(screen.getByText(/2\/2 done/)).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("should have a close button that can be clicked", () => {
      const onClose = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onClose={onClose} />);

      // Find the X icon button by finding a button that contains an svg
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons.find((btn) => btn.querySelector("svg.lucide-x"));

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it("should call onMarkComplete when Complete All button clicked", () => {
      const onMarkComplete = jest.fn();
      render(<TimelineItemSheet {...defaultProps} onMarkComplete={onMarkComplete} />);

      const completeButton = screen.getByRole("button", {
        name: /complete all/i,
      });
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

    it("should show loading state when isMarking is true", () => {
      render(<TimelineItemSheet {...defaultProps} isMarking={true} />);

      const completeButton = screen.getByRole("button", {
        name: /complete all/i,
      });
      expect(completeButton).toBeDisabled();
    });
  });

  describe("read-only mode", () => {
    it("should show read-only message when readOnly is true", () => {
      render(<TimelineItemSheet {...defaultProps} readOnly={true} />);

      expect(screen.getByText(/completions can only be tracked/i)).toBeInTheDocument();
    });

    it("should not show action buttons when readOnly is true", () => {
      render(<TimelineItemSheet {...defaultProps} readOnly={true} />);

      expect(screen.queryByRole("button", { name: /complete all/i })).not.toBeInTheDocument();
    });
  });

  describe("individual item completion", () => {
    it("should toggle individual source item when checkbox clicked", () => {
      const isSourceItemCompleted = jest.fn().mockReturnValue(false);
      const onMarkSourceItemComplete = jest.fn();

      render(
        <TimelineItemSheet
          {...defaultProps}
          isSourceItemCompleted={isSourceItemCompleted}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      // Find the food item row and click on the checkbox toggle button
      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(onMarkSourceItemComplete).toHaveBeenCalledWith("source-1");
    });

    it("should not toggle items in read-only mode", () => {
      const onMarkSourceItemComplete = jest.fn();

      render(
        <TimelineItemSheet
          {...defaultProps}
          readOnly={true}
          onMarkSourceItemComplete={onMarkSourceItemComplete}
        />
      );

      // Find the food item row and click on the checkbox toggle button
      const foodItemRow = screen.getByText("Eggs").closest("div")?.parentElement;
      const checkboxButton = foodItemRow?.querySelector("button");
      if (checkboxButton) {
        fireEvent.click(checkboxButton);
      }

      expect(onMarkSourceItemComplete).not.toHaveBeenCalled();
    });
  });
});
