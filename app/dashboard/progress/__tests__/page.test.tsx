import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProgressPage from "../page";

// Mock Supabase auth
const mockGetUser = jest.fn();
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock Refine useList hook
const mockUseList = jest.fn();
jest.mock("@refinedev/core", () => ({
  useList: () => mockUseList(),
}));

// Mock ProgressCharts component
jest.mock("@/components/admin/progress-charts", () => ({
  ProgressCharts: ({ checkIns }: { checkIns: unknown[] }) => (
    <div data-testid="progress-charts">ProgressCharts with {checkIns.length} check-ins</div>
  ),
}));

// Mock PhotosGallery component
jest.mock("@/components/admin/photos-gallery", () => ({
  PhotosGallery: ({ checkIns }: { checkIns: unknown[] }) => (
    <div data-testid="photos-gallery">PhotosGallery with {checkIns.length} check-ins</div>
  ),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("ProgressPage", () => {
  const mockCheckIns = [
    {
      id: "1",
      client_id: "user-123",
      submitted_at: "2025-01-01T00:00:00Z",
      weight: 85,
      body_fat_percent: 20,
      chest_cm: 100,
      waist_cm: 85,
      hips_cm: 95,
      arms_cm: 35,
      thighs_cm: 55,
      photo_front: "https://example.com/front1.jpg",
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
      client_id: "user-123",
      submitted_at: "2025-01-15T00:00:00Z",
      weight: 83,
      body_fat_percent: 18,
      chest_cm: 101,
      waist_cm: 82,
      hips_cm: 94,
      arms_cm: 36,
      thighs_cm: 56,
      photo_front: "https://example.com/front2.jpg",
      photo_side: "https://example.com/side2.jpg",
      photo_back: "https://example.com/back2.jpg",
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
  });

  it("renders page header with title", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("My")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    mockUseList.mockReturnValue({
      query: {
        data: null,
        isLoading: true,
        isError: false,
      },
    });

    const { container } = render(<ProgressPage />);

    // Check for loading animation
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders empty state when no check-ins", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: [] },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("No Progress Data Yet")).toBeInTheDocument();
    expect(
      screen.getByText("Submit your first check-in to start tracking your progress!")
    ).toBeInTheDocument();
    expect(screen.getByText("Submit First Check-In")).toBeInTheDocument();
  });

  it("renders empty state with link to check-in page", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: [] },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    const link = screen.getByRole("link", { name: /submit first check-in/i });
    expect(link).toHaveAttribute("href", "/dashboard/checkin");
  });

  it("renders tab navigation", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("Progress Charts")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
  });

  it("defaults to Progress Charts tab", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByTestId("progress-charts")).toBeInTheDocument();
    expect(screen.queryByTestId("photos-gallery")).not.toBeInTheDocument();
  });

  it("switches to Photos tab when clicked", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    // Click Photos tab
    fireEvent.click(screen.getByText("Photos"));

    expect(screen.getByTestId("photos-gallery")).toBeInTheDocument();
    expect(screen.queryByTestId("progress-charts")).not.toBeInTheDocument();
  });

  it("passes check-ins to ProgressCharts component", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("ProgressCharts with 2 check-ins")).toBeInTheDocument();
  });

  it("passes check-ins to PhotosGallery component", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    // Switch to Photos tab
    fireEvent.click(screen.getByText("Photos"));

    expect(screen.getByText("PhotosGallery with 2 check-ins")).toBeInTheDocument();
  });

  it("displays check-in count", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("2 check-ins recorded")).toBeInTheDocument();
  });

  it("renders error state when query fails", () => {
    mockUseList.mockReturnValue({
      query: {
        data: null,
        isLoading: false,
        isError: true,
      },
    });

    render(<ProgressPage />);

    expect(screen.getByText("Failed to load progress data. Please try again.")).toBeInTheDocument();
  });

  it("uses athletic-card styling", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    const { container } = render(<ProgressPage />);

    expect(container.querySelectorAll(".athletic-card").length).toBeGreaterThan(0);
  });

  it("fetches check-ins for the logged-in user", async () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  it("highlights active tab with gradient-electric class", () => {
    mockUseList.mockReturnValue({
      query: {
        data: { data: mockCheckIns },
        isLoading: false,
        isError: false,
      },
    });

    render(<ProgressPage />);

    const chartsTab = screen.getByText("Progress Charts").closest("button");
    expect(chartsTab).toHaveClass("gradient-electric");

    // Click Photos tab
    fireEvent.click(screen.getByText("Photos"));

    const photosTab = screen.getByText("Photos").closest("button");
    expect(photosTab).toHaveClass("gradient-electric");
    expect(chartsTab).not.toHaveClass("gradient-electric");
  });
});
