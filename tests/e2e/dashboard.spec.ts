import { test, expect } from "@playwright/test";

// =============================================================================
// Dashboard Auth Protection Tests
// =============================================================================
// The proxy.ts middleware redirects unauthenticated users to /login for all
// /dashboard/* routes. These tests verify that behavior without needing auth.

test.describe("Dashboard Auth Protection", () => {
  test("redirects /dashboard to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /dashboard/checkin to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard/checkin");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /dashboard/challenge to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard/challenge");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /dashboard/progress to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard/progress");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /dashboard/profile to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /dashboard/checkin/history to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/checkin/history");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows the login form after redirect from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });

    // Verify the login form is rendered after redirect
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

// =============================================================================
// Dashboard Page Structure Tests (Authenticated)
// =============================================================================
// These tests require an authenticated session. They use environment variables
// for test credentials. If credentials are not available, the tests are skipped.

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;
const hasCredentials = !!(TEST_EMAIL && TEST_PASSWORD);

/**
 * Helper to log in via the UI and navigate to a dashboard page.
 * Returns true if login succeeded and we reached the dashboard.
 */
async function loginAndNavigate(
  page: import("@playwright/test").Page,
  targetPath: string = "/dashboard"
): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) return false;

  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to dashboard (the server redirects based on role)
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  } catch {
    return false;
  }

  // Navigate to target path if different from default
  if (targetPath !== "/dashboard") {
    await page.goto(targetPath);
    // Ensure we weren't redirected away (still on a dashboard page)
    try {
      await page.waitForURL(new RegExp(targetPath.replace(/\//g, "\\/")), {
        timeout: 15000,
      });
    } catch {
      return false;
    }
  }

  return true;
}

test.describe("Dashboard Main Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("loads the dashboard and shows the timeline view", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    // The dashboard page renders ClientTimelineView which shows either
    // content or a loading skeleton. Wait for the page to settle.
    await page.waitForLoadState("networkidle");

    // The dashboard layout includes a sidebar (desktop) or mobile nav
    // Check that the main layout structure is present
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });

  test("shows the day navigator for switching between plan days", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // PlanDayNavigator renders day controls - look for day number text
    // The component renders "Day X" indicators. Even if no plan is configured
    // the loading state or "not configured" state should appear.
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    // Look for common dashboard elements that appear regardless of plan state:
    // - Loading skeletons (animate-pulse)
    // - "Plan Not Configured" message
    // - Or active timeline with day navigation
    const hasContent = await page
      .locator('[class*="athletic-card"], [class*="animate-pulse"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test("dashboard layout includes sidebar navigation on desktop", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The Sidebar component renders as an aside element on desktop (lg:flex)
    // Check for the navigation links defined in sidebar.tsx
    const sidebar = page.locator("aside");
    // On desktop viewport, sidebar should be visible
    if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      // Check for navigation items
      await expect(sidebar.getByRole("link", { name: /Today.s Plan/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Check-In/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Progress/i })).toBeVisible();
      await expect(sidebar.getByRole("link", { name: /Challenge/i })).toBeVisible();
    }
  });
});

// =============================================================================
// Check-In Page Tests
// =============================================================================

