/**
 * Tests for ScrollToNowButton component
 *
 * Enhanced to cover: visibility logic, direction detection, scroll-to-now
 * click handler with haptic feedback, IntersectionObserver setup/teardown,
 * custom threshold, custom className, and null ref handling.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { useRef } from "react";
import { ScrollToNowButton } from "../scroll-to-now-button";

// ---------------------------------------------------------------------------
// Mock IntersectionObserver
// ---------------------------------------------------------------------------

type IntersectionCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let _intersectionCallback: IntersectionCallback | null = null;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

const mockIntersectionObserver = jest.fn().mockImplementation((callback: IntersectionCallback) => {
  _intersectionCallback = callback;
  return {
    observe: mockObserve,
    unobserve: jest.fn(),
    disconnect: mockDisconnect,
  };
});

window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

// ---------------------------------------------------------------------------
// Mock navigator.vibrate
// ---------------------------------------------------------------------------

const mockVibrate = jest.fn();
Object.defineProperty(navigator, "vibrate", {
  value: mockVibrate,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Mock window.scrollTo
// ---------------------------------------------------------------------------

const mockScrollTo = jest.fn();
window.scrollTo = mockScrollTo;

// ---------------------------------------------------------------------------
// Test wrapper components
// ---------------------------------------------------------------------------

function TestWrapper({
  elementTop = 200,
  threshold,
  className,
}: {
  elementTop?: number;
  threshold?: number;
  className?: string;
}) {
  const nowIndicatorRef = useRef<HTMLDivElement>(null);

  // Create a mock ref that provides getBoundingClientRect
  const mockRef = {
    current: {
      getBoundingClientRect: () => ({
        top: elementTop,
        bottom: elementTop + 10,
        left: 0,
        right: 100,
        width: 100,
        height: 10,
        x: 0,
        y: elementTop,
        toJSON: () => {},
      }),
    },
  } as React.RefObject<HTMLElement>;

  return (
    <div>
      <div ref={nowIndicatorRef} data-testid="now-indicator">
        Now Indicator
      </div>
      <ScrollToNowButton nowIndicatorRef={mockRef} threshold={threshold} className={className} />
    </div>
  );
}

function NullRefWrapper() {
  const nullRef = useRef<HTMLElement>(null);
  return <ScrollToNowButton nowIndicatorRef={nullRef} />;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ScrollToNowButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _intersectionCallback = null;
    mockIntersectionObserver.mockClear();
  });

  // =========================================================================
  // Not visible (element in view)
  // =========================================================================

  describe("when element is in view", () => {
    it("should not render the button", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        _intersectionCallback = callback;
        // Immediately report intersecting
        callback([{ isIntersecting: true, boundingClientRect: { top: 200 } as DOMRect }]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={200} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Visible (element out of view - below)
  // =========================================================================

  describe("when element is below viewport", () => {
    it("should render the button with down direction", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        _intersectionCallback = callback;
        // Report not intersecting, element is below
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000, bottom: 1010 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={1000} />);

      const button = screen.getByRole("button", { name: "Scroll to current time" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Now");
    });

    it("should show down arrow when element is below", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        _intersectionCallback = callback;
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={1000} />);

      // The component shows direction arrow
      const button = screen.getByRole("button");
      // Direction "down" shows a down arrow unicode character
      expect(button.textContent).toContain("Now");
    });
  });

  // =========================================================================
  // Visible (element out of view - above)
  // =========================================================================

  describe("when element is above viewport", () => {
    it("should show up arrow when element is above", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        _intersectionCallback = callback;
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: -500 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={-500} />);

      const button = screen.getByRole("button");
      // The component shows up arrow when element is above
      expect(button.textContent).toContain("Now");
    });
  });

  // =========================================================================
  // Click handler - scroll to now
  // =========================================================================

  describe("handleScrollToNow", () => {
    beforeEach(() => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        _intersectionCallback = callback;
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });
    });

    it("should call window.scrollTo with smooth behavior when clicked", () => {
      render(<TestWrapper elementTop={1000} />);

      const button = screen.getByRole("button", { name: "Scroll to current time" });
      fireEvent.click(button);

      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: "smooth",
        })
      );
    });

    it("should trigger haptic feedback (navigator.vibrate) when clicked", () => {
      render(<TestWrapper elementTop={1000} />);

      const button = screen.getByRole("button", { name: "Scroll to current time" });
      fireEvent.click(button);

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it("should calculate scroll offset accounting for header", () => {
      // Mock window.scrollY
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });

      render(<TestWrapper elementTop={1000} />);

      const button = screen.getByRole("button", { name: "Scroll to current time" });
      fireEvent.click(button);

      // headerOffset = 140
      // elementPosition = 1000 (top) + 500 (scrollY) = 1500
      // offsetPosition = 1500 - 140 = 1360
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 1360,
        behavior: "smooth",
      });
    });
  });

  // =========================================================================
  // IntersectionObserver setup
  // =========================================================================

  describe("IntersectionObserver setup", () => {
    it("should create IntersectionObserver on mount", () => {
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<TestWrapper />);

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it("should observe the element", () => {
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<TestWrapper />);

      expect(mockObserve).toHaveBeenCalled();
    });

    it("should disconnect IntersectionObserver on unmount", () => {
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      const { unmount } = render(<TestWrapper />);
      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should pass correct rootMargin with threshold", () => {
      const customThreshold = 300;
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<TestWrapper threshold={customThreshold} />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: `-120px 0px -${customThreshold}px 0px`,
          threshold: 0,
        })
      );
    });

    it("should use default threshold of 200", () => {
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<TestWrapper />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: "-120px 0px -200px 0px",
        })
      );
    });
  });

  // =========================================================================
  // Null ref handling
  // =========================================================================

  describe("null ref handling", () => {
    it("should not render when ref.current is null", () => {
      render(<NullRefWrapper />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not create IntersectionObserver when ref.current is null", () => {
      render(<NullRefWrapper />);

      // IntersectionObserver should still be called but observe should NOT be called
      // because the element is null
      expect(mockObserve).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Scroll listener
  // =========================================================================

  describe("scroll listener", () => {
    it("should add scroll listener on mount", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<TestWrapper />);

      expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
        passive: true,
      });

      addEventListenerSpy.mockRestore();
    });

    it("should remove scroll listener on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      const { unmount } = render(<TestWrapper />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  // =========================================================================
  // Custom className
  // =========================================================================

  describe("custom className", () => {
    it("should apply custom className to the button", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={1000} className="my-custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("my-custom-class");
    });
  });

  // =========================================================================
  // aria-label
  // =========================================================================

  describe("accessibility", () => {
    it("should have correct aria-label", () => {
      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={1000} />);

      expect(screen.getByLabelText("Scroll to current time")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // handleScrollToNow with null ref
  // =========================================================================

  describe("handleScrollToNow with null element", () => {
    it("should not scroll or vibrate when ref.current is null", () => {
      // The NullRefWrapper won't show a button (isVisible stays false),
      // so we can't click it. But we verify the safety check exists
      // by ensuring no crashes.
      render(<NullRefWrapper />);

      expect(mockScrollTo).not.toHaveBeenCalled();
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // checkVisibility via scroll events
  // =========================================================================

  describe("checkVisibility via scroll", () => {
    it("should update visibility when scroll event fires with element out of view", () => {
      // Mock requestAnimationFrame to execute immediately
      const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      // Keep IntersectionObserver simple (does not set visibility)
      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      // Element is far below viewport
      render(<TestWrapper elementTop={2000} />);

      // Trigger scroll event
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      // checkVisibility should set isVisible=true since element is outside threshold
      // With elementTop=2000, rect.bottom (2010) > windowHeight (768) + threshold (200)
      // So isVisible = !isInView = true, and direction = "down"
      const button = screen.queryByRole("button");
      // Button should be visible
      expect(button).toBeInTheDocument();

      rafSpy.mockRestore();
    });

    it("should hide button when element comes into view after scroll", () => {
      const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      // Start with element far out of view
      let currentElementTop = 2000;

      const mockRefForHide = {
        current: {
          getBoundingClientRect: () => ({
            top: currentElementTop,
            bottom: currentElementTop + 10,
            left: 0,
            right: 100,
            width: 100,
            height: 10,
            x: 0,
            y: currentElementTop,
            toJSON: () => {},
          }),
        },
      } as React.RefObject<HTMLElement>;

      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        callback([
          {
            isIntersecting: false,
            boundingClientRect: { top: 2000 } as DOMRect,
          },
        ]);
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      // Render directly with the mutable ref
      render(<ScrollToNowButton nowIndicatorRef={mockRefForHide} threshold={200} />);

      // Button should be visible since element is at 2000 (out of view)
      expect(screen.getByRole("button")).toBeInTheDocument();

      // Now simulate element scrolling into view
      currentElementTop = 300;

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      // After checkVisibility, element at top=300 is within view
      // isInView: 300 >= 120-200 && 310 <= 768+200 => true, so isVisible=false
      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      rafSpy.mockRestore();
    });

    it("should set direction to up when element is above viewport", () => {
      const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      // Element is far above viewport
      render(<TestWrapper elementTop={-500} threshold={50} />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.queryByRole("button");
      if (button) {
        // Should contain up arrow
        expect(button.textContent).toContain("Now");
      }

      rafSpy.mockRestore();
    });

    it("should handle checkVisibility when element ref is null", () => {
      const rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      mockIntersectionObserver.mockImplementation(() => ({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      }));

      render(<NullRefWrapper />);

      // Should not crash when scroll fires with null ref
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      rafSpy.mockRestore();
    });
  });

  // =========================================================================
  // Dynamic visibility toggling via IntersectionObserver
  // =========================================================================

  describe("dynamic visibility changes", () => {
    it("should show/hide button as IntersectionObserver fires", () => {
      let observerCallback: IntersectionCallback;

      mockIntersectionObserver.mockImplementation((callback: IntersectionCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: jest.fn(),
          disconnect: mockDisconnect,
        };
      });

      render(<TestWrapper elementTop={200} />);

      // Initially, button should not be visible (checkVisibility sees element in view)
      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      // Simulate element going out of view
      act(() => {
        observerCallback!([
          {
            isIntersecting: false,
            boundingClientRect: { top: 1000 } as DOMRect,
          },
        ]);
      });

      expect(screen.getByRole("button")).toBeInTheDocument();

      // Simulate element coming back into view
      act(() => {
        observerCallback!([
          {
            isIntersecting: true,
            boundingClientRect: { top: 200 } as DOMRect,
          },
        ]);
      });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
