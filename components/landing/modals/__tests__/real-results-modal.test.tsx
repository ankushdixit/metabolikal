import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RealResultsModal } from "../real-results-modal";

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

describe("RealResultsModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Title contains "Transformation" and "Gallery"
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Transformation")).toBeInTheDocument();
    expect(screen.getByText("Gallery")).toBeInTheDocument();
  });

  it("renders modal description", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(
      screen.getByText(/See the incredible before & after transformations/i)
    ).toBeInTheDocument();
  });

  it("renders Before & After Results section heading", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.getByText("Before & After Results")).toBeInTheDocument();
  });

  it("renders Before/After carousel", () => {
    render(<RealResultsModal {...defaultProps} />);
    // The carousel should be present with navigation
    expect(
      screen.getByRole("region", { name: /before and after transformation gallery/i })
    ).toBeInTheDocument();
  });

  it("does not render Client Testimonials section (moved to landing page)", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.queryByText("Client Testimonials")).not.toBeInTheDocument();
    // No YouTube videos in modal - they've been moved to the landing page
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(0);
  });

  it("renders three Instagram cards", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.getByText("Before & After Stories")).toBeInTheDocument();
    expect(screen.getByText("Client Wins")).toBeInTheDocument();
    expect(screen.getByText("Learn & Level Up")).toBeInTheDocument();
  });

  it("renders Instagram card descriptions", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(
      screen.getByText("Real clients, real results, real transformations")
    ).toBeInTheDocument();
    expect(screen.getByText("Daily posts of metabolic breakthroughs")).toBeInTheDocument();
    expect(screen.getByText("Metabolic tips & transformation strategies")).toBeInTheDocument();
  });

  it("renders Instagram follow button with correct link", () => {
    render(<RealResultsModal {...defaultProps} />);
    const instagramLink = screen.getByRole("link", {
      name: /Follow @metabolikal for Daily Transformations/i,
    });
    expect(instagramLink).toHaveAttribute("href", "https://www.instagram.com/metabolikal");
    expect(instagramLink).toHaveAttribute("target", "_blank");
    expect(instagramLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Connect With Our Community section", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.getByText("Connect With Our Community")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<RealResultsModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Transformation")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<RealResultsModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render any YouTube video sections (all moved to landing page)", () => {
    render(<RealResultsModal {...defaultProps} />);
    // The YouTube Shorts "Client Transformation Stories" section should no longer exist
    expect(screen.queryByText("Client Transformation Stories")).not.toBeInTheDocument();
    // The Client Testimonials section should no longer exist either
    expect(screen.queryByText("Client Testimonials")).not.toBeInTheDocument();
    // No iframes at all - all videos are on landing page now
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(0);
  });
});
