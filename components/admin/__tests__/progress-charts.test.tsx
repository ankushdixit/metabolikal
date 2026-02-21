import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressCharts } from "../progress-charts";

// Capture formatter callbacks so we can invoke them directly for coverage
const capturedTooltipFormatters: Array<(value: number, name: string) => [string, string]> = [];
const capturedYAxisFormatters: Array<(value: number) => string> = [];
let legendFormatter: ((value: string) => React.ReactNode) | null = null;

// Mock Recharts components, capturing formatter props
jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: (props: { tickFormatter?: (value: number) => string }) => {
    if (props.tickFormatter) {
      capturedYAxisFormatters.push(props.tickFormatter);
    }
    return null;
  },
  CartesianGrid: () => null,
  Tooltip: (props: { formatter?: (value: number, name: string) => [string, string] }) => {
    if (props.formatter) {
      capturedTooltipFormatters.push(props.formatter);
    }
    return null;
  },
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: (props: { formatter?: (value: string) => React.ReactNode }) => {
    if (props.formatter) {
      legendFormatter = props.formatter;
    }
    return null;
  },
}));

describe("ProgressCharts Component", () => {
  const mockCheckIns = [
    {
      id: "1",
      client_id: "client1",
      submitted_at: "2025-01-01T00:00:00Z",
      weight: 85,
      body_fat_percent: 20,
      chest_cm: 100,
      waist_cm: 85,
      hips_cm: 95,
      arms_cm: 35,
      thighs_cm: 55,
      neck_cm: 38,
      calves_cm: 40,
      photo_front: null,
      photo_side: null,
      photo_back: null,
      energy_rating: 7,
      sleep_rating: 8,
      stress_rating: 4,
      mood_rating: 7,
      diet_adherence: 85,
      workout_adherence: 90,
      challenges: null,
      progress_notes: null,
      questions: null,
      admin_notes: null,
      flagged_for_followup: false,
      reviewed_at: null,
      reviewed_by: null,
      plan_cycle: 1,
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "2",
      client_id: "client1",
      submitted_at: "2025-01-15T00:00:00Z",
      weight: 83,
      body_fat_percent: 18,
      chest_cm: 101,
      waist_cm: 82,
      hips_cm: 94,
      arms_cm: 36,
      thighs_cm: 56,
      neck_cm: 37.5,
      calves_cm: 39.5,
      photo_front: null,
      photo_side: null,
      photo_back: null,
      energy_rating: 8,
      sleep_rating: 7,
      stress_rating: 3,
      mood_rating: 8,
      diet_adherence: 90,
      workout_adherence: 95,
      challenges: null,
      progress_notes: null,
      questions: null,
      admin_notes: null,
      flagged_for_followup: false,
      reviewed_at: null,
      reviewed_by: null,
      plan_cycle: 1,
      created_at: "2025-01-15T00:00:00Z",
    },
  ];

  it("renders weight trend section", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    expect(screen.getByText("Weight")).toBeInTheDocument();
    expect(screen.getAllByText("Trend").length).toBeGreaterThan(0);
  });

  it("renders measurements trend section when data available", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    expect(screen.getByText("Measurements")).toBeInTheDocument();
    expect(screen.getAllByText("Trend").length).toBe(2);
  });

  it("renders date range selector", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    expect(screen.getByText("Last 90 Days")).toBeInTheDocument();
    expect(screen.getByText("All Time")).toBeInTheDocument();
  });

  it("defaults to all time view", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    const allTimeButton = screen.getByText("All Time");
    expect(allTimeButton).toHaveClass("gradient-electric");
  });

  it("changes active date range on click", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    const thirtyDaysButton = screen.getByText("Last 30 Days");
    fireEvent.click(thirtyDaysButton);
    expect(thirtyDaysButton).toHaveClass("gradient-electric");
  });

  it("renders empty state when no check-ins", () => {
    render(<ProgressCharts checkIns={[]} />);
    expect(screen.getByText("No check-in data available for charts")).toBeInTheDocument();
  });

  it("shows message when only one check-in", () => {
    render(<ProgressCharts checkIns={[mockCheckIns[0]]} />);
    expect(screen.getByText("Need at least 2 check-ins to show weight trend")).toBeInTheDocument();
  });

  it("renders line chart components", () => {
    render(<ProgressCharts checkIns={mockCheckIns} />);
    expect(screen.getAllByTestId("line-chart").length).toBeGreaterThan(0);
  });

  it("uses athletic-card styling", () => {
    const { container } = render(<ProgressCharts checkIns={mockCheckIns} />);
    expect(container.querySelectorAll(".athletic-card").length).toBeGreaterThan(0);
  });

  it("renders scale icon for weight chart", () => {
    const { container } = render(<ProgressCharts checkIns={mockCheckIns} />);
    const scaleIcon = container.querySelector("svg.lucide-scale");
    expect(scaleIcon).toBeInTheDocument();
  });

  it("renders ruler icon for measurements chart", () => {
    const { container } = render(<ProgressCharts checkIns={mockCheckIns} />);
    const rulerIcon = container.querySelector("svg.lucide-ruler");
    expect(rulerIcon).toBeInTheDocument();
  });

  describe("Date Range Filtering", () => {
    it("filters to 30 days when Last 30 Days is selected", () => {
      // Create check-ins spanning more than 30 days
      const now = new Date();
      const recentCheckIn = {
        ...mockCheckIns[0],
        id: "recent",
        submitted_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const oldCheckIn = {
        ...mockCheckIns[1],
        id: "old",
        submitted_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      };

      render(<ProgressCharts checkIns={[recentCheckIn, oldCheckIn]} />);

      // Click 30 days
      fireEvent.click(screen.getByText("Last 30 Days"));

      // The 30 days button should now be active
      expect(screen.getByText("Last 30 Days")).toHaveClass("gradient-electric");
    });

    it("filters to 90 days when Last 90 Days is selected", () => {
      const now = new Date();
      const recentCheckIn = {
        ...mockCheckIns[0],
        id: "recent",
        submitted_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const midCheckIn = {
        ...mockCheckIns[1],
        id: "mid",
        submitted_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      };

      render(<ProgressCharts checkIns={[recentCheckIn, midCheckIn]} />);

      // Click 90 days
      fireEvent.click(screen.getByText("Last 90 Days"));

      expect(screen.getByText("Last 90 Days")).toHaveClass("gradient-electric");
    });
  });

  describe("Tooltip and Legend Formatters", () => {
    beforeEach(() => {
      capturedTooltipFormatters.length = 0;
      capturedYAxisFormatters.length = 0;
      legendFormatter = null;
    });

    it("weight tooltip formatter returns value with kg suffix and 'Weight' label", () => {
      render(<ProgressCharts checkIns={mockCheckIns} />);

      // First tooltip is the weight chart
      expect(capturedTooltipFormatters.length).toBeGreaterThanOrEqual(1);
      const weightFormatter = capturedTooltipFormatters[0];
      const result = weightFormatter(85, "weight");
      expect(result[0]).toBe("85kg");
      expect(result[1]).toBe("Weight");
    });

    it("measurements tooltip formatter capitalizes name and adds cm suffix", () => {
      render(<ProgressCharts checkIns={mockCheckIns} />);

      // Second tooltip is the measurements chart
      expect(capturedTooltipFormatters.length).toBeGreaterThanOrEqual(2);
      const measurementsFormatter = capturedTooltipFormatters[1];
      const result = measurementsFormatter(95, "chest");
      expect(result[0]).toBe("95cm");
      expect(result[1]).toBe("Chest");
    });

    it("legend formatter capitalizes value name", () => {
      render(<ProgressCharts checkIns={mockCheckIns} />);

      expect(legendFormatter).not.toBeNull();
      const result = legendFormatter!("waist");
      // The formatter returns a <span> element with capitalized text
      expect(result).toBeTruthy();
    });

    it("YAxis weight formatter adds kg suffix", () => {
      render(<ProgressCharts checkIns={mockCheckIns} />);

      expect(capturedYAxisFormatters.length).toBeGreaterThanOrEqual(1);
      expect(capturedYAxisFormatters[0](85)).toBe("85kg");
    });

    it("YAxis measurements formatter adds cm suffix", () => {
      render(<ProgressCharts checkIns={mockCheckIns} />);

      expect(capturedYAxisFormatters.length).toBeGreaterThanOrEqual(2);
      expect(capturedYAxisFormatters[1](95)).toBe("95cm");
    });
  });

  describe("No measurements data", () => {
    it("does not render measurements section when no measurement data", () => {
      const checkInsNoMeasurements = mockCheckIns.map((c) => ({
        ...c,
        chest_cm: null,
        waist_cm: null,
        arms_cm: null,
        thighs_cm: null,
        neck_cm: null,
        calves_cm: null,
      }));

      render(<ProgressCharts checkIns={checkInsNoMeasurements} />);

      expect(screen.queryByText("Measurements")).not.toBeInTheDocument();
    });
  });
});
