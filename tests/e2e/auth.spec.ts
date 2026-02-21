import { test, expect } from "@playwright/test";

// =============================================================================
// Login Page Tests
// =============================================================================

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form with correct heading and fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Sign in to your account to continue")).toBeVisible();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows validation errors when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in" }).click();

    // Email field has type="email" so browser or zod validation will fire.
    // Zod schema requires email (string().email()) and password (min(1)).
    // With zodResolver, submitting empty should show error messages.
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    // Fill fields first to ensure the form is hydrated, then disable native
    // browser validation so Zod validation fires instead of the browser tooltip
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("somepassword");
    await page
      .locator("form")
      .first()
      .evaluate((el) => el.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // The button text changes to "Signing in..." while loading
    await expect(page.getByRole("button", { name: "Signing in..." })).toBeVisible();

    // After the Supabase call fails, should show the error
    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 10000,
    });

    // Button should return to normal state
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("displays message from URL param (e.g., after registration)", async ({ page }) => {
    await page.goto("/login?message=Account created. Please log in.");

    await expect(page.getByText("Account created. Please log in.")).toBeVisible();
  });

  test("displays deactivation error when error=account_deactivated param is present", async ({
    page,
  }) => {
    await page.goto("/login?error=account_deactivated");

    await expect(
      page.getByText("Your account has been deactivated. Please contact your administrator.")
    ).toBeVisible();
  });

  test("has a link to the registration page", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: "Register" });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("has a link to the forgot password page", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: "Forgot password?" });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });

  test("navigates to register page when clicking Register link", async ({ page }) => {
    await page.getByRole("link", { name: "Register" }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });

  test("navigates to forgot password page when clicking Forgot password link", async ({ page }) => {
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
  });

  test("email field has correct placeholder and autocomplete", async ({ page }) => {
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("password field has correct type and autocomplete", async ({ page }) => {
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});

// =============================================================================
// Registration Page Tests
// =============================================================================

test.describe("Registration Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders the registration form with correct heading and fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByText("Enter your details to get started")).toBeVisible();

    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    // Use exact label matching for the two password fields
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("shows validation errors when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Full name is required")).toBeVisible();
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    // Fill fields first to ensure the form is hydrated, then disable native
    // browser validation so Zod validation fires instead of the browser tooltip
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email").fill("bademail");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password123");
    await page
      .locator("form")
      .first()
      .evaluate((el) => el.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows validation error for mismatched passwords", async ({ page }) => {
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("differentpassword");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("has a link to the login page", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "Login" });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("navigates to login page when clicking Login link", async ({ page }) => {
    await page.getByRole("link", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("full name field has correct placeholder and autocomplete", async ({ page }) => {
    const fullNameInput = page.getByLabel("Full name");
    await expect(fullNameInput).toHaveAttribute("placeholder", "John Doe");
    await expect(fullNameInput).toHaveAttribute("autocomplete", "name");
  });

  test("password fields have correct placeholders", async ({ page }) => {
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "placeholder",
      "At least 8 characters"
    );
    await expect(page.getByLabel("Confirm password")).toHaveAttribute(
      "placeholder",
      "Confirm your password"
    );
  });

  test("disables form fields and shows loading state while submitting", async ({ page }) => {
    // Fill valid data so the form actually submits to Supabase
    await page.getByLabel("Full name").fill("E2E Test User");
    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("testpassword123");
    await page.getByLabel("Confirm password").fill("testpassword123");

    await page.getByRole("button", { name: "Create account" }).click();

    // Button should show loading state
    await expect(page.getByRole("button", { name: "Creating account..." })).toBeVisible();
  });
});

// =============================================================================
// Forgot Password Page Tests
// =============================================================================

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders the forgot password form with correct heading and fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByText("Enter your email and we'll send you a reset link")).toBeVisible();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    // Fill fields first to ensure the form is hydrated, then disable native
    // browser validation so Zod validation fires instead of the browser tooltip
    await page.getByLabel("Email").fill("not-valid");
    await page
      .locator("form")
      .first()
      .evaluate((el) => el.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("shows success state after submitting valid email", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    // Should show loading state first
    await expect(page.getByRole("button", { name: "Sending..." })).toBeVisible();

    // After Supabase responds, should show the success state
    // Note: Supabase resetPasswordForEmail succeeds even for non-existent emails
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Check your email for reset instructions")).toBeVisible();
    await expect(
      page.getByText(
        "We've sent you an email with a link to reset your password. Please check your inbox."
      )
    ).toBeVisible();
  });

  test("success state has a link back to login", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible({
      timeout: 10000,
    });

    const backToLoginLink = page.getByRole("link", { name: "Back to login" });
    await expect(backToLoginLink).toBeVisible();
    await expect(backToLoginLink).toHaveAttribute("href", "/login");
  });

  test("has a link back to login from the form view", async ({ page }) => {
    const backToLoginLink = page.getByRole("link", { name: "Back to login" });
    await expect(backToLoginLink).toBeVisible();
    await expect(backToLoginLink).toHaveAttribute("href", "/login");
  });

  test("navigates back to login when clicking Back to login link", async ({ page }) => {
    await page.getByRole("link", { name: "Back to login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("email field has correct placeholder and autocomplete", async ({ page }) => {
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
  });
});

