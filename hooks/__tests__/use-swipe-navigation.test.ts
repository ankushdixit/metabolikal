/**
 * Tests for useSwipeNavigation hook
 */

import { renderHook, act } from "@testing-library/react";
import { useSwipeNavigation } from "../use-swipe-navigation";

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, "vibrate", {
  value: mockVibrate,
  writable: true,
});

// Mock window dimensions
const mockWindowInnerWidth = 375;
Object.defineProperty(window, "innerWidth", {
  value: mockWindowInnerWidth,
  writable: true,
});

describe("useSwipeNavigation", () => {
  const defaultProps = {
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    canSwipeLeft: true,
    canSwipeRight: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      expect(result.current.swipeProgress).toBe(0);
      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBeNull();
      expect(result.current.thresholdReached).toBe(false);
    });

    it("should return touch event handlers", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      expect(result.current.handlers).toHaveProperty("onTouchStart");
      expect(result.current.handlers).toHaveProperty("onTouchMove");
      expect(result.current.handlers).toHaveProperty("onTouchEnd");
    });
  });

  describe("touch start", () => {
    it("should reset state on touch start", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      expect(result.current.swipeProgress).toBe(0);
      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBeNull();
    });
  });

  describe("touch move", () => {
    it("should detect horizontal swipe left", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      const startX = 200;
      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - 50, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      expect(result.current.isSwiping).toBe(true);
      expect(result.current.swipeDirection).toBe("left");
      expect(result.current.swipeProgress).toBeLessThan(0);
    });

    it("should detect horizontal swipe right", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      const startX = 100;
      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX + 50, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      expect(result.current.isSwiping).toBe(true);
      expect(result.current.swipeDirection).toBe("right");
      expect(result.current.swipeProgress).toBeGreaterThan(0);
    });

    it("should not trigger on vertical swipe", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      const startY = 100;
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: startY }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: 100, clientY: startY + 50 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      // Should not start swiping for vertical movement
      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBeNull();
    });

    it("should apply resistance when swiping in blocked direction", () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          canSwipeLeft: false, // Block left swipe
        })
      );

      const startX = 200;
      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - 100, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      // Progress should be reduced due to resistance
      expect(Math.abs(result.current.swipeProgress)).toBeLessThan(1);
    });
  });

  describe("touch end", () => {
    it("should trigger onSwipeLeft when threshold reached", () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          onSwipeLeft,
          threshold: 0.3,
        })
      );

      // Calculate distance needed to exceed threshold (30% of 375 = 112.5)
      const startX = 300;
      const swipeDistance = 120; // Just over threshold

      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - swipeDistance, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX - swipeDistance, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it("should trigger onSwipeRight when threshold reached", () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          onSwipeRight,
          threshold: 0.3,
        })
      );

      const startX = 50;
      const swipeDistance = 120;

      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX + swipeDistance, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX + swipeDistance, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it("should not trigger callback if threshold not reached and swipe is slow", () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          onSwipeLeft,
          threshold: 0.3,
        })
      );

      // Swipe less than threshold (30% of 375 = 112.5, so 30px is way under)
      // But also need to make sure the velocity is low enough to not trigger
      // The velocity threshold is 0.5 px/ms, and needs progress > 0.2
      // With 30px and threshold of 112.5, progress = 30/112.5 = 0.27, so over 0.2
      // We need to swipe very little (under 0.2 progress which is ~22px)
      const startX = 200;
      const swipeDistance = 15; // Very small - progress will be ~0.13

      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - swipeDistance, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX - swipeDistance, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it("should reset state after touch end", () => {
      const { result } = renderHook(() => useSwipeNavigation(defaultProps));

      const startX = 200;
      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - 50, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX - 50, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeProgress).toBe(0);
      expect(result.current.swipeDirection).toBeNull();
    });
  });

  describe("haptic feedback", () => {
    it("should trigger vibration on successful swipe when haptics enabled", () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          enableHaptics: true,
        })
      );

      const startX = 300;
      const swipeDistance = 120;

      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - swipeDistance, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX - swipeDistance, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(mockVibrate).toHaveBeenCalled();
    });

    it("should not trigger vibration when haptics disabled", () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          ...defaultProps,
          enableHaptics: false,
        })
      );

      const startX = 300;
      const swipeDistance = 120;

      const touchStartEvent = {
        touches: [{ clientX: startX, clientY: 100 }],
      } as unknown as React.TouchEvent;

      const touchMoveEvent = {
        touches: [{ clientX: startX - swipeDistance, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      const touchEndEvent = {
        changedTouches: [{ clientX: startX - swipeDistance, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd(touchEndEvent);
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });
});
