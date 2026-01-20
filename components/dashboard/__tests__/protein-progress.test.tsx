import { render, screen } from "@testing-library/react";
import { ProteinProgress } from "../protein-progress";

describe("ProteinProgress Component", () => {
  it("renders consumed and target protein", () => {
    render(<ProteinProgress consumed={100} target={150} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("/ 150g")).toBeInTheDocument();
  });

  it("displays percentage", () => {
    render(<ProteinProgress consumed={75} target={150} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows 'Keep going!' message when under 50%", () => {
    render(<ProteinProgress consumed={60} target={150} />);
    expect(screen.getByText("Keep going! You've got this.")).toBeInTheDocument();
  });

  it("shows 'Great progress!' message when between 50-79%", () => {
    render(<ProteinProgress consumed={100} target={150} />);
    expect(screen.getByText("Great progress! Almost there.")).toBeInTheDocument();
  });

  it("shows 'Almost at your goal!' message when between 80-99%", () => {
    render(<ProteinProgress consumed={130} target={150} />);
    expect(screen.getByText("Almost at your goal!")).toBeInTheDocument();
  });

  it("shows 'Protein goal crushed!' message when at or over 100%", () => {
    render(<ProteinProgress consumed={150} target={150} />);
    expect(screen.getByText("Protein goal crushed!")).toBeInTheDocument();
  });

  it("shows 'Protein goal crushed!' message when over 100%", () => {
    render(<ProteinProgress consumed={180} target={150} />);
    expect(screen.getByText("Protein goal crushed!")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const { container } = render(<ProteinProgress consumed={100} target={150} />);
    const progressBar = container.querySelector(".gradient-electric");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders Protein header", () => {
    render(<ProteinProgress consumed={100} target={150} />);
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });

  it("renders Today label", () => {
    render(<ProteinProgress consumed={100} target={150} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders Daily intake subtitle", () => {
    render(<ProteinProgress consumed={100} target={150} />);
    expect(screen.getByText("Daily intake")).toBeInTheDocument();
  });

  it("handles zero target gracefully", () => {
    render(<ProteinProgress consumed={0} target={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders athletic card styling", () => {
    const { container } = render(<ProteinProgress consumed={100} target={150} />);
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("renders gamified message card", () => {
    const { container } = render(<ProteinProgress consumed={100} target={150} />);
    // Should have nested athletic-card for message
    const cards = container.querySelectorAll(".athletic-card");
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it("renders gradient athletic styling for percentage", () => {
    const { container } = render(<ProteinProgress consumed={100} target={150} />);
    const gradientText = container.querySelector(".gradient-athletic");
    expect(gradientText).toBeInTheDocument();
  });

  it("caps displayed progress bar at 100%", () => {
    const { container } = render(<ProteinProgress consumed={200} target={150} />);
    const progressBar = container.querySelector(".gradient-electric");
    expect(progressBar).toHaveStyle({ width: "100%" });
  });
});
