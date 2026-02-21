import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../header";
import { ModalProvider, useModalState } from "@/contexts/modal-context";

// Helper component to observe which modal was opened
function ModalSpy() {
  const { activeModal } = useModalState();
  return <div data-testid="modal-spy">{activeModal ?? "none"}</div>;
}

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <ModalProvider>
      {ui}
      <ModalSpy />
    </ModalProvider>
  );
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

// Mock next/link - pass through onClick so mobile menu close works
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
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

  describe("CTA button handlers", () => {
    it("opens assessment modal when Take Assessment is clicked (desktop)", async () => {
      const user = userEvent.setup();
      renderWithProvider(<Header />);

      // Click the first Take Assessment button (desktop)
      const assessmentButtons = screen.getAllByRole("button", { name: /Take Assessment/i });
      await user.click(assessmentButtons[0]);

      expect(screen.getByTestId("modal-spy")).toHaveTextContent("assessment");
    });

    it("opens calendly modal when Book a Call is clicked (desktop)", async () => {
      const user = userEvent.setup();
      renderWithProvider(<Header />);

      // Click the first Book a Call button (desktop)
      const bookCallButtons = screen.getAllByRole("button", { name: /Book a Call/i });
      await user.click(bookCallButtons[0]);

      expect(screen.getByTestId("modal-spy")).toHaveTextContent("calendly");
    });

    it("opens assessment modal and closes mobile menu when Take Assessment is clicked in mobile menu", async () => {
      const user = userEvent.setup();
      renderWithProvider(<Header />);

      // Open mobile menu
      const menuButton = screen.getByLabelText(/Open menu/i);
      await user.click(menuButton);

      // Now click the mobile Take Assessment button (last one)
      const assessmentButtons = screen.getAllByRole("button", { name: /Take Assessment/i });
      await user.click(assessmentButtons[assessmentButtons.length - 1]);

      // Modal should be opened
      expect(screen.getByTestId("modal-spy")).toHaveTextContent("assessment");
      // Mobile menu should be closed
      expect(screen.getByLabelText(/Open menu/i)).toBeInTheDocument();
    });

    it("opens calendly modal and closes mobile menu when Book a Call is clicked in mobile menu", async () => {
      const user = userEvent.setup();
      renderWithProvider(<Header />);

      // Open mobile menu
      const menuButton = screen.getByLabelText(/Open menu/i);
      await user.click(menuButton);

      // Now click the mobile Book a Call button (last one)
      const bookCallButtons = screen.getAllByRole("button", { name: /Book a Call/i });
      await user.click(bookCallButtons[bookCallButtons.length - 1]);

      // Modal should be opened
      expect(screen.getByTestId("modal-spy")).toHaveTextContent("calendly");
      // Mobile menu should be closed
      expect(screen.getByLabelText(/Open menu/i)).toBeInTheDocument();
    });

    it("closes mobile menu when a navigation link is clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider(<Header />);

      // Open mobile menu
      await user.click(screen.getByLabelText(/Open menu/i));
      expect(screen.getByLabelText(/Close menu/i)).toBeInTheDocument();

      // Click a mobile nav link (pick the last "About" link which is in mobile menu)
      const aboutLinks = screen.getAllByRole("link", { name: "About" });
      await user.click(aboutLinks[aboutLinks.length - 1]);

      // Menu should close
      expect(screen.getByLabelText(/Open menu/i)).toBeInTheDocument();
    });
  });
});
