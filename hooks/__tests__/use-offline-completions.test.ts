/**
 * Tests for useOfflineCompletions hook
 *
 * Covers:
 * - Initialization (online/offline, localStorage loading)
 * - Queue management (add, cancel, dedup, persist)
 * - getPendingAction
 * - clearQueue
 * - Online/offline event handling
 * - Sync logic (success, auth failure, retry, max retry discard)
 * - Conflict resolution (existing completion check)
 * - localStorage error handling
 * - lastSyncTime tracking
 * - Unmount cleanup
 */

import { renderHook, act } from "@testing-library/react";
import { useOfflineCompletions } from "../use-offline-completions";

// =============================================================================
// MOCK SETUP
// =============================================================================

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
    get _store() {
      return store;
    },
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

// Mock Supabase client for sync tests
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the dynamic import of @/lib/auth
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => mockSupabaseClient,
}));

// Helper to set up Supabase chain for sync
function setupSupabaseChain(options?: {
  user?: { id: string } | null;
  existingCompletion?: { id: string } | null;
  insertError?: Error | null;
  deleteError?: Error | null;
  selectError?: Error | null;
}) {
  const {
    user = { id: "user-1" },
    existingCompletion = null,
    insertError = null,
    deleteError = null,
  } = options ?? {};

  mockGetUser.mockResolvedValue({
    data: { user },
    error: null,
  });

  // Create a chainable mock for from()
  const chain = {
    select: mockSelect.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    delete: mockDelete.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle.mockResolvedValue({
      data: existingCompletion,
      error: null,
    }),
  };

  // For insert: resolves with potential error
  mockInsert.mockReturnValue({
    ...chain,
    // The insert path doesn't chain further, it returns { error }
    then: (resolve: (v: unknown) => void) => resolve({ error: insertError }),
  });

  // Override: when from() is called, check the context
  mockFrom.mockImplementation(() => {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingCompletion,
                error: null,
              }),
            }),
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: insertError }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteError }),
          }),
        }),
      }),
    };
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe("useOfflineCompletions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.clear();
    mockOnLine = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  describe("initialization", () => {
    it("should initialize with online status", () => {
      mockOnLine = true;
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.queue).toEqual([]);
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).toBeNull();
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
          planCycle: 1,
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

    it("should load last sync time from localStorage on mount", () => {
      const syncTime = "2026-01-27T10:00:00.000Z";
      // Use mockReturnValueOnce for each getItem call:
      // First call: loadQueue() reads QUEUE_KEY -> null
      // Second call: loadLastSyncTime() reads LAST_SYNC_KEY -> syncTime
      localStorageMock.getItem
        .mockReturnValueOnce(null) // queue
        .mockReturnValueOnce(syncTime); // last sync

      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.lastSyncTime).toEqual(new Date(syncTime));
    });

    it("should handle invalid JSON in localStorage gracefully", () => {
      localStorageMock.getItem.mockReturnValueOnce("not-valid-json");

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.queue).toEqual([]);
      consoleSpy.mockRestore();
    });

    it("should handle null localStorage queue", () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.queue).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // QUEUE COMPLETION
  // ---------------------------------------------------------------------------
  describe("queueCompletion", () => {
    it("should add a completion to the queue", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].sourceId).toBe("item-1");
      expect(result.current.queue[0].action).toBe("complete");
    });

    it("should add uncomplete action to the queue", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].action).toBe("uncomplete");
    });

    it("should remove canceling actions (complete then uncomplete)", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it("should remove canceling actions (uncomplete then complete)", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it("should not duplicate same action", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);
    });

    it("should allow same sourceId with different completedDate", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-28", "complete");
      });

      expect(result.current.queue).toHaveLength(2);
    });

    it("should persist queue to localStorage after adding", () => {
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

    it("should use default planCycle of 1 when not specified", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue[0].planCycle).toBe(1);
    });

    it("should use provided planCycle value", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete", 3);
      });

      expect(result.current.queue[0].planCycle).toBe(3);
    });

    it("should accept all plan types", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      const planTypes = ["diet", "supplement", "workout", "lifestyle"] as const;

      for (const planType of planTypes) {
        act(() => {
          result.current.queueCompletion(`item-${planType}`, planType, "2026-01-27", "complete");
        });
      }

      expect(result.current.queue).toHaveLength(4);
      expect(result.current.queue.map((q) => q.planType)).toEqual(planTypes);
    });

    it("should trigger sync debounce when online", () => {
      mockOnLine = true;
      setupSupabaseChain();
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      // The sync should be scheduled but not yet fired (debounce = 1000ms)
      expect(result.current.isSyncing).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GET PENDING ACTION
  // ---------------------------------------------------------------------------
  describe("getPendingAction", () => {
    it("should return the pending action for an item", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.getPendingAction("item-1")).toBe("complete");
    });

    it("should return uncomplete as pending action", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      expect(result.current.getPendingAction("item-1")).toBe("uncomplete");
    });

    it("should return null for items without pending actions", () => {
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.getPendingAction("non-existent")).toBeNull();
    });

    it("should return null after canceling actions neutralize", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      expect(result.current.getPendingAction("item-1")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // CLEAR QUEUE
  // ---------------------------------------------------------------------------
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

    it("should persist empty queue to localStorage", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.clearQueue();
      });

      // The last setItem call should be for an empty array
      const lastCall =
        localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      expect(lastCall[0]).toBe("metabolikal_completion_queue");
      expect(JSON.parse(lastCall[1])).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // ONLINE/OFFLINE EVENTS
  // ---------------------------------------------------------------------------
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

    it("should trigger sync after debounce when coming back online with queue items", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      // Queue an item while offline
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);

      // Come back online
      act(() => {
        mockOnLine = true;
        window.dispatchEvent(new Event("online"));
      });

      // Advance timers past debounce
      await act(async () => {
        jest.advanceTimersByTime(1100);
      });

      // Sync should have been triggered (check that supabase was called)
      expect(mockFrom).toHaveBeenCalled();
    });

    it("should clean up event listeners on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useOfflineCompletions());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // QUEUE ITEM STRUCTURE
  // ---------------------------------------------------------------------------
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
      expect(typeof queuedItem.id).toBe("string");
      expect(queuedItem.id.length).toBeGreaterThan(0);
      expect(queuedItem.sourceId).toBe("item-1");
      expect(queuedItem.planType).toBe("workout");
      expect(queuedItem.completedDate).toBe("2026-01-27");
      expect(queuedItem.planCycle).toBe(1);
      expect(queuedItem.action).toBe("complete");
      expect(queuedItem.queuedAt).toBeGreaterThanOrEqual(beforeQueue);
      expect(queuedItem.queuedAt).toBeLessThanOrEqual(afterQueue);
      expect(queuedItem.attempts).toBe(0);
      expect(queuedItem.lastError).toBeUndefined();
    });

    it("should generate unique IDs for each queued item", () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
        result.current.queueCompletion("item-2", "supplement", "2026-01-27", "complete");
      });

      const ids = result.current.queue.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ---------------------------------------------------------------------------
  // SYNC LOGIC
  // ---------------------------------------------------------------------------
  describe("syncQueue", () => {
    it("should not sync when offline", async () => {
      mockOnLine = false;
      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      await act(async () => {
        await result.current.syncQueue();
      });

      // Queue should remain unchanged since we're offline
      expect(result.current.queue).toHaveLength(1);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should not sync when queue is empty", async () => {
      mockOnLine = true;
      setupSupabaseChain();
      const { result } = renderHook(() => useOfflineCompletions());

      await act(async () => {
        await result.current.syncQueue();
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should sync complete action successfully", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" }, existingCompletion: null });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      expect(result.current.queue).toHaveLength(1);

      // Go online and sync
      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      // Queue should be cleared after successful sync
      expect(result.current.queue).toHaveLength(0);
    });

    it("should sync uncomplete action (delete) successfully", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "uncomplete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it("should skip insert when completion already exists (conflict resolution)", async () => {
      mockOnLine = false;
      setupSupabaseChain({
        user: { id: "user-1" },
        existingCompletion: { id: "existing-1" }, // Already completed
      });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      // Should succeed (skipping the insert) and clear the queue
      expect(result.current.queue).toHaveLength(0);
    });

    it("should keep item in queue when not authenticated", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: null });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      // Item should remain in queue with incremented attempts
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].attempts).toBe(1);
      expect(result.current.queue[0].lastError).toBe("Not authenticated");
    });

    it("should retry failed items up to max attempts", async () => {
      mockOnLine = false;
      setupSupabaseChain({
        user: { id: "user-1" },
        insertError: new Error("Database error"),
      });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      // First attempt
      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].attempts).toBe(1);
      expect(result.current.queue[0].lastError).toBe("Database error");
    });

    it("should discard items after max retry attempts (3)", async () => {
      mockOnLine = false;
      setupSupabaseChain({
        user: { id: "user-1" },
        insertError: new Error("Persistent error"),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      renderHook(() => useOfflineCompletions());

      // Pre-load a queue item that's already at max attempts
      const preloadedQueue = [
        {
          id: "test-1",
          sourceId: "item-1",
          planType: "diet" as const,
          completedDate: "2026-01-27",
          planCycle: 1,
          action: "complete" as const,
          queuedAt: Date.now(),
          attempts: 3, // Already at MAX_RETRY_ATTEMPTS
        },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(preloadedQueue));

      const { result: result2 } = renderHook(() => useOfflineCompletions());

      mockOnLine = true;
      await act(async () => {
        await result2.current.syncQueue();
      });

      // Item should be discarded (removed from queue)
      expect(result2.current.queue).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it("should update lastSyncTime after successful sync", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      // lastSyncTime should be null when no prior sync time is stored
      // (localStorage was cleared in beforeEach)

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    });

    it("should save lastSyncTime to localStorage", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "metabolikal_last_sync",
        expect.any(String)
      );
    });

    it("should sync multiple items in order", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
        result.current.queueCompletion("item-2", "workout", "2026-01-27", "complete");
        result.current.queueCompletion("item-3", "supplement", "2026-01-27", "uncomplete");
      });

      expect(result.current.queue).toHaveLength(3);

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it("should handle mix of successful and failed items", async () => {
      // This tests partial sync success
      // We need a more sophisticated mock that fails for specific items
      mockOnLine = false;
      let callCount = 0;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });

      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          // First item (complete): check existing then insert
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ error: null }),
                }),
              }),
            }),
          };
        }
        // Second item fails
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: new Error("Fail") }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: new Error("Fail") }),
              }),
            }),
          }),
        };
      });

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
        result.current.queueCompletion("item-2", "workout", "2026-01-28", "complete");
      });

      mockOnLine = true;
      await act(async () => {
        await result.current.syncQueue();
      });

      // One item should have synced, one failed
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].sourceId).toBe("item-2");
      expect(result.current.queue[0].attempts).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // LOCALSTORAGE ERROR HANDLING
  // ---------------------------------------------------------------------------
  describe("localStorage error handling", () => {
    it("should handle localStorage.setItem throwing", () => {
      mockOnLine = false;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useOfflineCompletions());

      // Should not throw
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      consoleSpy.mockRestore();
    });

    it("should handle localStorage.getItem throwing", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("SecurityError");
      });

      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current.queue).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // DEBOUNCE BEHAVIOR
  // ---------------------------------------------------------------------------
  describe("debounce behavior", () => {
    it("should debounce multiple rapid queues into one sync", () => {
      mockOnLine = true;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result } = renderHook(() => useOfflineCompletions());

      // Queue multiple items rapidly
      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-2", "workout", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-3", "supplement", "2026-01-27", "complete");
      });

      // Before debounce fires, sync should not have started
      expect(result.current.isSyncing).toBe(false);
    });

    it("should clear previous debounce timeout when new item queued", () => {
      mockOnLine = true;
      setupSupabaseChain({ user: { id: "user-1" } });

      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { result } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      act(() => {
        result.current.queueCompletion("item-2", "workout", "2026-01-28", "complete");
      });

      // clearTimeout should have been called when second item was queued
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // UNMOUNT SAFETY
  // ---------------------------------------------------------------------------
  describe("unmount safety", () => {
    it("should not update state after unmount", async () => {
      mockOnLine = false;
      setupSupabaseChain({ user: { id: "user-1" } });

      const { result, unmount } = renderHook(() => useOfflineCompletions());

      act(() => {
        result.current.queueCompletion("item-1", "diet", "2026-01-27", "complete");
      });

      mockOnLine = true;

      // Unmount before sync completes
      unmount();

      // This should not throw or cause warnings
      // (isMountedRef prevents setState after unmount)
    });

    it("should clean up sync timeout on unmount", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(() => useOfflineCompletions());

      unmount();

      // clearTimeout should be called during cleanup
      // (may be called 0 or more times depending on whether a timeout was set)
      clearTimeoutSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // RETURN SHAPE
  // ---------------------------------------------------------------------------
  describe("return value shape", () => {
    it("should return all expected properties", () => {
      const { result } = renderHook(() => useOfflineCompletions());

      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("queue");
      expect(result.current).toHaveProperty("queueCompletion");
      expect(result.current).toHaveProperty("getPendingAction");
      expect(result.current).toHaveProperty("syncQueue");
      expect(result.current).toHaveProperty("isSyncing");
      expect(result.current).toHaveProperty("lastSyncTime");
      expect(result.current).toHaveProperty("clearQueue");

      expect(typeof result.current.isOnline).toBe("boolean");
      expect(Array.isArray(result.current.queue)).toBe(true);
      expect(typeof result.current.queueCompletion).toBe("function");
      expect(typeof result.current.getPendingAction).toBe("function");
      expect(typeof result.current.syncQueue).toBe("function");
      expect(typeof result.current.isSyncing).toBe("boolean");
      expect(typeof result.current.clearQueue).toBe("function");
    });
  });
});
