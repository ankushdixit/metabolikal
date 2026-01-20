import { render, screen } from "@testing-library/react";
import { CalorieSummary } from "../calorie-summary";

describe("CalorieSummary Component", () => {
  it("renders consumed and target calories", () => {
    render(<CalorieSummary consumed={1500} target={2000} />);

    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("/ 2,000 kcal")).toBeInTheDocument();
  });

  it("displays remaining calories", () => {
    render(<CalorieSummary consumed={1500} target={2000} />);
    expect(screen.getByText("500 kcal remaining")).toBeInTheDocument();
  });

  it("displays 0 remaining when consumed equals target", () => {
    render(<CalorieSummary consumed={2000} target={2000} />);
    expect(screen.getByText("0 kcal remaining")).toBeInTheDocument();
  });

  it("displays 0 remaining when over target", () => {
    render(<CalorieSummary consumed={2500} target={2000} />);
    expect(screen.getByText("0 kcal remaining")).toBeInTheDocument();
  });

  it("shows green status when on track (under 80%)", () => {
    render(<CalorieSummary consumed={1000} target={2000} />);
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it("shows yellow status when close to limit (80-100%)", () => {
    render(<CalorieSummary consumed={1800} target={2000} />);
    expect(screen.getByText("Close to limit")).toBeInTheDocument();
  });

  it("shows red status when over limit (>100%)", () => {
    render(<CalorieSummary consumed={2500} target={2000} />);
    expect(screen.getByText("Over limit")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const { container } = render(<CalorieSummary consumed={1500} target={2000} />);
    const progressBar = container.querySelector(".bg-secondary");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders calories header", () => {
    render(<CalorieSummary consumed={1500} target={2000} />);
    expect(screen.getByText("Calories")).toBeInTheDocument();
  });

  it("renders Today label", () => {
    render(<CalorieSummary consumed={1500} target={2000} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("displays correct percentage consumed", () => {
    render(<CalorieSummary consumed={1500} target={2000} />);
    expect(screen.getByText("75% consumed")).toBeInTheDocument();
  });

  it("handles zero target gracefully", () => {
    render(<CalorieSummary consumed={0} target={0} />);
    expect(screen.getByText("0% consumed")).toBeInTheDocument();
  });

  it("renders athletic card styling", () => {
    const { container } = render(<CalorieSummary consumed={1500} target={2000} />);
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("renders with green progress bar when on track", () => {
    const { container } = render(<CalorieSummary consumed={1000} target={2000} />);
    const greenBar = container.querySelector(".bg-neon-green");
    expect(greenBar).toBeInTheDocument();
  });

  it("renders with yellow progress bar when close to limit", () => {
    const { container } = render(<CalorieSummary consumed={1800} target={2000} />);
    const yellowBar = container.querySelector(".bg-yellow-500");
    expect(yellowBar).toBeInTheDocument();
  });

  it("renders with red progress bar when over limit", () => {
    const { container } = render(<CalorieSummary consumed={2500} target={2000} />);
    const redBar = container.querySelector(".bg-red-500");
    expect(redBar).toBeInTheDocument();
  });
});
