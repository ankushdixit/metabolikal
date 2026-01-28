import { render, screen } from "@testing-library/react";
import { Footer } from "../footer";
import { ModalProvider } from "@/contexts/modal-context";

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ModalProvider>{ui}</ModalProvider>);
};

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

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Landing Footer Component", () => {
  it("renders the footer element", () => {
    const { container } = renderWithProvider(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the logo with METABOLIKAL text", () => {
    renderWithProvider(<Footer />);
    // Use getAllBy since the text appears in logo and copyright
    const metaboliTexts = screen.getAllByText(/METABOLI/);
    expect(metaboliTexts.length).toBeGreaterThan(0);
  });

  it("renders the logo image", () => {
    renderWithProvider(<Footer />);
    const logoImage = screen.getByAltText("Metabolikal");
    expect(logoImage).toBeInTheDocument();
  });

  it("renders brand tagline", () => {
    renderWithProvider(<Footer />);
    expect(screen.getByText(/Reset Your Rhythm/i)).toBeInTheDocument();
    expect(screen.getByText(/Reclaim Your Life/i)).toBeInTheDocument();
  });

  it("renders YouTube social link", () => {
    renderWithProvider(<Footer />);
    const youtubeLink = screen.getByLabelText("YouTube");
    expect(youtubeLink).toBeInTheDocument();
    expect(youtubeLink).toHaveAttribute("href", "https://www.youtube.com/@Metabolikal_1");
    expect(youtubeLink).toHaveAttribute("target", "_blank");
    expect(youtubeLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Instagram social link", () => {
    renderWithProvider(<Footer />);
    const instagramLink = screen.getByLabelText("Instagram");
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink).toHaveAttribute("href", "https://www.instagram.com/metabolikal");
    expect(instagramLink).toHaveAttribute("target", "_blank");
    expect(instagramLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Quick Links section with navigation items", () => {
    renderWithProvider(<Footer />);
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Transformations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge" })).toBeInTheDocument();
  });

  it("renders Programs section", () => {
    renderWithProvider(<Footer />);
    expect(screen.getByText("Programs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Elite Programs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /The Method/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /30-Day Challenge/i })).toBeInTheDocument();
  });

  it("renders Get Started section", () => {
    renderWithProvider(<Footer />);
    expect(screen.getByText("Start Now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Take Assessment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Book Strategy Call/i })).toBeInTheDocument();
  });

  it("renders copyright notice", () => {
    renderWithProvider(<Footer />);
    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} METABOLI-K-AL`, "i"))
    ).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });

  it("navigation links have correct hrefs", () => {
    renderWithProvider(<Footer />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "#");

    const transformationsLink = screen.getByRole("link", { name: "Transformations" });
    expect(transformationsLink).toHaveAttribute("href", "#transformations");

    const aboutLink = screen.getByRole("link", { name: "About" });
    expect(aboutLink).toHaveAttribute("href", "#about");

    const challengeLink = screen.getByRole("link", { name: "Challenge" });
    expect(challengeLink).toHaveAttribute("href", "#challenge");
  });

  it("has gradient electric accent bar", () => {
    const { container } = renderWithProvider(<Footer />);
    const accentBar = container.querySelector(".gradient-electric");
    expect(accentBar).toBeInTheDocument();
  });
});
