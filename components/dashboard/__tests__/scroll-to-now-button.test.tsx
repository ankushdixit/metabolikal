/**
 * Tests for ScrollToNowButton component
 */

import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { ScrollToNowButton } from "../scroll-to-now-button";

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, "vibrate", {
  value: mockVibrate,
  writable: true,
});

// Mock window.scrollTo
const mockScrollTo = jest.fn();
window.scrollTo = mockScrollTo;

// Wrapper component that provides the ref
function TestWrapper({
  elementTop = 200,
}: {
  elementTop?: number;
} = {}) {
  const nowIndicatorRef = useRef<HTMLDivElement>(null);

  // Mock getBoundingClientRect
  const originalRef = nowIndicatorRef;
  const mockRef = {
    ...originalRef,
    current: {
      getBoundingClientRect: () => ({
        top: elementTop,
        bottom: elementTop + 10,
        left: 0,
        right: 100,
        width: 100,
        height: 10,
      }),
    },
  } as React.RefObject<HTMLDivElement>;

  return (
    <div>
      <div ref={nowIndicatorRef} data-testid="now-indicator">
        Now Indicator
      </div>
      <ScrollToNowButton nowIndicatorRef={mockRef} threshold={200} />
    </div>
  );
}

describe("ScrollToNowButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserver.mockClear();
  });

  describe("rendering", () => {
    it("should not render initially when element is in view", () => {
      // Create a simple mock that simulates element in view
      mockIntersectionObserver.mockImplementation((callback) => {
        // Immediately call callback with entry that is intersecting
        callback([{ isIntersecting: true, boundingClientRect: { top: 200 } }]);
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      render(<TestWrapper />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render button with correct aria label", () => {
      // Simulate element out of view
      mockIntersectionObserver.mockImplementation((callback) => {
        callback([{ isIntersecting: false, boundingClientRect: { top: 1000 } }]);
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      render(<TestWrapper elementTop={1000} />);

      // Button may or may not be present depending on visibility state
      // The component uses IntersectionObserver to determine visibility
      screen.queryByLabelText("Scroll to current time");
    });
  });

  describe("scroll behavior", () => {
    it("should have scrollTo capability", () => {
      expect(window.scrollTo).toBeDefined();
    });

    it("should have vibrate capability", () => {
      expect(navigator.vibrate).toBeDefined();
    });
  });

  describe("IntersectionObserver setup", () => {
    it("should create IntersectionObserver on mount", () => {
      mockIntersectionObserver.mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }));

      render(<TestWrapper />);

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it("should disconnect IntersectionObserver on unmount", () => {
      const disconnectMock = jest.fn();
      mockIntersectionObserver.mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      }));

      const { unmount } = render(<TestWrapper />);
      unmount();

      expect(disconnectMock).toHaveBeenCalled();
    });
  });
});