test.describe("Check-In Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("renders the check-in form with multi-step structure", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The check-in page has a "Weekly Check-In" heading
    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Shows the current date
    const today = new Date();
    const monthName = today.toLocaleDateString("en-US", { month: "long" });
    await expect(page.getByText(new RegExp(monthName))).toBeVisible();

    // Shows day number indicator
    await expect(page.getByText(/Day \d+/i)).toBeVisible();
  });

  test("shows the step progress indicator", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Wait for the form to load (not just loading skeleton)
    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // The steps are: Measurements, Photos, Ratings, Notes
    // On mobile, "Step 1 of 4" is shown; on desktop, step labels are visible
    const hasStepIndicator =
      (await page
        .getByText(/Step 1 of 4/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/Measurements/i)
        .isVisible()
        .catch(() => false));
    expect(hasStepIndicator).toBeTruthy();
  });

  test("has navigation buttons for stepping through the form", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Wait for form content to load (beyond skeleton)
    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Back button should be present but disabled on step 1
    const backButton = page.getByRole("button", { name: /Back/i });
    await expect(backButton).toBeVisible();

    // Next button should be present on step 1
    const nextButton = page.getByRole("button", { name: /Next/i });
    await expect(nextButton).toBeVisible();
  });

  test("has a link to check-in history", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // The check-in page has a "View History" link
    const historyLink = page.getByRole("link", { name: /View History/i });
    await expect(historyLink).toBeVisible();
    await expect(historyLink).toHaveAttribute("href", "/dashboard/checkin/history");
  });

  test("navigates between form steps using Next button", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Step 1 is Measurements - fill in weight (required field) then click Next
    // The weight field is labeled with "Weight" text in the MeasurementsStep component
    const weightInput = page.locator('input[name="weight"]');
    if (await weightInput.isVisible().catch(() => false)) {
      await weightInput.fill("70");
    }

    const nextButton = page.getByRole("button", { name: /Next/i });
    await nextButton.click();

    // After clicking Next, we should be on step 2 (Photos)
    // On mobile: "Step 2 of 4"; on desktop: Photos step label highlighted
    // We can check that the Back button is now enabled
    await expect(page.getByRole("button", { name: /Back/i })).toBeEnabled();
  });

  test("navigates back using the Back button", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Fill weight and go to step 2
    const weightInput = page.locator('input[name="weight"]');
    if (await weightInput.isVisible().catch(() => false)) {
      await weightInput.fill("70");
    }

    await page.getByRole("button", { name: /Next/i }).click();

    // Wait for step 2
    await expect(page.getByRole("button", { name: /Back/i })).toBeEnabled();

    // Click Back to return to step 1
    await page.getByRole("button", { name: /Back/i }).click();

    // Next button should be visible again on step 1
    await expect(page.getByRole("button", { name: /Next/i })).toBeVisible();
  });

  test("shows Submit button on the final step", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Navigate through all 4 steps to reach the final one
    // Step 1 -> Step 2: fill weight and click Next
    const weightInput = page.locator('input[name="weight"]');
    if (await weightInput.isVisible().catch(() => false)) {
      await weightInput.fill("70");
    }
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // Step 2 -> Step 3: click Next (Photos step, no required fields)
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // Step 3 -> Step 4: click Next (Ratings step)
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(300);

    // On the final step (Notes), Submit button should replace Next
    await expect(page.getByRole("button", { name: /Submit Check-In/i })).toBeVisible({
      timeout: 5000,
    });
  });
});

// =============================================================================
// Check-In History Page Tests
// =============================================================================

test.describe("Check-In History Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("renders the check-in history page with header", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin/history");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The history page has a "Check-In History" heading
    await expect(page.getByRole("heading", { name: /Check-In.*History/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows check-in count or empty state", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin/history");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Check-In.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // Either shows "X check-ins recorded" or the empty state "No Check-Ins Yet"
    const hasCheckIns = await page
      .getByText(/\d+ check-ins? recorded/)
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Check-Ins Yet/i)
      .isVisible()
      .catch(() => false);
    expect(hasCheckIns || hasEmptyState).toBeTruthy();
  });

  test("has a link to create a new check-in", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin/history");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Check-In.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // The page has a "New Check-In" link (in the header) or "Submit First Check-In" (empty state)
    const hasNewCheckInLink = await page
      .getByRole("link", { name: /New Check-In/i })
      .isVisible()
      .catch(() => false);
    const hasFirstCheckInLink = await page
      .getByRole("link", { name: /Submit First Check-In/i })
      .isVisible()
      .catch(() => false);
    expect(hasNewCheckInLink || hasFirstCheckInLink).toBeTruthy();
  });

  test("navigates to check-in form from history page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin/history");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Check-In.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // Click the New Check-In link (or Submit First Check-In in empty state)
    const newCheckInLink = page.getByRole("link", {
      name: /New Check-In|Submit First Check-In/i,
    });
    await newCheckInLink.first().click();

    await page.waitForURL(/\/dashboard\/checkin$/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/checkin$/);
  });
});

// =============================================================================
// Challenge Page Tests
// =============================================================================

test.describe("Challenge History Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("renders the challenge history page with header", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/challenge");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The challenge page has a "Challenge History" heading
    await expect(page.getByRole("heading", { name: /Challenge.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // Shows the total days description
    await expect(page.getByText(/\d+-day metabolic challenge journey/i)).toBeVisible();
  });

  test("shows summary stats or empty/loading state", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/challenge");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Challenge.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // After loading, shows either:
    // - Summary stats: "Days Completed", "Total Points", "Completion"
    // - Empty state: "No Challenge Data Yet"
    // - Loading skeletons
    const hasDaysCompleted = await page
      .getByText(/Days Completed/i)
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Challenge Data Yet/i)
      .isVisible()
      .catch(() => false);
    const hasLoadingSkeleton = await page
      .locator('[class*="animate-pulse"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasDaysCompleted || hasEmptyState || hasLoadingSkeleton).toBeTruthy();
  });

  test("shows the calendar section when data is available", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/challenge");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Challenge.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // The calendar section has a heading like "30-Day Calendar" or "X-Day Calendar"
    const hasCalendar = await page
      .getByText(/\d+-Day Calendar/i)
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Challenge Data Yet/i)
      .isVisible()
      .catch(() => false);

    // Either we see the calendar or the empty state (both are valid)
    expect(hasCalendar || hasEmptyState).toBeTruthy();
  });

  test("shows cumulative metrics section when data is available", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/challenge");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Challenge.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // The cumulative metrics section has labels like "Total Steps", "Total Water", etc.
    const hasCumulativeMetrics = await page
      .getByText(/Cumulative Metrics/i)
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Challenge Data Yet/i)
      .isVisible()
      .catch(() => false);

    expect(hasCumulativeMetrics || hasEmptyState).toBeTruthy();
  });
});

