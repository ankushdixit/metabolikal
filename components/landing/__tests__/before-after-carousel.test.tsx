import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BeforeAfterCarousel } from "../before-after-carousel";

// Mock transformation data for tests (using the transformed format that the component expects)
const MOCK_TRANSFORMATIONS = [
  {
    id: "transformation-1",
    clientName: "Shivashish S.",
    profession: "Metabolikal Founder",
    duration: "90 days",
    result: "Went from 25% to 15% body fat. Lost 4kg fat",
    beforeImage: "/images/transformations/client1-before.jpg",
    afterImage: "/images/transformations/client1-after.jpg",
  },
  {
    id: "transformation-2",
    clientName: "Sandeep",
    profession: "Lead Engineer",
    duration: "3 months",
    result: "Gained 7.5kg",
    beforeImage: "/images/transformations/client2-before.jpg",
    afterImage: "/images/transformations/client2-after.jpg",
  },
  {
    id: "transformation-3",
    clientName: "Sumedha",
    profession: "IT Professional",
    duration: "16 weeks",
    result: "Lost 10kg",
    beforeImage: "/images/transformations/client3-before.jpg",
    afterImage: "/images/transformations/client3-after.jpg",
  },
];

// Database format data for mocking supabase response
const MOCK_DB_DATA = [
  {
    id: "transformation-1",
    client_name: "Shivashish S.",
    profession: "Metabolikal Founder",
    duration: "90 days",
    result: "Went from 25% to 15% body fat. Lost 4kg fat",
    before_image_url: "/images/transformations/client1-before.jpg",
    after_image_url: "/images/transformations/client1-after.jpg",
    display_order: 1,
    is_active: true,
  },
  {
    id: "transformation-2",
    client_name: "Sandeep",
    profession: "Lead Engineer",
    duration: "3 months",
    result: "Gained 7.5kg",
    before_image_url: "/images/transformations/client2-before.jpg",
    after_image_url: "/images/transformations/client2-after.jpg",
    display_order: 2,
    is_active: true,
  },
  {
    id: "transformation-3",
    client_name: "Sumedha",
    profession: "IT Professional",
    duration: "16 weeks",
    result: "Lost 10kg",
    before_image_url: "/images/transformations/client3-before.jpg",
    after_image_url: "/images/transformations/client3-after.jpg",
    display_order: 3,
    is_active: true,
  },
];

// Mock Supabase client to return our mock data
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: MOCK_DB_DATA, error: null })),
        })),
      })),
    })),
  })),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
    onError?: () => void;
  }) {
    return (
      <img
        alt={props.alt}
        src={props.src}
        data-testid="mock-image"
        className={props.className}
        onError={props.onError}
      />
    );
  },
}));

