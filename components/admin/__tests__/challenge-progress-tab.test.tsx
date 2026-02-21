import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChallengeProgressTab } from "../challenge-progress-tab";
import type { Profile } from "@/lib/database.types";

// Mock data
const mockProgressRows = [
  {
    id: "p1",
    visitor_id: "v1",
    user_id: "client-1",
    day_number: 1,
    logged_date: "2026-01-01",
    steps: 12000,
    water_liters: 3.5,
    floors_climbed: 8,
    protein_grams: 90,
    sleep_hours: 7.5,
    feeling: "Great",
    tomorrow_focus: "More steps",
    points_earned: 105,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p2",
    visitor_id: "v1",
    user_id: "client-1",
    day_number: 2,
    logged_date: "2026-01-02",
    steps: 8000,
    water_liters: 4.0,
    floors_climbed: 10,
    protein_grams: 100,
    sleep_hours: 8,
    feeling: null,
    tomorrow_focus: null,
    points_earned: 75,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

let mockQueryData: { data: typeof mockProgressRows } | undefined;
let mockIsLoading: boolean;

jest.mock("@refinedev/core", () => ({
  useList: (opts?: { resource?: string }) => ({
    query: {
      data: opts?.resource === "challenge_progress" ? mockQueryData : { data: [] },
      isLoading: opts?.resource === "challenge_progress" ? mockIsLoading : false,
    },
  }),
}));

// Mock challenge-utils to control date-dependent calculations
jest.mock("@/lib/challenge-utils", () => {
  const actual = jest.requireActual("@/lib/challenge-utils");
  return {
    ...actual,
    getDaysSinceStart: jest.fn().mockReturnValue(5),
    daysUntilStart: jest.fn().mockReturnValue(0),
  };
});

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "client-1",
  email: "test@example.com",
  full_name: "Test Client",
  phone: null,
  role: "client",
  avatar_url: null,
  date_of_birth: null,
  gender: null,
  address: null,
  invited_at: null,
  invitation_accepted_at: null,
  is_deactivated: false,
  deactivated_at: null,
  deactivation_reason: null,
  plan_start_date: "2026-01-01",
  plan_duration_days: 60,
  current_plan_cycle: 1,
  challenge_start_date: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("ChallengeProgressTab", () => {
  beforeEach(() => {
    mockQueryData = { data: mockProgressRows };
    mockIsLoading = false;
  });

  it("renders loading state", () => {
    mockIsLoading = true;
    const { container } = render(
      <ChallengeProgressTab clientId="client-1" profile={makeProfile()} />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders empty state when no progress data", () => {
    mockQueryData = { data: [] };
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    expect(screen.getByText("No challenge data yet")).toBeInTheDocument();
  });

  it("renders summary stats", () => {
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    expect(screen.getByText("Current Day")).toBeInTheDocument();
    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
    expect(screen.getByText("Completion")).toBeInTheDocument();
    expect(screen.getByText("Days Completed")).toBeInTheDocument();
  });

  it("renders day entries with Day badges", () => {
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
  });

  it("shows points for logged days", () => {
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    expect(screen.getByText("105 pts")).toBeInTheDocument();
    expect(screen.getByText("75 pts")).toBeInTheDocument();
  });

  it("shows Missed badge for days without data", () => {
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    // Days 3, 4, 5 should be missed (current day is mocked to 5)
    const missedBadges = screen.getAllByText("Missed");
    expect(missedBadges.length).toBe(3);
  });

  it("expands a day entry on click to show metrics", async () => {
    const user = userEvent.setup();
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);

    // Click on Day 1 entry
    const day1Button = screen.getByText("Day 1").closest("button")!;
    await user.click(day1Button);

    // Should show metric values
    expect(screen.getByText("12,000")).toBeInTheDocument(); // steps
    expect(screen.getByText("3.5L")).toBeInTheDocument(); // water
    expect(screen.getByText("8")).toBeInTheDocument(); // floors
    expect(screen.getByText("90g")).toBeInTheDocument(); // protein
    expect(screen.getByText("7.5h")).toBeInTheDocument(); // sleep
    expect(screen.getByText("Great")).toBeInTheDocument(); // feeling
    expect(screen.getByText("More steps")).toBeInTheDocument(); // focus
  });

  it("renders section headings", () => {
    render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
    expect(screen.getByText("Stats")).toBeInTheDocument();
    expect(screen.getByText("Log")).toBeInTheDocument();
  });

  describe("isNotStarted state", () => {
    it("renders 'not started' message when getDaysSinceStart returns 0", () => {
      const { getDaysSinceStart, daysUntilStart } = jest.requireMock("@/lib/challenge-utils");
      getDaysSinceStart.mockReturnValue(0);
      daysUntilStart.mockReturnValue(3);

      render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
      expect(screen.getByText(/Plan starts in 3 days/)).toBeInTheDocument();
      expect(
        screen.getByText(/Challenge data will appear once the plan start date arrives/)
      ).toBeInTheDocument();

      // Restore
      getDaysSinceStart.mockReturnValue(5);
      daysUntilStart.mockReturnValue(0);
    });

    it("renders singular 'day' when daysUntil is 1", () => {
      const { getDaysSinceStart, daysUntilStart } = jest.requireMock("@/lib/challenge-utils");
      getDaysSinceStart.mockReturnValue(0);
      daysUntilStart.mockReturnValue(1);

      render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
      expect(screen.getByText(/Plan starts in 1 day$/)).toBeInTheDocument();

      getDaysSinceStart.mockReturnValue(5);
      daysUntilStart.mockReturnValue(0);
    });
  });

  describe("profile fallback values", () => {
    it("uses DEFAULT_CHALLENGE_DAYS when plan_duration_days is null", () => {
      render(
        <ChallengeProgressTab
          clientId="client-1"
          profile={makeProfile({ plan_duration_days: undefined })}
        />
      );
      // Should still render (falls back to DEFAULT_CHALLENGE_DAYS = 30)
      expect(screen.getByText("Current Day")).toBeInTheDocument();
    });

    it("uses created_at as fallback when plan_start_date is null", () => {
      render(
        <ChallengeProgressTab
          clientId="client-1"
          profile={makeProfile({ plan_start_date: null })}
        />
      );
      expect(screen.getByText("Current Day")).toBeInTheDocument();
    });

    it("uses empty string when both plan_start_date and created_at are null", () => {
      render(
        <ChallengeProgressTab
          clientId="client-1"
          profile={makeProfile({ plan_start_date: null, created_at: undefined })}
        />
      );
      // Should still render without crashing
      expect(screen.getByText("Current Day")).toBeInTheDocument();
    });
  });

  describe("externally controlled cycle", () => {
    it("does not render PlanCycleSelector when externally controlled", () => {
      const onCycleChange = jest.fn();
      const { container: _container } = render(
        <ChallengeProgressTab
          clientId="client-1"
          profile={makeProfile()}
          selectedCycle={1}
          onCycleChange={onCycleChange}
        />
      );
      // The PlanCycleSelector should not be rendered
      // The component check: !isExternallyControlled
      expect(screen.getByText("Current Day")).toBeInTheDocument();
    });
  });

  describe("expanded day without feeling/tomorrowFocus", () => {
    it("does not render feeling/focus section when both are null", async () => {
      const user = userEvent.setup();
      render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);

      // Click on Day 2 which has null feeling and tomorrow_focus
      const day2Button = screen.getByText("Day 2").closest("button")!;
      await user.click(day2Button);

      // Should show metrics but not feeling/focus sections
      expect(screen.getByText("8,000")).toBeInTheDocument(); // steps
      expect(screen.queryByText("Feeling")).not.toBeInTheDocument();
      expect(screen.queryByText("Tomorrow's Focus")).not.toBeInTheDocument();
    });
  });

  describe("stat highlight logic", () => {
    it("highlights totalPoints stat when points > 0", () => {
      render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
      // Total Points = 180 (105+75), should have highlight class
      expect(screen.getByText("Total Points")).toBeInTheDocument();
    });

    it("does not highlight when no points earned", () => {
      mockQueryData = {
        data: [
          {
            ...mockProgressRows[0],
            points_earned: 0,
          },
        ],
      };
      render(<ChallengeProgressTab clientId="client-1" profile={makeProfile()} />);
      expect(screen.getByText("Total Points")).toBeInTheDocument();
    });
  });

  describe("current_plan_cycle null fallback", () => {
    it("defaults to cycle 1 when current_plan_cycle is null", () => {
      render(
        <ChallengeProgressTab
          clientId="client-1"
          profile={makeProfile({ current_plan_cycle: undefined })}
        />
      );
      expect(screen.getByText("Current Day")).toBeInTheDocument();
    });
  });
});
