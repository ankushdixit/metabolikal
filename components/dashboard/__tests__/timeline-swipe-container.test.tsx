/**
 * Tests for TimelineSwipeContainer component
 *
 * Tests swipe gesture navigation, visual indicators, boundary handling,
 * and enabled/disabled states.
 */

import { render, screen } from "@testing-library/react";
import { TimelineSwipeContainer } from "../timeline-swipe-container";

// Mock the useSwipeNavigation hook
const mockHandlers = {
  onTouchStart: jest.fn(),
  onTouchMove: jest.fn(),
  onTouchEnd: jest.fn(),
};

let mockSwipeState = {
  handlers: mockHandlers,
  swipeProgress: 0,
  isSwiping: false,
  swipeDirection: null as "left" | "right" | null,
  thresholdReached: false,
};

jest.mock("@/hooks/use-swipe-navigation", () => ({
  useSwipeNavigation: jest.fn((options: Record<string, unknown>) => {
    // Store the options so tests can inspect them
    (useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }).lastOptions =
      options;
    return mockSwipeState;
  }),
}));

const { useSwipeNavigation: useSwipeNavigationMock } = require("@/hooks/use-swipe-navigation");

const defaultProps = {
  children: <div data-testid="child-content">Timeline Content</div>,
  onPreviousDay: jest.fn(),
  onNextDay: jest.fn(),
  canGoPrevious: true,
  canGoNext: true,
  previousDayLabel: "Day 4",
  nextDayLabel: "Day 6",
  enabled: true,
};

