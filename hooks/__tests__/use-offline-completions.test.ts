/**
 * Tests for useOfflineCompletions hook
 */

import { renderHook, act } from "@testing-library/react";
import { useOfflineCompletions } from "../use-offline-completions";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock navigator.onLine
let mockOnLine = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnLine,
  configurable: true,
});

describe("useOfflineCompletions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockOnLine = true;
  });

  describe("initialization", () => {
    it("should initialize with online status", () => {
      mockOnLine = true;
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.queue).toEqual([]);
      expect(result.current.isSyncing).toBe(false);
    });

    it("should initialize with offline status when offline", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.isOnline).toBe(false);
    });

    it("should load queue from localStorage on mount", () => {
      const existingQueue = [
        {
          id: "test-1",
          sourceId: "item-1",
          planType: "diet" as const,
          completedDate: "2026-01-27",
          action: "complete" as const,
          queuedAt: Date.now(),
          attempts: 0,
        },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingQueue));

      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].sourceId).toBe("item-1");
    });
  });

  describe("queueCompletion", () => {
    it("should add a completion to the queue", () => {
      mockOnLine = false; // Prevent auto-sync
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].sourceId).toBe("item-1");
      expect(result.current.queue[0].action).toBe("complete");
    });

    it("should remove canceling actions (complete then uncomplete)", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      // Queue a complete action
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);

      // Queue an uncomplete action for the same item
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      // They should cancel out
      expect(result.current.queue).toHaveLength(0);
    });

    it("should not duplicate same action", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      // Queue a complete action twice
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      // Should only have one entry
      expect(result.current.queue).toHaveLength(1);
    });

    it("should persist queue to localStorage", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "metabolikal_completion_queue",
        expect.any(String)
      );
    });
  });

  describe("getPendingAction", () => {
    it("should return the pending action for an item", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.getPendingAction("item-1")).toBe("complete");
    });

    it("should return null for items without pending actions", () => {
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.getPendingAction("non-existent")).toBeNull();
    });
  });

  describe("clearQueue", () => {
    it("should clear all queued items", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
        result.current.queueCompletion("item-2", "supplement", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(2);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });
  });

  describe("online/offline events", () => {
    it("should update isOnline when going offline", () => {
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        mockOnLine = false;
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it("should update isOnline when coming back online", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.isOnline).toBe(false);

      act(() => {
        mockOnLine = true;
        window.dispatchEvent(new Event("online"));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe("queue item structure", () => {
    it("should include all required fields in queued items", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      const beforeQueue = Date.now();

      act(() => {
        result.current.queueCompletion("item-1", "workout", "2026-01-27", "complete");
      });

      const afterQueue = Date.now();
      const queuedItem = result.current.queue[0];

      expect(queuedItem.id).toBeDefined();
      expect(queuedItem.sourceId).toBe("item-1");
      expect(queuedItem.planType).toBe("workout");
      expect(queuedItem.completedDate).toBe("2026-01-27");
      expect(queuedItem.action).toBe("complete");
      expect(queuedItem.queuedAt).toBeGreaterThanOrEqual(beforeQueue);
      expect(queuedItem.queuedAt).toBeLessThanOrEqual(afterQueue);
      expect(queuedItem.attempts).toBe(0);
    });
  });
});
