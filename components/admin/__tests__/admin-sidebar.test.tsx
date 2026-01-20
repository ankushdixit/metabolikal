import { render, screen, fireEvent } from "@testing-library/react";
import { AdminSidebar } from "../admin-sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/admin"),
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
    },
  })),
}));

describe("AdminSidebar Component", () => {
  it("renders sidebar navigation", () => {
    const { container } = render(<AdminSidebar />);
    expect(container.querySelector("aside")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Pending Reviews")).toBeInTheDocument();
  });

  it("has accessible navigation landmark", () => {
    render(<AdminSidebar />);
    expect(screen.getByLabelText("Admin navigation")).toBeInTheDocument();
  });

  it("renders links with correct href attributes", () => {
    render(<AdminSidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/admin");

    const clientsLink = screen.getByText("Clients").closest("a");
    expect(clientsLink).toHaveAttribute("href", "/admin/clients");

    const pendingLink = screen.getByText("Pending Reviews").closest("a");
    expect(pendingLink).toHaveAttribute("href", "/admin/pending-reviews");
  });

  it("marks dashboard as active on admin path", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/admin");

    render(<AdminSidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("marks clients as active on clients path", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/admin/clients");

    render(<AdminSidebar />);

    const clientsLink = screen.getByText("Clients").closest("a");
    expect(clientsLink).toHaveAttribute("aria-current", "page");
  });

  it("has hidden class for mobile viewports (lg breakpoint)", () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden");
    expect(aside).toHaveClass("lg:flex");
  });

  it("renders brand logo with Admin Portal text", () => {
    render(<AdminSidebar />);
    expect(screen.getByAltText("Metabolikal")).toBeInTheDocument();
    expect(screen.getByText("Admin Portal")).toBeInTheDocument();
  });

  it("has proper sidebar width", () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-64");
  });

  it("has border on the right", () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("border-r");
  });

  it("renders logout button", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    const { createBrowserSupabaseClient } = require("@/lib/auth");
    const mockSignOut = jest.fn().mockResolvedValue({});
    createBrowserSupabaseClient.mockReturnValue({
      auth: { signOut: mockSignOut },
    });

    render(<AdminSidebar />);
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("renders gradient electric accent bar", () => {
    const { container } = render(<AdminSidebar />);
    const accentBar = container.querySelector(".gradient-electric");
    expect(accentBar).toBeInTheDocument();
  });
});
