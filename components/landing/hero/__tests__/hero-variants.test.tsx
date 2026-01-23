import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeroVariantA } from "../hero-variant-a";
import { HeroVariantB } from "../hero-variant-b";
import { HeroVariantC } from "../hero-variant-c";
import { HeroOriginal } from "../hero-original";
import { HeroController } from "../hero-controller";

// Mock the constants module for controlled testing
jest.mock("@/lib/constants", () => ({
  ACTIVE_HERO_VARIANT: "A",
  HERO_VARIANTS: {
    A: { name: "Problem-Solution", description: "", focus: "" },
    B: { name: "Results-Focused", description: "", focus: "" },
    C: { name: "Identity-Positioning", description: "", focus: "" },
    original: { name: "Original Quote", description: "", focus: "" },
  },
}));

describe("HeroVariantA - Problem-Solution Focus", () => {
  const mockOnOpenCalendly = jest.fn();
  const mockOnOpenAssessment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the hero section", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
  });

  it("renders the eyebrow text", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByText(/For High-Performing Professionals/i)).toBeInTheDocument();
  });

  it("renders the main headline with problem-focused messaging", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Tired of Diets That Ignore Your/i)).toBeInTheDocument();
  });

  it("renders the sub-headline about science-based coaching", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByText(/science-based metabolic coaching/i)).toBeInTheDocument();
  });

  it("renders all three supporting bullet points", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByText(/No extreme protocols/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalized nutrition/i)).toBeInTheDocument();
    expect(screen.getByText(/1-on-1 coaching/i)).toBeInTheDocument();
  });

  it("renders primary CTA button that calls onOpenCalendly", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    const primaryButton = screen.getByRole("button", { name: /Book.*(free|strategy)/i });
    expect(primaryButton).toBeInTheDocument();

    fireEvent.click(primaryButton);
    expect(mockOnOpenCalendly).toHaveBeenCalledTimes(1);
  });

  it("renders secondary CTA button that calls onOpenAssessment", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    const secondaryButton = screen.getByRole("button", { name: /Take.*assessment/i });
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(secondaryButton);
    expect(mockOnOpenAssessment).toHaveBeenCalledTimes(1);
  });

  it("renders social proof element", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByText(/Trusted by/i)).toBeInTheDocument();
    expect(screen.getByText(/200\+ executives/i)).toBeInTheDocument();
  });

  it("renders the stats card with program overview", () => {
    render(
      <HeroVariantA onOpenCalendly={mockOnOpenCalendly} onOpenAssessment={mockOnOpenAssessment} />
    );
    expect(screen.getByText("Program Overview")).toBeInTheDocument();
    expect(screen.getByText(/Complete Program/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Coaching/i)).toBeInTheDocument();
  });
});

describe("HeroVariantB - Results/Transformation Focus", () => {
  const mockOnOpenCalendly = jest.fn();
  const mockOnOpenRealResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders the hero section", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
  });

  it("renders the eyebrow text about metabolic optimization", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(screen.getByText(/Metabolic Optimization for Peak Performance/i)).toBeInTheDocument();
  });

  it("renders the main headline with results-focused messaging", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(screen.getByText(/Reclaim Your/i)).toBeInTheDocument();
    // Energy appears multiple times (headline + results banner), use heading check
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Lose the Weight/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep Your Schedule/i)).toBeInTheDocument();
  });

  it("renders the results banner with key metrics", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(screen.getByText(/avg. loss/i)).toBeInTheDocument();
    expect(screen.getByText(/energy up/i)).toBeInTheDocument();
    expect(screen.getByText(/extreme diets/i)).toBeInTheDocument();
    expect(screen.getByText(/program/i)).toBeInTheDocument();
  });

  it("renders the founder quote as social proof", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(
      screen.getByText(/My clients complain that I make them eat too much/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Shivashish Sinha/i)).toBeInTheDocument();
  });

  it("renders primary CTA button that calls onOpenCalendly", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    const primaryButton = screen.getByRole("button", { name: /Start.*transformation/i });
    expect(primaryButton).toBeInTheDocument();

    fireEvent.click(primaryButton);
    expect(mockOnOpenCalendly).toHaveBeenCalledTimes(1);
  });

  it("renders secondary CTA button that calls onOpenRealResults", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    const secondaryButton = screen.getByRole("button", { name: /real.*results/i });
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(secondaryButton);
    expect(mockOnOpenRealResults).toHaveBeenCalledTimes(1);
  });

  it("renders the transformation preview card", () => {
    render(
      <HeroVariantB onOpenCalendly={mockOnOpenCalendly} onOpenRealResults={mockOnOpenRealResults} />
    );
    expect(screen.getByText("Transformation Preview")).toBeInTheDocument();
    expect(screen.getByText(/Reset Phase/i)).toBeInTheDocument();
    // Check for phase titles (Acceleration and Optimization appear as phase names)
    expect(screen.getByText("Acceleration")).toBeInTheDocument();
    expect(screen.getByText("Optimization")).toBeInTheDocument();
  });
});

