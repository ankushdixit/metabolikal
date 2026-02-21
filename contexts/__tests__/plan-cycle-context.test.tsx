import { render, screen, act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Mocks — must be defined before imports
// ---------------------------------------------------------------------------

const mockUseAuth = jest.fn();
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseList = jest.fn();
jest.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

// daysBetween is a pure function — import real implementation
jest.mock("@/lib/challenge-utils", () => ({
  ...jest.requireActual("@/lib/challenge-utils"),
}));

// ---------------------------------------------------------------------------
// Now import modules under test
// ---------------------------------------------------------------------------
import {
  PlanCycleProvider,
  usePlanCycleData,
  usePlanCycleLoading,
  usePlanCycle,
} from "../plan-cycle-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_USER_ID = "user-abc-123";

/** Creates a profile object with sensible defaults, merged with overrides. */
function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    avatar_url: null,
    full_name: "Test User",
    role: "client",
    plan_duration_days: 90,
    plan_start_date: "2026-01-01",
    challenge_start_date: null,
    current_plan_cycle: 1,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Sets up mockUseAuth with defaults and optional overrides. */
function setupAuth(overrides: Record<string, unknown> = {}) {
  const defaults = {
    userId: TEST_USER_ID,
    profile: makeProfile(),
    isLoading: false,
    signOut: jest.fn(),
    authError: null,
  };
  mockUseAuth.mockReturnValue({ ...defaults, ...overrides });
}

/** Sets up mockUseList with a default empty/unused response. */
function setupUseList(data: unknown[] = [], isLoading = false) {
  mockUseList.mockReturnValue({
    query: {
      data: data.length > 0 ? { data } : undefined,
      isLoading,
    },
  });
}

/** Consumer component that exposes context values via data-testid attributes. */
function DataConsumer() {
  const ctx = usePlanCycleData();
  return (
    <div>
      <span data-testid="userId">{ctx.userId ?? "null"}</span>
      <span data-testid="currentCycle">{ctx.currentCycle}</span>
      <span data-testid="selectedCycle">{ctx.selectedCycle}</span>
      <span data-testid="isViewingHistory">{String(ctx.isViewingHistory)}</span>
      <span data-testid="cycleDetails">
        {ctx.cycleDetails ? JSON.stringify(ctx.cycleDetails) : "null"}
      </span>
      <span data-testid="currentCycleProfile">
        {ctx.currentCycleProfile ? JSON.stringify(ctx.currentCycleProfile) : "null"}
      </span>
      <button data-testid="setCycle2" onClick={() => ctx.setSelectedCycle(2)}>
        Select Cycle 2
      </button>
      <button data-testid="setCycle1" onClick={() => ctx.setSelectedCycle(1)}>
        Select Cycle 1
      </button>
    </div>
  );
}

function LoadingConsumer() {
  const ctx = usePlanCycleLoading();
  return <span data-testid="isLoading">{String(ctx.isLoading)}</span>;
}

function CombinedConsumer() {
  const ctx = usePlanCycle();
  return (
    <div>
      <span data-testid="combinedUserId">{ctx.userId ?? "null"}</span>
      <span data-testid="combinedIsLoading">{String(ctx.isLoading)}</span>
      <span data-testid="combinedCurrentCycle">{ctx.currentCycle}</span>
    </div>
  );
}

function renderWithProvider(children: ReactNode) {
  return render(<PlanCycleProvider>{children}</PlanCycleProvider>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlanCycleProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseList();
  });

  // =========================================================================
  // Basic rendering with profile data
  // =========================================================================
  describe("initial state with authenticated user", () => {
    it("provides userId, currentCycle, and selectedCycle from auth profile", () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 3 }),
      });

      renderWithProvider(<DataConsumer />);

      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("currentCycle").textContent).toBe("3");
      expect(screen.getByTestId("selectedCycle").textContent).toBe("3");
      expect(screen.getByTestId("isViewingHistory").textContent).toBe("false");
    });

    it("defaults currentCycle to 1 when profile.current_plan_cycle is null", () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: null }),
      });

      renderWithProvider(<DataConsumer />);

      expect(screen.getByTestId("currentCycle").textContent).toBe("1");
      expect(screen.getByTestId("selectedCycle").textContent).toBe("1");
    });

    it("provides currentCycleProfile with plan_start_date and plan_duration_days", () => {
      setupAuth({
        profile: makeProfile({
          plan_start_date: "2026-03-01",
          plan_duration_days: 60,
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      expect(profileData.startDate).toBe("2026-03-01");
      expect(profileData.durationDays).toBe(60);
    });

    it("uses created_at as fallback when plan_start_date is null", () => {
      setupAuth({
        profile: makeProfile({
          plan_start_date: null,
          plan_duration_days: 30,
          created_at: "2026-02-15T12:00:00Z",
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      expect(profileData.startDate).toBe("2026-02-15");
      expect(profileData.durationDays).toBe(30);
    });

    it("defaults plan_duration_days to 30 when null", () => {
      setupAuth({
        profile: makeProfile({ plan_duration_days: null }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      expect(profileData.durationDays).toBe(30);
    });
  });

  // =========================================================================
  // Challenge start date upgrade logic
  // =========================================================================
  describe("challenge_start_date extension logic", () => {
    it("extends duration when challenge_start_date is before plan_start_date", () => {
      setupAuth({
        profile: makeProfile({
          challenge_start_date: "2025-12-15",
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      // Gap is 17 days (Dec 15 to Jan 1), duration should be 17 + 90 = 107
      expect(profileData.startDate).toBe("2025-12-15");
      expect(profileData.durationDays).toBe(107);
    });

    it("does not extend duration when challenge_start_date equals plan_start_date", () => {
      setupAuth({
        profile: makeProfile({
          challenge_start_date: "2026-01-01",
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      // daysBetween returns 0 when dates are equal, so no extension
      expect(profileData.startDate).toBe("2026-01-01");
      expect(profileData.durationDays).toBe(90);
    });

    it("does not extend duration when challenge_start_date is after plan_start_date", () => {
      setupAuth({
        profile: makeProfile({
          challenge_start_date: "2026-01-15",
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      // challenge_start_date >= plan_start_date, so no gap
      expect(profileData.startDate).toBe("2026-01-01");
      expect(profileData.durationDays).toBe(90);
    });

    it("does not extend duration when challenge_start_date is null", () => {
      setupAuth({
        profile: makeProfile({
          challenge_start_date: null,
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
        }),
      });

      renderWithProvider(<DataConsumer />);

      const profileData = JSON.parse(screen.getByTestId("currentCycleProfile").textContent!);
      expect(profileData.startDate).toBe("2026-01-01");
      expect(profileData.durationDays).toBe(90);
    });
  });

  // =========================================================================
  // No profile (not logged in or profile not loaded)
  // =========================================================================
  describe("when profile is null", () => {
    it("provides null cycleDetails and null currentCycleProfile", () => {
      setupAuth({ userId: null, profile: null });

      renderWithProvider(<DataConsumer />);

      expect(screen.getByTestId("userId").textContent).toBe("null");
      expect(screen.getByTestId("currentCycle").textContent).toBe("1");
      expect(screen.getByTestId("cycleDetails").textContent).toBe("null");
      expect(screen.getByTestId("currentCycleProfile").textContent).toBe("null");
    });
  });

  // =========================================================================
  // Cycle selection and history viewing
  // =========================================================================
  describe("cycle selection", () => {
    it("updates selectedCycle via setSelectedCycle", async () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 3 }),
      });

      renderWithProvider(<DataConsumer />);

      expect(screen.getByTestId("selectedCycle").textContent).toBe("3");
      expect(screen.getByTestId("isViewingHistory").textContent).toBe("false");

      // Switch to cycle 2 (historical)
      await act(async () => {
        screen.getByTestId("setCycle2").click();
      });

      expect(screen.getByTestId("selectedCycle").textContent).toBe("2");
      expect(screen.getByTestId("isViewingHistory").textContent).toBe("true");
    });

    it("sets isViewingHistory=false when selectedCycle matches currentCycle", async () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 2 }),
      });

      renderWithProvider(<DataConsumer />);

      // Select a different cycle first
      await act(async () => {
        screen.getByTestId("setCycle1").click();
      });
      expect(screen.getByTestId("isViewingHistory").textContent).toBe("true");

      // Go back to current cycle
      await act(async () => {
        screen.getByTestId("setCycle2").click();
      });
      expect(screen.getByTestId("isViewingHistory").textContent).toBe("false");
    });
  });

  // =========================================================================
  // Historical cycle details from useList query
  // =========================================================================
  describe("historical cycle details", () => {
    it("uses plan_cycles data for cycleDetails when viewing history", async () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 2 }),
      });

      // When viewing cycle 1 (historical), useList returns plan_cycles data
      mockUseList.mockReturnValue({
        query: {
          data: {
            data: [
              {
                id: "cycle-1",
                client_id: TEST_USER_ID,
                cycle_number: 1,
                start_date: "2025-10-01",
                duration_days: 60,
                end_date: "2025-11-30",
                status: "completed",
                notes: null,
                created_at: "2025-10-01T00:00:00Z",
              },
            ],
          },
          isLoading: false,
        },
      });

      renderWithProvider(<DataConsumer />);

      // Switch to historical cycle
      await act(async () => {
        screen.getByTestId("setCycle1").click();
      });

      expect(screen.getByTestId("isViewingHistory").textContent).toBe("true");

      const cycleDetails = JSON.parse(screen.getByTestId("cycleDetails").textContent!);
      expect(cycleDetails.startDate).toBe("2025-10-01");
      expect(cycleDetails.durationDays).toBe(60);
    });

    it("returns null cycleDetails when historical data is not yet loaded", async () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 2 }),
      });

      // useList returns no data
      mockUseList.mockReturnValue({
        query: {
          data: undefined,
          isLoading: true,
        },
      });

      renderWithProvider(<DataConsumer />);

      // Switch to historical cycle
      await act(async () => {
        screen.getByTestId("setCycle1").click();
      });

      expect(screen.getByTestId("cycleDetails").textContent).toBe("null");
    });

    it("uses currentCycleProfile for cycleDetails when not viewing history", () => {
      setupAuth({
        profile: makeProfile({
          plan_start_date: "2026-01-01",
          plan_duration_days: 90,
          current_plan_cycle: 1,
        }),
      });

      renderWithProvider(<DataConsumer />);

      expect(screen.getByTestId("isViewingHistory").textContent).toBe("false");

      const cycleDetails = JSON.parse(screen.getByTestId("cycleDetails").textContent!);
      expect(cycleDetails.startDate).toBe("2026-01-01");
      expect(cycleDetails.durationDays).toBe(90);
    });
  });

  // =========================================================================
  // useList query configuration
  // =========================================================================
  describe("useList query configuration", () => {
    it("passes correct filters for plan_cycles query", () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 1 }),
      });

      renderWithProvider(<DataConsumer />);

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "plan_cycles",
          filters: [
            { field: "client_id", operator: "eq", value: TEST_USER_ID },
            { field: "cycle_number", operator: "eq", value: 1 },
          ],
          pagination: { pageSize: 1 },
        })
      );
    });

    it("disables query when not viewing history", () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 1 }),
      });

      renderWithProvider(<DataConsumer />);

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it("disables query when userId is null", () => {
      setupAuth({
        userId: null,
        profile: null,
      });

      renderWithProvider(<DataConsumer />);

      expect(mockUseList).toHaveBeenCalledWith(
        expect.objectContaining({
          queryOptions: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });
  });

  // =========================================================================
  // Loading state
  // =========================================================================
  describe("loading state", () => {
    it("reflects authLoading as isLoading", () => {
      setupAuth({ isLoading: true });

      renderWithProvider(<LoadingConsumer />);

      expect(screen.getByTestId("isLoading").textContent).toBe("true");
    });

    it("sets isLoading=false when auth is not loading", () => {
      setupAuth({ isLoading: false });

      renderWithProvider(<LoadingConsumer />);

      expect(screen.getByTestId("isLoading").textContent).toBe("false");
    });
  });

  // =========================================================================
  // Combined hook (usePlanCycle)
  // =========================================================================
  describe("usePlanCycle (combined hook)", () => {
    it("provides both data and loading values", () => {
      setupAuth({
        profile: makeProfile({ current_plan_cycle: 2 }),
        isLoading: false,
      });

      renderWithProvider(<CombinedConsumer />);

      expect(screen.getByTestId("combinedUserId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("combinedIsLoading").textContent).toBe("false");
      expect(screen.getByTestId("combinedCurrentCycle").textContent).toBe("2");
    });
  });
});

// ---------------------------------------------------------------------------
// Hook error handling (outside provider)
// ---------------------------------------------------------------------------
describe("usePlanCycleData", () => {
  it("throws when used outside PlanCycleProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePlanCycleData());
    }).toThrow("usePlanCycleData must be used within a PlanCycleProvider");

    consoleSpy.mockRestore();
  });
});

describe("usePlanCycleLoading", () => {
  it("throws when used outside PlanCycleProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePlanCycleLoading());
    }).toThrow("usePlanCycleLoading must be used within a PlanCycleProvider");

    consoleSpy.mockRestore();
  });
});

describe("usePlanCycle", () => {
  it("throws when used outside PlanCycleProvider (via usePlanCycleData)", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePlanCycle());
    }).toThrow("usePlanCycleData must be used within a PlanCycleProvider");

    consoleSpy.mockRestore();
  });
});
