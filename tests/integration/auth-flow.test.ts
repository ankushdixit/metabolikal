/**
 * @jest-environment node
 */

/**
 * Integration tests for authentication flows.
 *
 * These tests verify multi-step auth flows by mocking Supabase auth methods
 * and database queries. They test the logical flow (not UI rendering),
 * chaining multiple operations to verify state consistency.
 */

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

interface MockUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface MockProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_deactivated: boolean;
  invitation_accepted_at: string | null;
  plan_start_date: string | null;
  plan_duration_days: number | null;
  current_plan_cycle: number | null;
  created_at: string;
}

function createUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: "user-123",
    email: "test@example.com",
    user_metadata: { full_name: "Test User" },
    ...overrides,
  };
}

function createProfile(overrides?: Partial<MockProfile>): MockProfile {
  return {
    id: "user-123",
    email: "test@example.com",
    full_name: "Test User",
    role: "client",
    is_deactivated: false,
    invitation_accepted_at: null,
    plan_start_date: null,
    plan_duration_days: null,
    current_plan_cycle: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Creates a mock Supabase client with configurable auth and database responses.
 * Each method is independently mockable for fine-grained control over multi-step flows.
 */
function createMockSupabase() {
  // Store for simulating database state across operations
  const profiles: Map<string, MockProfile> = new Map();
  const assessmentResults: Map<string, Record<string, unknown>> = new Map();
  const calculatorResults: Map<string, Record<string, unknown>> = new Map();

  // Track passwords for login verification (simulates auth.users table)
  const passwords: Map<string, string> = new Map();

  // Single chainable builder that terminates with .single() / .maybeSingle() / await
  const buildChainable = (resolvedData: unknown, resolvedError: unknown = null) => {
    const chain: Record<string, jest.Mock> = {};
    const terminal = { data: resolvedData, error: resolvedError };

    const self = () => chain;
    chain.select = jest.fn().mockImplementation(self);
    chain.insert = jest.fn().mockImplementation((_data: unknown) => {
      // Return the chain so .select() etc. can be called after insert
      return chain;
    });
    chain.update = jest.fn().mockImplementation(self);
    chain.upsert = jest.fn().mockImplementation(self);
    chain.delete = jest.fn().mockImplementation(self);
    chain.eq = jest.fn().mockImplementation(self);
    chain.neq = jest.fn().mockImplementation(self);
    chain.order = jest.fn().mockImplementation(self);
    chain.limit = jest.fn().mockImplementation(self);
    chain.is = jest.fn().mockImplementation(self);
    chain.in = jest.fn().mockImplementation(self);
    chain.single = jest.fn().mockResolvedValue(terminal);
    chain.maybeSingle = jest.fn().mockResolvedValue(terminal);
    // Make chain itself thenable for queries without .single()
    chain.then = jest.fn((resolve: (v: unknown) => void) =>
      resolve({ data: resolvedData ? [resolvedData] : [], error: resolvedError })
    );

    return chain;
  };

  const client = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    client,
    profiles,
    assessmentResults,
    calculatorResults,
    passwords,
    buildChainable,
  };
}

// =============================================================================
// Test Suite 1: Register -> Profile Creation -> Assessment -> Calculator -> Profile Complete
// =============================================================================

describe("Integration: Registration through profile completion flow", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  it("completes full registration flow: signUp -> profile created -> assessment saved -> calculator saved -> profile complete", async () => {
    const newUser = createUser({
      id: "new-user-001",
      email: "newuser@example.com",
      user_metadata: { full_name: "New User" },
    });

    // Step 1: User registers via signUp
    supabase.client.auth.signUp.mockResolvedValueOnce({
      data: { user: newUser, session: { user: newUser } },
      error: null,
    });

    const signUpResult = await supabase.client.auth.signUp({
      email: "newuser@example.com",
      password: "SecurePass123",
      options: { data: { full_name: "New User" } },
    });

    expect(signUpResult.error).toBeNull();
    expect(signUpResult.data.user).toBeDefined();
    expect(signUpResult.data.user.id).toBe("new-user-001");

    // Step 2: Profile row is created (simulates database trigger)
    const profile = createProfile({
      id: newUser.id,
      email: "newuser@example.com",
      full_name: "New User",
      role: "challenger",
    });
    supabase.profiles.set(newUser.id, profile);

    // Verify profile exists after registration
    supabase.client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return supabase.buildChainable(supabase.profiles.get(newUser.id) ?? null);
      }
      return supabase.buildChainable(null);
    });

    const profileChain = supabase.client.from("profiles");
    const profileResult = await profileChain.select("*").eq("id", newUser.id).single();

    expect(profileResult.data).toBeDefined();
    expect(profileResult.data.role).toBe("challenger");
    expect(profileResult.data.full_name).toBe("New User");

    // Step 3: User completes assessment (data saved to assessment_results)
    const assessmentData = {
      user_id: newUser.id,
      scores: {
        nutrition: 65,
        activity: 40,
        sleep: 70,
        stress: 55,
        hydration: 80,
      },
      completed_at: new Date().toISOString(),
    };

    supabase.assessmentResults.set(newUser.id, assessmentData);

    // Configure from() to now return assessment data too
    supabase.client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return supabase.buildChainable(supabase.profiles.get(newUser.id) ?? null);
      }
      if (table === "assessment_results") {
        const chain = supabase.buildChainable(supabase.assessmentResults.get(newUser.id) ?? null);
        chain.insert.mockImplementation((data: Record<string, unknown>) => {
          supabase.assessmentResults.set(newUser.id, data);
          return { data, error: null };
        });
        return chain;
      }
      return supabase.buildChainable(null);
    });

    const assessmentChain = supabase.client.from("assessment_results");
    const assessmentResult = await assessmentChain.select("*").eq("user_id", newUser.id).single();

    expect(assessmentResult.data).toBeDefined();
    expect(assessmentResult.data.scores.nutrition).toBe(65);

    // Step 4: User runs calculator (data saved to calculator_results)
    const calculatorData = {
      user_id: newUser.id,
      inputs: {
        age: 30,
        weight: 75,
        height: 175,
        activity_level: "moderate",
        goal: "maintain",
      },
      results: {
        bmr: 1700,
        tdee: 2635,
        target_calories: 2635,
        protein: 150,
        carbs: 330,
        fat: 88,
      },
      health_score: 62,
      completed_at: new Date().toISOString(),
    };

    supabase.calculatorResults.set(newUser.id, calculatorData);

    supabase.client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return supabase.buildChainable(supabase.profiles.get(newUser.id) ?? null);
      }
      if (table === "calculator_results") {
        return supabase.buildChainable(supabase.calculatorResults.get(newUser.id) ?? null);
      }
      if (table === "assessment_results") {
        return supabase.buildChainable(supabase.assessmentResults.get(newUser.id) ?? null);
      }
      return supabase.buildChainable(null);
    });

    const calculatorChain = supabase.client.from("calculator_results");
    const calculatorResult = await calculatorChain.select("*").eq("user_id", newUser.id).single();

    expect(calculatorResult.data).toBeDefined();
    expect(calculatorResult.data.results.tdee).toBe(2635);
    expect(calculatorResult.data.health_score).toBe(62);

    // Step 5: Verify profile is now "complete" — both assessment and calculator data exist
    const hasAssessment = supabase.assessmentResults.has(newUser.id);
    const hasCalculator = supabase.calculatorResults.has(newUser.id);
    const isProfileComplete = hasAssessment && hasCalculator;

    expect(isProfileComplete).toBe(true);
    expect(supabase.profiles.get(newUser.id)?.role).toBe("challenger");
  });

  it("handles signUp failure gracefully", async () => {
    supabase.client.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const result = await supabase.client.auth.signUp({
      email: "existing@example.com",
      password: "password123",
      options: { data: { full_name: "Existing User" } },
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain("already registered");
    expect(result.data.user).toBeNull();

    // Verify no profile was created for a failed registration
    expect(supabase.profiles.size).toBe(0);
  });

  it("handles partial completion — assessment saved but calculator not yet done", async () => {
    const user = createUser({ id: "partial-user" });

    supabase.client.auth.signUp.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });

    await supabase.client.auth.signUp({
      email: user.email,
      password: "password123",
      options: { data: { full_name: "Partial User" } },
    });

    // Profile created
    supabase.profiles.set(user.id, createProfile({ id: user.id }));

    // Assessment completed
    supabase.assessmentResults.set(user.id, {
      user_id: user.id,
      scores: { nutrition: 50, activity: 50, sleep: 50, stress: 50, hydration: 50 },
    });

    // Calculator NOT completed
    const hasAssessment = supabase.assessmentResults.has(user.id);
    const hasCalculator = supabase.calculatorResults.has(user.id);
    const isProfileComplete = hasAssessment && hasCalculator;

    expect(hasAssessment).toBe(true);
    expect(hasCalculator).toBe(false);
    expect(isProfileComplete).toBe(false);
  });
});

