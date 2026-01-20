import { render, screen, fireEvent } from "@testing-library/react";
import { CheckInHistoryItem } from "../checkin-history-item";
import type { CheckIn } from "@/lib/database.types";

// Mock Supabase client
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed-url" },
        }),
      }),
    },
  }),
}));

const mockCheckIn: CheckIn = {
  id: "checkin-1",
  client_id: "user-123",
  submitted_at: "2026-01-20T10:00:00Z",
  weight: 75.5,
  body_fat_percent: 15,
  chest_cm: 100,
  waist_cm: 80,
  hips_cm: 95,
  arms_cm: 35,
  thighs_cm: 55,
  photo_front: null,
  photo_side: null,
  photo_back: null,
  energy_rating: 7,
  sleep_rating: 8,
  stress_rating: 6,
  mood_rating: 7,
  diet_adherence: 85,
  workout_adherence: 90,
  challenges: "Busy work week",
  progress_notes: "Feeling stronger",
  questions: "Should I increase cardio?",
  admin_notes: null,
  flagged_for_followup: false,
  reviewed_at: null,
  reviewed_by: null,
  created_at: "2026-01-20T10:00:00Z",
};

describe("CheckInHistoryItem Component", () => {
  it("renders date in collapsed state", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);
    // Date should be visible in collapsed header
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders weight in collapsed state", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);
    // Weight is shown in collapsed state
    const weightTexts = screen.getAllByText(/75\.5/);
    expect(weightTexts.length).toBeGreaterThan(0);
  });

  it("shows Complete badge when key data is present", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("expands on click to show details", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Initially should not show all details
    expect(screen.queryByText("Measurements")).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    // Now should show details
    expect(screen.getByText("Measurements")).toBeInTheDocument();
  });

  it("shows measurements section when expanded", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // Check for measurement labels
    expect(screen.getByText("Weight")).toBeInTheDocument();
    expect(screen.getByText("Body Fat")).toBeInTheDocument();
    expect(screen.getByText("Chest")).toBeInTheDocument();
  });

  it("shows subjective ratings when expanded", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Subjective Ratings")).toBeInTheDocument();
    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
  });

  it("shows compliance percentages when expanded", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Diet")).toBeInTheDocument();
    expect(screen.getByText("Workout")).toBeInTheDocument();
  });

  it("shows notes section when expanded", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Busy work week")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Feeling stronger")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(screen.getByText("Should I increase cardio?")).toBeInTheDocument();
  });

  it("collapses on second click", () => {
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Measurements")).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Measurements")).not.toBeInTheDocument();
  });

  it("renders athletic-card styling", () => {
    const { container } = render(<CheckInHistoryItem checkIn={mockCheckIn} />);
    const card = container.querySelector(".athletic-card");
    expect(card).toBeInTheDocument();
  });

  it("applies color coding to ratings", () => {
    const { container } = render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // Look for elements with the rating color class
    const greenRatings = container.querySelectorAll(".text-neon-green");
    expect(greenRatings.length).toBeGreaterThan(0);
  });
});

describe("CheckInHistoryItem with minimal data", () => {
  const minimalCheckIn: CheckIn = {
    id: "checkin-2",
    client_id: "user-123",
    submitted_at: "2026-01-15T10:00:00Z",
    weight: 76,
    body_fat_percent: null,
    chest_cm: null,
    waist_cm: null,
    hips_cm: null,
    arms_cm: null,
    thighs_cm: null,
    photo_front: null,
    photo_side: null,
    photo_back: null,
    energy_rating: null,
    sleep_rating: null,
    stress_rating: null,
    mood_rating: null,
    diet_adherence: null,
    workout_adherence: null,
    challenges: null,
    progress_notes: null,
    questions: null,
    admin_notes: null,
    flagged_for_followup: false,
    reviewed_at: null,
    reviewed_by: null,
    created_at: "2026-01-15T10:00:00Z",
  };

  it("renders without Complete badge when missing key data", () => {
    render(<CheckInHistoryItem checkIn={minimalCheckIn} />);
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
  });

  it("only shows weight in measurements when expanded", () => {
    render(<CheckInHistoryItem checkIn={minimalCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // "Body Fat" label should not be present when body_fat_percent is null
    expect(screen.getByText("Weight")).toBeInTheDocument();
    expect(screen.queryByText("Body Fat")).not.toBeInTheDocument();
  });

  it("does not show ratings section when no ratings", () => {
    render(<CheckInHistoryItem checkIn={minimalCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.queryByText("Subjective Ratings")).not.toBeInTheDocument();
  });

  it("does not show notes section when no notes", () => {
    render(<CheckInHistoryItem checkIn={minimalCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });
});
