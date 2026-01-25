import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "../mobile-nav";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

// Mock Supabase auth
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    auth: {
      signOut: jest.fn().mockResolvedValue({}),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { avatar_url: null, full_name: "Test User" },
          }),
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    })),
  })),
}));

describe("MobileNav Component", () => {
  it("renders mobile header", () => {
    render(<MobileNav />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("renders hamburger button", () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText("Open menu");
    expect(menuButton).toBeInTheDocument();
  });

  it("opens mobile menu when hamburger is clicked", () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText("Open menu");
    fireEvent.click(menuButton);

    // There are multiple close menu buttons when open
    expect(screen.getAllByLabelText("Close menu").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
  });

  it("closes mobile menu when close button is clicked", () => {
    render(<MobileNav />);

    // Open menu
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();

    // Close menu (click the first close button)
    const closeButtons = screen.getAllByLabelText("Close menu");
    fireEvent.click(closeButtons[0]);

    // Menu should be hidden (translated off screen)
    const drawer = screen.queryByLabelText("Mobile navigation");
    expect(drawer?.closest("div")).toHaveClass("-translate-x-full");
  });

  it("renders all navigation items in mobile menu", () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByLabelText("Open menu"));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Diet Plan")).toBeInTheDocument();
    expect(screen.getByText("Workout Plan")).toBeInTheDocument();
    expect(screen.getByText("Check-In")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("closes menu when a navigation link is clicked", () => {
    render(<MobileNav />);

    // Open menu
    fireEvent.click(screen.getByLabelText("Open menu"));

    // Click a navigation link
    const dietLink = screen.getByText("Diet Plan");
    fireEvent.click(dietLink);

    // Menu should be closed
    const drawer = screen.queryByLabelText("Mobile navigation");
    expect(drawer?.closest("div")).toHaveClass("-translate-x-full");
  });

  it("renders logout button in mobile menu", () => {
    render(<MobileNav />);
    fireEvent.click(screen.getByLabelText("Open menu"));

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("marks current page as active", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/dashboard");

    render(<MobileNav />);
    fireEvent.click(screen.getByLabelText("Open menu"));

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("renders brand logo in mobile header", () => {
    render(<MobileNav />);
    const logos = screen.getAllByAltText("Metabolikal");
    expect(logos.length).toBeGreaterThan(0);
  });

  it("renders gradient electric accent bar", () => {
    const { container } = render(<MobileNav />);
    const accentBars = container.querySelectorAll(".gradient-electric");
    expect(accentBars.length).toBeGreaterThan(0);
  });

  it("is visible only on mobile (lg:hidden)", () => {
    render(<MobileNav />);
    const header = screen.getByLabelText("Open menu").closest("header");
    expect(header).toHaveClass("lg:hidden");
  });

  it("has correct aria-expanded attribute on menu button", () => {
    render(<MobileNav />);
    const menuButton = screen.getByLabelText("Open menu");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    // After opening, the header button shows Close menu
    const closeButtons = screen.getAllByLabelText("Close menu");
    expect(closeButtons[0]).toHaveAttribute("aria-expanded", "true");
  });
});
