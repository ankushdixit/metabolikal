import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../login/page";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
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
const mockFrom = jest.fn();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    from: mockFrom,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
