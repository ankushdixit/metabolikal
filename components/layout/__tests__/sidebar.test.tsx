import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "../sidebar";

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
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { avatar_url: null, full_name: "Test User" },
          }),
        })),
      })),
    })),
  })),
}));

describe("Sidebar Component", () => {
  it("renders sidebar navigation", () => {
    const { container } = render(<Sidebar />);
    expect(container.querySelector("aside")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Diet Plan")).toBeInTheDocument();
    expect(screen.getByText("Workout Plan")).toBeInTheDocument();
    expect(screen.getByText("Check-In")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("has accessible navigation landmark", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
  });

  it("renders links with correct href attributes", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    const dietLink = screen.getByText("Diet Plan").closest("a");
    expect(dietLink).toHaveAttribute("href", "/dashboard/diet");

    const workoutLink = screen.getByText("Workout Plan").closest("a");
    expect(workoutLink).toHaveAttribute("href", "/dashboard/workout");
  });

  it("marks dashboard as active on dashboard path", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/dashboard");

    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("has hidden class for mobile viewports (lg breakpoint)", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden");
    expect(aside).toHaveClass("lg:flex");
  });

  it("renders brand logo with correct styling", () => {
    render(<Sidebar />);
    expect(screen.getByAltText("Metabolikal")).toBeInTheDocument();
    expect(screen.getByText("Client Portal")).toBeInTheDocument();
  });

  it("has proper sidebar width", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-64");
  });

  it("has border on the right", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("border-r");
  });

  it("renders logout button", () => {
    render(<Sidebar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls signOut when logout button is clicked", async () => {
    const { createBrowserSupabaseClient } = require("@/lib/auth");
    const mockSignOut = jest.fn().mockResolvedValue({});
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signOut: mockSignOut,
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { avatar_url: null, full_name: "Test User" },
            }),
          })),
        })),
      })),
    });

    render(<Sidebar />);
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("renders gradient electric accent bar", () => {
    const { container } = render(<Sidebar />);
    const accentBar = container.querySelector(".gradient-electric");
    expect(accentBar).toBeInTheDocument();
  });

  it("renders athletic-styled branding", () => {
    render(<Sidebar />);
    // Check for the gradient text in logo
    const logo = screen.getByText(/METABOLI/);
    expect(logo).toBeInTheDocument();
  });
});