describe("HeroVariantC - Identity/Positioning Focus", () => {
  const mockOnOpenCalendly = jest.fn();
  const mockOnOpenMethod = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders the hero section", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
  });

  it("renders the eyebrow text with elite positioning", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(
      screen.getByText(/The Metabolic Operating System for Elite Performers/i)
    ).toBeInTheDocument();
  });

  it("renders the main headline with Diet crossed out", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    // Diet and System both appear in the headline
    expect(screen.getByText("Diet")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders the identity checklist header", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByText(/This is for you if/i)).toBeInTheDocument();
  });

  it("renders all identity checklist items", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(
      screen.getByText(/succeeded at everything except sustainable fitness/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/skeptical of cookie-cutter programs/i)).toBeInTheDocument();
    expect(screen.getByText(/refuse to sacrifice career performance/i)).toBeInTheDocument();
    expect(screen.getByText(/want science, not fitness influencer nonsense/i)).toBeInTheDocument();
  });

  it("renders primary CTA button that calls onOpenCalendly", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    const primaryButton = screen.getByRole("button", { name: /qualify/i });
    expect(primaryButton).toBeInTheDocument();

    fireEvent.click(primaryButton);
    expect(mockOnOpenCalendly).toHaveBeenCalledTimes(1);
  });

  it("renders secondary CTA button that calls onOpenMethod", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    const secondaryButton = screen.getByRole("button", { name: /How.*Works/i });
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(secondaryButton);
    expect(mockOnOpenMethod).toHaveBeenCalledTimes(1);
  });

  it("renders exclusivity badge", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByText(/Limited spots available/i)).toBeInTheDocument();
  });

  it("renders positioning statement", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByText(/Built for the 1% who demand more/i)).toBeInTheDocument();
  });

  it("renders coach profile card with quote", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByText(/metabolic engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Shivashish Sinha/)).toBeInTheDocument();
    expect(screen.getByText(/Founder & Head Coach/i)).toBeInTheDocument();
  });

  it("renders coach credentials", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);
    expect(screen.getByText(/200\+ clients coached/i)).toBeInTheDocument();
    expect(screen.getByText(/15 years experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Certified Metabolic Specialist/i)).toBeInTheDocument();
  });

  it("animates checkmarks sequentially", () => {
    render(<HeroVariantC onOpenCalendly={mockOnOpenCalendly} onOpenMethod={mockOnOpenMethod} />);

    // Get all list items
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(7); // 4 identity + 3 credentials

    // Advance timers and verify no errors during animation
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Items should still be rendered after animation
    expect(screen.getAllByRole("listitem").length).toBe(7);
  });
});

