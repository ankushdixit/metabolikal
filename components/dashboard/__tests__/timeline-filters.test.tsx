/**
 * Tests for TimelineFilters component and utility functions
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  TimelineFilters,
  parseFiltersFromParam,
  filtersToParam,
  areAllFiltersEnabled,
  areNoFiltersEnabled,
  getActiveFilterTypes,
  type TypeFilters,
} from "../timeline-filters";

describe("TimelineFilters", () => {
  const defaultFilters: TypeFilters = {
    meal: true,
    supplement: true,
    workout: true,
    lifestyle: true,
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  describe("utility functions", () => {
    describe("parseFiltersFromParam", () => {
      it("returns default filters for null param", () => {
        const result = parseFiltersFromParam(null);
        expect(result).toEqual(defaultFilters);
      });

      it("returns default filters for empty string", () => {
        const result = parseFiltersFromParam("");
        expect(result).toEqual(defaultFilters);
      });

      it("parses single filter", () => {
        const result = parseFiltersFromParam("meal");
        expect(result).toEqual({
          meal: true,
          supplement: false,
          workout: false,
          lifestyle: false,
        });
      });

      it("parses multiple filters", () => {
        const result = parseFiltersFromParam("meal,supplement");
        expect(result).toEqual({
          meal: true,
          supplement: true,
          workout: false,
          lifestyle: false,
        });
      });

      it("parses all filters", () => {
        const result = parseFiltersFromParam("meal,supplement,workout,lifestyle");
        expect(result).toEqual(defaultFilters);
      });

      it("ignores invalid filter types", () => {
        const result = parseFiltersFromParam("meal,invalid,workout");
        expect(result.meal).toBe(true);
        expect(result.workout).toBe(true);
        // Invalid types are just ignored
      });
    });

    describe("filtersToParam", () => {
      it("returns null when all filters enabled", () => {
        const result = filtersToParam(defaultFilters);
        expect(result).toBeNull();
      });

      it("returns null when no filters enabled", () => {
        const result = filtersToParam({
          meal: false,
          supplement: false,
          workout: false,
          lifestyle: false,
        });
        expect(result).toBeNull();
      });

      it("returns single filter string", () => {
        const result = filtersToParam({
          meal: true,
          supplement: false,
          workout: false,
          lifestyle: false,
        });
        expect(result).toBe("meal");
      });

      it("returns comma-separated filter string", () => {
        const result = filtersToParam({
          meal: true,
          supplement: true,
          workout: false,
          lifestyle: false,
        });
        expect(result).toBe("meal,supplement");
      });
    });

    describe("areAllFiltersEnabled", () => {
      it("returns true when all enabled", () => {
        expect(areAllFiltersEnabled(defaultFilters)).toBe(true);
      });

      it("returns false when any disabled", () => {
        expect(
          areAllFiltersEnabled({
            ...defaultFilters,
            meal: false,
          })
        ).toBe(false);
      });
    });

    describe("areNoFiltersEnabled", () => {
      it("returns false when any enabled", () => {
        expect(areNoFiltersEnabled(defaultFilters)).toBe(false);
      });

      it("returns true when all disabled", () => {
        expect(
          areNoFiltersEnabled({
            meal: false,
            supplement: false,
            workout: false,
            lifestyle: false,
          })
        ).toBe(true);
      });
    });

    describe("getActiveFilterTypes", () => {
      it("returns all types when all enabled", () => {
        const result = getActiveFilterTypes(defaultFilters);
        expect(result).toEqual(["meal", "supplement", "workout", "lifestyle"]);
      });

      it("returns only enabled types", () => {
        const result = getActiveFilterTypes({
          meal: true,
          supplement: false,
          workout: true,
          lifestyle: false,
        });
        expect(result).toEqual(["meal", "workout"]);
      });

      it("returns empty array when none enabled", () => {
        const result = getActiveFilterTypes({
          meal: false,
          supplement: false,
          workout: false,
          lifestyle: false,
        });
        expect(result).toEqual([]);
      });
    });
  });

  describe("component rendering", () => {
    it("renders all filter buttons", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      expect(screen.getByText("Meals")).toBeInTheDocument();
      expect(screen.getByText("Supplements")).toBeInTheDocument();
      expect(screen.getByText("Workouts")).toBeInTheDocument();
      expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    });

    it("renders Show: label", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      expect(screen.getByText("Show:")).toBeInTheDocument();
    });

    it("renders Hide All when all filters enabled", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      expect(screen.getByText("Hide All")).toBeInTheDocument();
    });

    it("renders Show All when any filter disabled", () => {
      render(
        <TimelineFilters
          filters={{ ...defaultFilters, meal: false }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText("Show All")).toBeInTheDocument();
    });

    it("renders counts when provided", () => {
      render(
        <TimelineFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          counts={{
            meal: 5,
            supplement: 3,
            workout: 1,
            lifestyle: 2,
            total: 11,
          }}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("component interactions", () => {
    it("calls onFiltersChange when filter clicked", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      fireEvent.click(screen.getByText("Meals"));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        meal: false,
      });
    });

    it("toggles filter off when enabled filter clicked", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      fireEvent.click(screen.getByText("Supplements"));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        supplement: false,
      });
    });

    it("toggles filter on when disabled filter clicked", () => {
      render(
        <TimelineFilters
          filters={{ ...defaultFilters, workout: false }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByText("Workouts"));

      expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
    });

    it("hides all when Hide All clicked", () => {
      render(<TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />);

      fireEvent.click(screen.getByText("Hide All"));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        meal: false,
        supplement: false,
        workout: false,
        lifestyle: false,
      });
    });

    it("shows all when Show All clicked", () => {
      render(
        <TimelineFilters
          filters={{ meal: false, supplement: false, workout: false, lifestyle: false }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByText("Show All"));

      expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
    });

    it("does not call onFiltersChange when disabled", () => {
      render(
        <TimelineFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} disabled />
      );

      fireEvent.click(screen.getByText("Meals"));

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });
});
