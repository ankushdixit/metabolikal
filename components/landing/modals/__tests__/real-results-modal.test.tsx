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
  }) {
    return <img alt={props.alt} src={props.src} data-testid="mock-image" />;
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
    // Title contains "Real People." and "Real Transformations."
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders YouTube section heading", () => {
    render(<RealResultsModal {...defaultProps} />);
    expect(screen.getByText("Watch Real Client Transformations")).toBeInTheDocument();
  });

  it("renders YouTube video embeds", () => {
    render(<RealResultsModal {...defaultProps} />);
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(3);
  });

  it("renders main transformation results image", () => {
    render(<RealResultsModal {...defaultProps} />);
    const image = screen.getByAltText("Client transformations");
    expect(image).toBeInTheDocument();
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

  it("does not render when closed", () => {
    render(<RealResultsModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Real People.")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<RealResultsModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
