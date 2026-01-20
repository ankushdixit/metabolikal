import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressCharts } from "../progress-charts";

// Mock Recharts components
jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => null,
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
});
