import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientReviewPage from "../page";

// Mock modules
jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "test-client-id" })),
}));

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "admin-id" } },
      }),
    },
  })),
}));

// Mock Refine hooks
const mockProfileData = {
  id: "test-client-id",
  full_name: "John Doe",
  email: "john@example.com",
  phone: "+919876543210",
  date_of_birth: "1992-05-15",
  gender: "male" as const,
  avatar_url: null,
  address: null,
  role: "client" as const,
  invited_at: null,
  invitation_accepted_at: null,
  is_deactivated: false,
  deactivated_at: null,
  deactivation_reason: null,
  plan_start_date: "2026-01-01",
  plan_duration_days: 14,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockCheckInData = [
  {
    id: "checkin-1",
    client_id: "test-client-id",
    weight: 75,
    submitted_at: "2026-01-20T00:00:00Z",
    flagged_for_followup: false,
  },
];

const mockConditionsData = [
  {
    id: "cc-1",
    client_id: "test-client-id",
    condition_id: "cond-1",
    medical_conditions: {
      id: "cond-1",
      name: "Diabetes Type 2",
      slug: "diabetes-type-2",
    },
    diagnosed_at: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: "admin-id",
  },
  {
    id: "cc-2",
    client_id: "test-client-id",
    condition_id: "cond-2",
    medical_conditions: {
      id: "cond-2",
      name: "Hypertension",
      slug: "hypertension",
    },
    diagnosed_at: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: "admin-id",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseOne = jest.fn<any, any>(() => ({
  query: {
    data: { data: mockProfileData },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseList = jest.fn<any, any>((options: { resource: string }) => {
  if (options.resource === "check_ins") {
    return {
      query: {
        data: { data: mockCheckInData },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    };
  }
  if (options.resource === "client_conditions") {
    return {
      query: {
        data: { data: mockConditionsData },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    };
  }
  return {
    query: {
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
  };
});

const mockUseInvalidate = jest.fn(() => jest.fn());

jest.mock("@refinedev/core", () => ({
  useOne: () => mockUseOne(),
  useList: (options: { resource: string }) => mockUseList(options),
  useInvalidate: () => mockUseInvalidate(),
}));

// Mock components
jest.mock("@/components/admin/checkin-review", () => ({
  CheckInReview: () => <div data-testid="checkin-review">CheckIn Review</div>,
}));

jest.mock("@/components/admin/progress-charts", () => ({
  ProgressCharts: () => <div data-testid="progress-charts">Progress Charts</div>,
}));

jest.mock("@/components/admin/photos-gallery", () => ({
  PhotosGallery: () => <div data-testid="photos-gallery">Photos Gallery</div>,
}));

jest.mock("@/components/admin/plans-summary", () => ({
  PlansSummary: () => <div data-testid="plans-summary">Plans Summary</div>,
}));

jest.mock("@/components/admin/edit-client-modal", () => ({
  EditClientModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="edit-modal">Edit Modal</div> : null,
}));

describe("ClientReviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock data
    mockUseOne.mockImplementation(() => ({
      query: {
        data: { data: mockProfileData },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    }));
    mockUseList.mockImplementation((options: { resource: string }) => {
      if (options.resource === "check_ins") {
        return {
          query: {
            data: { data: mockCheckInData },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          },
        };
      }
      if (options.resource === "client_conditions") {
        return {
          query: {
            data: { data: mockConditionsData },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          },
        };
      }
      return {
        query: {
          data: { data: [] },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      };
    });
  });

  describe("Header Display", () => {
    it("renders client name and email", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("displays gender with correct label", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText("Male")).toBeInTheDocument();
    });

    it("displays male gender icon", () => {
      render(<ClientReviewPage />);

      // Check that the male gender symbol is present
      expect(screen.getByText("♂")).toBeInTheDocument();
    });

    it("displays female gender with correct icon when gender is female", () => {
      mockUseOne.mockImplementation(() => ({
        query: {
          data: { data: { ...mockProfileData, gender: "female" } },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      }));

      render(<ClientReviewPage />);

      expect(screen.getByText("Female")).toBeInTheDocument();
      expect(screen.getByText("♀")).toBeInTheDocument();
    });

    it("hides gender when not set", () => {
      mockUseOne.mockImplementation(() => ({
        query: {
          data: { data: { ...mockProfileData, gender: null } },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      }));

      render(<ClientReviewPage />);

      expect(screen.queryByText("Male")).not.toBeInTheDocument();
      expect(screen.queryByText("Female")).not.toBeInTheDocument();
      expect(screen.queryByText("♂")).not.toBeInTheDocument();
    });
  });

  describe("Age Display", () => {
    it("calculates and displays age from date of birth", () => {
      // DOB is 1992-05-15, current year in test context
      // Mock the date to get consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-26"));

      render(<ClientReviewPage />);

      // Person born on 1992-05-15 would be 33 on 2026-01-26
      expect(screen.getByText("Age 33")).toBeInTheDocument();

      jest.useRealTimers();
    });

    it("hides age when DOB is not set", () => {
      mockUseOne.mockImplementation(() => ({
        query: {
          data: { data: { ...mockProfileData, date_of_birth: null } },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      }));

      render(<ClientReviewPage />);

      expect(screen.queryByText(/Age \d+/)).not.toBeInTheDocument();
    });

    it("calculates age correctly when birthday has passed this year", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15")); // After May 15

      render(<ClientReviewPage />);

      // Person born on 1992-05-15 would be 34 after their birthday in 2026
      expect(screen.getByText("Age 34")).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe("Conditions Display", () => {
    it("displays medical conditions as chips", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText("Diabetes Type 2")).toBeInTheDocument();
      expect(screen.getByText("Hypertension")).toBeInTheDocument();
    });

    it("displays conditions label", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText("Conditions:")).toBeInTheDocument();
    });

    it("hides conditions section when no conditions", () => {
      mockUseList.mockImplementation((options: { resource: string }) => {
        if (options.resource === "client_conditions") {
          return {
            query: {
              data: { data: [] },
              isLoading: false,
              error: null,
              refetch: jest.fn(),
            },
          };
        }
        if (options.resource === "check_ins") {
          return {
            query: {
              data: { data: mockCheckInData },
              isLoading: false,
              error: null,
              refetch: jest.fn(),
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          },
        };
      });

      render(<ClientReviewPage />);

      expect(screen.queryByText("Conditions:")).not.toBeInTheDocument();
    });
  });

  describe("Edit Button", () => {
    it("renders Edit Profile button", () => {
      render(<ClientReviewPage />);

      expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
    });

    it("opens edit modal when clicked", async () => {
      const user = userEvent.setup();
      render(<ClientReviewPage />);

      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();

      const editButton = screen.getByRole("button", { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    });
  });

  describe("Quick Stats", () => {
    it("displays weight when available", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText("Current: 75kg")).toBeInTheDocument();
    });

    it("displays last check-in date", () => {
      render(<ClientReviewPage />);

      expect(screen.getByText(/Last check-in:/)).toBeInTheDocument();
    });

    it("displays days in program", () => {
      // Ensure mocks are properly reset for this test
      mockUseOne.mockImplementation(() => ({
        query: {
          data: { data: mockProfileData },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      }));
      mockUseList.mockImplementation((options: { resource: string }) => {
        if (options.resource === "check_ins") {
          return {
            query: {
              data: { data: mockCheckInData },
              isLoading: false,
              error: null,
              refetch: jest.fn(),
            },
          };
        }
        if (options.resource === "client_conditions") {
          return {
            query: {
              data: { data: mockConditionsData },
              isLoading: false,
              error: null,
              refetch: jest.fn(),
            },
          };
        }
        return {
          query: {
            data: { data: [] },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          },
        };
      });

      render(<ClientReviewPage />);

      // Should show days in program (exact number depends on current date vs created_at)
      expect(screen.getByText(/days in program/)).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton when data is loading", () => {
      mockUseOne.mockImplementation(() => ({
        query: {
          data: null,
          isLoading: true,
          error: null,
          refetch: jest.fn(),
        },
      }));

      const { container } = render(<ClientReviewPage />);

      // Check for the animate-pulse loading skeleton
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Not Found State", () => {
    it("shows not found message when profile does not exist", () => {
      mockUseOne.mockImplementation(() => ({
        query: {
          data: { data: null },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        },
      }));

      render(<ClientReviewPage />);

      expect(screen.getByText("Client not found")).toBeInTheDocument();
    });
  });
});

// Test for calculateAge function (extracted for unit testing)
describe("calculateAge helper function", () => {
  // Since calculateAge is not exported, we test its behavior through the component
  // These tests verify the age calculation logic

  it("handles edge case where birthday is today", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15")); // Same as DOB month/day

    mockUseOne.mockImplementation(() => ({
      query: {
        data: { data: mockProfileData },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      },
    }));

    render(<ClientReviewPage />);

    // Person born on 1992-05-15 would be 34 on 2026-05-15
    expect(screen.getByText("Age 34")).toBeInTheDocument();

    jest.useRealTimers();
  });
});
