import { render, screen, act, waitFor, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth, useOptionalAuth, authStateCache } from "../auth-context";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUnsubscribe = jest.fn();
let authStateChangeCallback:
  | ((event: string, session: { user: { id: string } } | null) => void)
  | null = null;

const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

const mockOnAuthStateChange = jest
  .fn()
  .mockImplementation((cb: (event: string, session: { user: { id: string } } | null) => void) => {
    authStateChangeCallback = cb;
    return {
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    };
  });

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
  },
  from: mockFrom,
};

jest.mock("@/lib/auth", () => ({
  createBrowserSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

const mockResetUser = jest.fn();
jest.mock("@/lib/posthog", () => ({
  resetUser: (...args: unknown[]) => mockResetUser(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush microtask queue (resolved promises) without advancing fake timers. */
function flushMicrotasks() {
  return act(async () => {
    // awaiting in act flushes the microtask queue
  });
}

/** Advance timers and flush the microtask queue. */
async function advanceTimersAndFlush(ms?: number) {
  await act(async () => {
    if (ms !== undefined) {
      jest.advanceTimersByTime(ms);
    } else {
      jest.runAllTimers();
    }
  });
  // Flush any microtasks triggered by timers
  await flushMicrotasks();
}

function resetAllMocks() {
  mockUnsubscribe.mockClear();
  mockSignOut.mockClear().mockResolvedValue({ error: null });
  mockGetUser.mockClear().mockResolvedValue({ data: { user: null }, error: null });
  mockSingle.mockClear().mockResolvedValue({ data: null, error: null });
  mockEq.mockClear().mockReturnValue({ single: mockSingle });
  mockSelect.mockClear().mockReturnValue({ eq: mockEq });
  mockFrom.mockClear().mockReturnValue({ select: mockSelect });
  mockOnAuthStateChange
    .mockClear()
    .mockImplementation((cb: (event: string, session: { user: { id: string } } | null) => void) => {
      authStateChangeCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });
  mockResetUser.mockClear();
  authStateChangeCallback = null;

  // Reset authStateCache
  authStateCache.userId = null;
  authStateCache.profile = null;
  authStateCache.isLoading = true;
}

const TEST_USER_ID = "user-abc-123";
const TEST_PROFILE = {
  avatar_url: "https://example.com/avatar.png",
  full_name: "Test User",
  role: "client",
  plan_duration_days: 90,
  plan_start_date: "2025-01-01",
  challenge_start_date: null,
  current_plan_cycle: 1,
  created_at: "2025-01-01T00:00:00Z",
};

/** Helper to set up mocks for a logged-in user with profile. */
function setupAuthenticatedUser(userId = TEST_USER_ID, profile = TEST_PROFILE) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  mockSingle.mockResolvedValue({ data: profile, error: null });
}

/** Helper to render provider and wait for auth to settle. */
async function renderAndSettle(ui?: ReactNode) {
  const result = render(<AuthProvider>{ui ?? <AuthConsumer />}</AuthProvider>);

  // Flush microtasks first (let getUser resolve), then advance timers
  await flushMicrotasks();
  await flushMicrotasks();
  await flushMicrotasks();

  return result;
}

/** A tiny consumer component that displays auth state for assertions. */
function AuthConsumer() {
  const { userId, profile, isLoading, authError, signOut } = useAuth();
  return (
    <div>
      <span data-testid="userId">{userId ?? "null"}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="authError">{authError ?? "null"}</span>
      <span data-testid="role">{profile?.role ?? "null"}</span>
      <span data-testid="fullName">{profile?.full_name ?? "null"}</span>
      <button data-testid="signOutBtn" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthProvider", () => {
  beforeEach(() => {
    resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Normal auth flow: getUser -> profile -> cache populated
  // -----------------------------------------------------------------------
  describe("normal auth flow", () => {
    it("fetches user and profile, then sets loading=false and populates cache", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("role").textContent).toBe("client");
      expect(screen.getByTestId("fullName").textContent).toBe("Test User");
      expect(screen.getByTestId("authError").textContent).toBe("null");

      // authStateCache should be synced
      expect(authStateCache.userId).toBe(TEST_USER_ID);
      expect(authStateCache.profile).toEqual(expect.objectContaining({ role: "client" }));
      expect(authStateCache.isLoading).toBe(false);
    });

    it("starts with isLoading=true before auth settles", async () => {
      // getUser never resolves - use pending promise
      mockGetUser.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId("isLoading").textContent).toBe("true");
      expect(screen.getByTestId("userId").textContent).toBe("null");
    });

    it("sets loading=false with null userId when no user is logged in", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("userId").textContent).toBe("null");
      expect(screen.getByTestId("role").textContent).toBe("null");
    });

    it("handles profile with nullable fields (defaults to null)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
      mockSingle.mockResolvedValue({
        data: {
          avatar_url: null,
          full_name: null,
          role: "challenger",
          // Deliberately omit optional fields to test ?? null fallback
        },
        error: null,
      });

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("role").textContent).toBe("challenger");
      // Profile should have null for missing fields
      expect(authStateCache.profile?.plan_duration_days).toBeNull();
      expect(authStateCache.profile?.plan_start_date).toBeNull();
      expect(authStateCache.profile?.challenge_start_date).toBeNull();
      expect(authStateCache.profile?.current_plan_cycle).toBeNull();
      expect(authStateCache.profile?.created_at).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 10s timeout fires when getUser hangs
  // -----------------------------------------------------------------------
  describe("10s timeout", () => {
    it("fires when getUser hangs indefinitely", async () => {
      // getUser never resolves
      mockGetUser.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Before timeout: still loading
      expect(screen.getByTestId("isLoading").textContent).toBe("true");

      // Advance to just before 10s
      await advanceTimersAndFlush(9999);
      expect(screen.getByTestId("isLoading").textContent).toBe("true");

      // Advance past the 10s mark
      await advanceTimersAndFlush(2);

      expect(screen.getByTestId("isLoading").textContent).toBe("false");
      expect(screen.getByTestId("authError").textContent).toBe(
        "Authentication timed out. Please refresh the page."
      );
      expect(screen.getByTestId("userId").textContent).toBe("null");
    });

    it("does not set state if getUser resolves after timeout", async () => {
      let resolveGetUser: (v: unknown) => void;
      mockGetUser.mockReturnValue(
        new Promise((resolve) => {
          resolveGetUser = resolve;
        })
      );

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Fire the timeout
      await advanceTimersAndFlush(10001);

      expect(screen.getByTestId("authError").textContent).toBe(
        "Authentication timed out. Please refresh the page."
      );

      // Now resolve getUser - should be ignored because didTimeout=true
      await act(async () => {
        resolveGetUser!({ data: { user: { id: TEST_USER_ID } }, error: null });
      });

      // userId should still be null (late resolve was ignored)
      expect(screen.getByTestId("userId").textContent).toBe("null");
    });
  });

  // -----------------------------------------------------------------------
  // Profile fetch fails but user remains authenticated
  // -----------------------------------------------------------------------
  describe("profile fetch failure", () => {
    it("keeps userId but profile is null when profile fetch throws", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
      mockSingle.mockRejectedValue(new Error("DB error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("role").textContent).toBe("null"); // no profile
      expect(screen.getByTestId("authError").textContent).toBe("null"); // not an auth error

      consoleSpy.mockRestore();
    });

    it("keeps userId but profile is null when profile data is null", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
      mockSingle.mockResolvedValue({ data: null, error: null });

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("role").textContent).toBe("null");
    });
  });

  // -----------------------------------------------------------------------
  // getUser itself fails
  // -----------------------------------------------------------------------
  describe("getUser failure", () => {
    it("sets authError and stops loading when getUser rejects", async () => {
      mockGetUser.mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("authError").textContent).toBe(
        "Failed to verify authentication. Please refresh."
      );
      expect(screen.getByTestId("userId").textContent).toBe("null");

      consoleSpy.mockRestore();
    });

    it("does not set error state if getUser fails after timeout", async () => {
      let rejectGetUser: (e: Error) => void;
      mockGetUser.mockReturnValue(
        new Promise((_, reject) => {
          rejectGetUser = reject;
        })
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Fire the timeout
      await advanceTimersAndFlush(10001);

      expect(screen.getByTestId("authError").textContent).toBe(
        "Authentication timed out. Please refresh the page."
      );

      // Now reject getUser after timeout
      await act(async () => {
        rejectGetUser!(new Error("Late failure"));
      });

      // Error should remain the timeout error, not overwritten
      expect(screen.getByTestId("authError").textContent).toBe(
        "Authentication timed out. Please refresh the page."
      );

      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // signOut timeout race (server failure -> still redirects)
  // -----------------------------------------------------------------------
  describe("signOut", () => {
    // Note: window.location.href is non-configurable in jsdom. We verify
    // signOut behavior by checking that mockSignOut was called, resetUser was
    // called, and the function completed. The redirect to "/login" is the
    // final line of signOut, so if resetUser was called the function reached
    // that code path.

    it("calls signOut, resets posthog, and completes on success", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Click sign out
      await act(async () => {
        screen.getByTestId("signOutBtn").click();
      });
      await flushMicrotasks();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockResetUser).toHaveBeenCalledTimes(1);
    });

    it("still calls resetUser when signOut times out (5s race)", async () => {
      // signOut never resolves
      mockSignOut.mockReturnValue(new Promise(() => {}));
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Trigger signOut
      await act(async () => {
        screen.getByTestId("signOutBtn").click();
      });

      // Advance past the 5s signOut timeout
      await advanceTimersAndFlush(5001);

      // resetUser should still be called even though signOut timed out
      expect(mockResetUser).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it("still calls resetUser when signOut throws an error", async () => {
      mockSignOut.mockRejectedValue(new Error("Server error"));
      setupAuthenticatedUser();

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      await act(async () => {
        screen.getByTestId("signOutBtn").click();
      });
      await flushMicrotasks();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockResetUser).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // SIGNED_OUT clears state, SIGNED_IN refetches profile
  // -----------------------------------------------------------------------
  describe("onAuthStateChange: SIGNED_OUT", () => {
    it("clears userId and profile when SIGNED_OUT fires", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Fire SIGNED_OUT event
      await act(async () => {
        authStateChangeCallback!("SIGNED_OUT", null);
      });

      expect(screen.getByTestId("userId").textContent).toBe("null");
      expect(screen.getByTestId("role").textContent).toBe("null");

      // authStateCache should be synced
      await waitFor(() => {
        expect(authStateCache.userId).toBeNull();
        expect(authStateCache.profile).toBeNull();
      });
    });

    it("clears state when session has no user", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Event with a non-SIGNED_OUT event but session.user is falsy
      await act(async () => {
        authStateChangeCallback!("SOME_OTHER_EVENT", { user: null as unknown as { id: string } });
      });

      // The code checks `!session?.user` - null user triggers signed-out path
      expect(screen.getByTestId("userId").textContent).toBe("null");
    });
  });

  describe("onAuthStateChange: SIGNED_IN", () => {
    it("fetches profile for a new user on SIGNED_IN", async () => {
      // Start with no user
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("userId").textContent).toBe("null");

      // Now a sign-in happens
      const newUserId = "new-user-456";
      mockSingle.mockResolvedValue({
        data: { ...TEST_PROFILE, full_name: "New User", role: "admin" },
        error: null,
      });

      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: newUserId } });
      });
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(newUserId);
      });

      expect(screen.getByTestId("role").textContent).toBe("admin");
      expect(screen.getByTestId("fullName").textContent).toBe("New User");
    });

    it("handles profile fetch failure on SIGNED_IN event", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      // Profile fetch will throw on SIGNED_IN
      mockSingle.mockRejectedValue(new Error("Profile DB error"));

      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: "new-user-789" } });
      });
      await flushMicrotasks();

      await waitFor(() => {
        // userId should still be set even though profile fetch failed
        expect(screen.getByTestId("userId").textContent).toBe("new-user-789");
      });

      // Profile remains null
      expect(screen.getByTestId("role").textContent).toBe("null");

      consoleSpy.mockRestore();
    });

    it("handles null profile data on SIGNED_IN event", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      // Profile data returns null
      mockSingle.mockResolvedValue({ data: null, error: null });

      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: "new-user-aaa" } });
      });
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe("new-user-aaa");
      });

      // Profile should remain null since profileData is null
      expect(screen.getByTestId("role").textContent).toBe("null");
    });
  });

  // -----------------------------------------------------------------------
  // TOKEN_REFRESHED updates userId
  // -----------------------------------------------------------------------
  describe("onAuthStateChange: TOKEN_REFRESHED", () => {
    it("updates userId without refetching profile", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Clear call counts so we can assert profile wasn't re-fetched
      mockFrom.mockClear();

      // Fire TOKEN_REFRESHED
      await act(async () => {
        authStateChangeCallback!("TOKEN_REFRESHED", { user: { id: TEST_USER_ID } });
      });

      // userId should remain the same
      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      // Profile should not have been re-fetched
      expect(mockFrom).not.toHaveBeenCalled();
      // Original profile should persist
      expect(screen.getByTestId("role").textContent).toBe("client");
    });

    it("updates userId if it differs on TOKEN_REFRESHED", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      const newUserId = "different-user-id";

      await act(async () => {
        authStateChangeCallback!("TOKEN_REFRESHED", { user: { id: newUserId } });
      });

      expect(screen.getByTestId("userId").textContent).toBe(newUserId);
    });
  });

  // -----------------------------------------------------------------------
  // authStateCache is synced on every state change
  // -----------------------------------------------------------------------
  describe("authStateCache sync", () => {
    it("syncs userId, profile, and isLoading to module-level cache", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(authStateCache.isLoading).toBe(false);
      });

      expect(authStateCache.userId).toBe(TEST_USER_ID);
      expect(authStateCache.profile).toEqual(
        expect.objectContaining({
          avatar_url: "https://example.com/avatar.png",
          full_name: "Test User",
          role: "client",
          plan_duration_days: 90,
          plan_start_date: "2025-01-01",
          challenge_start_date: null,
          current_plan_cycle: 1,
          created_at: "2025-01-01T00:00:00Z",
        })
      );
    });

    it("updates cache when SIGNED_OUT fires", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(authStateCache.userId).toBe(TEST_USER_ID);
      });

      await act(async () => {
        authStateChangeCallback!("SIGNED_OUT", null);
      });

      await waitFor(() => {
        expect(authStateCache.userId).toBeNull();
        expect(authStateCache.profile).toBeNull();
      });
    });

    it("updates cache with new user on SIGNED_IN", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await renderAndSettle();

      await waitFor(() => {
        expect(authStateCache.isLoading).toBe(false);
        expect(authStateCache.userId).toBeNull();
      });

      const newUserId = "signed-in-user";
      mockSingle.mockResolvedValue({
        data: { ...TEST_PROFILE, role: "admin" },
        error: null,
      });

      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: newUserId } });
      });
      await flushMicrotasks();

      await waitFor(() => {
        expect(authStateCache.userId).toBe(newUserId);
        expect(authStateCache.profile?.role).toBe("admin");
      });
    });
  });

  // -----------------------------------------------------------------------
  // Skip refetch when SIGNED_IN fires for same user as getUser
  // -----------------------------------------------------------------------
  describe("skip redundant SIGNED_IN", () => {
    it("does not refetch profile when SIGNED_IN fires for the same user getUser returned", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Clear the mock call counts
      mockFrom.mockClear();
      mockSingle.mockClear();

      // Fire SIGNED_IN with the SAME user id that getUser returned
      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: TEST_USER_ID } });
      });

      // Profile should NOT have been re-fetched
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockSingle).not.toHaveBeenCalled();

      // State should remain unchanged
      expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      expect(screen.getByTestId("role").textContent).toBe("client");
    });

    it("fetches profile when SIGNED_IN fires for a DIFFERENT user than getUser returned", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(TEST_USER_ID);
      });

      // Reset so we can set up new profile data for the new user
      mockSingle.mockClear();
      mockFrom.mockClear();
      // Re-setup the chain
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: { ...TEST_PROFILE, full_name: "Different User", role: "admin" },
        error: null,
      });

      const differentUserId = "different-user-id";

      await act(async () => {
        authStateChangeCallback!("SIGNED_IN", { user: { id: differentUserId } });
      });
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByTestId("userId").textContent).toBe(differentUserId);
      });

      // Profile SHOULD have been fetched
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(screen.getByTestId("fullName").textContent).toBe("Different User");
      expect(screen.getByTestId("role").textContent).toBe("admin");
    });
  });

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------
  describe("cleanup", () => {
    it("unsubscribes from auth state changes on unmount", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { unmount } = await renderAndSettle();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("clears timeout on unmount", async () => {
      // getUser never resolves
      mockGetUser.mockReturnValue(new Promise(() => {}));

      const { unmount } = render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      );

      // Unmount before timeout fires
      unmount();

      // Advance past the 10s mark - should not cause issues
      await advanceTimersAndFlush(15000);

      // No errors should have occurred (clearTimeout was called in cleanup)
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Profile query correctness
  // -----------------------------------------------------------------------
  describe("profile query", () => {
    it("queries the profiles table with correct select and eq", async () => {
      setupAuthenticatedUser();

      await renderAndSettle();

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith(
        "avatar_url, full_name, role, plan_duration_days, plan_start_date, challenge_start_date, current_plan_cycle, created_at"
      );
      expect(mockEq).toHaveBeenCalledWith("id", TEST_USER_ID);
    });
  });
});

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------
describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress console.error from React's error boundary
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useOptionalAuth hook
// ---------------------------------------------------------------------------
describe("useOptionalAuth", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("returns null when used outside AuthProvider", () => {
    const { result } = renderHook(() => useOptionalAuth());
    expect(result.current).toBeNull();
  });

  it("returns auth context when used inside AuthProvider", async () => {
    jest.useFakeTimers();

    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useOptionalAuth(), { wrapper });

    await flushMicrotasks();
    await flushMicrotasks();

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current?.isLoading).toBe(false);
    });

    expect(result.current?.userId).toBeNull();

    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// authStateCache export
// ---------------------------------------------------------------------------
describe("authStateCache", () => {
  it("has correct initial values", () => {
    // Reset cache to initial state
    authStateCache.userId = null;
    authStateCache.profile = null;
    authStateCache.isLoading = true;

    expect(authStateCache.userId).toBeNull();
    expect(authStateCache.profile).toBeNull();
    expect(authStateCache.isLoading).toBe(true);
  });

  it("is mutable from outside (module-level object)", () => {
    authStateCache.userId = "test-id";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authStateCache.profile = { ...TEST_PROFILE } as any;
    authStateCache.isLoading = false;

    expect(authStateCache.userId).toBe("test-id");
    expect(authStateCache.profile?.role).toBe("client");
    expect(authStateCache.isLoading).toBe(false);

    // Reset
    authStateCache.userId = null;
    authStateCache.profile = null;
    authStateCache.isLoading = true;
  });
});