describe("BeforeAfterCarousel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the carousel container with correct aria attributes", () => {
    render(<BeforeAfterCarousel />);
    const carousel = screen.getByRole("region", {
      name: /before and after transformation gallery/i,
    });
    expect(carousel).toBeInTheDocument();
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("renders navigation arrows", () => {
    render(<BeforeAfterCarousel />);
    expect(screen.getByLabelText("Previous transformation")).toBeInTheDocument();
    expect(screen.getByLabelText("Next transformation")).toBeInTheDocument();
  });

  it("renders dot indicators for all transformations", async () => {
    render(<BeforeAfterCarousel />);
    await waitFor(() => {
      const dots = screen.getAllByRole("tab");
      expect(dots.length).toBe(MOCK_TRANSFORMATIONS.length);
    });
  });

  it("shows first transformation by default", async () => {
    render(<BeforeAfterCarousel />);
    await waitFor(() => {
      const firstClient = MOCK_TRANSFORMATIONS[0];
      expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();
    });
    // Check that the result text is in the document (wrapped in quotes)
    const carouselContent = screen.getByRole("group", { name: /Transformation 1 of/i });
    expect(carouselContent.textContent).toContain(MOCK_TRANSFORMATIONS[0].result);
  });

  it("navigates to next transformation when clicking next button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    expect(screen.getByText(MOCK_TRANSFORMATIONS[1].clientName)).toBeInTheDocument();
  });

  it("navigates to previous transformation when clicking previous button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Go to second slide first
    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    // Then go back
    const prevButton = screen.getByLabelText("Previous transformation");
    await user.click(prevButton);

    expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
  });

  it("wraps around to last slide when clicking previous on first slide", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    const prevButton = screen.getByLabelText("Previous transformation");
    await user.click(prevButton);

    expect(
      screen.getByText(MOCK_TRANSFORMATIONS[MOCK_TRANSFORMATIONS.length - 1].clientName)
    ).toBeInTheDocument();
  });

  it("wraps around to first slide when clicking next on last slide", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Navigate to the last slide
    const nextButton = screen.getByLabelText("Next transformation");
    for (let i = 0; i < MOCK_TRANSFORMATIONS.length; i++) {
      await user.click(nextButton);
    }

    // Should be back at first slide
    expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
  });

  it("navigates to specific slide when clicking dot indicator", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      const dots = screen.getAllByRole("tab");
      expect(dots.length).toBe(MOCK_TRANSFORMATIONS.length);
    });

    const dots = screen.getAllByRole("tab");
    await user.click(dots[2]); // Click third dot

    expect(screen.getByText(MOCK_TRANSFORMATIONS[2].clientName)).toBeInTheDocument();
  });

  it("updates dot indicator aria-selected when navigating", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      const dots = screen.getAllByRole("tab");
      expect(dots.length).toBe(MOCK_TRANSFORMATIONS.length);
    });

    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
    expect(dots[1]).toHaveAttribute("aria-selected", "false");

    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    expect(dots[0]).toHaveAttribute("aria-selected", "false");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
  });

  it("responds to keyboard left arrow navigation", async () => {
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Press left arrow (should go to last slide)
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(
      screen.getByText(MOCK_TRANSFORMATIONS[MOCK_TRANSFORMATIONS.length - 1].clientName)
    ).toBeInTheDocument();
  });

  it("responds to keyboard right arrow navigation", async () => {
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Press right arrow
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText(MOCK_TRANSFORMATIONS[1].clientName)).toBeInTheDocument();
  });

  it("renders before and after images", async () => {
    render(<BeforeAfterCarousel />);
    await waitFor(() => {
      const images = screen.getAllByTestId("mock-image");
      expect(images.length).toBe(2); // Before and After images
    });
  });

  it("renders before and after labels", async () => {
    render(<BeforeAfterCarousel />);
    await waitFor(() => {
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });
  });

  it("displays client profession and duration", async () => {
    render(<BeforeAfterCarousel />);
    const firstClient = MOCK_TRANSFORMATIONS[0];
    await waitFor(() => {
      expect(screen.getByText(firstClient.duration)).toBeInTheDocument();
      expect(screen.getByText(firstClient.profession)).toBeInTheDocument();
    });
  });

  it("applies custom className when provided", () => {
    const { container } = render(<BeforeAfterCarousel className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("auto-advances when autoAdvanceInterval is set", async () => {
    render(<BeforeAfterCarousel autoAdvanceInterval={5000} />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText(MOCK_TRANSFORMATIONS[1].clientName)).toBeInTheDocument();
  });

  it("does not auto-advance when autoAdvanceInterval is 0", async () => {
    render(<BeforeAfterCarousel autoAdvanceInterval={0} />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
    });

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should still be on first slide
    expect(screen.getByText(MOCK_TRANSFORMATIONS[0].clientName)).toBeInTheDocument();
  });

  it("announces slide changes for screen readers", async () => {
    render(<BeforeAfterCarousel />);
    await waitFor(() => {
      const announcement = screen.getByText(/Showing transformation 1 of/i);
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveClass("sr-only");
      expect(announcement).toHaveAttribute("aria-live", "polite");
    });
  });

  it("handles image error gracefully with fallback", async () => {
    render(<BeforeAfterCarousel />);

    await waitFor(() => {
      const images = screen.getAllByTestId("mock-image");
      expect(images.length).toBe(2);
    });

    const images = screen.getAllByTestId("mock-image");

    // Trigger error on before image
    fireEvent.error(images[0]);

    // Should show fallback UI (the emoji placeholder replaces the image)
    // The "Before" label still exists in the DOM
    const beforeLabels = screen.getAllByText("Before");
    expect(beforeLabels.length).toBeGreaterThan(0);
  });
});
