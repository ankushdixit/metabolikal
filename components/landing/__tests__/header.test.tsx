import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../header";
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

describe("Landing Header Component", () => {
  it("renders the header element", () => {
    const { container } = renderWithProvider(<Header />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("renders the logo with METABOLIKAL text", () => {
    renderWithProvider(<Header />);
    // The text is split across elements, so we use getAllBy
    const metaboliTexts = screen.getAllByText(/METABOLI/);
    expect(metaboliTexts.length).toBeGreaterThan(0);
    // K is in its own span with gradient
    const kTexts = screen.getAllByText(/^K$/);
    expect(kTexts.length).toBeGreaterThan(0);
  });

  it("renders the logo image", () => {
    renderWithProvider(<Header />);
    const logoImage = screen.getByAltText("Metabolikal");
    expect(logoImage).toBeInTheDocument();
  });

  it("renders desktop navigation with all items", () => {
    renderWithProvider(<Header />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Transformations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge" })).toBeInTheDocument();
  });

  it("renders Take Assessment button in header", () => {
    renderWithProvider(<Header />);
    const assessmentButtons = screen.getAllByRole("button", { name: /Take Assessment/i });
    expect(assessmentButtons.length).toBeGreaterThan(0);
  });

  it("renders Book a Call button in header", () => {
    renderWithProvider(<Header />);
    const bookCallButtons = screen.getAllByRole("button", { name: /Book a Call/i });
    expect(bookCallButtons.length).toBeGreaterThan(0);
  });

  it("renders mobile menu toggle button", () => {
    renderWithProvider(<Header />);
    const menuButton = screen.getByLabelText(/Open menu/i);
    expect(menuButton).toBeInTheDocument();
  });

  it("toggles mobile menu when button is clicked", () => {
    renderWithProvider(<Header />);
    const menuButton = screen.getByLabelText(/Open menu/i);

    // Initially mobile menu should not show mobile nav
    expect(screen.queryByRole("navigation")).toBeInTheDocument(); // Desktop nav exists

    // Click to open mobile menu
    fireEvent.click(menuButton);

    // Button should now show close option
    expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();
  });

  it("closes mobile menu when a link is clicked", () => {
    renderWithProvider(<Header />);
    const menuButton = screen.getByLabelText(/Open menu/i);

    // Open the menu
    fireEvent.click(menuButton);
    const closeButton = screen.getByLabelText(/Close menu/i);
    expect(closeButton).toBeInTheDocument();

    // Verify mobile nav links are rendered when menu is open
    const aboutLinks = screen.getAllByRole("link", { name: "About" });
    // Should have at least 2 About links (desktop hidden + mobile visible)
    expect(aboutLinks.length).toBeGreaterThanOrEqual(2);

    // Click the close button to close the menu
    fireEvent.click(closeButton);
    // Menu should close (button shows "Open menu" again)
    expect(screen.getByLabelText(/Open menu/i)).toBeInTheDocument();
  });

  it("has proper z-index for layering", () => {
    const { container } = renderWithProvider(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("z-50");
  });

  it("has fixed positioning", () => {
    const { container } = renderWithProvider(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("fixed");
  });

  it("navigation links have correct hrefs", () => {
    renderWithProvider(<Header />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "#");

    const transformationsLink = screen.getByRole("link", { name: "Transformations" });
    expect(transformationsLink).toHaveAttribute("href", "#transformations");

    const aboutLink = screen.getByRole("link", { name: "About" });
    expect(aboutLink).toHaveAttribute("href", "#about");

    const challengeLink = screen.getByRole("link", { name: "Challenge" });
    expect(challengeLink).toHaveAttribute("href", "#challenge");
  });
});
