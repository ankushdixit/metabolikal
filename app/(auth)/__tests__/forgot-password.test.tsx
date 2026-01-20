import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "../forgot-password/page";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: { alt: string; src: string }) {
    return <img alt={props.alt} src={props.src} />;
  },
}));

// Mock Supabase client
const mockResetPasswordForEmail = jest.fn();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the forgot password form", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("renders back to login link", () => {
    render(<ForgotPasswordPage />);

    const loginLink = screen.getByRole("link", { name: /back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("does not submit with empty email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    // The form should not call the API with empty email
    await waitFor(() => {
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  it("calls resetPasswordForEmail on valid form submission", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });
  });

  it("shows success message after sending reset email", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
      expect(screen.getByText(/sent you an email/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      error: { message: "Rate limit exceeded" },
    });

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });

  it("disables form while submitting", async () => {
    mockResetPasswordForEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });
});
