/**
 * useSwipeNavigation Hook
 *
 * Provides swipe gesture handling for day navigation on mobile devices.
 * Features:
 * - Swipe left/right to navigate between days
 * - Visual feedback during swipe (progress tracking)
 * - Configurable threshold for navigation trigger
 * - Resistance when swiping past boundaries
 * - Haptic feedback on successful navigation
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface SwipeNavigationOptions {
  /** Callback when user swipes left (next day) */
  onSwipeLeft: () => void;
  /** Callback when user swipes right (previous day) */
  onSwipeRight: () => void;
  /** Whether swiping left is allowed */
  canSwipeLeft: boolean;
  /** Whether swiping right is allowed */
  canSwipeRight: boolean;
  /** Threshold as percentage of screen width (0-1) to trigger navigation */
  threshold?: number;
  /** Enable/disable haptic feedback */
  enableHaptics?: boolean;
  /** Resistance factor when swiping past boundaries (0-1, lower = more resistance) */
  resistanceFactor?: number;
}

export interface SwipeNavigationReturn {
  /** Touch event handlers to attach to the swipeable element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  /** Current swipe progress (-1 to 1, negative = left, positive = right) */
  swipeProgress: number;
  /** Whether a swipe is currently in progress */
  isSwiping: boolean;
  /** Direction of current swipe */
  swipeDirection: "left" | "right" | null;
  /** Whether the threshold has been reached */
  thresholdReached: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_THRESHOLD = 0.3; // 30% of screen width
const DEFAULT_RESISTANCE_FACTOR = 0.3;
const MIN_SWIPE_DISTANCE = 10; // Minimum pixels to consider a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.5; // pixels/ms for fast swipe

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  threshold = DEFAULT_THRESHOLD,
  enableHaptics = true,
  resistanceFactor = DEFAULT_RESISTANCE_FACTOR,
}: SwipeNavigationOptions): SwipeNavigationReturn {
  // State
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [thresholdReached, setThresholdReached] = useState(false);

  // Refs for tracking touch
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "success") => {
      if (!enableHaptics) return;

      // Use Vibration API if available
      if ("vibrate" in navigator) {
        switch (type) {
          case "light":
            navigator.vibrate(5);
            break;
          case "medium":
            navigator.vibrate(10);
            break;
          case "success":
            navigator.vibrate([10, 50, 10]);
            break;
        }
      }
    },
    [enableHaptics]
  );

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    isHorizontalSwipeRef.current = null;
    setIsSwiping(false);
    setSwipeProgress(0);
    setSwipeDirection(null);
    setThresholdReached(false);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if this is a horizontal swipe (only once per gesture)
      if (
        isHorizontalSwipeRef.current === null &&
        (absX > MIN_SWIPE_DISTANCE || absY > MIN_SWIPE_DISTANCE)
      ) {
        isHorizontalSwipeRef.current = absX > absY;
      }

      // Only process horizontal swipes
      if (!isHorizontalSwipeRef.current) {
        return;
      }

      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault();

      const screenWidth = window.innerWidth;
      const direction = deltaX < 0 ? "left" : "right";
      const canSwipe = direction === "left" ? canSwipeLeft : canSwipeRight;

      // Calculate progress with resistance for disallowed direction
      let progress = absX / (screenWidth * threshold);

      if (!canSwipe) {
        // Apply resistance when swiping in disallowed direction
        progress = progress * resistanceFactor;
      }

      // Normalize to -1 to 1 range
      const normalizedProgress = Math.min(1, progress) * (deltaX < 0 ? -1 : 1);

      setIsSwiping(true);
      setSwipeProgress(normalizedProgress);
      setSwipeDirection(direction);

      // Check if threshold reached
      const hasReachedThreshold = progress >= 1 && canSwipe;
      if (hasReachedThreshold && !thresholdReached) {
        triggerHaptic("medium");
      }
      setThresholdReached(hasReachedThreshold);
    },
    [canSwipeLeft, canSwipeRight, threshold, resistanceFactor, thresholdReached, triggerHaptic]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping || isHorizontalSwipeRef.current !== true) {
        setIsSwiping(false);
        setSwipeProgress(0);
        setSwipeDirection(null);
        setThresholdReached(false);
        return;
      }

      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startXRef.current;
      const absX = Math.abs(deltaX);
      const velocity = absX / duration;

      const direction = deltaX < 0 ? "left" : "right";
      const canSwipe = direction === "left" ? canSwipeLeft : canSwipeRight;
      const screenWidth = window.innerWidth;
      const progress = absX / (screenWidth * threshold);

      // Trigger navigation if threshold reached or fast swipe
      const shouldNavigate =
        canSwipe && (progress >= 1 || (velocity > SWIPE_VELOCITY_THRESHOLD && progress > 0.2));

      if (shouldNavigate) {
        triggerHaptic("success");
        if (direction === "left") {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }

      // Reset state
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
      setThresholdReached(false);
    },
    [isSwiping, canSwipeLeft, canSwipeRight, threshold, onSwipeLeft, onSwipeRight, triggerHaptic]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsSwiping(false);
      setSwipeProgress(0);
      setSwipeDirection(null);
      setThresholdReached(false);
    };
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swipeProgress,
    isSwiping,
    swipeDirection,
    thresholdReached,
  };
}
