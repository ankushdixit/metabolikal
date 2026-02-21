import { render, screen } from "@testing-library/react";
import { Zap, Clock, Users } from "lucide-react";
import { HeroStatsCard, StatItem } from "../shared/hero-stats-card";

describe("HeroStatsCard", () => {
  const mockStats: StatItem[] = [
    {
      number: "4",
      label: "Phases",
      sublabel: "Complete Program",
      icon: Zap,
    },
    {
      number: "180",
      label: "Minutes",
      sublabel: "Weekly Commitment",
      icon: Clock,
    },
    {
      number: "200+",
      label: "Clients",
      sublabel: "Transformed Lives",
      icon: Users,
    },
  ];

  it("renders the card title", () => {
    render(<HeroStatsCard title="Program Overview" stats={mockStats} />);

    expect(screen.getByText("Program Overview")).toBeInTheDocument();
  });

  it("renders all stat items with numbers, labels, and sublabels", () => {
    render(<HeroStatsCard title="Program Overview" stats={mockStats} />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Phases")).toBeInTheDocument();
    expect(screen.getByText("Complete Program")).toBeInTheDocument();

    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
    expect(screen.getByText("Weekly Commitment")).toBeInTheDocument();

    expect(screen.getByText("200+")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Transformed Lives")).toBeInTheDocument();
  });

  it("renders icon containers with aria-hidden", () => {
    const { container } = render(<HeroStatsCard title="Program Overview" stats={mockStats} />);

    // Each stat has a div container with aria-hidden="true" wrapping the icon
    const hiddenContainers = container.querySelectorAll('div[aria-hidden="true"]');
    expect(hiddenContainers.length).toBe(3);
  });

  it("renders tagline when provided", () => {
    render(
      <HeroStatsCard
        title="Program Overview"
        stats={mockStats}
        tagline={{ text: "Built for the", highlight: "Elite" }}
      />
    );

    expect(screen.getByText("Built for the")).toBeInTheDocument();
    expect(screen.getByText("Elite")).toBeInTheDocument();
  });

  it("does not render tagline section when not provided", () => {
    const { container } = render(<HeroStatsCard title="Program Overview" stats={mockStats} />);

    // No tagline border-t section
    expect(screen.queryByText("Elite")).not.toBeInTheDocument();
    // The border-t div for tagline should not exist
    const borderTDivs = container.querySelectorAll(".border-t.border-border");
    expect(borderTDivs.length).toBe(0);
  });

  it("applies additional className when provided", () => {
    const { container } = render(
      <HeroStatsCard title="Program Overview" stats={mockStats} className="custom-class" />
    );

    const card = container.firstElementChild;
    expect(card).toHaveClass("custom-class");
  });

  it("uses default empty className when none provided", () => {
    const { container } = render(<HeroStatsCard title="Program Overview" stats={mockStats} />);

    const card = container.firstElementChild;
    expect(card).toHaveClass("athletic-card");
  });

  it("renders with a single stat item", () => {
    const singleStat: StatItem[] = [
      {
        number: "1",
        label: "Focus",
        sublabel: "Single Goal",
        icon: Zap,
      },
    ];

    render(<HeroStatsCard title="Simple" stats={singleStat} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Focus")).toBeInTheDocument();
    expect(screen.getByText("Single Goal")).toBeInTheDocument();
  });

  it("renders tagline highlight with gradient class", () => {
    const { container } = render(
      <HeroStatsCard
        title="Test"
        stats={mockStats}
        tagline={{ text: "Built for the", highlight: "Elite" }}
      />
    );

    const highlightSpan = container.querySelector(".gradient-athletic");
    expect(highlightSpan).toBeInTheDocument();
    expect(highlightSpan).toHaveTextContent("Elite");
  });
});
