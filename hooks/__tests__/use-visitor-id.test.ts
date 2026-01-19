import { renderHook, waitFor } from "@testing-library/react";
import { useVisitorId } from "../use-visitor-id";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock crypto.randomUUID
const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
Object.defineProperty(window, "crypto", {
  value: {
    randomUUID: jest.fn(() => mockUUID),
  },
});

describe("useVisitorId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new visitor ID when none exists", async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useVisitorId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(localStorageMock.getItem).toHaveBeenCalledWith("metabolikal_visitor_id");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("metabolikal_visitor_id", mockUUID);
    expect(result.current.visitorId).toBe(mockUUID);
  });

  it("returns existing visitor ID from localStorage", async () => {
    const existingId = "existing-uuid-12345";
    localStorageMock.getItem.mockReturnValue(existingId);

    const { result } = renderHook(() => useVisitorId());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(localStorageMock.getItem).toHaveBeenCalledWith("metabolikal_visitor_id");
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(result.current.visitorId).toBe(existingId);
  });

  it("finishes loading after initialization", async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useVisitorId());

    // After effect runs, loading should be false and visitor ID should be set
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.visitorId).toBe(mockUUID);
  });
});
