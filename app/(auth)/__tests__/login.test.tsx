import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../login/page";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
let mockSearchParamsMap: Record<string, string | null> = {};
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
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
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
    from: mockFrom,
  }),
}));

// Mock migrateLocalStorageToDatabase
const mockMigrate = jest.fn();
jest.mock("@/hooks/use-assessment-storage", () => ({
  migrateLocalStorageToDatabase: (...args: unknown[]) => mockMigrate(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsMap = {};
    mockSignOut.mockResolvedValue({ error: null });
    mockMigrate.mockResolvedValue({ migrated: 0 });
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    render(<LoginPage />);

    const forgotLink = screen.getByRole("link", { name: /forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });

  it("renders register link", () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("does not submit with empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    // The form should not call the API with empty fields
    await waitFor(() => {
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  it("does not submit with only email filled", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // The form should not call the API without password
    await waitFor(() => {
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  it("calls signInWithPassword on valid form submission", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: "client" }, error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows error message on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid credentials" },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("redirects client users to /dashboard on successful login", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: "client" }, error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "client@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects admin users to /admin on successful login", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "admin-123" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: "admin" }, error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("disables form while submitting", async () => {
    mockSignInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: null }), 100)
        )
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });

  // ── Branch coverage: account_deactivated error param ──
  it("shows deactivation error on initial render when error=account_deactivated", () => {
    mockSearchParamsMap = { error: "account_deactivated" };
    render(<LoginPage />);

    expect(screen.getByText(/your account has been deactivated/i)).toBeInTheDocument();
  });

  // ── Branch coverage: message search param display ──
  it("displays message banner when message param is present", () => {
    mockSearchParamsMap = { message: "Password reset successful" };
    render(<LoginPage />);

    expect(screen.getByText("Password reset successful")).toBeInTheDocument();
  });

  // ── Branch coverage: no user returned (no error but user is null) ──
  it("shows error when signIn returns no error but also no user", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ── Branch coverage: deactivated non-admin user blocked ──
  it("blocks deactivated non-admin user and shows error", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-deactivated" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { role: "client", is_deactivated: true },
              error: null,
            }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "deactivated@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByText(/your account has been deactivated/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── Branch coverage: deactivated admin user is NOT blocked ──
  it("allows deactivated admin user to proceed", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "admin-deactivated" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { role: "admin", is_deactivated: true },
              error: null,
            }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // ── Branch coverage: null profile defaults role to "client" ──
  it("defaults to client role when profile is null", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-no-profile" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "noprofile@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  // ── Branch coverage: catch block for unexpected error ──
  it("shows unexpected error when signIn throws", async () => {
    mockSignInWithPassword.mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  // ── Branch coverage: migrateLocalStorageToDatabase error is caught silently ──
  it("does not block login when localStorage migration fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockMigrate.mockRejectedValueOnce(new Error("Migration failed"));
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: "client" }, error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    // Wait for the migration error to be caught
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to migrate localStorage data:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  // ── Branch coverage: error param is not "account_deactivated" ──
  it("does not show deactivation error for unrecognized error param values", () => {
    mockSearchParamsMap = { error: "some_other_error" };
    render(<LoginPage />);

    // Should not show the deactivation message
    const errorElements = screen.queryByText(/your account has been deactivated/i);
    expect(errorElements).not.toBeInTheDocument();
  });
});
