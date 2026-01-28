import { renderHook } from "@testing-library/react";
import { useMealTypes } from "../use-meal-types";

// Mock Refine useList hook
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(),
}));

import { useList } from "@refinedev/core";

const mockUseList = useList as jest.MockedFunction<typeof useList>;

describe("useMealTypes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns loading state initially", () => {
    mockUseList.mockReturnValue({
      query: {
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      },
    } as never);

    const { result } = renderHook(() => useMealTypes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.mealTypes).toEqual([]);
  });

  it("returns meal types from database when loaded", async () => {
    const mockMealTypes = [
      { id: "1", name: "Breakfast", slug: "breakfast", display_order: 1, is_active: true },
      { id: "2", name: "Lunch", slug: "lunch", display_order: 2, is_active: true },
      { id: "3", name: "Dinner", slug: "dinner", display_order: 3, is_active: true },
    ];

    mockUseList.mockReturnValue({
      query: {
        data: { data: mockMealTypes },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    } as never);

    const { result } = renderHook(() => useMealTypes());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.mealTypes).toEqual(mockMealTypes);
    expect(result.current.error).toBeNull();
  });

  it("returns error when database fetch fails", () => {
    const mockError = new Error("Database error");

    mockUseList.mockReturnValue({
      query: {
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      },
    } as never);

    const { result } = renderHook(() => useMealTypes());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.mealTypes).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });

  it("returns empty array when no meal types exist", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    } as never);

    const { result } = renderHook(() => useMealTypes());

    expect(result.current.mealTypes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("filters by active status by default", () => {
    renderHook(() => useMealTypes());

    expect(mockUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "meal_types",
        filters: [{ field: "is_active", operator: "eq", value: true }],
      })
    );
  });

  it("includes inactive when option is set", () => {
    renderHook(() => useMealTypes({ includeInactive: true }));

    expect(mockUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "meal_types",
        filters: [],
      })
    );
  });

  it("sorts by display_order ascending", () => {
    renderHook(() => useMealTypes());

    expect(mockUseList).toHaveBeenCalledWith(
      expect.objectContaining({
        sorters: [{ field: "display_order", order: "asc" }],
      })
    );
  });
});
