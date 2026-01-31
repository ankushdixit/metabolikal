import { render, screen } from "@testing-library/react";
import { HealthScoreChart } from "../health-score-chart";

describe("HealthScoreChart", () => {
  it("renders the score value", () => {
    render(<HealthScoreChart score={75} />);

    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("has correct aria-label for accessibility", () => {
    render(<HealthScoreChart score={85} />);

    expect(screen.getByRole("img", { name: "Health score: 85 out of 100" })).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    render(<HealthScoreChart score={50} size={250} />);

    const container = screen.getByRole("img");
    expect(container).toHaveStyle({ width: "250px", height: "250px" });
  });

  it("renders with default size of 200", () => {
    render(<HealthScoreChart score={50} />);

    const container = screen.getByRole("img");
    expect(container).toHaveStyle({ width: "200px", height: "200px" });
  });

  it("renders background circle with correct color", () => {
    const { container } = render(<HealthScoreChart score={50} animated={false} />);

    const backgroundCircle = container.querySelectorAll("circle")[0];
    expect(backgroundCircle).toHaveAttribute("stroke", "#27272a");
  });

  describe("tier colors", () => {
    it("uses green color for Elite tier (score >= 86)", () => {
      const { container } = render(<HealthScoreChart score={90} animated={false} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveAttribute("stroke", "#22c55e");
    });

    it("uses yellow color for Good tier (score 71-85)", () => {
      const { container } = render(<HealthScoreChart score={75} animated={false} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveAttribute("stroke", "#eab308");
    });

    it("uses orange color for Moderate tier (score 51-70)", () => {
      const { container } = render(<HealthScoreChart score={60} animated={false} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveAttribute("stroke", "#f97316");
    });

    it("uses red color for Needs Attention tier (score <= 50)", () => {
      const { container } = render(<HealthScoreChart score={40} animated={false} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveAttribute("stroke", "#ef4444");
    });
  });

  describe("animation", () => {
    it("applies transition style when animated is true", () => {
      const { container } = render(<HealthScoreChart score={75} animated={true} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveStyle({
        transition: "stroke-dashoffset 1s ease-out",
      });
    });

    it("does not apply transition style when animated is false", () => {
      const { container } = render(<HealthScoreChart score={75} animated={false} />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveStyle({
        transition: "none",
      });
    });
  });
});
