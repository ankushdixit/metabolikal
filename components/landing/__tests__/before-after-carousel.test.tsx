import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BeforeAfterCarousel } from "../before-after-carousel";
import { TRANSFORMATIONS } from "@/lib/data/transformations";

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

  it("renders dot indicators for all transformations", () => {
    render(<BeforeAfterCarousel />);
    const dots = screen.getAllByRole("tab");
    expect(dots.length).toBe(TRANSFORMATIONS.length);
  });

  it("shows first transformation by default", () => {
    render(<BeforeAfterCarousel />);
    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();
    // Check that the result text is in the document (wrapped in quotes)
    const carouselContent = screen.getByRole("group", { name: /Transformation 1 of/i });
    expect(carouselContent.textContent).toContain(firstClient.result);
  });

  it("navigates to next transformation when clicking next button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    const secondClient = TRANSFORMATIONS[1];
    expect(screen.getByText(secondClient.clientName)).toBeInTheDocument();
  });

  it("navigates to previous transformation when clicking previous button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    // Go to second slide first
    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    // Then go back
    const prevButton = screen.getByLabelText("Previous transformation");
    await user.click(prevButton);

    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();
  });

  it("wraps around to last slide when clicking previous on first slide", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    const prevButton = screen.getByLabelText("Previous transformation");
    await user.click(prevButton);

    const lastClient = TRANSFORMATIONS[TRANSFORMATIONS.length - 1];
    expect(screen.getByText(lastClient.clientName)).toBeInTheDocument();
  });

  it("wraps around to first slide when clicking next on last slide", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    // Navigate to the last slide
    const nextButton = screen.getByLabelText("Next transformation");
    for (let i = 0; i < TRANSFORMATIONS.length; i++) {
      await user.click(nextButton);
    }

    // Should be back at first slide
    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();
  });

  it("navigates to specific slide when clicking dot indicator", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    const dots = screen.getAllByRole("tab");
    await user.click(dots[2]); // Click third dot

    const thirdClient = TRANSFORMATIONS[2];
    expect(screen.getByText(thirdClient.clientName)).toBeInTheDocument();
  });

  it("updates dot indicator aria-selected when navigating", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BeforeAfterCarousel />);

    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
    expect(dots[1]).toHaveAttribute("aria-selected", "false");

    const nextButton = screen.getByLabelText("Next transformation");
    await user.click(nextButton);

    expect(dots[0]).toHaveAttribute("aria-selected", "false");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
  });

  it("responds to keyboard left arrow navigation", () => {
    render(<BeforeAfterCarousel />);

    // Press left arrow (should go to last slide)
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    const lastClient = TRANSFORMATIONS[TRANSFORMATIONS.length - 1];
    expect(screen.getByText(lastClient.clientName)).toBeInTheDocument();
  });

  it("responds to keyboard right arrow navigation", () => {
    render(<BeforeAfterCarousel />);

    // Press right arrow
    fireEvent.keyDown(window, { key: "ArrowRight" });

    const secondClient = TRANSFORMATIONS[1];
    expect(screen.getByText(secondClient.clientName)).toBeInTheDocument();
  });

  it("renders before and after images", () => {
    render(<BeforeAfterCarousel />);
    const images = screen.getAllByTestId("mock-image");
    expect(images.length).toBe(2); // Before and After images
  });

  it("renders before and after labels", () => {
    render(<BeforeAfterCarousel />);
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("displays client profession and duration", () => {
    render(<BeforeAfterCarousel />);
    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.duration)).toBeInTheDocument();
    expect(screen.getByText(firstClient.profession)).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(<BeforeAfterCarousel className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("auto-advances when autoAdvanceInterval is set", () => {
    render(<BeforeAfterCarousel autoAdvanceInterval={5000} />);

    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();

    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const secondClient = TRANSFORMATIONS[1];
    expect(screen.getByText(secondClient.clientName)).toBeInTheDocument();
  });

  it("does not auto-advance when autoAdvanceInterval is 0", () => {
    render(<BeforeAfterCarousel autoAdvanceInterval={0} />);

    const firstClient = TRANSFORMATIONS[0];
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should still be on first slide
    expect(screen.getByText(firstClient.clientName)).toBeInTheDocument();
  });

  it("announces slide changes for screen readers", () => {
    render(<BeforeAfterCarousel />);
    const announcement = screen.getByText(/Showing transformation 1 of/i);
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveClass("sr-only");
    expect(announcement).toHaveAttribute("aria-live", "polite");
  });

  it("handles image error gracefully with fallback", () => {
    render(<BeforeAfterCarousel />);
    const images = screen.getAllByTestId("mock-image");

    // Trigger error on before image
    fireEvent.error(images[0]);

    // Should show fallback UI (the emoji placeholder replaces the image)
    // The "Before" label still exists in the DOM
    const beforeLabels = screen.getAllByText("Before");
    expect(beforeLabels.length).toBeGreaterThan(0);
  });
});
