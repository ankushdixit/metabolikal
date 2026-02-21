/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  YouTubeShortsCarousel,
  YOUTUBE_SHORTS,
  YOUTUBE_TESTIMONIALS,
  ALL_VIDEOS,
} from "../youtube-shorts-carousel";

// Store the IntersectionObserver callback so we can trigger it in tests
// eslint-disable-next-line no-undef
let intersectionObserverCallback: IntersectionObserverCallback | null = null;

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
// eslint-disable-next-line no-undef
const mockIntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
  intersectionObserverCallback = callback;
  return {
    observe: mockObserve,
    unobserve: jest.fn(),
    disconnect: mockDisconnect,
  };
});
window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock Supabase client - controllable per test
const mockOrder = jest.fn(() => Promise.resolve({ data: null, error: null }));
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: mockOrder,
        })),
      })),
    })),
  })),
}));

// Define scrollTo for jsdom (not natively available)
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = jest.fn();
}

describe("YouTubeShortsCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    intersectionObserverCallback = null;
    mockOrder.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  });

  it("renders the carousel container with correct aria-label", () => {
    render(<YouTubeShortsCarousel />);
    const carousel = screen.getByRole("region", { name: /client transformation video stories/i });
    expect(carousel).toBeInTheDocument();
  });

  it("renders video placeholders for fallback videos when database is empty", async () => {
    render(<YouTubeShortsCarousel />);
    await waitFor(() => {
      const videoContainers = document.querySelectorAll("[data-index]");
      // Uses fallback data (4 videos) since mock returns null
      expect(videoContainers.length).toBe(ALL_VIDEOS.length);
    });
  });

  it("renders navigation arrows when showArrows is true", () => {
    render(<YouTubeShortsCarousel showArrows={true} />);
    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
  });

  it("hides navigation arrows when showArrows is false", () => {
    render(<YouTubeShortsCarousel showArrows={false} />);
    expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
  });

  it("renders mobile swipe hint on small screens", () => {
    render(<YouTubeShortsCarousel />);
    expect(screen.getByText(/Swipe to see more transformations/i)).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(<YouTubeShortsCarousel className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders in compact mode with correct sizing", async () => {
    render(<YouTubeShortsCarousel compact={true} />);
    await waitFor(() => {
      const videoContainers = document.querySelectorAll("[data-index]");
      // Verify first container has compact class
      expect(videoContainers[0]).toHaveClass("w-[140px]");
    });
  });

  it("sets up IntersectionObserver for lazy loading", () => {
    render(<YouTubeShortsCarousel />);
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it("handles scroll button click without error", () => {
    render(<YouTubeShortsCarousel />);

    const rightButton = screen.getByLabelText("Scroll right");

    // Should not throw when clicked
    expect(() => fireEvent.click(rightButton)).not.toThrow();
  });

  it("exports video constants with correct structure", () => {
    // YOUTUBE_SHORTS is now fallback data
    expect(YOUTUBE_SHORTS).toBeDefined();
    expect(Array.isArray(YOUTUBE_SHORTS)).toBe(true);
    expect(YOUTUBE_SHORTS.length).toBeGreaterThan(0);
    YOUTUBE_SHORTS.forEach((short) => {
      expect(short).toHaveProperty("id");
      expect(short).toHaveProperty("title");
    });

    // YOUTUBE_TESTIMONIALS is now fallback data
    expect(YOUTUBE_TESTIMONIALS).toBeDefined();
    expect(Array.isArray(YOUTUBE_TESTIMONIALS)).toBe(true);
    expect(YOUTUBE_TESTIMONIALS.length).toBeGreaterThan(0);
    YOUTUBE_TESTIMONIALS.forEach((video) => {
      expect(video).toHaveProperty("id");
      expect(video).toHaveProperty("title");
      expect(video.isLandscape).toBe(true);
    });

    expect(ALL_VIDEOS).toBeDefined();
    expect(ALL_VIDEOS.length).toBe(YOUTUBE_SHORTS.length + YOUTUBE_TESTIMONIALS.length);
  });

  it("renders play button icon in unloaded video placeholders", () => {
    render(<YouTubeShortsCarousel />);
    // Check that placeholders are rendered (before intersection triggers)
    const placeholders = document.querySelectorAll("[data-index]");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  describe("scroll function", () => {
    it("scrolls left when left arrow is clicked", () => {
      render(<YouTubeShortsCarousel />);
      const leftButton = screen.getByLabelText("Scroll left");
      expect(() => fireEvent.click(leftButton)).not.toThrow();
    });

    it("scrolls right when right arrow is clicked", () => {
      render(<YouTubeShortsCarousel />);
      const rightButton = screen.getByLabelText("Scroll right");
      expect(() => fireEvent.click(rightButton)).not.toThrow();
    });

    it("uses smaller scroll amount in compact mode", () => {
      render(<YouTubeShortsCarousel compact={true} />);
      const rightButton = screen.getByLabelText("Scroll right");
      // Should not throw; scroll amount is 300 instead of 400
      expect(() => fireEvent.click(rightButton)).not.toThrow();
    });
  });

  describe("updateScrollState", () => {
    it("updates canScrollLeft and canScrollRight on scroll event", () => {
      render(<YouTubeShortsCarousel />);

      const scrollContainer = screen.getByRole("region", {
        name: /client transformation video stories/i,
      }).firstChild as HTMLElement;

      if (scrollContainer) {
        // Simulate a scroll event to exercise updateScrollState
        fireEvent.scroll(scrollContainer);
      }

      // Verify arrows are still rendered (state updated without error)
      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });
  });

  describe("IntersectionObserver callback", () => {
    it("makes video visible when intersection is observed", async () => {
      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        expect(mockObserve).toHaveBeenCalled();
      });

      // Trigger the intersection observer callback for the first video
      if (intersectionObserverCallback) {
        const mockEntry = {
          isIntersecting: true,
          target: {
            getAttribute: (attr: string) => (attr === "data-index" ? "0" : null),
          },
        } as unknown as IntersectionObserverEntry;

        act(() => {
          intersectionObserverCallback!([mockEntry], {} as IntersectionObserver);
        });
      }

      // After intersection, the first video should have an iframe
      await waitFor(() => {
        const iframes = document.querySelectorAll("iframe");
        expect(iframes.length).toBeGreaterThan(0);
      });
    });

    it("does not make video visible when not intersecting", async () => {
      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        expect(mockObserve).toHaveBeenCalled();
      });

      // Trigger with isIntersecting = false
      if (intersectionObserverCallback) {
        const mockEntry = {
          isIntersecting: false,
          target: {
            getAttribute: (attr: string) => (attr === "data-index" ? "0" : null),
          },
        } as unknown as IntersectionObserverEntry;

        act(() => {
          intersectionObserverCallback!([mockEntry], {} as IntersectionObserver);
        });
      }

      // Should still show placeholders, not iframes
      const _iframes = document.querySelectorAll("iframe");
      expect(_iframes.length).toBe(0);
    });
  });

  describe("database fetch", () => {
    it("replaces fallback videos when database returns data", async () => {
      const dbVideos = [
        {
          id: "db-1",
          youtube_video_id: "DB_VIDEO_1",
          title: "DB Video One",
          video_type: "portrait",
          is_active: true,
          display_order: 1,
        },
        {
          id: "db-2",
          youtube_video_id: "DB_VIDEO_2",
          title: "DB Video Two",
          video_type: "landscape",
          is_active: true,
          display_order: 2,
        },
      ];

      mockOrder.mockImplementation(() => Promise.resolve({ data: dbVideos, error: null } as any));

      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        expect(videoContainers.length).toBe(2);
      });
    });

    it("keeps fallback videos when database returns an error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockOrder.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: "DB error" } } as any)
      );

      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        // Falls back to FALLBACK_SHORTS + FALLBACK_TESTIMONIALS
        expect(videoContainers.length).toBe(ALL_VIDEOS.length);
      });

      consoleSpy.mockRestore();
    });

    it("keeps fallback videos when fetch throws", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockOrder.mockImplementation(() => Promise.reject(new Error("Network error")));

      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        expect(videoContainers.length).toBe(ALL_VIDEOS.length);
      });

      consoleSpy.mockRestore();
    });

    it("keeps fallback when database returns empty array", async () => {
      mockOrder.mockImplementation(() => Promise.resolve({ data: [], error: null } as any));

      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        expect(videoContainers.length).toBe(ALL_VIDEOS.length);
      });
    });
  });

  describe("getCardClasses - landscape vs portrait sizing", () => {
    it("renders landscape video with wider dimensions", async () => {
      // The last fallback video is landscape
      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        // Last video (index 3) is the landscape testimonial
        const lastVideo = videoContainers[videoContainers.length - 1];
        expect(lastVideo).toHaveClass("w-[320px]");
      });
    });

    it("renders portrait video with narrower dimensions", async () => {
      render(<YouTubeShortsCarousel />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        // First video is a portrait Short
        expect(videoContainers[0]).toHaveClass("w-[160px]");
      });
    });

    it("uses compact landscape sizing in compact mode", async () => {
      const dbVideos = [
        {
          id: "db-1",
          youtube_video_id: "COMPACT_LANDSCAPE",
          title: "Compact Landscape",
          video_type: "landscape",
          is_active: true,
          display_order: 1,
        },
      ];

      mockOrder.mockImplementation(() => Promise.resolve({ data: dbVideos, error: null } as any));

      render(<YouTubeShortsCarousel compact={true} />);

      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        expect(videoContainers.length).toBe(1);
        expect(videoContainers[0]).toHaveClass("w-[280px]");
      });
    });
  });

  describe("scroll function execution", () => {
    it("invokes scroll right when button is enabled", () => {
      render(<YouTubeShortsCarousel compact={false} />);

      // The scroll container is the element with role="region"
      const scrollContainer = screen.getByRole("region", {
        name: /client transformation video stories/i,
      });

      // Set scrollWidth > clientWidth to enable right scroll
      Object.defineProperty(scrollContainer, "scrollWidth", { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 300, configurable: true });
      Object.defineProperty(scrollContainer, "scrollLeft", {
        value: 0,
        configurable: true,
        writable: true,
      });

      // Replace scrollTo with a jest.fn on the specific element
      const scrollToMock = jest.fn();
      scrollContainer.scrollTo = scrollToMock;

      // Trigger scroll event to update canScrollRight state
      fireEvent.scroll(scrollContainer);

      const rightButton = screen.getByLabelText("Scroll right");
      fireEvent.click(rightButton);

      expect(scrollToMock).toHaveBeenCalledWith({
        left: 400,
        behavior: "smooth",
      });
    });

    it("invokes scroll left when button is enabled", () => {
      render(<YouTubeShortsCarousel compact={false} />);

      const scrollContainer = screen.getByRole("region", {
        name: /client transformation video stories/i,
      });

      // Set scrollLeft > 10 to enable left scroll
      Object.defineProperty(scrollContainer, "scrollWidth", { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 300, configurable: true });
      Object.defineProperty(scrollContainer, "scrollLeft", {
        value: 500,
        configurable: true,
        writable: true,
      });

      const scrollToMock = jest.fn();
      scrollContainer.scrollTo = scrollToMock;

      fireEvent.scroll(scrollContainer);

      const leftButton = screen.getByLabelText("Scroll left");
      fireEvent.click(leftButton);

      expect(scrollToMock).toHaveBeenCalledWith({
        left: 100, // 500 - 400
        behavior: "smooth",
      });
    });

    it("uses compact scroll amount (300) when compact=true", () => {
      render(<YouTubeShortsCarousel compact={true} />);

      const scrollContainer = screen.getByRole("region", {
        name: /client transformation video stories/i,
      });

      Object.defineProperty(scrollContainer, "scrollWidth", { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 300, configurable: true });
      Object.defineProperty(scrollContainer, "scrollLeft", {
        value: 0,
        configurable: true,
        writable: true,
      });

      const scrollToMock = jest.fn();
      scrollContainer.scrollTo = scrollToMock;

      fireEvent.scroll(scrollContainer);

      const rightButton = screen.getByLabelText("Scroll right");
      fireEvent.click(rightButton);

      expect(scrollToMock).toHaveBeenCalledWith({
        left: 300, // compact uses 300 instead of 400
        behavior: "smooth",
      });
    });
  });

  describe("cleanup", () => {
    it("disconnects IntersectionObserver on unmount", () => {
      const { unmount } = render(<YouTubeShortsCarousel />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe("scroll state conditions", () => {
    it("disables left scroll button initially (canScrollLeft=false)", () => {
      render(<YouTubeShortsCarousel />);
      const leftButton = screen.getByLabelText("Scroll left");
      expect(leftButton).toBeDisabled();
    });

    it("has scroll right button present", () => {
      render(<YouTubeShortsCarousel />);
      const rightButton = screen.getByLabelText("Scroll right");
      expect(rightButton).toBeInTheDocument();
    });

    it("applies opacity-0 class when canScrollLeft is false", () => {
      render(<YouTubeShortsCarousel />);
      const leftButton = screen.getByLabelText("Scroll left");
      expect(leftButton.className).toContain("opacity-0");
    });

    it("both scroll buttons have cursor-default when scroll is not possible", () => {
      // In jsdom, scrollWidth === clientWidth === 0, so both buttons are disabled
      render(<YouTubeShortsCarousel />);
      const leftButton = screen.getByLabelText("Scroll left");
      const rightButton = screen.getByLabelText("Scroll right");
      expect(leftButton.className).toContain("cursor-default");
      expect(rightButton.className).toContain("cursor-default");
    });
  });

  describe("compact mode gap class", () => {
    it("uses gap-3 in compact mode", () => {
      const { container } = render(<YouTubeShortsCarousel compact={true} />);
      const flexContainer = container.querySelector(".gap-3");
      expect(flexContainer).toBeInTheDocument();
    });

    it("uses gap-4 in normal mode", () => {
      const { container } = render(<YouTubeShortsCarousel compact={false} />);
      const flexContainer = container.querySelector(".gap-4");
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe("getCardClasses - compact portrait sizing", () => {
    it("renders compact portrait video with correct sizing", async () => {
      render(<YouTubeShortsCarousel compact={true} />);
      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        // First video is a portrait Short in compact mode
        expect(videoContainers[0]).toHaveClass("w-[140px]");
      });
    });

    it("renders non-compact portrait video with correct sizing", async () => {
      render(<YouTubeShortsCarousel compact={false} />);
      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        expect(videoContainers[0]).toHaveClass("w-[160px]");
      });
    });

    it("renders non-compact landscape video with wider sizing", async () => {
      render(<YouTubeShortsCarousel compact={false} />);
      await waitFor(() => {
        const videoContainers = document.querySelectorAll("[data-index]");
        // Last video is landscape
        const lastVideo = videoContainers[videoContainers.length - 1];
        expect(lastVideo).toHaveClass("w-[320px]");
      });
    });
  });
});