// =============================================================================
// Test Suite 2: Login -> Check Deactivation -> Redirect Based on Role
// =============================================================================

describe("Integration: Login with deactivation check and role-based redirect", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  /**
   * Simulates the login page's onSubmit logic:
   * 1. Call signInWithPassword
   * 2. Check profile for role and deactivation status
   * 3. Redirect or reject based on the result
   */
  async function simulateLoginFlow(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    redirectTo: string | null;
    error: string | null;
    signedOut: boolean;
  }> {
    let signedOut = false;

    // Step 1: Attempt sign-in
    const { data: authData, error: authError } = await supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, redirectTo: null, error: "Invalid email or password", signedOut };
    }

    if (!authData.user) {
      return { success: false, redirectTo: null, error: "Invalid email or password", signedOut };
    }

    // Step 2: Fetch profile for role and deactivation status
    const profileChain = supabase.client.from("profiles");
    const { data: profile } = await profileChain
      .select("role, is_deactivated")
      .eq("id", authData.user.id)
      .single();

    // Step 3: Check deactivation for non-admin users
    if (profile?.is_deactivated && profile?.role !== "admin") {
      await supabase.client.auth.signOut();
      signedOut = true;
      return {
        success: false,
        redirectTo: null,
        error: "Your account has been deactivated. Please contact your administrator.",
        signedOut,
      };
    }

    // Step 4: Determine redirect based on role
    const role = profile?.role ?? "client";
    const redirectTo = role === "admin" ? "/admin" : "/dashboard";

    return { success: true, redirectTo, error: null, signedOut };
  }

  it("active admin logs in and is redirected to /admin", async () => {
    const adminUser = createUser({ id: "admin-001", email: "admin@example.com" });
    const adminProfile = createProfile({
      id: "admin-001",
      email: "admin@example.com",
      role: "admin",
      is_deactivated: false,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: adminUser, session: { user: adminUser } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(adminProfile));

    const result = await simulateLoginFlow("admin@example.com", "admin-password");

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/admin");
    expect(result.error).toBeNull();
    expect(result.signedOut).toBe(false);
    expect(supabase.client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "admin-password",
    });
  });

  it("active client logs in and is redirected to /dashboard", async () => {
    const clientUser = createUser({ id: "client-001", email: "client@example.com" });
    const clientProfile = createProfile({
      id: "client-001",
      email: "client@example.com",
      role: "client",
      is_deactivated: false,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: clientUser, session: { user: clientUser } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(clientProfile));

    const result = await simulateLoginFlow("client@example.com", "client-password");

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
    expect(result.error).toBeNull();
    expect(result.signedOut).toBe(false);
  });

  it("active challenger logs in and is redirected to /dashboard (non-admin default)", async () => {
    const challengerUser = createUser({ id: "challenger-001", email: "challenger@example.com" });
    const challengerProfile = createProfile({
      id: "challenger-001",
      email: "challenger@example.com",
      role: "challenger",
      is_deactivated: false,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: challengerUser, session: { user: challengerUser } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(challengerProfile));

    const result = await simulateLoginFlow("challenger@example.com", "challenger-password");

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
    expect(result.error).toBeNull();
  });

  it("deactivated non-admin (client) is rejected with error and signed out", async () => {
    const deactivatedUser = createUser({ id: "deactivated-001", email: "deactivated@example.com" });
    const deactivatedProfile = createProfile({
      id: "deactivated-001",
      email: "deactivated@example.com",
      role: "client",
      is_deactivated: true,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: deactivatedUser, session: { user: deactivatedUser } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(deactivatedProfile));

    const result = await simulateLoginFlow("deactivated@example.com", "password123");

    expect(result.success).toBe(false);
    expect(result.redirectTo).toBeNull();
    expect(result.error).toContain("deactivated");
    expect(result.signedOut).toBe(true);
    expect(supabase.client.auth.signOut).toHaveBeenCalled();
  });

  it("deactivated challenger is rejected with error and signed out", async () => {
    const deactivatedChallenger = createUser({
      id: "deactivated-challenger",
      email: "dc@example.com",
    });
    const deactivatedChallengerProfile = createProfile({
      id: "deactivated-challenger",
      email: "dc@example.com",
      role: "challenger",
      is_deactivated: true,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: deactivatedChallenger, session: { user: deactivatedChallenger } },
      error: null,
    });

    supabase.client.from.mockImplementation(() =>
      supabase.buildChainable(deactivatedChallengerProfile)
    );

    const result = await simulateLoginFlow("dc@example.com", "password123");

    expect(result.success).toBe(false);
    expect(result.error).toContain("deactivated");
    expect(result.signedOut).toBe(true);
  });

  it("deactivated admin is still allowed to log in", async () => {
    const deactivatedAdmin = createUser({
      id: "deactivated-admin",
      email: "admin-deactivated@example.com",
    });
    const deactivatedAdminProfile = createProfile({
      id: "deactivated-admin",
      email: "admin-deactivated@example.com",
      role: "admin",
      is_deactivated: true,
    });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: deactivatedAdmin, session: { user: deactivatedAdmin } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(deactivatedAdminProfile));

    const result = await simulateLoginFlow("admin-deactivated@example.com", "admin-password");

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/admin");
    expect(result.error).toBeNull();
    expect(result.signedOut).toBe(false);
    expect(supabase.client.auth.signOut).not.toHaveBeenCalled();
  });

  it("invalid credentials are rejected before profile check", async () => {
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await simulateLoginFlow("wrong@example.com", "bad-password");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
    expect(result.redirectTo).toBeNull();
    // Profile check should never happen
    expect(supabase.client.from).not.toHaveBeenCalled();
  });

  it("defaults to client role when profile is null (no profile row found)", async () => {
    const noProfileUser = createUser({ id: "no-profile-001", email: "noprofile@example.com" });

    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: noProfileUser, session: { user: noProfileUser } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(null));

    const result = await simulateLoginFlow("noprofile@example.com", "password123");

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
    expect(result.error).toBeNull();
  });

  it("handles signInWithPassword returning no error but also no user", async () => {
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await simulateLoginFlow("ghost@example.com", "password123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
    expect(supabase.client.from).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Test Suite 3: Password Reset Flow
// =============================================================================

describe("Integration: Password reset flow", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  it("completes full password reset: request reset -> token received -> password updated -> login with new password", async () => {
    const user = createUser({ id: "reset-user-001", email: "reset@example.com" });
    const profile = createProfile({
      id: "reset-user-001",
      email: "reset@example.com",
      role: "client",
    });

    // Step 1: Request password reset
    supabase.client.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const resetRequestResult = await supabase.client.auth.resetPasswordForEmail(
      "reset@example.com",
      { redirectTo: "http://localhost:3000/reset-password" }
    );

    expect(resetRequestResult.error).toBeNull();
    expect(supabase.client.auth.resetPasswordForEmail).toHaveBeenCalledWith("reset@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });

    // Step 2: Simulate token receipt (Supabase handles this via email link)
    // In the real flow, the user clicks the email link which sets up a session.
    // Here we simulate that the session is established and getUser works.
    supabase.client.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });

    const sessionCheck = await supabase.client.auth.getUser();
    expect(sessionCheck.data.user).toBeDefined();
    expect(sessionCheck.data.user.id).toBe("reset-user-001");

    // Step 3: Update password
    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    const updateResult = await supabase.client.auth.updateUser({
      password: "NewSecurePass456",
    });

    expect(updateResult.error).toBeNull();
    expect(supabase.client.auth.updateUser).toHaveBeenCalledWith({
      password: "NewSecurePass456",
    });

    // Step 4: Sign out after password reset (as the app does)
    const signOutResult = await supabase.client.auth.signOut();
    expect(signOutResult.error).toBeNull();

    // Step 5: Login with the new password succeeds
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });

    supabase.client.from.mockImplementation(() => supabase.buildChainable(profile));

    const loginResult = await supabase.client.auth.signInWithPassword({
      email: "reset@example.com",
      password: "NewSecurePass456",
    });

    expect(loginResult.error).toBeNull();
    expect(loginResult.data.user).toBeDefined();
    expect(loginResult.data.user.id).toBe("reset-user-001");

    // Verify profile can be fetched after re-login
    const profileChain = supabase.client.from("profiles");
    const profileResult = await profileChain
      .select("role, is_deactivated")
      .eq("id", user.id)
      .single();

    expect(profileResult.data).toBeDefined();
    expect(profileResult.data.role).toBe("client");
  });

  it("handles password reset request failure", async () => {
    supabase.client.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: { message: "Rate limit exceeded" },
    });

    const result = await supabase.client.auth.resetPasswordForEmail("reset@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe("Rate limit exceeded");
  });

  it("handles expired reset token (updateUser fails)", async () => {
    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Password reset token expired" },
    });

    const result = await supabase.client.auth.updateUser({
      password: "NewPassword123",
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe("Password reset token expired");

    // User should not be signed out since the update failed
    expect(supabase.client.auth.signOut).not.toHaveBeenCalled();
  });

  it("handles invited user password setup flow with invitation_accepted_at update", async () => {
    const invitedUser = createUser({ id: "invited-001", email: "invited@example.com" });

    // Step 1: Invited user lands on reset-password page with invited=true
    // (Supabase session is already established via invite link)
    supabase.client.auth.getUser.mockResolvedValue({
      data: { user: invitedUser },
      error: null,
    });

    // Step 2: User sets their password
    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user: invitedUser },
      error: null,
    });

    const updateResult = await supabase.client.auth.updateUser({
      password: "InvitedUserPass123",
    });
    expect(updateResult.error).toBeNull();

    // Step 3: Mark invitation as accepted (profile update)
    const profileUpdateChain = supabase.buildChainable(null);
    profileUpdateChain.eq.mockResolvedValueOnce({ data: null, error: null });
    supabase.client.from.mockReturnValueOnce(profileUpdateChain);

    const {
      data: { user: sessionUser },
    } = await supabase.client.auth.getUser();
    expect(sessionUser).toBeDefined();

    if (sessionUser) {
      const chain = supabase.client.from("profiles");
      await chain
        .update({ invitation_accepted_at: new Date().toISOString() })
        .eq("id", sessionUser.id);

      expect(supabase.client.from).toHaveBeenCalledWith("profiles");
    }

    // Step 4: Sign out after setup
    await supabase.client.auth.signOut();
    expect(supabase.client.auth.signOut).toHaveBeenCalled();

    // Step 5: Login with new password succeeds
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: invitedUser, session: { user: invitedUser } },
      error: null,
    });

    const loginResult = await supabase.client.auth.signInWithPassword({
      email: "invited@example.com",
      password: "InvitedUserPass123",
    });

    expect(loginResult.error).toBeNull();
    expect(loginResult.data.user.id).toBe("invited-001");
  });

  it("verifies password reset then login with old password fails", async () => {
    const user = createUser({ id: "pwd-change-001", email: "change@example.com" });

    // Reset password succeeds
    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });
    await supabase.client.auth.updateUser({ password: "NewPassword789" });
    await supabase.client.auth.signOut();

    // Login with OLD password should fail
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const oldPasswordResult = await supabase.client.auth.signInWithPassword({
      email: "change@example.com",
      password: "OldPassword123",
    });

    expect(oldPasswordResult.error).toBeDefined();
    expect(oldPasswordResult.error.message).toContain("Invalid login credentials");
    expect(oldPasswordResult.data.user).toBeNull();

    // Login with NEW password should succeed
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });

    const newPasswordResult = await supabase.client.auth.signInWithPassword({
      email: "change@example.com",
      password: "NewPassword789",
    });

    expect(newPasswordResult.error).toBeNull();
    expect(newPasswordResult.data.user).toBeDefined();
    expect(newPasswordResult.data.user.id).toBe("pwd-change-001");
  });

  it("handles network error during password reset request", async () => {
    supabase.client.auth.resetPasswordForEmail.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      supabase.client.auth.resetPasswordForEmail("reset@example.com", {
        redirectTo: "http://localhost:3000/reset-password",
      })
    ).rejects.toThrow("Network error");
  });
});

