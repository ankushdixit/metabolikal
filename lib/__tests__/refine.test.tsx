// ---------------------------------------------------------------------------
// Mocks — jest.mock calls are hoisted above all variable declarations.
// Factory functions must be fully self-contained (no references to const/let).
// ---------------------------------------------------------------------------

// Mock @/lib/auth – provides a controllable Supabase client for auth tests
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockProfileSelect = jest.fn().mockReturnThis();
const mockProfileEq = jest.fn().mockReturnThis();
const mockProfileSingle = jest.fn().mockResolvedValue({
  data: null,
  error: null,
});

jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth"),
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: mockProfileSelect,
      eq: mockProfileEq,
      single: mockProfileSingle,
    })),
  }),
}));

// Mock @/contexts/auth-context – the factory returns a fresh object.
// We'll retrieve and mutate the actual exported reference after import.
jest.mock("@/contexts/auth-context", () => ({
  authStateCache: {
    userId: null as string | null,
    profile: null as unknown,
    isLoading: true,
  },
}));

// Mock @/lib/env – returns null by default so module-level refineDataProvider is null
jest.mock("@/lib/env", () => ({
  getEnvSafe: jest.fn(() => null),
}));

// Mock @refinedev/supabase dataProvider factory
jest.mock("@refinedev/supabase", () => ({
  dataProvider: jest.fn(() => ({
    getList: jest.fn(),
    getOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteOne: jest.fn(),
    getApiUrl: jest.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Imports — after mocks are registered
// ---------------------------------------------------------------------------

import {
  refineDataProvider,
  createRefineDataProvider,
  refineResources,
  refineOptions,
  refineRouterProvider,
  refineAuthProvider,
} from "../refine";

import { getEnvSafe } from "@/lib/env";
import { authStateCache } from "@/contexts/auth-context";

const mockGetEnvSafe = getEnvSafe as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetCache() {
  authStateCache.userId = null;
  authStateCache.profile = null;
  authStateCache.isLoading = true;
}

function resetMocks() {
  jest.clearAllMocks();
  resetCache();

  // Re-apply default chainable returns after clearAllMocks
  mockProfileSelect.mockReturnThis();
  mockProfileEq.mockReturnThis();
  mockProfileSingle.mockResolvedValue({ data: null, error: null });
}

// ==========================================================================
// Tests
// ==========================================================================

describe("createRefineDataProvider", () => {
  beforeEach(resetMocks);

  it("returns null when environment variables are not set", () => {
    mockGetEnvSafe.mockReturnValue(null);
    const provider = createRefineDataProvider();
    expect(provider).toBeNull();
  });

  it("returns a data provider when environment is configured", () => {
    mockGetEnvSafe.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
    });
    const provider = createRefineDataProvider();
    expect(provider).not.toBeNull();
    expect(provider).toHaveProperty("getList");
    expect(provider).toHaveProperty("getOne");
    expect(provider).toHaveProperty("create");
    expect(provider).toHaveProperty("update");
    expect(provider).toHaveProperty("deleteOne");
  });
});

describe("refineDataProvider export", () => {
  it("is null when env vars are not configured (test env)", () => {
    expect(refineDataProvider).toBeNull();
  });
});

describe("refineResources", () => {
  it("is an array", () => {
    expect(Array.isArray(refineResources)).toBe(true);
  });

  it("contains calculator_settings resource", () => {
    const calc = refineResources.find((r) => r.name === "calculator_settings");
    expect(calc).toBeDefined();
    expect(calc?.list).toBe("/admin/config/calculator-settings");
    expect(calc?.meta?.canDelete).toBe(false);
  });

  it("contains plan_templates resource with full CRUD paths", () => {
    const tpl = refineResources.find((r) => r.name === "plan_templates");
    expect(tpl).toBeDefined();
    expect(tpl?.list).toBe("/admin/config/templates");
    expect(tpl?.create).toBe("/admin/config/templates/create");
    expect(tpl?.edit).toBe("/admin/config/templates/:id/edit");
    expect(tpl?.meta?.canDelete).toBe(true);
  });

  it("contains all template item resources", () => {
    const resourceNames = refineResources.map((r) => r.name);
    expect(resourceNames).toContain("template_diet_items");
    expect(resourceNames).toContain("template_supplement_items");
    expect(resourceNames).toContain("template_workout_items");
    expect(resourceNames).toContain("template_lifestyle_items");
  });

  it("template item resources have no routes but have canDelete", () => {
    const items = refineResources.filter(
      (r) => r.name.startsWith("template_") && r.name.endsWith("_items")
    );
    expect(items.length).toBe(4);
    for (const item of items) {
      expect(item.list).toBeUndefined();
      expect(item.create).toBeUndefined();
      expect(item.edit).toBeUndefined();
      expect(item.show).toBeUndefined();
      expect(item.meta?.canDelete).toBe(true);
    }
  });
});

describe("refineOptions", () => {
  it("has correct default options", () => {
    expect(refineOptions.syncWithLocation).toBe(true);
    expect(refineOptions.warnWhenUnsavedChanges).toBe(true);
    expect(refineOptions.useNewQueryKeys).toBe(true);
    expect(refineOptions.projectId).toBe("refine-dashboard");
  });
});

describe("refineRouterProvider", () => {
  it("is defined", () => {
    expect(refineRouterProvider).toBeDefined();
  });
});

// ==========================================================================
// refineAuthProvider tests
// ==========================================================================

describe("refineAuthProvider", () => {
  beforeEach(resetMocks);

  // ---------- login ----------

  describe("login", () => {
    it("returns success with /admin redirect for admin users", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "admin", is_deactivated: false },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "admin@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/admin");
    });

    it("returns success with /dashboard redirect for client users", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u2" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "client", is_deactivated: false },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "client@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });

    it("returns success with /dashboard redirect for challenger users", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u3" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "challenger", is_deactivated: false },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "challenger@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });

    it("returns failure on auth error", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await refineAuthProvider.login({
        email: "bad@test.com",
        password: "wrong",
      });

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        name: "LoginError",
        message: "Invalid email or password",
      });
    });

    it("returns failure when no user data is returned", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "no-user@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      expect(result.error?.name).toBe("LoginError");
      expect(result.error?.message).toBe("Invalid email or password");
    });

    it("rejects deactivated non-admin user and signs them out", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u4" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "client", is_deactivated: true },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      const result = await refineAuthProvider.login({
        email: "deactivated@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("deactivated");
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("rejects deactivated challenger and signs them out", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u5" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "challenger", is_deactivated: true },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      const result = await refineAuthProvider.login({
        email: "deactivated-challenger@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("deactivated");
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("allows deactivated admin to login with /admin redirect", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u6" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "admin", is_deactivated: true },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "deactivated-admin@test.com",
        password: "pass",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/admin");
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("defaults to client role when profile has null role", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u7" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: null, is_deactivated: false },
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "norole@test.com",
        password: "pass",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });

    it("defaults to client role and not deactivated when profile query returns null", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "u8" } },
        error: null,
      });
      mockProfileSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await refineAuthProvider.login({
        email: "noprofile@test.com",
        password: "pass",
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });
  });

  // ---------- logout ----------

  describe("logout", () => {
    it("returns success with redirect to /login", async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await refineAuthProvider.logout({});

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/login");
    });

    it("returns failure with error message on signOut error", async () => {
      mockSignOut.mockResolvedValue({
        error: { message: "Network error" },
      });

      const result = await refineAuthProvider.logout({});

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        name: "LogoutError",
        message: "Network error",
      });
    });
  });

  // ---------- check ----------

  describe("check", () => {
    it("returns authenticated when cache has userId (not loading)", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-123";

      const result = await refineAuthProvider.check({});

      expect(result.authenticated).toBe(true);
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("returns not authenticated when cache has no userId (not loading)", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = null;

      const result = await refineAuthProvider.check({});

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("falls back to getSession when cache is still loading — session exists", async () => {
      authStateCache.isLoading = true;
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "u1" } } },
      });

      const result = await refineAuthProvider.check({});

      expect(result.authenticated).toBe(true);
      expect(mockGetSession).toHaveBeenCalled();
    });

    it("returns not authenticated when cache is loading and no session", async () => {
      authStateCache.isLoading = true;
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await refineAuthProvider.check({});

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });
  });

  // ---------- getPermissions ----------

  describe("getPermissions", () => {
    it("returns role from cache when cache is populated", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-123";
      authStateCache.profile = {
        role: "admin",
        full_name: "Admin User",
        avatar_url: null,
        plan_duration_days: null,
        plan_start_date: null,
        challenge_start_date: null,
        current_plan_cycle: null,
        created_at: null,
      };

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("admin");
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("returns challenger role from cache", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-456";
      authStateCache.profile = {
        role: "challenger",
        full_name: "Challenger",
        avatar_url: null,
        plan_duration_days: null,
        plan_start_date: null,
        challenge_start_date: null,
        current_plan_cycle: null,
        created_at: null,
      };

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("challenger");
    });

    it("defaults to client when cache profile has undefined role", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-789";
      authStateCache.profile = {
        role: undefined as unknown as string,
        full_name: null,
        avatar_url: null,
        plan_duration_days: null,
        plan_start_date: null,
        challenge_start_date: null,
        current_plan_cycle: null,
        created_at: null,
      };

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("client");
    });

    it("falls back to getUser + profile query when cache is loading", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "challenger" },
        error: null,
      });

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("challenger");
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("falls back to getUser when cache has no userId (not loading)", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = null;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: "client" },
        error: null,
      });

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("client");
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("returns null when fallback getUser returns no user", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBeNull();
    });

    it("defaults to client when fallback profile query returns null role", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockProfileSingle.mockResolvedValue({
        data: { role: null },
        error: null,
      });

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("client");
    });

    it("defaults to client when fallback profile query returns no data", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: { user: { id: "u1" } },
      });
      mockProfileSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await refineAuthProvider.getPermissions!({});

      expect(result).toBe("client");
    });
  });

  // ---------- getIdentity ----------

  describe("getIdentity", () => {
    it("returns identity from cache when cache is populated", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-abc";
      authStateCache.profile = {
        full_name: "Jane Doe",
        avatar_url: "https://example.com/avatar.png",
        role: "client",
        plan_duration_days: null,
        plan_start_date: null,
        challenge_start_date: null,
        current_plan_cycle: null,
        created_at: null,
      };

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "user-abc",
        name: "Jane Doe",
        avatar: "https://example.com/avatar.png",
        role: "client",
      });
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("returns identity with null name/avatar from cache when profile fields are null", async () => {
      authStateCache.isLoading = false;
      authStateCache.userId = "user-xyz";
      authStateCache.profile = {
        full_name: null,
        avatar_url: null,
        role: "challenger",
        plan_duration_days: null,
        plan_start_date: null,
        challenge_start_date: null,
        current_plan_cycle: null,
        created_at: null,
      };

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "user-xyz",
        name: null,
        avatar: null,
        role: "challenger",
      });
    });

    it("falls back to getUser when cache is loading", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "u1", email: "user@test.com" },
        },
      });
      mockProfileSingle.mockResolvedValue({
        data: {
          id: "u1",
          full_name: "Test User",
          email: "user@test.com",
          avatar_url: "https://example.com/pic.jpg",
          role: "admin",
        },
        error: null,
      });

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "u1",
        name: "Test User",
        email: "user@test.com",
        avatar: "https://example.com/pic.jpg",
        role: "admin",
      });
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("returns null when fallback getUser returns no user", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toBeNull();
    });

    it("returns email-based identity when fallback profile query returns null", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "u2", email: "fallback@test.com" },
        },
      });
      mockProfileSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "u2",
        name: "fallback@test.com",
        email: "fallback@test.com",
      });
    });

    it("returns profile-based identity when fallback profile exists", async () => {
      authStateCache.isLoading = true;

      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "u3", email: "user3@test.com" },
        },
      });
      mockProfileSingle.mockResolvedValue({
        data: {
          id: "u3",
          full_name: "Profile User",
          email: "profile@test.com",
          avatar_url: null,
          role: "client",
        },
        error: null,
      });

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "u3",
        name: "Profile User",
        email: "profile@test.com",
        avatar: null,
        role: "client",
      });
    });

    it("falls back to getUser when cache is loading even if cache has stale userId", async () => {
      authStateCache.isLoading = true;
      authStateCache.userId = "stale-id";

      mockGetUser.mockResolvedValue({
        data: {
          user: { id: "u4", email: "fresh@test.com" },
        },
      });
      mockProfileSingle.mockResolvedValue({
        data: {
          id: "u4",
          full_name: "Fresh User",
          email: "fresh@test.com",
          avatar_url: null,
          role: "admin",
        },
        error: null,
      });

      const result = await refineAuthProvider.getIdentity!({});

      expect(result).toEqual({
        id: "u4",
        name: "Fresh User",
        email: "fresh@test.com",
        avatar: null,
        role: "admin",
      });
    });
  });

  // ---------- onError ----------

  describe("onError", () => {
    it("returns the error as-is", async () => {
      const error = new Error("Something failed");
      const result = await refineAuthProvider.onError!(error);

      expect(result).toEqual({ error });
    });

    it("handles string errors", async () => {
      const result = await refineAuthProvider.onError!("string error" as unknown as Error);

      expect(result).toEqual({ error: "string error" });
    });

    it("handles object errors", async () => {
      const error = { status: 401, message: "Unauthorized" };
      const result = await refineAuthProvider.onError!(error as unknown as Error);

      expect(result).toEqual({ error });
    });
  });
});
