import { render, screen, fireEvent } from "@testing-library/react";
import { PhotosGallery } from "../photos-gallery";

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

  it("renders photo thumbnails", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it("renders photo view labels", () => {
    render(<PhotosGallery checkIns={mockCheckIns} />);
    expect(screen.getAllByText("front").length).toBeGreaterThan(0);
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
});
