import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckInHistoryItem } from "../checkin-history-item";
import type { CheckIn } from "@/lib/database.types";

// Mock createSignedUrl so we can control it per test
const mockCreateSignedUrl = jest.fn().mockResolvedValue({
  data: { signedUrl: "https://example.com/signed-url" },
});

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: mockCreateSignedUrl,
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
  plan_cycle: 1,
  created_at: "2026-01-20T10:00:00Z",
};

describe("CheckInHistoryItem Component", () => {
  beforeEach(() => {
    mockCreateSignedUrl.mockClear();
  });

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

describe("CheckInHistoryItem with photos", () => {
  const checkInWithPhotos: CheckIn = {
    ...mockCheckIn,
    photo_front: "photos/front.jpg",
    photo_side: "photos/side.jpg",
    photo_back: "photos/back.jpg",
  };

  beforeEach(() => {
    mockCreateSignedUrl.mockClear();
    let callCount = 0;
    mockCreateSignedUrl.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        data: { signedUrl: `https://example.com/signed-url-${callCount}` },
      });
    });
  });

  it("fetches photo signed URLs when expanded", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      // Should have called createSignedUrl for each photo
      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(3);
    });
  });

  it("renders photo images after fetching URLs", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByAltText("Front view")).toBeInTheDocument();
      expect(screen.getByAltText("Side view")).toBeInTheDocument();
      expect(screen.getByAltText("Back view")).toBeInTheDocument();
    });
  });

  it("shows Progress Photos section heading when photos exist", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Progress Photos")).toBeInTheDocument();
    });
  });

  it("opens lightbox when a photo is clicked", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByAltText("Front view")).toBeInTheDocument();
    });

    // Click on front photo to open lightbox
    const frontPhotoButton = screen.getByAltText("Front view").closest("button")!;
    fireEvent.click(frontPhotoButton);

    // Lightbox should appear
    expect(screen.getByAltText("Full size progress photo")).toBeInTheDocument();
  });

  it("closes lightbox when backdrop is clicked", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByAltText("Front view")).toBeInTheDocument();
    });

    // Open lightbox
    const frontPhotoButton = screen.getByAltText("Front view").closest("button")!;
    fireEvent.click(frontPhotoButton);
    expect(screen.getByAltText("Full size progress photo")).toBeInTheDocument();

    // Click backdrop to close
    const backdrop = screen.getByAltText("Full size progress photo").closest("div.fixed")!;
    fireEvent.click(backdrop);

    expect(screen.queryByAltText("Full size progress photo")).not.toBeInTheDocument();
  });

  it("closes lightbox when X button is clicked", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByAltText("Front view")).toBeInTheDocument();
    });

    // Open lightbox
    const frontPhotoButton = screen.getByAltText("Front view").closest("button")!;
    fireEvent.click(frontPhotoButton);
    expect(screen.getByAltText("Full size progress photo")).toBeInTheDocument();

    // Find and click the X close button (absolute positioned button with X icon)
    const closeButtons = screen.getAllByRole("button");
    const xCloseButton = closeButtons.find((btn) => btn.classList.contains("absolute"));
    if (xCloseButton) {
      fireEvent.click(xCloseButton);
      expect(screen.queryByAltText("Full size progress photo")).not.toBeInTheDocument();
    }
  });

  it("opens lightbox when side photo is clicked", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByAltText("Side view")).toBeInTheDocument();
    });
    const sidePhotoButton = screen.getByAltText("Side view").closest("button")!;
    fireEvent.click(sidePhotoButton);
    expect(screen.getByAltText("Full size progress photo")).toBeInTheDocument();
  });

  it("opens lightbox when back photo is clicked", async () => {
    render(<CheckInHistoryItem checkIn={checkInWithPhotos} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByAltText("Back view")).toBeInTheDocument();
    });
    const backPhotoButton = screen.getByAltText("Back view").closest("button")!;
    fireEvent.click(backPhotoButton);
    expect(screen.getByAltText("Full size progress photo")).toBeInTheDocument();
  });

  it("fetches only available photos (only front)", async () => {
    const checkInFrontOnly: CheckIn = {
      ...mockCheckIn,
      photo_front: "photos/front.jpg",
      photo_side: null,
      photo_back: null,
    };

    render(<CheckInHistoryItem checkIn={checkInFrontOnly} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  it("does not fetch URLs when no photos exist", async () => {
    mockCreateSignedUrl.mockClear();
    render(<CheckInHistoryItem checkIn={mockCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // Wait a tick to ensure any async operations complete
    await waitFor(() => {
      // Should not have called createSignedUrl since mockCheckIn has no photos
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });
  });
});

describe("CheckInHistoryItem with low adherence values", () => {
  it("applies red color for diet adherence below 60", () => {
    const lowDietCheckIn: CheckIn = {
      ...mockCheckIn,
      diet_adherence: 40,
    };

    const { container } = render(<CheckInHistoryItem checkIn={lowDietCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // The diet adherence bar should have red-500 class
    const adherenceBars = container.querySelectorAll(".bg-red-500");
    expect(adherenceBars.length).toBeGreaterThan(0);
  });

  it("applies yellow color for diet adherence between 60-79", () => {
    const midDietCheckIn: CheckIn = {
      ...mockCheckIn,
      diet_adherence: 70,
    };

    const { container } = render(<CheckInHistoryItem checkIn={midDietCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    const yellowBars = container.querySelectorAll(".bg-yellow-500");
    expect(yellowBars.length).toBeGreaterThan(0);
  });

  it("applies red color for workout adherence below 60", () => {
    const lowWorkoutCheckIn: CheckIn = {
      ...mockCheckIn,
      workout_adherence: 30,
    };

    const { container } = render(<CheckInHistoryItem checkIn={lowWorkoutCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    const adherenceBars = container.querySelectorAll(".bg-red-500");
    expect(adherenceBars.length).toBeGreaterThan(0);
  });

  it("applies yellow color for workout adherence between 60-79", () => {
    const midWorkoutCheckIn: CheckIn = {
      ...mockCheckIn,
      workout_adherence: 65,
    };

    const { container } = render(<CheckInHistoryItem checkIn={midWorkoutCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    const yellowBars = container.querySelectorAll(".bg-yellow-500");
    expect(yellowBars.length).toBeGreaterThan(0);
  });
});

describe("CheckInHistoryItem RatingDisplay with low values", () => {
  it("applies red color for rating below 4", () => {
    const lowRatingCheckIn: CheckIn = {
      ...mockCheckIn,
      energy_rating: 2,
      sleep_rating: 1,
      stress_rating: 3,
      mood_rating: 2,
    };

    const { container } = render(<CheckInHistoryItem checkIn={lowRatingCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    // All ratings should have red color
    const redRatings = container.querySelectorAll(".text-red-500");
    expect(redRatings.length).toBeGreaterThan(0);
  });

  it("applies yellow color for rating between 4-6", () => {
    const midRatingCheckIn: CheckIn = {
      ...mockCheckIn,
      energy_rating: 5,
      sleep_rating: 4,
      stress_rating: 6,
      mood_rating: 5,
    };

    const { container } = render(<CheckInHistoryItem checkIn={midRatingCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    const yellowRatings = container.querySelectorAll(".text-yellow-500");
    expect(yellowRatings.length).toBeGreaterThan(0);
  });

  it("shows rating values in format value/10", () => {
    const lowRatingCheckIn: CheckIn = {
      ...mockCheckIn,
      energy_rating: 2,
    };

    render(<CheckInHistoryItem checkIn={lowRatingCheckIn} />);

    // Expand
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("2/10")).toBeInTheDocument();
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
    plan_cycle: 1,
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