describe("HeroOriginal - Original Quote Design", () => {
  const mockOnOpenCalendly = jest.fn();
  const mockOnOpenAssessment = jest.fn();
  const mockOnOpenChallengeHub = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the hero section", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    expect(screen.getByLabelText("Hero section")).toBeInTheDocument();
  });

  it("renders the eyebrow badge with Metabolic Transformation", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    expect(screen.getByText(/Metabolic Transformation/i)).toBeInTheDocument();
  });

  it("renders the founder quote", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    expect(screen.getByText(/My clients complain that I make them/i)).toBeInTheDocument();
    expect(screen.getByText(/eat too much/i)).toBeInTheDocument();
  });

  it("renders founder attribution", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    expect(screen.getByText(/Shivashish Sinha/)).toBeInTheDocument();
    expect(screen.getByText(/Founder | Metaboli-k-al/i)).toBeInTheDocument();
  });

  it("renders primary CTA that calls onOpenCalendly", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    const primaryButton = screen.getByRole("button", { name: /free strategy session/i });
    expect(primaryButton).toBeInTheDocument();

    fireEvent.click(primaryButton);
    expect(mockOnOpenCalendly).toHaveBeenCalledTimes(1);
  });

  it("renders secondary CTA that calls onOpenAssessment", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    const secondaryButton = screen.getByRole("button", { name: /assessment/i });
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(secondaryButton);
    expect(mockOnOpenAssessment).toHaveBeenCalledTimes(1);
  });

  it("renders challenge CTA that calls onOpenChallengeHub", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    const challengeButton = screen.getByRole("button", { name: /30.*day.*challenge/i });
    expect(challengeButton).toBeInTheDocument();

    fireEvent.click(challengeButton);
    expect(mockOnOpenChallengeHub).toHaveBeenCalledTimes(1);
  });

  it("renders program stats card", () => {
    render(
      <HeroOriginal
        onOpenCalendly={mockOnOpenCalendly}
        onOpenAssessment={mockOnOpenAssessment}
        onOpenChallengeHub={mockOnOpenChallengeHub}
      />
    );
    expect(screen.getByText("Program Stats")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Phases")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
  });
});

describe("HeroController - Variant Selection", () => {
  const defaultProps = {
    onOpenCalendly: jest.fn(),
    onOpenAssessment: jest.fn(),
    onOpenRealResults: jest.fn(),
    onOpenMethod: jest.fn(),
    onOpenChallengeHub: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders Variant A by default (from mock)", () => {
    render(<HeroController {...defaultProps} />);
    expect(screen.getByText(/Tired of Diets That Ignore Your/i)).toBeInTheDocument();
  });

  it("renders Variant A when explicitly set", () => {
    render(<HeroController {...defaultProps} variant="A" />);
    expect(screen.getByText(/Tired of Diets That Ignore Your/i)).toBeInTheDocument();
  });

  it("renders Variant B when explicitly set", () => {
    render(<HeroController {...defaultProps} variant="B" />);
    expect(screen.getByText(/Reclaim Your/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders Variant C when explicitly set", () => {
    render(<HeroController {...defaultProps} variant="C" />);
    expect(screen.getByText(/You Need a/i)).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders Original variant when explicitly set", () => {
    render(<HeroController {...defaultProps} variant="original" />);
    expect(screen.getByText(/My clients complain that I make them/i)).toBeInTheDocument();
  });

  it("passes correct handlers to Variant A", () => {
    render(<HeroController {...defaultProps} variant="A" />);

    const calendlyButton = screen.getByRole("button", { name: /Book.*(free|strategy)/i });
    fireEvent.click(calendlyButton);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();

    const assessmentButton = screen.getByRole("button", { name: /Take.*assessment/i });
    fireEvent.click(assessmentButton);
    expect(defaultProps.onOpenAssessment).toHaveBeenCalled();
  });

  it("passes correct handlers to Variant B", () => {
    render(<HeroController {...defaultProps} variant="B" />);

    const calendlyButton = screen.getByRole("button", { name: /Start.*transformation/i });
    fireEvent.click(calendlyButton);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();

    const resultsButton = screen.getByRole("button", { name: /real.*results/i });
    fireEvent.click(resultsButton);
    expect(defaultProps.onOpenRealResults).toHaveBeenCalled();
  });

  it("passes correct handlers to Variant C", () => {
    render(<HeroController {...defaultProps} variant="C" />);

    const calendlyButton = screen.getByRole("button", { name: /qualify/i });
    fireEvent.click(calendlyButton);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();

    const methodButton = screen.getByRole("button", { name: /How.*Works/i });
    fireEvent.click(methodButton);
    expect(defaultProps.onOpenMethod).toHaveBeenCalled();
  });

  it("passes correct handlers to Original variant", () => {
    render(<HeroController {...defaultProps} variant="original" />);

    const calendlyButton = screen.getByRole("button", { name: /free strategy session/i });
    fireEvent.click(calendlyButton);
    expect(defaultProps.onOpenCalendly).toHaveBeenCalled();

    const challengeButton = screen.getByRole("button", { name: /30.*day.*challenge/i });
    fireEvent.click(challengeButton);
    expect(defaultProps.onOpenChallengeHub).toHaveBeenCalled();
  });
});
