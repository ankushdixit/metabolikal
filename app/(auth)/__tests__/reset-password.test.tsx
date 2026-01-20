import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "../reset-password/page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
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
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
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
      expect(mockPush).toHaveBeenCalledWith("/login?message=Password reset successful");
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
});
