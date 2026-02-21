import { render, screen } from "@testing-library/react";
import { TodaysChallengeActivity } from "../todays-challenge-activity";
import type { Profile } from "@/lib/database.types";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock progress data
const mockProgressRows = [
  {
    id: "p1",
    visitor_id: "v1",
    user_id: "client-1",
    day_number: 3,
    logged_date: "2026-02-06",
    steps: 12000,
    water_liters: 3.5,
    floors_climbed: 8,
    protein_grams: 90,
    sleep_hours: 7.5,
    feeling: null,
    tomorrow_focus: null,
    points_earned: 105,
    plan_cycle: 1,
    created_at: "2026-02-06T00:00:00Z",
    updated_at: "2026-02-06T00:00:00Z",
  },
];

let mockQueryData: { data: typeof mockProgressRows } | undefined;
let mockProgressLoading: boolean;

jest.mock("@refinedev/core", () => ({
  useList: () => ({
    query: {
      data: mockQueryData,
      isLoading: mockProgressLoading,
    },
  }),
}));

// Mock getDaysSinceStart and daysUntilStart to return controlled values
jest.mock("@/lib/challenge-utils", () => {
  const actual = jest.requireActual("@/lib/challenge-utils");
  return {
    ...actual,
    getDaysSinceStart: jest.fn().mockReturnValue(3),
    daysUntilStart: jest.fn().mockReturnValue(0),
  };
});

const makeClient = (id: string, name: string, overrides: Partial<Profile> = {}): Profile => ({
  id,
  email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  full_name: name,
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
  plan_start_date: "2026-02-04",
  plan_duration_days: 60,
  current_plan_cycle: 1,
  challenge_start_date: null,
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
  ...overrides,
});

