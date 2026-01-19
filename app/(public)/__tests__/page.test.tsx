import { render, screen } from "@testing-library/react";
import LandingPage from "../page";
import { ModalProvider } from "@/contexts/modal-context";

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ModalProvider>{ui}</ModalProvider>);
};

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
  }) {
    return <img alt={props.alt} src={props.src} data-testid="mock-image" />;
  },
}));

describe("Landing Page", () => {
  describe("Hero Section", () => {
    it("renders the main quote", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/My clients complain that I make them/i)).toBeInTheDocument();
      expect(screen.getByText(/eat too much/i)).toBeInTheDocument();
    });

    it("renders the founder attribution", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Shivashish Sinha/i)).toBeInTheDocument();
      expect(screen.getByText(/Founder \| Metaboli-k-al/i)).toBeInTheDocument();
    });

    it("renders the subtitle with program description", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/structured lifestyle reset/i)).toBeInTheDocument();
      expect(screen.getByText(/high-performing professionals/i)).toBeInTheDocument();
    });

    it("renders three CTA buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(
        screen.getByRole("button", { name: /Get Free Strategy Session/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Take Assessment/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Start 30-Day Challenge/i })).toBeInTheDocument();
    });

    it("renders feature stats box with correct values", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Phases")).toBeInTheDocument();
      expect(screen.getByText("180")).toBeInTheDocument();
      expect(screen.getByText("Minutes")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("Burnout")).toBeInTheDocument();
    });

    it("renders metabolic transformation badge", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Metabolic Transformation/i)).toBeInTheDocument();
    });
  });

  describe("Transformations Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#transformations");
      expect(section).toBeInTheDocument();
    });

    it("renders the section title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Real People/i)).toBeInTheDocument();
      expect(screen.getByText(/Real Transformations/i)).toBeInTheDocument();
    });

    it("renders View Transformation Gallery button", () => {
      renderWithProvider(<LandingPage />);
      expect(
        screen.getByRole("button", { name: /View Transformation Gallery/i })
      ).toBeInTheDocument();
    });
  });

  describe("Revelation Section", () => {
    it("renders THE REVELATION badge", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("The Revelation")).toBeInTheDocument();
    });

    it("renders the revelation title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/You don't lack discipline/i)).toBeInTheDocument();
      expect(screen.getByText(/Your system lacks calibration/i)).toBeInTheDocument();
    });

    it("renders two revelation buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /The High-Performer Trap/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /See Who We Work With/i })).toBeInTheDocument();
    });
  });

  describe("About Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#about");
      expect(section).toBeInTheDocument();
    });

    it("renders ABOUT METABOLI-K-AL title", () => {
      renderWithProvider(<LandingPage />);
      // Multiple "About" texts exist (section title, nav badge)
      const aboutTexts = screen.getAllByText(/About/);
      expect(aboutTexts.length).toBeGreaterThan(0);
      // Multiple Metaboli-k-al texts exist
      const metaboliTexts = screen.getAllByText(/Metaboli-k-al/i);
      expect(metaboliTexts.length).toBeGreaterThan(0);
    });

    it("renders three quick link buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /Meet the Expert/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /The Method/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Elite Programs/i })).toBeInTheDocument();
    });

    it("renders THE DISCOVERY accordion", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("The Discovery")).toBeInTheDocument();
    });

    it("renders WHY WE'RE METABOLI-K-AL accordion", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Why We're Metaboli-k-al/i)).toBeInTheDocument();
    });
  });

  describe("Difference Section", () => {
    it("renders THE METABOLI-K-AL DIFFERENCE title", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/The Metaboli-k-al/i)).toBeInTheDocument();
      expect(screen.getByText(/Difference/)).toBeInTheDocument();
    });

    it("renders three difference cards", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Personal, Not Automated/i)).toBeInTheDocument();
      expect(screen.getByText(/Science-Based, Tested/i)).toBeInTheDocument();
      expect(screen.getByText(/Built for Elite Lifestyles/i)).toBeInTheDocument();
    });

    it("renders the bottom statement", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/You don't need more hustle/i)).toBeInTheDocument();
      expect(screen.getByText(/You need rhythm/i)).toBeInTheDocument();
    });
  });

  describe("Challenge Section", () => {
    it("has correct section id for navigation", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const section = container.querySelector("#challenge");
      expect(section).toBeInTheDocument();
    });

    it("renders STILL NOT SURE badge", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText(/Still Not Sure\? Take the Challenge/i)).toBeInTheDocument();
    });

    it("renders two challenge buttons", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByRole("button", { name: /How It Works/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Launch Challenge Hub/i })).toBeInTheDocument();
    });

    it("renders challenge tags", () => {
      renderWithProvider(<LandingPage />);
      expect(screen.getByText("Science-Backed")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
      expect(screen.getByText("Sustainable")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all buttons are accessible", () => {
      renderWithProvider(<LandingPage />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("accordions are implemented with details/summary for accessibility", () => {
      const { container } = renderWithProvider(<LandingPage />);
      const detailsElements = container.querySelectorAll("details");
      expect(detailsElements.length).toBe(2); // The Discovery and Why We're Metaboli-k-al
    });
  });
});
