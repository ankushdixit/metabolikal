import { render, screen, fireEvent } from "@testing-library/react";
import { ClientTable } from "../client-table";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("ClientTable Component", () => {
  const mockClients = [
    {
      id: "1",
      email: "john@example.com",
      full_name: "John Doe",
      phone: null,
      role: "client" as const,
      avatar_url: null,
      date_of_birth: null,
      gender: null,
      address: null,
      invited_at: null,
      invitation_accepted_at: null,
      is_deactivated: false,
      deactivated_at: null,
      deactivation_reason: null,
      plan_start_date: null,
      plan_duration_days: 7,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      lastCheckIn: {
        id: "ci1",
        client_id: "1",
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
        reviewed_at: "2025-01-16T00:00:00Z",
        reviewed_by: null,
        created_at: "2025-01-15T00:00:00Z",
      },
    },
    {
      id: "2",
      email: "jane@example.com",
      full_name: "Jane Smith",
      phone: null,
      role: "client" as const,
      avatar_url: null,
      date_of_birth: null,
      gender: null,
      address: null,
      invited_at: null,
      invitation_accepted_at: null,
      is_deactivated: false,
      deactivated_at: null,
      deactivation_reason: null,
      plan_start_date: null,
      plan_duration_days: 7,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      lastCheckIn: {
        id: "ci2",
        client_id: "2",
        submitted_at: "2025-01-14T00:00:00Z",
        weight: 65,
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
        flagged_for_followup: true,
        reviewed_at: null,
        reviewed_by: null,
        created_at: "2025-01-14T00:00:00Z",
      },
    },
    {
      id: "3",
      email: "bob@example.com",
      full_name: "Bob Wilson",
      phone: null,
      role: "client" as const,
      avatar_url: null,
      date_of_birth: null,
      gender: null,
      address: null,
      invited_at: null,
      invitation_accepted_at: null,
      is_deactivated: false,
      deactivated_at: null,
      deactivation_reason: null,
      plan_start_date: null,
      plan_duration_days: 7,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      lastCheckIn: {
        id: "ci3",
        client_id: "3",
        submitted_at: "2025-01-13T00:00:00Z",
        weight: 75,
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
        created_at: "2025-01-13T00:00:00Z",
      },
    },
  ];

  const defaultProps = {
    clients: mockClients,
    currentPage: 1,
    totalPages: 1,
    onPageChange: jest.fn(),
  };

  it("renders table with all columns", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Last Check-in")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders client names", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders client emails", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders view buttons with correct links", () => {
    render(<ClientTable {...defaultProps} />);
    const viewButtons = screen.getAllByText("View");
    expect(viewButtons[0].closest("a")).toHaveAttribute("href", "/admin/clients/1");
    expect(viewButtons[1].closest("a")).toHaveAttribute("href", "/admin/clients/2");
    expect(viewButtons[2].closest("a")).toHaveAttribute("href", "/admin/clients/3");
  });

  it("shows flagged status for flagged clients", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("Flagged")).toBeInTheDocument();
  });

  it("shows pending review status for unreviewed check-ins", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
  });

  it("shows active status for reviewed non-flagged clients", () => {
    render(<ClientTable {...defaultProps} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows deactivated status for deactivated clients", () => {
    const deactivatedClients = [
      {
        ...mockClients[0],
        is_deactivated: true,
        deactivated_at: "2025-01-20T00:00:00Z",
        deactivation_reason: "Test reason",
      },
    ];
    render(<ClientTable {...defaultProps} clients={deactivatedClients} />);
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    const { container } = render(<ClientTable {...defaultProps} isLoading={true} />);
    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("renders empty state when no clients", () => {
    render(<ClientTable {...defaultProps} clients={[]} />);
    expect(screen.getByText("No clients found")).toBeInTheDocument();
  });

  it("shows pagination when multiple pages", () => {
    render(<ClientTable {...defaultProps} totalPages={3} />);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("hides pagination when single page", () => {
    render(<ClientTable {...defaultProps} totalPages={1} />);
    expect(screen.queryByText("Page 1 of 1")).not.toBeInTheDocument();
  });

  it("calls onPageChange when next button clicked", () => {
    const mockOnPageChange = jest.fn();
    render(<ClientTable {...defaultProps} totalPages={3} onPageChange={mockOnPageChange} />);
    const nextButton = screen.getByLabelText("Next page");
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when previous button clicked", () => {
    const mockOnPageChange = jest.fn();
    render(
      <ClientTable
        {...defaultProps}
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );
    const prevButton = screen.getByLabelText("Previous page");
    fireEvent.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("disables previous button on first page", () => {
    render(<ClientTable {...defaultProps} currentPage={1} totalPages={3} />);
    const prevButton = screen.getByLabelText("Previous page");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<ClientTable {...defaultProps} currentPage={3} totalPages={3} />);
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeDisabled();
  });

  it("renders client initials in avatar", () => {
    render(<ClientTable {...defaultProps} />);
    // John and Jane both have "J" as initial, Bob has "B"
    const jInitials = screen.getAllByText("J");
    expect(jInitials.length).toBe(2);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("uses athletic-card styling", () => {
    const { container } = render(<ClientTable {...defaultProps} />);
    expect(container.querySelector(".athletic-card")).toBeInTheDocument();
  });

  describe("Selection Mode", () => {
    it("renders checkboxes when in selection mode", () => {
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={jest.fn()}
        />
      );
      // Should have select-all checkbox plus one per client
      expect(screen.getByTestId("select-all-checkbox")).toBeInTheDocument();
      expect(screen.getByTestId("select-checkbox-1")).toBeInTheDocument();
      expect(screen.getByTestId("select-checkbox-2")).toBeInTheDocument();
      expect(screen.getByTestId("select-checkbox-3")).toBeInTheDocument();
    });

    it("does not render checkboxes when not in selection mode", () => {
      render(<ClientTable {...defaultProps} />);
      expect(screen.queryByTestId("select-all-checkbox")).not.toBeInTheDocument();
    });

    it("calls onSelectionChange when checkbox is clicked", () => {
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-checkbox-1"));

      expect(onSelectionChange).toHaveBeenCalledWith(["1"]);
    });

    it("removes id from selection when already selected", () => {
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={["1", "2"]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-checkbox-1"));

      expect(onSelectionChange).toHaveBeenCalledWith(["2"]);
    });

    it("checkbox is checked when client is selected", () => {
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={["1"]}
          onSelectionChange={jest.fn()}
        />
      );

      const checkbox = screen.getByTestId("select-checkbox-1");
      expect(checkbox).toHaveAttribute("data-state", "checked");
    });

    it("select all checkbox selects all selectable clients", () => {
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-all-checkbox"));

      // All clients in mockClients are active, so all 3 should be selected
      expect(onSelectionChange).toHaveBeenCalledWith(["1", "2", "3"]);
    });

    it("select all checkbox deselects all when all are selected", () => {
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          selectionMode={true}
          selectedIds={["1", "2", "3"]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-all-checkbox"));

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it("disables checkbox for deactivated clients", () => {
      const deactivatedClients = [
        {
          ...mockClients[0],
          is_deactivated: true,
        },
        ...mockClients.slice(1),
      ];
      render(
        <ClientTable
          {...defaultProps}
          clients={deactivatedClients}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={jest.fn()}
        />
      );

      const checkbox = screen.getByTestId("select-checkbox-1");
      expect(checkbox).toBeDisabled();
    });

    it("disables checkbox for clients with pending invitations", () => {
      const invitedClients = [
        {
          ...mockClients[0],
          invited_at: "2025-01-01T00:00:00Z",
          invitation_accepted_at: null,
        },
        ...mockClients.slice(1),
      ];
      render(
        <ClientTable
          {...defaultProps}
          clients={invitedClients}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={jest.fn()}
        />
      );

      const checkbox = screen.getByTestId("select-checkbox-1");
      expect(checkbox).toBeDisabled();
    });

    it("does not include deactivated clients in select all", () => {
      const mixedClients = [
        {
          ...mockClients[0],
          is_deactivated: true,
        },
        mockClients[1],
        mockClients[2],
      ];
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          clients={mixedClients}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-all-checkbox"));

      // Only non-deactivated clients (2 and 3) should be selected
      expect(onSelectionChange).toHaveBeenCalledWith(["2", "3"]);
    });

    it("does not include invited-only clients in select all", () => {
      const mixedClients = [
        {
          ...mockClients[0],
          invited_at: "2025-01-01T00:00:00Z",
          invitation_accepted_at: null,
        },
        mockClients[1],
        mockClients[2],
      ];
      const onSelectionChange = jest.fn();
      render(
        <ClientTable
          {...defaultProps}
          clients={mixedClients}
          selectionMode={true}
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByTestId("select-all-checkbox"));

      // Only non-invited clients (2 and 3) should be selected
      expect(onSelectionChange).toHaveBeenCalledWith(["2", "3"]);
    });
  });
});
