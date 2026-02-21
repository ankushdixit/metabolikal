/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditClientModal } from "../edit-client-modal";
import type { Profile, ClientCondition } from "@/lib/database.types";

// Mock the Refine hooks
const mockUpdateProfile = jest.fn();
const mockCreateCondition = jest.fn();
const mockDeleteConditions = jest.fn();

jest.mock("@refinedev/core", () => ({
  useUpdate: () => ({ mutateAsync: mockUpdateProfile }),
  useCreate: () => ({ mutateAsync: mockCreateCondition }),
  useDeleteMany: () => ({ mutateAsync: mockDeleteConditions }),
  useList: () => ({
    query: {
      data: { data: [] },
      isLoading: false,
      error: null,
    },
  }),
}));

// Mock the auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    userId: "admin-123",
    isLoading: false,
    profile: null,
    signOut: jest.fn(),
  }),
}));

// Mock the Supabase client (still used for non-auth operations like plan_cycles update)
let mockSupabaseCycleError: { message: string } | null = null;
jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: () => ({
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: mockSupabaseCycleError }),
        }),
      }),
    }),
  }),
}));

// Mock the medical conditions hook - using proper UUID v4 format
const mockConditions = [
  {
    id: "a1b2c3d4-e5f6-4789-8abc-def012345678",
    name: "Diabetes Type 2",
    slug: "diabetes-type2",
    impact_percent: 10,
    gender_restriction: null,
    is_active: true,
    display_order: 1,
  },
  {
    id: "b2c3d4e5-f6a7-4890-9bcd-ef0123456789",
    name: "Hypertension",
    slug: "hypertension",
    impact_percent: 5,
    gender_restriction: null,
    is_active: true,
    display_order: 2,
  },
  {
    id: "c3d4e5f6-a7b8-4901-abcd-f01234567890",
    name: "PCOS",
    slug: "pcos",
    impact_percent: 8,
    gender_restriction: "female",
    is_active: true,
    display_order: 3,
  },
];

