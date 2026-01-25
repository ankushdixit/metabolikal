import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileDetailsCard } from "../profile-details-card";
import type { Profile } from "@/lib/database.types";

// Mock Supabase client
const mockResetPasswordForEmail = jest.fn();
const mockUpdate = jest.fn();
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
    from: () => ({
      update: () => ({
        eq: mockUpdate,
      }),
    }),
  }),
}));

describe("ProfileDetailsCard", () => {
  const mockProfile: Profile = {
    id: "user-123",
    email: "test@example.com",
    full_name: "John Doe",
    phone: "+1234567890",
    role: "client",
    avatar_url: null,
    date_of_birth: "1990-05-15",
    gender: "male",
    address: "123 Main St, City",
    invited_at: null,
    invitation_accepted_at: null,
    is_deactivated: false,
    deactivated_at: null,
    deactivation_reason: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockUpdate.mockResolvedValue({ error: null });
  });

  describe("Personal Information Section", () => {
    it("renders personal information heading", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });

    it("displays full name", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders Edit button for personal information", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("displays phone number", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
    });

    it("displays formatted date of birth", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText(/May 15, 1990/i)).toBeInTheDocument();
    });

    it("displays gender", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Male")).toBeInTheDocument();
    });

    it("displays address", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText("123 Main St, City")).toBeInTheDocument();
    });

    it("shows 'Not provided' for missing phone", () => {
      const profileWithoutPhone = { ...mockProfile, phone: null };
      render(<ProfileDetailsCard profile={profileWithoutPhone} userEmail="test@example.com" />);

      const notProvidedElements = screen.getAllByText("Not provided");
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it("shows 'Not provided' for missing DOB", () => {
      const profileWithoutDOB = { ...mockProfile, date_of_birth: null };
      render(<ProfileDetailsCard profile={profileWithoutDOB} userEmail="test@example.com" />);

      const notProvidedElements = screen.getAllByText("Not provided");
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it("shows 'Not provided' for missing gender", () => {
      const profileWithoutGender = { ...mockProfile, gender: null };
      render(<ProfileDetailsCard profile={profileWithoutGender} userEmail="test@example.com" />);

      const notProvidedElements = screen.getAllByText("Not provided");
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it("shows 'Not provided' for missing address", () => {
      const profileWithoutAddress = { ...mockProfile, address: null };
      render(<ProfileDetailsCard profile={profileWithoutAddress} userEmail="test@example.com" />);

      const notProvidedElements = screen.getAllByText("Not provided");
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Account Details Section", () => {
    it("renders account details heading", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText(/Account Details/i)).toBeInTheDocument();
    });

    it("displays email in account details (read-only)", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      // Email appears in account details section
      expect(screen.getAllByText(/test@example.com/i).length).toBeGreaterThan(0);
    });

    it("displays formatted member since date", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText(/January 1, 2026/i)).toBeInTheDocument();
    });

    it("displays role", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Client")).toBeInTheDocument();
    });

    it("capitalizes role correctly", () => {
      const adminProfile = { ...mockProfile, role: "admin" as const };
      render(<ProfileDetailsCard profile={adminProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  describe("Security Section", () => {
    it("renders security heading", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByText(/Security/i)).toBeInTheDocument();
    });

    it("renders change password button", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    });

    it("renders security description text", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);
      expect(
        screen.getByText(/To change your password, click the button below/i)
      ).toBeInTheDocument();
    });

    it("sends reset email when change password is clicked", async () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
          redirectTo: expect.stringContaining("/reset-password"),
        });
      });
    });

    it("shows success message after password reset email sent", async () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
      });
    });

    it("shows error message when password reset fails", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Unable to send email" },
      });

      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/Unable to send email/i)).toBeInTheDocument();
      });
    });

    it("shows loading state while sending reset email", async () => {
      // Make the mock take time to resolve
      mockResetPasswordForEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ error: null }), 100);
          })
      );

      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      expect(screen.getByText(/Sending.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
      });
    });

    it("disables button while sending", async () => {
      mockResetPasswordForEmail.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ error: null }), 100);
          })
      );

      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      const button = screen.getByRole("button", { name: /change password/i });
      fireEvent.click(button);

      await waitFor(() => {
        // Find the button with "Sending..." text (which is the disabled password reset button)
        expect(screen.getByText(/Sending.../i).closest("button")).toBeDisabled();
      });
    });

    it("uses profile email if userEmail is null", async () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail={null} />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
          redirectTo: expect.stringContaining("/reset-password"),
        });
      });
    });

    it("shows error if no email available", async () => {
      const profileWithoutEmail = { ...mockProfile, email: "" };
      render(<ProfileDetailsCard profile={profileWithoutEmail} userEmail={null} />);

      fireEvent.click(screen.getByRole("button", { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/Email not found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Gender formatting", () => {
    it("formats female gender correctly", () => {
      const femaleProfile = { ...mockProfile, gender: "female" as const };
      render(<ProfileDetailsCard profile={femaleProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Female")).toBeInTheDocument();
    });

    it("formats other gender correctly", () => {
      const otherProfile = { ...mockProfile, gender: "other" as const };
      render(<ProfileDetailsCard profile={otherProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Other")).toBeInTheDocument();
    });

    it("formats prefer_not_to_say gender correctly", () => {
      const preferNotProfile = { ...mockProfile, gender: "prefer_not_to_say" as const };
      render(<ProfileDetailsCard profile={preferNotProfile} userEmail="test@example.com" />);
      expect(screen.getByText("Prefer not to say")).toBeInTheDocument();
    });
  });

  describe("Null profile handling", () => {
    it("renders with null profile", () => {
      render(<ProfileDetailsCard profile={null} userEmail="test@example.com" />);

      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Security/i)).toBeInTheDocument();
    });

    it("shows not provided for all fields when profile is null", () => {
      render(<ProfileDetailsCard profile={null} userEmail="test@example.com" />);

      const notProvidedElements = screen.getAllByText("Not provided");
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edit Mode", () => {
    it("enters edit mode when Edit button is clicked", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /edit/i }));

      // Should now show input fields
      expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("exits edit mode when Cancel is clicked", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /edit/i }));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      // Should be back to view mode
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    });

    it("saves profile changes when Save is clicked", async () => {
      const mockOnProfileUpdated = jest.fn();
      render(
        <ProfileDetailsCard
          profile={mockProfile}
          userEmail="test@example.com"
          onProfileUpdated={mockOnProfileUpdated}
        />
      );

      // Enter edit mode
      fireEvent.click(screen.getByRole("button", { name: /edit/i }));

      // Change the name
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      // Save
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockOnProfileUpdated).toHaveBeenCalled();
      });
    });

    it("shows success message after saving", async () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /edit/i }));
      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it("disables Save button when full name is empty", () => {
      render(<ProfileDetailsCard profile={mockProfile} userEmail="test@example.com" />);

      fireEvent.click(screen.getByRole("button", { name: /edit/i }));

      // Clear the name
      const nameInput = screen.getByPlaceholderText(/enter your full name/i);
      fireEvent.change(nameInput, { target: { value: "" } });

      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    });
  });
});
