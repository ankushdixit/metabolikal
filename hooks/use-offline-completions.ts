/**
 * useOfflineCompletions Hook
 *
 * Provides offline completion queue functionality with:
 * - Queue completions when offline
 * - Persist queue to localStorage
 * - Auto-sync when back online
 * - Optimistic UI updates
 * - Conflict resolution
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PlanCompletionType } from "@/lib/database.types";

// =============================================================================
// TYPES
// =============================================================================

export interface QueuedCompletion {
  /** Unique ID for the queued item */
  id: string;
  /** The source item ID to complete/uncomplete */
  sourceId: string;
  /** Type of plan item */
  planType: PlanCompletionType;
  /** The date for the completion */
  completedDate: string;
  /** Action to perform */
  action: "complete" | "uncomplete";
  /** When the item was queued */
  queuedAt: number;
  /** Number of sync attempts */
  attempts: number;
  /** Last error message if sync failed */
  lastError?: string;
}

export interface OfflineCompletionsReturn {
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Current queue of pending completions */
  queue: QueuedCompletion[];
  /** Queue a completion action */
  queueCompletion: (
    sourceId: string,
    planType: PlanCompletionType,
    completedDate: string,
    action: "complete" | "uncomplete"
  ) => void;
  /** Check if an item has a pending action */
  getPendingAction: (sourceId: string) => "complete" | "uncomplete" | null;
  /** Manually trigger sync */
  syncQueue: () => Promise<void>;
  /** Whether a sync is in progress */
  isSyncing: boolean;
  /** Last successful sync time */
  lastSyncTime: Date | null;
  /** Clear the queue (for testing/reset) */
  clearQueue: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUEUE_KEY = "metabolikal_completion_queue";
const LAST_SYNC_KEY = "metabolikal_last_sync";
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_DEBOUNCE_MS = 1000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique ID for queue items
 */
function generateQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load queue from localStorage
 */
function loadQueue(): QueuedCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    console.error("Failed to load completion queue from localStorage");
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedCompletion[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save completion queue to localStorage:", error);
  }
}

/**
 * Load last sync time from localStorage
 */
function loadLastSyncTime(): Date | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return null;
    return new Date(stored);
  } catch {
    return null;
  }
}

/**
 * Save last sync time to localStorage
 */
function saveLastSyncTime(time: Date): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_SYNC_KEY, time.toISOString());
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useOfflineCompletions(): OfflineCompletionsReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<QueuedCompletion[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Load queue and last sync time on mount
  useEffect(() => {
    setQueue(loadQueue());
    setLastSyncTime(loadLastSyncTime());
  }, []);

  // Save queue whenever it changes
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncQueueInternal();
      }, SYNC_DEBOUNCE_MS);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Internal sync function
  const syncQueueInternal = useCallback(async () => {
    if (!navigator.onLine || isSyncing || queue.length === 0) return;

    setIsSyncing(true);

    const itemsToSync = [...queue];
    const failedItems: QueuedCompletion[] = [];
    const successfulIds: string[] = [];

    for (const item of itemsToSync) {
      try {
        // Import dynamically to avoid SSR issues
        const { createBrowserSupabaseClient } = await import("@/lib/auth");
        const supabase = createBrowserSupabaseClient();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Can't sync without user - keep in queue
          failedItems.push({
            ...item,
            attempts: item.attempts + 1,
            lastError: "Not authenticated",
          });
          continue;
        }

        if (item.action === "complete") {
          // Check if already completed (avoid duplicates)
          const { data: existing } = await supabase
            .from("plan_completions")
            .select("id")
            .eq("client_id", user.id)
            .eq("plan_item_id", item.sourceId)
            .eq("completed_date", item.completedDate)
            .single();

          if (!existing) {
            // Create completion
            const { error } = await supabase.from("plan_completions").insert({
              client_id: user.id,
              plan_type: item.planType,
              plan_item_id: item.sourceId,
              completed_date: item.completedDate,
            });

            if (error) {
              throw error;
            }
          }
        } else {
          // Delete completion
          const { error } = await supabase
            .from("plan_completions")
            .delete()
            .eq("client_id", user.id)
            .eq("plan_item_id", item.sourceId)
            .eq("completed_date", item.completedDate);

          if (error) {
            throw error;
          }
        }

        successfulIds.push(item.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (item.attempts >= MAX_RETRY_ATTEMPTS) {
          // Max retries reached - discard the item
          console.error(
            `Discarding queued completion after ${MAX_RETRY_ATTEMPTS} attempts:`,
            item,
            error
          );
        } else {
          // Keep for retry
          failedItems.push({
            ...item,
            attempts: item.attempts + 1,
            lastError: errorMessage,
          });
        }
      }
    }

    // Update queue if component still mounted
    if (isMountedRef.current) {
      setQueue(failedItems);

      if (successfulIds.length > 0) {
        const now = new Date();
        setLastSyncTime(now);
        saveLastSyncTime(now);
      }

      setIsSyncing(false);
    }
  }, [queue, isSyncing]);

  // Queue a completion action
  const queueCompletion = useCallback(
    (
      sourceId: string,
      planType: PlanCompletionType,
      completedDate: string,
      action: "complete" | "uncomplete"
    ) => {
      setQueue((prevQueue) => {
        // Check if there's already a pending action for this item
        const existingIndex = prevQueue.findIndex(
          (item) => item.sourceId === sourceId && item.completedDate === completedDate
        );

        if (existingIndex >= 0) {
          const existing = prevQueue[existingIndex];

          // If the new action cancels out the existing one, remove it
          if (existing.action !== action) {
            return prevQueue.filter((_, i) => i !== existingIndex);
          }

          // Otherwise, keep the existing (it's the same action)
          return prevQueue;
        }

        // Add new queued item
        const newItem: QueuedCompletion = {
          id: generateQueueId(),
          sourceId,
          planType,
          completedDate,
          action,
          queuedAt: Date.now(),
          attempts: 0,
        };

        return [...prevQueue, newItem];
      });

      // Trigger sync if online (with debounce)
      if (navigator.onLine) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncQueueInternal();
        }, SYNC_DEBOUNCE_MS);
      }
    },
    [syncQueueInternal]
  );

  // Get pending action for an item
  const getPendingAction = useCallback(
    (sourceId: string): "complete" | "uncomplete" | null => {
      const pending = queue.find((item) => item.sourceId === sourceId);
      return pending?.action ?? null;
    },
    [queue]
  );

  // Manual sync trigger
  const syncQueue = useCallback(async () => {
    await syncQueueInternal();
  }, [syncQueueInternal]);

  // Clear queue (for testing/reset)
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    queueCompletion,
    getPendingAction,
    syncQueue,
    isSyncing,
    lastSyncTime,
    clearQueue,
  };
}