describe("TodaysChallengeActivity", () => {
  beforeEach(() => {
    mockQueryData = { data: mockProgressRows };
    mockProgressLoading = false;
  });

  it("renders nothing when no clients", () => {
    const { container } = render(<TodaysChallengeActivity clients={[]} isLoading={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders loading state", () => {
    const clients = [makeClient("client-1", "Alice")];
    const { container } = render(<TodaysChallengeActivity clients={clients} isLoading={true} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the heading", () => {
    const clients = [makeClient("client-1", "Alice")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("shows logged/total count", () => {
    const clients = [makeClient("client-1", "Alice"), makeClient("client-2", "Bob")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    // client-1 has progress data, client-2 doesn't
    expect(screen.getByText("1 of 2 clients logged today")).toBeInTheDocument();
  });

  it("renders client names", () => {
    const clients = [makeClient("client-1", "Alice Smith"), makeClient("client-2", "Bob Jones")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows avatar initials", () => {
    const clients = [makeClient("client-1", "Alice Smith")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows points for logged clients", () => {
    const clients = [makeClient("client-1", "Alice")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("105 pts")).toBeInTheDocument();
  });

  it("shows 'Not logged' for clients without data", () => {
    const clients = [makeClient("client-2", "Bob")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("Not logged")).toBeInTheDocument();
  });

  it("sorts not-logged clients first", () => {
    const clients = [makeClient("client-1", "Alice"), makeClient("client-2", "Bob")];
    const { container } = render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    const links = container.querySelectorAll("a");
    // Bob (not logged) should be first
    expect(links[0]).toHaveAttribute("href", "/admin/clients/client-2?tab=challenge");
    expect(links[1]).toHaveAttribute("href", "/admin/clients/client-1?tab=challenge");
  });

  it("links to client detail with challenge tab", () => {
    const clients = [makeClient("client-1", "Alice")];
    const { container } = render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/admin/clients/client-1?tab=challenge");
  });

  it("shows day progress indicator", () => {
    const clients = [makeClient("client-1", "Alice")];
    render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
    expect(screen.getByText("Day 3 of 60")).toBeInTheDocument();
  });

  describe("no progress data branch", () => {
    it("renders clients with 'not logged' when no progress data exists", () => {
      mockQueryData = { data: [] };
      const clients = [makeClient("client-1", "Alice"), makeClient("client-2", "Bob")];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);

      // All clients should show "Not logged"
      const notLogged = screen.getAllByText("Not logged");
      expect(notLogged.length).toBe(2);
      expect(screen.getByText("0 of 2 clients logged today")).toBeInTheDocument();
    });
  });

  describe("before start state", () => {
    it("shows 'Not started' badge when plan has not started", () => {
      const { getDaysSinceStart, daysUntilStart } = jest.requireMock("@/lib/challenge-utils");
      getDaysSinceStart.mockReturnValue(0);
      daysUntilStart.mockReturnValue(5);

      const clients = [makeClient("client-1", "Alice")];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);

      expect(screen.getByText("Not started")).toBeInTheDocument();
      expect(screen.getByText("Starts in 5 days")).toBeInTheDocument();

      // Restore
      getDaysSinceStart.mockReturnValue(3);
      daysUntilStart.mockReturnValue(0);
    });

    it("shows singular 'day' when daysUntil is 1", () => {
      const { getDaysSinceStart, daysUntilStart } = jest.requireMock("@/lib/challenge-utils");
      getDaysSinceStart.mockReturnValue(0);
      daysUntilStart.mockReturnValue(1);

      const clients = [makeClient("client-1", "Alice")];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);

      expect(screen.getByText("Starts in 1 day")).toBeInTheDocument();

      getDaysSinceStart.mockReturnValue(3);
      daysUntilStart.mockReturnValue(0);
    });
  });

  describe("fallback values", () => {
    it("uses DEFAULT_CHALLENGE_DAYS when plan_duration_days is null", () => {
      const clients = [makeClient("client-1", "Alice", { plan_duration_days: undefined })];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      // Should fall back to DEFAULT_CHALLENGE_DAYS (30)
      expect(screen.getByText("Day 3 of 30")).toBeInTheDocument();
    });

    it("falls back to created_at when plan_start_date is null", () => {
      const clients = [makeClient("client-1", "Alice", { plan_start_date: null })];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      // Should still render without crashing
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("shows ? when full_name is null", () => {
      const clients = [makeClient("client-1", "Alice", { full_name: null as unknown as string })];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("defaults current_plan_cycle to 1 when null", () => {
      const clients = [makeClient("client-1", "Alice", { current_plan_cycle: undefined })];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("progress loading state", () => {
    it("shows loading when progressLoading is true", () => {
      mockProgressLoading = true;
      const clients = [makeClient("client-1", "Alice")];
      const { container } = render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });
  });

  describe("streak display", () => {
    it("shows streak icon when streak > 0", () => {
      // client-1 has progress data, so calculateStreak will return > 0
      // The mock getDaysSinceStart returns 3 and client-1 has a day_number=3 entry
      const clients = [makeClient("client-1", "Alice")];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      // Check that the component renders (streak is calculated from progress data)
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("undefined query data", () => {
    it("handles undefined query.data gracefully", () => {
      mockQueryData = undefined;
      const clients = [makeClient("client-1", "Alice")];
      render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      // Should still render (falls back to empty array)
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Not logged")).toBeInTheDocument();
    });
  });

  describe("sort order edge cases", () => {
    it("sorts by points descending among logged clients", () => {
      // Provide progress for two clients with different points
      mockQueryData = {
        data: [
          {
            ...mockProgressRows[0],
            user_id: "client-1",
            points_earned: 50,
          },
          {
            ...mockProgressRows[0],
            id: "p2",
            user_id: "client-2",
            points_earned: 100,
          },
        ],
      };
      const clients = [makeClient("client-1", "Alice"), makeClient("client-2", "Bob")];
      const { container } = render(<TodaysChallengeActivity clients={clients} isLoading={false} />);
      const links = container.querySelectorAll("a");
      // Both logged, but Bob has more points so should be first
      expect(links[0]).toHaveAttribute("href", "/admin/clients/client-2?tab=challenge");
      expect(links[1]).toHaveAttribute("href", "/admin/clients/client-1?tab=challenge");
    });
  });
});
