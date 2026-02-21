import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhotosGallery } from "../photos-gallery";

// Mock Supabase client for signed URL resolution
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: (path: string) =>
          Promise.resolve({
            data: { signedUrl: `https://signed.example.com/${path}` },
            error: null,
          }),
      }),
    },
  }),
}));

// Mock Radix Dialog
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}));

describe("PhotosGallery Component", () => {
  const mockCheckIns = [
    {
      id: "1",
      client_id: "client1",
      submitted_at: "2025-01-15T00:00:00Z",
      weight: 80,
      body_fat_percent: null,
      chest_cm: null,
      waist_cm: null,
      hips_cm: null,
      arms_cm: null,
      thighs_cm: null,
      neck_cm: null,
      calves_cm: null,
      photo_front: "https://example.com/front1.jpg",
      photo_side: "https://example.com/side1.jpg",
      photo_back: "https://example.com/back1.jpg",
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
      created_at: "2025-01-15T00:00:00Z",
    },
    {
      id: "2",
      client_id: "client1",
      submitted_at: "2025-01-01T00:00:00Z",
      weight: 82,
      body_fat_percent: null,
      chest_cm: null,
      waist_cm: null,
      hips_cm: null,
      arms_cm: null,
      thighs_cm: null,
      neck_cm: null,
      calves_cm: null,
      photo_front: "https://example.com/front2.jpg",
      photo_side: null,
      photo_back: "https://example.com/back2.jpg",
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
      created_at: "2025-01-01T00:00:00Z",
    },
  ];

  const emptyCheckIns = [
    {
      id: "1",
      client_id: "client1",
      submitted_at: "2025-01-15T00:00:00Z",
      weight: 80,
      body_fat_percent: null,
      chest_cm: null,
      waist_cm: null,
      hips_cm: null,
      arms_cm: null,
      thighs_cm: null,
      neck_cm: null,
      calves_cm: null,
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
      created_at: "2025-01-15T00:00:00Z",
    },
  ];

  it("renders gallery title", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
  });

  it("renders compare button", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    expect(screen.getByText("Compare")).toBeInTheDocument();
  });

  it("renders empty state when no photos", () => {
    render(<PhotosGallery checkIns={emptyCheckIns} />);
    expect(screen.getByText("No progress photos available")).toBeInTheDocument();
  });

  it("renders empty state when empty check-ins array", () => {
    render(<PhotosGallery checkIns={[]} />);
    expect(screen.getByText("No progress photos available")).toBeInTheDocument();
  });

  it("renders photo thumbnails", async () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it("renders photo view labels", async () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    await waitFor(() => {
      expect(screen.getAllByText("front").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("back").length).toBeGreaterThan(0);
  });

  it("enables compare mode on button click", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);
    expect(screen.getByText("Exit Compare")).toBeInTheDocument();
  });

  it("shows compare instructions when in compare mode", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);
    expect(
      screen.getByText(/Select two dates to compare progress photos side-by-side/)
    ).toBeInTheDocument();
  });

  it("groups photos by check-in date", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    // Check that dates are displayed
    const dateElements = screen.getAllByText(/Jan \d+, \d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("uses athletic-card styling", () => {
    const { container } = render(<PhotosGallery checkIns={mockCheckIns} />);
    expect(container.querySelectorAll(".athletic-card").length).toBeGreaterThan(0);
  });

  it("shows view selector buttons in compare mode after selecting dates", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // Click on check-in cards to select dates
    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));
    if (cards[0]) fireEvent.click(cards[0]);
    if (cards[1]) fireEvent.click(cards[1]);

    // View selector should appear
    expect(screen.getByRole("button", { name: /front/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /side/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("opens lightbox when clicking a photo in non-compare mode", async () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });

    // Click on the first photo thumbnail
    const images = screen.getAllByRole("img");
    const photoContainer = images[0].closest(".aspect-\\[3\\/4\\]") || images[0].parentElement;
    if (photoContainer) {
      fireEvent.click(photoContainer);
    }

    // Lightbox should appear
    await waitFor(() => {
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByText("Progress Photo")).toBeInTheDocument();
    });
  });

  it("switches compare view when clicking side or back buttons", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // Select both dates
    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));
    if (cards[0]) fireEvent.click(cards[0]);
    if (cards[1]) fireEvent.click(cards[1]);

    // Click "side" view
    const sideButton = screen.getByRole("button", { name: /side/i });
    fireEvent.click(sideButton);

    // Side button should be active (gradient-electric)
    expect(sideButton).toHaveClass("gradient-electric");
  });

  it("shows 'Selected' badge on selected dates in compare mode", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // Select first date
    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));
    if (cards[0]) fireEvent.click(cards[0]);

    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("deselects first date when clicking it again in compare mode", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));

    // Select first date
    if (cards[0]) fireEvent.click(cards[0]);
    expect(screen.getByText("Selected")).toBeInTheDocument();

    // Deselect first date
    if (cards[0]) fireEvent.click(cards[0]);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("shows compare instruction text based on selection count", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // No dates selected
    expect(screen.getByText(/Select the first date/)).toBeInTheDocument();

    // Select first date
    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));
    if (cards[0]) fireEvent.click(cards[0]);

    // One date selected
    expect(screen.getByText(/Select one more date/)).toBeInTheDocument();

    // Select second date
    if (cards[1]) fireEvent.click(cards[1]);

    // Both dates selected
    expect(screen.getByText(/Both dates selected/)).toBeInTheDocument();
  });

  it("exits compare mode and resets selections", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);

    // Enter compare mode
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // Select a date
    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));
    if (cards[0]) fireEvent.click(cards[0]);

    // Exit compare mode
    const exitButton = screen.getByText("Exit Compare");
    fireEvent.click(exitButton);

    // Should be back in normal mode
    expect(screen.getByText("Compare")).toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("deselects second date when clicking it again in compare mode", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    const cards = screen.getAllByText(/Jan \d+, \d{4}/).map((el) => el.closest(".athletic-card"));

    // Select first date, then second date
    if (cards[0]) fireEvent.click(cards[0]);
    if (cards[1]) fireEvent.click(cards[1]);

    // Both should be selected
    expect(screen.getAllByText("Selected").length).toBe(2);

    // Deselect second date
    if (cards[1]) fireEvent.click(cards[1]);

    // Only first date should remain selected
    expect(screen.getAllByText("Selected").length).toBe(1);
  });

  it("replaces first date when both dates are selected and a third is clicked", () => {
    // Need 3 check-ins for this test
    const threeCheckIns = [
      ...mockCheckIns,
      {
        id: "3",
        client_id: "client1",
        submitted_at: "2024-12-15T00:00:00Z",
        weight: 85,
        body_fat_percent: null,
        chest_cm: null,
        waist_cm: null,
        hips_cm: null,
        arms_cm: null,
        thighs_cm: null,
        neck_cm: null,
        calves_cm: null,
        photo_front: "https://example.com/front3.jpg",
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
        created_at: "2024-12-15T00:00:00Z",
      },
    ];

    render(<PhotosGallery checkIns={threeCheckIns} />);
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    const cards = screen
      .getAllByText(/(Jan|Dec) \d+, \d{4}/)
      .map((el) => el.closest(".athletic-card"));

    // Select first two dates
    if (cards[0]) fireEvent.click(cards[0]);
    if (cards[1]) fireEvent.click(cards[1]);

    expect(screen.getAllByText("Selected").length).toBe(2);

    // Click a third date - should replace the first selected date
    if (cards[2]) fireEvent.click(cards[2]);

    // Should still have 2 selected
    expect(screen.getAllByText("Selected").length).toBe(2);
  });

  it("does not open lightbox when clicking photo in compare mode", async () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);
    });

    // Enter compare mode
    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    // Click on a photo - should not open lightbox
    const images = screen.getAllByRole("img");
    const photoContainer = images[0].closest(".aspect-\\[3\\/4\\]") || images[0].parentElement;
    if (photoContainer) {
      fireEvent.click(photoContainer);
    }

    // Lightbox should NOT appear
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});
