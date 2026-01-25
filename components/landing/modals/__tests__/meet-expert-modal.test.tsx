import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetExpertModal } from "../meet-expert-modal";

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

describe("MeetExpertModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onOpenCalendly: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal title", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByText("Meet Your Expert")).toBeInTheDocument();
  });

  it("renders expert photo", () => {
    render(<MeetExpertModal {...defaultProps} />);
    const image = screen.getByAltText("Shivashish Sinha");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/shivashish.webp");
  });

  it("renders expert name and title", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByText("Shivashish Sinha")).toBeInTheDocument();
    expect(screen.getByText("Founder & Metabolic Transformation Specialist")).toBeInTheDocument();
  });

  it("renders personal quote", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByText(/Fat loss isn.t about eating less/i)).toBeInTheDocument();
  });

  it("renders three paragraphs of personal story", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByText(/I was exactly where you are/i)).toBeInTheDocument();
    expect(screen.getByText(/Your metabolism isn.t broken. Your rhythm is./i)).toBeInTheDocument();
    expect(screen.getByText(/This revelation led to my own transformation/i)).toBeInTheDocument();
  });

  it("renders credentials table", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByText("Specialization")).toBeInTheDocument();
    expect(
      screen.getByText("High-Performing Professionals | Executive Health")
    ).toBeInTheDocument();
    expect(screen.getByText("Philosophy")).toBeInTheDocument();
    expect(screen.getByText("Reset Your Rhythm, Reclaim Your Life")).toBeInTheDocument();
  });

  it("renders social links for Instagram and YouTube", () => {
    render(<MeetExpertModal {...defaultProps} />);
    const instagramLink = screen.getByRole("link", {
      name: /Follow My Journey/i,
    });
    const youtubeLink = screen.getByRole("link", {
      name: /Watch, Learn & Level Up/i,
    });

    expect(instagramLink).toHaveAttribute("href", "https://www.instagram.com/metabolikal");
    expect(youtubeLink).toHaveAttribute("href", "https://www.youtube.com/@Metabolikal_1");
  });

  it("renders CTA button 'Reset your Rhythm'", () => {
    render(<MeetExpertModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Reset your Rhythm/i })).toBeInTheDocument();
  });

  it("CTA opens Calendly modal", async () => {
    const user = userEvent.setup();
    render(<MeetExpertModal {...defaultProps} />);

    const ctaButton = screen.getByRole("button", { name: /Reset your Rhythm/i });
    await user.click(ctaButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(<MeetExpertModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Meet Your Expert")).not.toBeInTheDocument();
  });
});
