import { render, screen } from "@testing-library/react";
import { Header } from "../header";

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

  it("renders notifications button", () => {
    render(<Header />);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
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
