import { render, screen } from "@testing-library/react";
import ThankYouPage from "../page";

describe("Thank You Page", () => {
  describe("Content Rendering", () => {
    it("renders the success checkmark icon", () => {
      render(<ThankYouPage />);
      // CheckCircle2 icon should be rendered
      const container = document.querySelector(".bg-green-500\\/20");
      expect(container).toBeInTheDocument();
    });

    it("renders the main headline", () => {
      render(<ThankYouPage />);
      expect(screen.getByText(/You're In/i)).toBeInTheDocument();
      expect(screen.getByText(/Let's Build Your Blueprint/i)).toBeInTheDocument();
    });

    it("renders the subheadline with email instruction", () => {
      render(<ThankYouPage />);
      expect(screen.getByText(/metabolic operating system/i)).toBeInTheDocument();
      expect(screen.getByText(/Check your email/i)).toBeInTheDocument();
    });
  });

  describe("Pre-Session Checklist Section", () => {
    it("renders the section header", () => {
      render(<ThankYouPage />);
      expect(screen.getByText(/Your Pre-Session Checklist/i)).toBeInTheDocument();
    });

    it("renders Check Your Inbox step", () => {
      render(<ThankYouPage />);
      expect(screen.getByText("Check Your Inbox")).toBeInTheDocument();
      expect(screen.getByText(/Confirmation \+ prep materials/i)).toBeInTheDocument();
    });

    it("renders Complete Pre-Session Form step", () => {
      render(<ThankYouPage />);
      expect(screen.getByText("Complete Pre-Session Form")).toBeInTheDocument();
      expect(screen.getByText(/Help us personalize/i)).toBeInTheDocument();
    });

    it("renders Show Up Ready step", () => {
      render(<ThankYouPage />);
      expect(screen.getByText("Show Up Ready")).toBeInTheDocument();
      expect(screen.getByText(/blueprint awaits/i)).toBeInTheDocument();
    });
  });

  describe("What to Expect Section", () => {
    it("renders the section header", () => {
      render(<ThankYouPage />);
      expect(screen.getByText(/What We'll Cover In Your Session/i)).toBeInTheDocument();
    });

    it("renders all session expectation items", () => {
      render(<ThankYouPage />);
      expect(screen.getByText(/Deep-dive metabolic assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom nutrition strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/Lifestyle optimization roadmap/i)).toBeInTheDocument();
      expect(screen.getByText(/Direct Q&A with Coach Shivashish/i)).toBeInTheDocument();
    });

    it("renders checkmark icons for each expectation", () => {
      render(<ThankYouPage />);
      // There should be 4 checkmark icons (one for each expectation)
      const checkIcons = document.querySelectorAll(".bg-green-500\\/20");
      // At least 4 for expectations plus 1 for success icon
      expect(checkIcons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("CTA Buttons", () => {
    it("renders Back to Homepage link", () => {
      render(<ThankYouPage />);
      const homepageLink = screen.getByRole("link", { name: /Back to Homepage/i });
      expect(homepageLink).toBeInTheDocument();
      expect(homepageLink).toHaveAttribute("href", "/");
    });

    it("renders Take Assessment link that opens assessment modal", () => {
      render(<ThankYouPage />);
      const assessmentLink = screen.getByRole("link", { name: /Take the Assessment/i });
      expect(assessmentLink).toBeInTheDocument();
      expect(assessmentLink).toHaveAttribute("href", "/?modal=assessment");
    });

    it("both CTAs have btn-athletic class for consistent styling", () => {
      render(<ThankYouPage />);
      const links = screen.getAllByRole("link");
      const ctaLinks = links.filter(
        (link) => link.textContent?.includes("Homepage") || link.textContent?.includes("Assessment")
      );
      ctaLinks.forEach((link) => {
        expect(link).toHaveClass("btn-athletic");
      });
    });
  });

  describe("Floating Decorative Icons", () => {
    it("renders decorative floating icons", () => {
      render(<ThankYouPage />);
      // Icons have the muted yellow color class
      const decorativeIcons = document.querySelectorAll(".text-yellow-500\\/20");
      expect(decorativeIcons.length).toBe(3); // Star, Trophy, Crown
    });

    it("decorative icons have pulse animation", () => {
      render(<ThankYouPage />);
      const animatedIcons = document.querySelectorAll(".animate-pulse-power");
      expect(animatedIcons.length).toBe(3);
    });
  });

  describe("Design System Compliance", () => {
    it("uses athletic-card class for content sections", () => {
      render(<ThankYouPage />);
      const athleticCards = document.querySelectorAll(".athletic-card");
      expect(athleticCards.length).toBe(2); // Pre-session checklist and What to expect
    });

    it("uses gradient-electric class for section headers", () => {
      render(<ThankYouPage />);
      const gradientBars = document.querySelectorAll(".gradient-electric");
      expect(gradientBars.length).toBeGreaterThanOrEqual(2);
    });

    it("uses gradient-athletic class for headline accent", () => {
      render(<ThankYouPage />);
      const gradientText = document.querySelector(".gradient-athletic");
      expect(gradientText).toBeInTheDocument();
    });

    it("primary CTA has glow-power effect", () => {
      render(<ThankYouPage />);
      const primaryCta = screen.getByRole("link", { name: /Back to Homepage/i });
      expect(primaryCta).toHaveClass("glow-power");
    });
  });

  describe("Responsive Layout", () => {
    it("uses responsive padding", () => {
      const { container } = render(<ThankYouPage />);
      const mainWrapper = container.firstChild;
      expect(mainWrapper).toHaveClass("py-16", "md:py-24");
    });

    it("uses responsive grid for checklist steps", () => {
      render(<ThankYouPage />);
      const stepsGrid = document.querySelector(".grid.md\\:grid-cols-3");
      expect(stepsGrid).toBeInTheDocument();
    });
  });

  describe("Animations", () => {
    it("applies slide-power animation with delays", () => {
      render(<ThankYouPage />);
      const animatedElements = document.querySelectorAll(".animate-slide-power");
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it("applies staggered animation delays", () => {
      render(<ThankYouPage />);
      expect(document.querySelector(".delay-100")).toBeInTheDocument();
      expect(document.querySelector(".delay-200")).toBeInTheDocument();
      expect(document.querySelector(".delay-300")).toBeInTheDocument();
      expect(document.querySelector(".delay-400")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all links are accessible", () => {
      render(<ThankYouPage />);
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toBeVisible();
      });
    });

    it("headings follow proper hierarchy", () => {
      render(<ThankYouPage />);
      // h1 for main title
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();

      // h2 for section headers
      const h2s = screen.getAllByRole("heading", { level: 2 });
      expect(h2s.length).toBe(2);

      // h3 for step titles
      const h3s = screen.getAllByRole("heading", { level: 3 });
      expect(h3s.length).toBe(3);
    });
  });
});
