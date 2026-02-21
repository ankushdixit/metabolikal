import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "../reset-password/page";

// Mock next/navigation
const mockPush = jest.fn();
let mockSearchParamsMap: Record<string, string | null> = {};
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsMap[key] ?? null,
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: { alt: string; src: string }) {
    return <img alt={props.alt} src={props.src} />;
  },
}));

// Mock Supabase client
const mockUpdateUser = jest.fn();
const mockSignOut = jest.fn();
const mockGetUser = jest.fn();
const mockProfileUpdate = jest.fn();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
    from: () => ({
      update: () => ({
        eq: mockProfileUpdate,
      }),
    }),
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsMap = {};
    mockSignOut.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockProfileUpdate.mockResolvedValue({ error: null });
  });

  it("renders the reset password form", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("renders back to login link", () => {
    render(<ResetPasswordPage />);

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("does not submit with short password", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "short");
    await user.type(screen.getByLabelText(/confirm new password/i), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    // The form should not call the API with short password
    await waitFor(() => {
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  it("does not submit with non-matching passwords", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm new password/i), "different456");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    // The form should not call the API with mismatched passwords
    await waitFor(() => {
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  it("calls updateUser on valid form submission", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "newpassword123",
      });
    });
  });

  it("signs out and redirects to login with success message", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login?message=Password%20reset%20successful");
    });
  });

  it("shows error message on failure", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      error: { message: "Password reset token expired" },
    });

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset token expired/i)).toBeInTheDocument();
    });
  });

  it("disables form while submitting", async () => {
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByRole("button", { name: /resetting/i })).toBeDisabled();
  });

  // ── Branch coverage: invited user via ?invited=true param ──
  describe("invited user flow (invited=true param)", () => {
    beforeEach(() => {
      mockSearchParamsMap = { invited: "true" };
    });

    it("renders 'Set your password' heading for invited users", () => {
      render(<ResetPasswordPage />);

      expect(screen.getByRole("heading", { name: /set your password/i })).toBeInTheDocument();
      expect(
        screen.getByText(/create a password to complete your account setup/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /set password/i })).toBeInTheDocument();
    });

    it("updates profile and redirects with invited success message", async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
      await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
      await user.click(screen.getByRole("button", { name: /set password/i }));

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
        expect(mockProfileUpdate).toHaveBeenCalledWith("id", "user-123");
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith(
          "/login?message=Account%20setup%20complete!%20Please%20sign%20in."
        );
      });
    });

    it("skips profile update when getUser returns no user", async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
      await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
      await user.click(screen.getByRole("button", { name: /set password/i }));

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
        expect(mockProfileUpdate).not.toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("shows 'Setting up...' on button while submitting", async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
      await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
      await user.click(screen.getByRole("button", { name: /set password/i }));

      expect(screen.getByRole("button", { name: /setting up/i })).toBeDisabled();
    });
  });

  // ── Branch coverage: invited user via message containing "Welcome" ──
  describe("invited user flow (Welcome message)", () => {
    it("treats user as invited when message includes 'Welcome'", () => {
      mockSearchParamsMap = { message: "Welcome to Metabolikal!" };
      render(<ResetPasswordPage />);

      expect(screen.getByRole("heading", { name: /set your password/i })).toBeInTheDocument();
      // Also check that the message is displayed
      expect(screen.getByText("Welcome to Metabolikal!")).toBeInTheDocument();
    });
  });

  // ── Branch coverage: message display without invited flag ──
  describe("message search param", () => {
    it("displays message when present but not containing Welcome", () => {
      mockSearchParamsMap = { message: "Please set your new password" };
      render(<ResetPasswordPage />);

      expect(screen.getByText("Please set your new password")).toBeInTheDocument();
      // Should still be the normal reset form (not invited)
      expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    });

    it("does not display message banner when message is absent", () => {
      render(<ResetPasswordPage />);

      // There should be no message banner
      const banners = document.querySelectorAll(".bg-primary\\/10");
      expect(banners).toHaveLength(0);
    });
  });

  // ── Branch coverage: catch block for unexpected error ──
  it("shows unexpected error when updateUser throws", async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error("Network failure"));

    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });
});