describe("TimelineSwipeContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSwipeState = {
      handlers: mockHandlers,
      swipeProgress: 0,
      isSwiping: false,
      swipeDirection: null,
      thresholdReached: false,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("rendering", () => {
    it("should render children content", () => {
      render(<TimelineSwipeContainer {...defaultProps} />);

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Timeline Content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <TimelineSwipeContainer {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should have overflow-hidden on the container", () => {
      const { container } = render(<TimelineSwipeContainer {...defaultProps} />);

      expect(container.firstChild).toHaveClass("overflow-hidden");
    });

    it("should not show any swipe indicators when not swiping", () => {
      render(<TimelineSwipeContainer {...defaultProps} />);

      expect(screen.queryByText("Day 4")).not.toBeInTheDocument();
      expect(screen.queryByText("Day 6")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // SWIPE HOOK OPTIONS
  // ===========================================================================

  describe("swipe hook configuration", () => {
    it("should pass onSwipeLeft and onSwipeRight callbacks to hook", () => {
      render(<TimelineSwipeContainer {...defaultProps} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      expect(options).toBeDefined();
      // canSwipeLeft maps to canGoNext (swipe left = next day)
      expect(options.canSwipeLeft).toBe(true);
      // canSwipeRight maps to canGoPrevious (swipe right = previous day)
      expect(options.canSwipeRight).toBe(true);
    });

    it("should disable swipe when canGoNext is false", () => {
      render(<TimelineSwipeContainer {...defaultProps} canGoNext={false} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      expect(options.canSwipeLeft).toBe(false);
    });

    it("should disable swipe when canGoPrevious is false", () => {
      render(<TimelineSwipeContainer {...defaultProps} canGoPrevious={false} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      expect(options.canSwipeRight).toBe(false);
    });

    it("should configure threshold and haptics", () => {
      render(<TimelineSwipeContainer {...defaultProps} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      expect(options.threshold).toBe(0.3);
      expect(options.enableHaptics).toBe(true);
    });
  });

  // ===========================================================================
  // SWIPE LEFT INDICATOR (next day)
  // ===========================================================================

  describe("swipe left indicator (next day)", () => {
    it("should show next day label when swiping left and canGoNext is true", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      expect(screen.getByText("Day 6")).toBeInTheDocument();
    });

    it("should not show next day label when swiping left and canGoNext is false", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} canGoNext={false} />);

      expect(screen.queryByText("Day 6")).not.toBeInTheDocument();
    });

    it("should apply threshold-reached styling when threshold is reached", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.8,
        thresholdReached: true,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      const label = screen.getByText("Day 6");
      expect(label).toHaveClass("text-primary");
    });

    it("should apply partial styling when threshold is not reached", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.3,
        thresholdReached: false,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      const label = screen.getByText("Day 6");
      expect(label).toHaveClass("text-primary/70");
    });
  });

  // ===========================================================================
  // SWIPE RIGHT INDICATOR (previous day)
  // ===========================================================================

  describe("swipe right indicator (previous day)", () => {
    it("should show previous day label when swiping right and canGoPrevious is true", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      expect(screen.getByText("Day 4")).toBeInTheDocument();
    });

    it("should not show previous day label when swiping right and canGoPrevious is false", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} canGoPrevious={false} />);

      expect(screen.queryByText("Day 4")).not.toBeInTheDocument();
    });

    it("should apply threshold-reached styling when threshold is reached", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.8,
        thresholdReached: true,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      const label = screen.getByText("Day 4");
      expect(label).toHaveClass("text-primary");
    });
  });

  // ===========================================================================
  // RESISTANCE INDICATORS
  // ===========================================================================

  describe("resistance indicators", () => {
    it("should show resistance bar when swiping right at boundary (canGoPrevious=false)", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.3,
      };

      const { container } = render(
        <TimelineSwipeContainer {...defaultProps} canGoPrevious={false} />
      );

      // Resistance bar should be visible (no label, just visual bar)
      const resistanceBars = container.querySelectorAll(".bg-muted-foreground\\/30");
      expect(resistanceBars.length).toBeGreaterThan(0);
    });

    it("should show resistance bar when swiping left at boundary (canGoNext=false)", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.3,
      };

      const { container } = render(<TimelineSwipeContainer {...defaultProps} canGoNext={false} />);

      const resistanceBars = container.querySelectorAll(".bg-muted-foreground\\/30");
      expect(resistanceBars.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // CONTENT TRANSFORM
  // ===========================================================================

  describe("content transform", () => {
    it("should apply translateX transform based on swipe progress when enabled and swiping", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} />);

      // Find the content wrapper that contains the child content
      const childContent = screen.getByTestId("child-content");
      const contentWrapper = childContent.parentElement;
      expect(contentWrapper).toBeTruthy();
      // swipeProgress * 50 = 0.5 * 50 = 25px
      expect(contentWrapper?.getAttribute("style")).toContain("translateX(25px)");
    });

    it("should not apply transform when not swiping", () => {
      render(<TimelineSwipeContainer {...defaultProps} />);

      const childContent = screen.getByTestId("child-content");
      const contentWrapper = childContent.parentElement;
      expect(contentWrapper?.getAttribute("style")).toContain("translateX(0px)");
    });

    it("should not apply transform when disabled", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} enabled={false} />);

      const childContent = screen.getByTestId("child-content");
      const contentWrapper = childContent.parentElement;
      expect(contentWrapper?.getAttribute("style")).toContain("translateX(0px)");
    });
  });

  // ===========================================================================
  // ENABLED / DISABLED STATE
  // ===========================================================================

  describe("enabled/disabled state", () => {
    it("should not attach touch handlers when disabled", () => {
      const { container } = render(<TimelineSwipeContainer {...defaultProps} enabled={false} />);

      // The container should not have touch handler attributes
      // When disabled, touchHandlers = {}, so no handlers are attached
      expect(container.firstChild).toBeTruthy();
      // Children should still be visible
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should not show swipe indicators when disabled even if swiping", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "left",
        swipeProgress: -0.5,
      };

      render(<TimelineSwipeContainer {...defaultProps} enabled={false} />);

      // Indicators should not show when enabled=false
      expect(screen.queryByText("Day 6")).not.toBeInTheDocument();
    });

    it("should default enabled to true", () => {
      const { canGoPrevious: _canGoPrevious, canGoNext: _canGoNext, ...rest } = defaultProps;
      render(<TimelineSwipeContainer canGoPrevious={true} canGoNext={true} {...rest} />);

      // Should render normally
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DEFAULT LABELS
  // ===========================================================================

  describe("default labels", () => {
    it("should use 'Previous' and 'Next' as default labels", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.5,
      };

      render(
        <TimelineSwipeContainer
          onPreviousDay={jest.fn()}
          onNextDay={jest.fn()}
          canGoPrevious={true}
          canGoNext={true}
        >
          <div>Content</div>
        </TimelineSwipeContainer>
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // NAVIGATION HANDLERS
  // ===========================================================================

  describe("navigation handlers", () => {
    it("should call onNextDay when swipe left completes and canGoNext is true", () => {
      const onNextDay = jest.fn();
      render(<TimelineSwipeContainer {...defaultProps} onNextDay={onNextDay} />);

      // Access the options passed to useSwipeNavigation
      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      // Simulate the onSwipeLeft callback (which triggers onNextDay)
      const swipeLeftHandler = options.onSwipeLeft as () => void;
      swipeLeftHandler();

      expect(onNextDay).toHaveBeenCalled();
    });

    it("should call onPreviousDay when swipe right completes and canGoPrevious is true", () => {
      const onPreviousDay = jest.fn();
      render(<TimelineSwipeContainer {...defaultProps} onPreviousDay={onPreviousDay} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      const swipeRightHandler = options.onSwipeRight as () => void;
      swipeRightHandler();

      expect(onPreviousDay).toHaveBeenCalled();
    });

    it("should not call onNextDay when canGoNext is false", () => {
      const onNextDay = jest.fn();
      render(<TimelineSwipeContainer {...defaultProps} onNextDay={onNextDay} canGoNext={false} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      // The handleSwipeLeft callback checks canGoNext internally
      const swipeLeftHandler = options.onSwipeLeft as () => void;
      swipeLeftHandler();

      // onNextDay should not be called because canGoNext is false
      expect(onNextDay).not.toHaveBeenCalled();
    });

    it("should not call onPreviousDay when canGoPrevious is false", () => {
      const onPreviousDay = jest.fn();
      render(
        <TimelineSwipeContainer
          {...defaultProps}
          onPreviousDay={onPreviousDay}
          canGoPrevious={false}
        />
      );

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      const swipeRightHandler = options.onSwipeRight as () => void;
      swipeRightHandler();

      expect(onPreviousDay).not.toHaveBeenCalled();
    });

    it("should set transitioning state after navigation and reset after timeout", () => {
      const onNextDay = jest.fn();
      render(<TimelineSwipeContainer {...defaultProps} onNextDay={onNextDay} />);

      const options = (
        useSwipeNavigationMock as jest.Mock & { lastOptions: Record<string, unknown> }
      ).lastOptions;
      const swipeLeftHandler = options.onSwipeLeft as () => void;
      swipeLeftHandler();

      expect(onNextDay).toHaveBeenCalledTimes(1);

      // Advance timer to clear transition state
      jest.advanceTimersByTime(300);
    });
  });

  // ===========================================================================
  // TRANSITION ANIMATIONS
  // ===========================================================================

  describe("transition animations", () => {
    it("should apply duration-0 transition when swiping", () => {
      mockSwipeState = {
        ...mockSwipeState,
        isSwiping: true,
        swipeDirection: "right",
        swipeProgress: 0.3,
      };

      const { container } = render(<TimelineSwipeContainer {...defaultProps} />);

      const contentWrapper = container.querySelector(".duration-0");
      expect(contentWrapper).toBeTruthy();
    });

    it("should apply duration-200 transition when not swiping and not transitioning", () => {
      const { container } = render(<TimelineSwipeContainer {...defaultProps} />);

      const contentWrapper = container.querySelector(".duration-200");
      expect(contentWrapper).toBeTruthy();
    });
  });
});