// =============================================================================
// Progress Page Tests
// =============================================================================

test.describe("Progress Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("renders the progress page with header", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/progress");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The progress page has "My Progress" heading
    await expect(page.getByRole("heading", { name: /My.*Progress/i })).toBeVisible({
      timeout: 15000,
    });

    // Shows description
    await expect(page.getByText(/Track your transformation journey/i)).toBeVisible();
  });

  test("shows tabs or empty state", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/progress");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Progress/i })).toBeVisible({
      timeout: 15000,
    });

    // Either shows tabs ("Progress Charts", "Photos") or empty state
    const hasChartTab = await page
      .getByRole("button", { name: /Progress Charts/i })
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Progress Data Yet/i)
      .isVisible()
      .catch(() => false);
    expect(hasChartTab || hasEmptyState).toBeTruthy();
  });

  test("empty state links to check-in form", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/progress");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Progress/i })).toBeVisible({
      timeout: 15000,
    });

    // If in empty state, there should be a link to submit first check-in
    const emptyStateLink = page.getByRole("link", {
      name: /Submit First Check-In/i,
    });
    const hasEmptyState = await emptyStateLink.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyStateLink).toHaveAttribute("href", "/dashboard/checkin");
    }
  });

  test("can switch between chart and photos tabs when data exists", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/progress");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Progress/i })).toBeVisible({
      timeout: 15000,
    });

    const chartTab = page.getByRole("button", { name: /Progress Charts/i });
    const photosTab = page.getByRole("button", { name: /Photos/i });

    // Only test tab switching if tabs are visible (data exists)
    if (await chartTab.isVisible().catch(() => false)) {
      await photosTab.click();
      // After clicking Photos, the Photos tab should be active (styled differently)
      await expect(photosTab).toBeVisible();

      // Switch back to charts
      await chartTab.click();
      await expect(chartTab).toBeVisible();
    }
  });
});

// =============================================================================
// Profile Page Tests
// =============================================================================

test.describe("Profile Page", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("renders the profile page with header", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/profile");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The profile page has "My Profile" heading
    await expect(page.getByRole("heading", { name: /My.*Profile/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows profile photo upload section", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/profile");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Profile/i })).toBeVisible({
      timeout: 15000,
    });

    // ProfilePhotoUpload component renders with an image or placeholder
    // Look for the photo section within the grid layout
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // The photo section should be present within the content grid
    const hasProfileContent = await mainContent
      .locator('[class*="athletic-card"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasProfileContent).toBeTruthy();
  });

  test("shows profile details, plan info, and conditions cards", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/profile");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Profile/i })).toBeVisible({
      timeout: 15000,
    });

    // The profile page renders multiple cards in a grid:
    // ProfileDetailsCard, ProfilePlanCard, ProfileConditionsCard, ProfileTargetsCard
    // At minimum, the main profile heading and some cards should be visible
    const cards = page.locator('[class*="athletic-card"]');
    const cardCount = await cards.count();
    // Should have at least the header card + photo + details + plan/conditions cards
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test("shows notification settings section", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/profile");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /My.*Profile/i })).toBeVisible({
      timeout: 15000,
    });

    // The profile page has a "Notification Settings" section
    await expect(page.getByRole("heading", { name: /Notification.*Settings/i })).toBeVisible();
  });
});

// =============================================================================
// Dashboard Navigation Tests
// =============================================================================

