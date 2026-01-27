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
  useList: () => ({
    query: {
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    },
  }),
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

// Mock new profile cards
jest.mock("@/components/dashboard/profile-plan-card", () => ({
  ProfilePlanCard: () => <div data-testid="profile-plan-card">Plan Card</div>,
}));

jest.mock("@/components/dashboard/profile-conditions-card", () => ({
  ProfileConditionsCard: () => <div data-testid="profile-conditions-card">Conditions Card</div>,
}));

jest.mock("@/components/dashboard/profile-targets-card", () => ({
  ProfileTargetsCard: () => <div data-testid="profile-targets-card">Targets Card</div>,
}));

// Mock the profile data hook
jest.mock("@/hooks/use-client-profile-data", () => ({
  useClientProfileData: () => ({
    conditions: [],
    limits: [],
    currentLimits: null,
    futureLimits: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  calculatePlanInfo: () => ({ isConfigured: false }),
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

  it("renders profile plan card component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-plan-card")).toBeInTheDocument();
    });
  });

  it("renders profile conditions card component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-conditions-card")).toBeInTheDocument();
    });
  });

  it("renders profile targets card component", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId("profile-targets-card")).toBeInTheDocument();
    });
  });
});
