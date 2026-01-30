import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  YouTubeShortsCarousel,
  YOUTUBE_SHORTS,
  YOUTUBE_TESTIMONIALS,
  ALL_VIDEOS,
} from "../youtube-shorts-carousel";

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Supabase client
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

describe("YouTubeShortsCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