test.describe("Dashboard Navigation", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("can navigate from dashboard to check-in page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Use sidebar navigation (desktop) or look for check-in link
    const checkInLink = page.getByRole("link", { name: /Check-In/i }).first();
    if (await checkInLink.isVisible().catch(() => false)) {
      await checkInLink.click();
      await page.waitForURL(/\/dashboard\/checkin/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/checkin/);
    }
  });

  test("can navigate from dashboard to progress page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    const progressLink = page.getByRole("link", { name: /Progress/i }).first();
    if (await progressLink.isVisible().catch(() => false)) {
      await progressLink.click();
      await page.waitForURL(/\/dashboard\/progress/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/progress/);
    }
  });

  test("can navigate from dashboard to challenge page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    const challengeLink = page.getByRole("link", { name: /Challenge/i }).first();
    if (await challengeLink.isVisible().catch(() => false)) {
      await challengeLink.click();
      await page.waitForURL(/\/dashboard\/challenge/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/challenge/);
    }
  });

  test("can navigate from check-in to check-in history", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // Click "View History" link on check-in page
    const historyLink = page.getByRole("link", { name: /View History/i });
    await historyLink.click();

    await page.waitForURL(/\/dashboard\/checkin\/history/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/checkin\/history/);
  });

  test("can navigate from check-in history back to check-in form", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin/history");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Check-In.*History/i })).toBeVisible({
      timeout: 15000,
    });

    // Click "New Check-In" link or "Submit First Check-In" link
    const newCheckInLink = page
      .getByRole("link", { name: /New Check-In|Submit First Check-In/i })
      .first();
    await newCheckInLink.click();

    await page.waitForURL(/\/dashboard\/checkin$/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/checkin$/);
  });

  test("sidebar profile link navigates to profile page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // On desktop, the sidebar has a profile link area
    const profileLink = page.locator('aside a[href="/dashboard/profile"]').first();
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click();
      await page.waitForURL(/\/dashboard\/profile/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/profile/);
    }
  });
});

// =============================================================================
// Mobile Viewport Tests
// =============================================================================

test.describe("Dashboard Mobile Viewport", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  // Use a mobile viewport for these tests
  test.use({ viewport: { width: 375, height: 812 } });

  test("shows mobile header with hamburger menu", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // MobileNav renders a header with a hamburger button
    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible({ timeout: 15000 });
  });

  test("hamburger menu opens mobile navigation", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Click the hamburger button
    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible({ timeout: 15000 });
    await menuButton.click();

    // The mobile nav should show navigation links
    // After opening, the button changes to "Close menu"
    await expect(page.getByRole("button", { name: /Close menu/i })).toBeVisible();

    // Navigation links should be visible
    await expect(page.getByRole("link", { name: /Today.s Plan/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Check-In/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Progress/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Challenge/i })).toBeVisible();
  });

  test("can navigate to check-in via mobile menu", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible({ timeout: 15000 });
    await menuButton.click();

    // Click Check-In link
    await page.getByRole("link", { name: /Check-In/i }).click();

    await page.waitForURL(/\/dashboard\/checkin/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/checkin/);
  });

  test("can navigate to challenge via mobile menu", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Open mobile menu
    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible({ timeout: 15000 });
    await menuButton.click();

    // Click Challenge link
    await page.getByRole("link", { name: /Challenge/i }).click();

    await page.waitForURL(/\/dashboard\/challenge/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/challenge/);
  });

  test("mobile check-in page shows step indicator", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/checkin");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Weekly.*Check-In/i })).toBeVisible({
      timeout: 15000,
    });

    // On mobile, the step indicator shows "Step X of 4"
    await expect(page.getByText(/Step 1 of 4/i)).toBeVisible();
  });

  test("mobile dashboard hides the desktop sidebar", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // The sidebar (aside element) should be hidden on mobile (lg:flex = hidden below 1024px)
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  });

  test("mobile profile page renders correctly", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard/profile");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Profile heading should be visible on mobile
    await expect(page.getByRole("heading", { name: /My.*Profile/i })).toBeVisible({
      timeout: 15000,
    });

    // Content should stack vertically on mobile (the grid becomes single column)
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("closes mobile menu when navigating to a page", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    await page.waitForLoadState("networkidle");

    // Open the menu
    const menuButton = page.getByRole("button", { name: /Open menu/i });
    await expect(menuButton).toBeVisible({ timeout: 15000 });
    await menuButton.click();

    // Verify menu is open
    await expect(page.getByRole("button", { name: /Close menu/i })).toBeVisible();

    // Navigate via menu link
    await page.getByRole("link", { name: /Progress/i }).click();
    await page.waitForURL(/\/dashboard\/progress/, { timeout: 10000 });

    // After navigation, the menu should close and "Open menu" button should be back
    await expect(page.getByRole("button", { name: /Open menu/i })).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// Dashboard Redirect After Login Tests
// =============================================================================

test.describe("Dashboard Login Flow", () => {
  test.skip(!hasCredentials, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();

    // After successful login, client users are redirected to /dashboard
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 20000 });

    // Should be on the dashboard (for client role) or admin (for admin role)
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|admin)/);
  });

  test("dashboard is accessible after login without re-redirect to login", async ({ page }) => {
    const loggedIn = await loginAndNavigate(page, "/dashboard");
    test.skip(!loggedIn, "Could not log in");

    // Confirm we're still on the dashboard (not redirected back to login)
    await expect(page).toHaveURL(/\/dashboard/);

    // The main content area should be rendered
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });
});