let mockConditionsOverride: typeof mockConditions | null = null;
let mockConditionsLoading = false;
jest.mock("@/hooks/use-medical-conditions", () => ({
  useMedicalConditions: () => ({
    conditions: mockConditionsOverride ?? mockConditions,
    allConditions: mockConditionsOverride ?? mockConditions,
    isLoading: mockConditionsLoading,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockClient: Profile = {
  id: "d4e5f6a7-b8c9-4012-bcde-f12345678901",
  email: "alex.chen@test.com",
  full_name: "Alex Chen",
  phone: "+1234567894",
  role: "client",
  avatar_url: null,
  date_of_birth: "1994-03-15",
  gender: "male",
  address: "123 Main St",
  invited_at: "2026-01-01T00:00:00Z",
  invitation_accepted_at: "2026-01-02T00:00:00Z",
  is_deactivated: false,
  deactivated_at: null,
  deactivation_reason: null,
  plan_start_date: "2026-01-28",
  plan_duration_days: 30,
  current_plan_cycle: 1,
  challenge_start_date: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockClientConditions: ClientCondition[] = [
  {
    id: "e5f6a7b8-c9d0-4123-cdef-012345678912",
    client_id: "d4e5f6a7-b8c9-4012-bcde-f12345678901",
    condition_id: "a1b2c3d4-e5f6-4789-8abc-def012345678",
    diagnosed_at: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: "f6a7b8c9-d0e1-4234-def0-123456789012",
  },
];

// Helper to flush promises and wait for async effects
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper to render with proper async handling
async function renderAndWait(props: Parameters<typeof EditClientModal>[0]) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<EditClientModal {...props} />);
    await flushPromises();
  });
  return result!;
}

describe("EditClientModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    client: mockClient,
    clientConditions: mockClientConditions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ data: mockClient });
    mockCreateCondition.mockResolvedValue({ data: {} });
    mockDeleteConditions.mockResolvedValue({ data: {} });
    mockSupabaseCycleError = null;
    mockConditionsOverride = null;
    mockConditionsLoading = false;
  });

  describe("Rendering", () => {
    it("renders modal with title when open", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Client Profile")).toBeInTheDocument();
    });

    it("does not render when closed", async () => {
      await renderAndWait({ ...defaultProps, isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders all form fields", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument(); // Gender select
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plan start date/i)).toBeInTheDocument();
      expect(screen.getByText(/plan duration/i)).toBeInTheDocument();
      // Medical Conditions appears in section header
      expect(screen.getByRole("heading", { name: /medical conditions/i })).toBeInTheDocument();
    });

    it("renders section headers", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByText("Personal Information")).toBeInTheDocument();
      expect(screen.getByText("Plan Settings")).toBeInTheDocument();
      expect(screen.getByText("Medical Conditions")).toBeInTheDocument();
    });

    it("renders action buttons", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe("Pre-population", () => {
    it("pre-populates full name field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/full name/i)).toHaveValue("Alex Chen");
    });

    it("pre-populates email field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/email/i)).toHaveValue("alex.chen@test.com");
    });

    it("pre-populates phone field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/phone/i)).toHaveValue("+1234567894");
    });

    it("pre-populates date of birth field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/date of birth/i)).toHaveValue("1994-03-15");
    });

    it("pre-populates address field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/address/i)).toHaveValue("123 Main St");
    });

    it("pre-populates plan start date field", async () => {
      await renderAndWait(defaultProps);
      expect(screen.getByLabelText(/plan start date/i)).toHaveValue("2026-01-28");
    });

    it("shows correct duration as selected", async () => {
      await renderAndWait(defaultProps);
      const btn30 = screen.getByRole("button", { name: "30" });
      expect(btn30).toHaveClass("bg-primary");
    });

    it("shows existing conditions as selected", async () => {
      await renderAndWait(defaultProps);
      // The condition should appear as a tag
      expect(screen.getByText("Diabetes Type 2")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows error when full name is cleared and form is submitted", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      });
    });

    it("has email field with email type", async () => {
      await renderAndWait(defaultProps);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("has phone field with tel type", async () => {
      await renderAndWait(defaultProps);
      const phoneInput = screen.getByLabelText(/phone/i);
      expect(phoneInput).toHaveAttribute("type", "tel");
    });
  });

  describe("Plan Duration Selection", () => {
    it("selects duration preset when clicked", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      const btn14 = screen.getByRole("button", { name: "14" });
      await user.click(btn14);

      expect(btn14).toHaveClass("bg-primary");
    });

    it("allows custom duration input", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      const customInput = screen.getByPlaceholderText("Custom");
      await user.type(customInput, "45");

      expect(customInput).toHaveValue(45);
    });
  });

  describe("Medical Conditions Management", () => {
    it("shows conditions dropdown when clicked", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Click on the dropdown button
      await user.click(screen.getByText(/1 condition selected/i));

      await waitFor(() => {
        // Should show conditions in dropdown (excluding none)
        expect(screen.getByText("Hypertension")).toBeInTheDocument();
        expect(screen.getByText("PCOS")).toBeInTheDocument();
      });
    });

    it("shows gender restriction indicator for conditions", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      await user.click(screen.getByText(/1 condition selected/i));

      await waitFor(() => {
        expect(screen.getByText("(female only)")).toBeInTheDocument();
      });
    });

    it("can remove existing condition by clicking X", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Find the X button next to the condition tag
      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find((btn) => btn.querySelector('svg[class*="h-3 w-3"]'));

      if (removeButton) {
        await user.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/1 condition selected/i)).not.toBeInTheDocument();
      });
    });

    it("can add new condition", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Open dropdown
      await user.click(screen.getByText(/1 condition selected/i));

      // Select Hypertension
      const hypertensionLabel = screen.getByText("Hypertension");
      await user.click(hypertensionLabel.closest("label")!);

      await waitFor(() => {
        expect(screen.getByText(/2 conditions selected/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form and updates profile", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onSuccess = jest.fn();

      await renderAndWait({ ...defaultProps, onClose, onSuccess });

      // Modify name
      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Alex Chen Updated");

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      // Wait for the profile update to be called
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });

      // Verify the call arguments
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "profiles",
          id: "d4e5f6a7-b8c9-4012-bcde-f12345678901",
        })
      );

      // Should call onClose and onSuccess
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("handles conditions changes on submit", async () => {
      const user = userEvent.setup();
      await renderAndWait({ ...defaultProps, clientConditions: [] });

      // Open dropdown and select condition
      await user.click(screen.getByText(/add condition/i));
      const diabetesLabel = screen.getByText("Diabetes Type 2");
      await user.click(diabetesLabel.closest("label")!);

      // Submit
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      // Wait for profile update first
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });

      // Then condition should be created
      await waitFor(() => {
        expect(mockCreateCondition).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error message on API failure", async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockRejectedValueOnce(new Error("Update failed"));

      await renderAndWait(defaultProps);
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });

    it("shows generic error message when error is not an Error instance", async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockRejectedValueOnce("string error");

      await renderAndWait(defaultProps);
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/failed to update client profile\. please try again\./i)
        ).toBeInTheDocument();
      });
    });

    it("logs error but does not fail when createCondition throws", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockCreateCondition.mockRejectedValueOnce(new Error("duplicate"));

      await renderAndWait({ ...defaultProps, clientConditions: [] });

      // Open dropdown and select a condition
      await user.click(screen.getByText(/add condition/i));
      const diabetesLabel = screen.getByText("Diabetes Type 2");
      await user.click(diabetesLabel.closest("label")!);

      // Submit form
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });

      // Should have logged the error but still succeed (onClose called)
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to add condition:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Conditions Removal on Submit", () => {
    it("deletes removed conditions on submit", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Remove the existing Diabetes condition by clicking the X button
      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find((btn) => btn.querySelector('svg[class*="h-3 w-3"]'));
      if (removeButton) {
        await user.click(removeButton);
      }

      // Submit form
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });

      // Should have called deleteConditions for the removed condition
      await waitFor(() => {
        expect(mockDeleteConditions).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: "client_conditions",
            ids: ["e5f6a7b8-c9d0-4123-cdef-012345678912"],
          })
        );
      });
    });
  });

  describe("Conditions Dropdown Edge Cases", () => {
    it("shows plural text when multiple conditions selected", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Currently 1 condition is selected, add another
      await user.click(screen.getByText(/1 condition selected/i));
      const hypertensionLabel = screen.getByText("Hypertension");
      await user.click(hypertensionLabel.closest("label")!);

      await waitFor(() => {
        expect(screen.getByText(/2 conditions selected/i)).toBeInTheDocument();
      });
    });

    it("toggles a condition off via the checkbox in the dropdown", async () => {
      const user = userEvent.setup();
      await renderAndWait(defaultProps);

      // Open dropdown
      await user.click(screen.getByText(/1 condition selected/i));

      // Find the checkbox labels in the dropdown — they are inside <label> elements
      const allLabels = document.querySelectorAll("label");
      const diabetesDropdownLabel = Array.from(allLabels).find((label) =>
        label.textContent?.includes("Diabetes Type 2")
      );
      expect(diabetesDropdownLabel).toBeTruthy();

      if (diabetesDropdownLabel) {
        await user.click(diabetesDropdownLabel);
      }

      await waitFor(() => {
        expect(screen.getByText(/add condition/i)).toBeInTheDocument();
      });
    });
  });

  describe("Default Prop Values", () => {
    it("renders with empty clientConditions showing 'Add condition' text", async () => {
      await renderAndWait({
        ...defaultProps,
        clientConditions: [],
      });

      // Should show "Add condition..." since no conditions are selected
      expect(screen.getByText(/add condition/i)).toBeInTheDocument();
    });

    it("renders client with null optional fields using fallback values", async () => {
      const clientWithNulls: Profile = {
        ...mockClient,
        phone: null,
        date_of_birth: null,
        gender: null,
        address: null,
        plan_start_date: null,
        plan_duration_days: null as any,
        current_plan_cycle: null as any,
      };

      await renderAndWait({
        ...defaultProps,
        client: clientWithNulls,
        clientConditions: [],
      });

      expect(screen.getByLabelText(/phone/i)).toHaveValue("");
      expect(screen.getByLabelText(/address/i)).toHaveValue("");
    });
  });

  describe("Empty Conditions List", () => {
    it("shows 'No conditions available' when conditions list is empty", async () => {
      const user = userEvent.setup();
      mockConditionsOverride = [];

      await renderAndWait({ ...defaultProps, clientConditions: [] });

      // Open dropdown
      await user.click(screen.getByText(/add condition/i));

      await waitFor(() => {
        expect(screen.getByText("No conditions available")).toBeInTheDocument();
      });
    });

    it("shows 'Loading conditions...' when conditions are loading", async () => {
      mockConditionsLoading = true;

      await renderAndWait({ ...defaultProps, clientConditions: [] });

      expect(screen.getByText("Loading conditions...")).toBeInTheDocument();
    });
  });

  describe("Submitting State", () => {
    it("shows saving spinner and disables submit button during submission", async () => {
      const user = userEvent.setup();
      // Make the update hang so we can check the submitting state
      let resolveUpdate: (value: unknown) => void;
      mockUpdateProfile.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          })
      );

      await renderAndWait(defaultProps);
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      // During submission, button should show "Saving..."
      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });

      // Resolve the update to clean up
      resolveUpdate!({ data: mockClient });
    });
  });

  describe("Plan Cycle Overlap Error", () => {
    it("shows overlap error when plan_cycles update returns overlap message", async () => {
      const user = userEvent.setup();
      mockSupabaseCycleError = { message: "New cycle overlaps with existing cycle" };

      await renderAndWait(defaultProps);
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/these plan dates overlap with another cycle/i)
        ).toBeInTheDocument();
      });
    });

    it("logs non-overlap cycle error without throwing", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockSupabaseCycleError = { message: "Some other database error" };
      const onClose = jest.fn();

      await renderAndWait({ ...defaultProps, onClose });
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      // Should still succeed (non-overlap errors are logged but not thrown)
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error syncing plan_cycles:",
        expect.objectContaining({ message: "Some other database error" })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Modal Behavior", () => {
    it("calls onClose when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      await renderAndWait({ ...defaultProps, onClose });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("calls onClose when dialog is dismissed via Escape key", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      await renderAndWait({ ...defaultProps, onClose });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
