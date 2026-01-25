import { render, screen, waitFor } from "@testing-library/react";
import ProfilePage from "../page";

// Mock Supabase client
const mockGetUser = jest.fn();
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock Refine hooks
const mockUseOne = jest.fn();
jest.mock("@refinedev/core", () => ({
  useOne: () => mockUseOne(),
}));

// Mock child components
jest.mock("@/components/dashboard/profile-photo-upload", () => ({
  ProfilePhotoUpload: ({ userId }: { userId: string }) => (
    <div data-testid="profile-photo-upload">Photo Upload for {userId}</div>
  ),
}));

jest.mock("@/components/dashboard/profile-details-card", () => ({
  ProfileDetailsCard: ({
    profile,
    userEmail,
  }: {
    profile: { full_name: string } | null;
    userEmail: string | null;
  }) => (
    <div data-testid="profile-details-card">
      Details Card - {profile?.full_name || "No profile"} - {userEmail}
    </div>
  ),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockUseOne.mockReturnValue({
      query: {
        data: {
          data: {
            id: "user-123",
            email: "test@example.com",
            full_name: "John Doe",
            avatar_url: null,
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      },
    });
  });

  it("renders page title", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/My/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    });
  });

  it("renders profile photo upload component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-photo-upload")).toBeInTheDocument();
    });
  });

  it("renders profile details card component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-details-card")).toBeInTheDocument();
    });
  });

  it("passes user ID to photo upload component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Photo Upload for user-123/i)).toBeInTheDocument();
    });
  });

  it("passes user email to details card", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  it("shows loading skeleton when data is loading", () => {
    mockUseOne.mockReturnValue({
      query: {
        data: null,
        isLoading: true,
        refetch: jest.fn(),
      },
    });

    const { container } = render(<ProfilePage />);

    // Check for skeleton elements
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows loading state when no user ID", () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { container } = render(<ProfilePage />);

    // Should show loading skeleton when no user
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