// =============================================================================
// Reset Password Page Tests
// =============================================================================

test.describe("Reset Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password");
  });

  test("renders the reset password form with correct heading and fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByText("Enter your new password below")).toBeVisible();

    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm new password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset Password" })).toBeVisible();
  });

  test("shows validation errors when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: "Reset Password" }).click();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password").fill("short");
    await page.getByRole("button", { name: "Reset Password" }).click();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows validation error for mismatched passwords", async ({ page }) => {
    await page.getByLabel("New password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm new password").fill("differentpassword");
    await page.getByRole("button", { name: "Reset Password" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("has a link back to login", async ({ page }) => {
    const backToLoginLink = page.getByRole("link", { name: "Back to login" });
    await expect(backToLoginLink).toBeVisible();
    await expect(backToLoginLink).toHaveAttribute("href", "/login");
  });

  test("navigates back to login when clicking Back to login link", async ({ page }) => {
    await page.getByRole("link", { name: "Back to login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("password fields have correct placeholders and autocomplete", async ({ page }) => {
    const passwordInput = page.getByLabel("New password", { exact: true });
    await expect(passwordInput).toHaveAttribute("placeholder", "At least 8 characters");
    await expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const confirmInput = page.getByLabel("Confirm new password");
    await expect(confirmInput).toHaveAttribute("placeholder", "Confirm your new password");
    await expect(confirmInput).toHaveAttribute("autocomplete", "new-password");
    await expect(confirmInput).toHaveAttribute("type", "password");
  });
});

test.describe("Reset Password Page - Invited User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password?invited=true");
  });

  test("shows invited user heading and description", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Set your password" })).toBeVisible();
    await expect(page.getByText("Create a password to complete your account setup")).toBeVisible();
  });

  test("shows 'Set Password' button text for invited users", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Set Password" })).toBeVisible();
  });

  test("shows validation errors for invited user form too", async ({ page }) => {
    await page.getByRole("button", { name: "Set Password" }).click();

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows mismatched password error for invited user", async ({ page }) => {
    await page.getByLabel("New password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm new password").fill("different123");
    await page.getByRole("button", { name: "Set Password" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});

test.describe("Reset Password Page - Message Param", () => {
  test("displays message from URL param", async ({ page }) => {
    await page.goto("/reset-password?message=Welcome! Please set your password.");

    await expect(page.getByText("Welcome! Please set your password.")).toBeVisible();
  });
});

// =============================================================================
// Cross-Page Navigation Tests
// =============================================================================

test.describe("Auth Page Navigation Flow", () => {
  test("can navigate login -> register -> login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // Go to register
    await page.getByRole("link", { name: "Register" }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();

    // Go back to login
    await page.getByRole("link", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("can navigate login -> forgot password -> login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // Go to forgot password
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();

    // Go back to login
    await page.getByRole("link", { name: "Back to login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("can navigate reset password -> login", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();

    await page.getByRole("link", { name: "Back to login" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

// =============================================================================
// Auth Layout Tests
// =============================================================================

test.describe("Auth Layout", () => {
  test("displays the logo on auth pages", async ({ page }) => {
    await page.goto("/login");

    const logo = page.getByAltText("METABOLI-K-AL");
    await expect(logo).toBeVisible();
  });

  test("logo links to the home page", async ({ page }) => {
    await page.goto("/login");

    const logoLink = page.getByRole("link").filter({ has: page.getByAltText("METABOLI-K-AL") });
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("displays the footer copyright text", async ({ page }) => {
    await page.goto("/login");

    const currentYear = new Date().getFullYear().toString();
    await expect(
      page.getByText(`${currentYear} METABOLI-K-AL. All rights reserved.`)
    ).toBeVisible();
  });
});