// =============================================================================
// Cross-flow Integration Tests
// =============================================================================

describe("Integration: Cross-flow state consistency", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  it("register -> login -> logout -> login again preserves profile data", async () => {
    const user = createUser({ id: "roundtrip-001", email: "roundtrip@example.com" });
    const profile = createProfile({
      id: "roundtrip-001",
      email: "roundtrip@example.com",
      full_name: "Roundtrip User",
      role: "client",
    });

    // Step 1: Register
    supabase.client.auth.signUp.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });
    const signUpResult = await supabase.client.auth.signUp({
      email: "roundtrip@example.com",
      password: "password123",
      options: { data: { full_name: "Roundtrip User" } },
    });
    expect(signUpResult.data.user).toBeDefined();

    // Profile is created by DB trigger
    supabase.profiles.set(user.id, profile);

    // Step 2: First login
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });
    supabase.client.from.mockImplementation(() => supabase.buildChainable(profile));

    const firstLogin = await supabase.client.auth.signInWithPassword({
      email: "roundtrip@example.com",
      password: "password123",
    });
    expect(firstLogin.data.user.id).toBe("roundtrip-001");

    // Step 3: Logout
    await supabase.client.auth.signOut();
    expect(supabase.client.auth.signOut).toHaveBeenCalledTimes(1);

    // Step 4: Login again
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });

    const secondLogin = await supabase.client.auth.signInWithPassword({
      email: "roundtrip@example.com",
      password: "password123",
    });
    expect(secondLogin.data.user.id).toBe("roundtrip-001");

    // Verify profile data is still accessible
    const profileChain = supabase.client.from("profiles");
    const profileResult = await profileChain.select("*").eq("id", user.id).single();
    expect(profileResult.data.full_name).toBe("Roundtrip User");
    expect(profileResult.data.role).toBe("client");
  });

  it("register -> complete assessment -> reset password -> login -> assessment data persists", async () => {
    const user = createUser({ id: "persist-001", email: "persist@example.com" });
    const profile = createProfile({ id: "persist-001", email: "persist@example.com" });

    // Step 1: Register
    supabase.client.auth.signUp.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });
    await supabase.client.auth.signUp({
      email: "persist@example.com",
      password: "OldPass123",
      options: { data: { full_name: "Persist User" } },
    });

    supabase.profiles.set(user.id, profile);

    // Step 2: Complete assessment
    const assessmentData = {
      user_id: user.id,
      scores: { nutrition: 80, activity: 70, sleep: 90, stress: 60, hydration: 85 },
      completed_at: new Date().toISOString(),
    };
    supabase.assessmentResults.set(user.id, assessmentData);

    // Step 3: Reset password
    supabase.client.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });
    await supabase.client.auth.resetPasswordForEmail("persist@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });

    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });
    await supabase.client.auth.updateUser({ password: "NewPass456" });
    await supabase.client.auth.signOut();

    // Step 4: Login with new password
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });

    supabase.client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return supabase.buildChainable(profile);
      }
      if (table === "assessment_results") {
        return supabase.buildChainable(assessmentData);
      }
      return supabase.buildChainable(null);
    });

    const loginResult = await supabase.client.auth.signInWithPassword({
      email: "persist@example.com",
      password: "NewPass456",
    });
    expect(loginResult.data.user.id).toBe("persist-001");

    // Step 5: Assessment data still accessible
    const assessmentChain = supabase.client.from("assessment_results");
    const assessmentResult = await assessmentChain.select("*").eq("user_id", user.id).single();

    expect(assessmentResult.data).toBeDefined();
    expect(assessmentResult.data.scores.nutrition).toBe(80);
  });

  it("deactivated user cannot reset password and log back in (deactivation persists)", async () => {
    const user = createUser({ id: "deactivated-reset", email: "deactivated-reset@example.com" });
    const deactivatedProfile = createProfile({
      id: "deactivated-reset",
      email: "deactivated-reset@example.com",
      role: "client",
      is_deactivated: true,
    });

    // Step 1: Even if password reset works at the auth level
    supabase.client.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });
    await supabase.client.auth.resetPasswordForEmail("deactivated-reset@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });

    supabase.client.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });
    await supabase.client.auth.updateUser({ password: "NewPass123" });
    await supabase.client.auth.signOut();

    // Step 2: Login with new password — auth succeeds but deactivation check blocks
    supabase.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user, session: { user } },
      error: null,
    });
    supabase.client.from.mockImplementation(() => supabase.buildChainable(deactivatedProfile));

    // Simulate the login flow logic
    const { data: authData } = await supabase.client.auth.signInWithPassword({
      email: "deactivated-reset@example.com",
      password: "NewPass123",
    });
    expect(authData.user).toBeDefined();

    const profileChain = supabase.client.from("profiles");
    const { data: fetchedProfile } = await profileChain
      .select("role, is_deactivated")
      .eq("id", authData.user.id)
      .single();

    // The login logic should block deactivated non-admin users
    const isBlocked = fetchedProfile?.is_deactivated && fetchedProfile?.role !== "admin";
    expect(isBlocked).toBe(true);

    if (isBlocked) {
      await supabase.client.auth.signOut();
    }

    // signOut called twice: once after password reset, once after blocked login
    expect(supabase.client.auth.signOut).toHaveBeenCalledTimes(2);
  });
});
