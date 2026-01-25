import { render, screen, waitFor } from "@testing-library/react";
import { Header } from "../header";

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "test-user-id" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { avatar_url: null } }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

describe("Header Component", () => {
  it("renders header element", () => {
    render(<Header />);
    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("renders Dashboard breadcrumb text", () => {
    render(<Header />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders notifications button after user loads", async () => {
    render(<Header />);
    await waitFor(() => {
      expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });
  });

  it("renders profile link", () => {
    render(<Header />);
    expect(screen.getByLabelText("Profile")).toBeInTheDocument();
  });

  it("has correct href for profile link", () => {
    render(<Header />);
    const profileLink = screen.getByLabelText("Profile");
    expect(profileLink).toHaveAttribute("href", "/dashboard/profile");
  });

  it("has sticky positioning", () => {
    render(<Header />);
    const header = document.querySelector("header");
    expect(header).toHaveClass("sticky");
    expect(header).toHaveClass("top-0");
  });

  it("has high z-index for stacking", () => {
    render(<Header />);
    const header = document.querySelector("header");
    expect(header).toHaveClass("z-40");
  });

  it("has border bottom", () => {
    render(<Header />);
    const header = document.querySelector("header");
    expect(header).toHaveClass("border-b");
  });

  it("is hidden on mobile (lg:block)", () => {
    render(<Header />);
    const header = document.querySelector("header");
    expect(header).toHaveClass("hidden");
    expect(header).toHaveClass("lg:block");
  });

  it("renders gradient electric accent bar", () => {
    const { container } = render(<Header />);
    const accentBar = container.querySelector(".gradient-electric");
    expect(accentBar).toBeInTheDocument();
  });

  it("renders primary-colored Dashboard text", () => {
    render(<Header />);
    const dashboardText = screen.getByText("Dashboard");
    expect(dashboardText).toHaveClass("text-primary");
  });
});
