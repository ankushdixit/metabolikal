# Stability & Performance Plan

**Created**: 2026-02-20
**Completed**: 2026-02-20
**Status**: All phases completed

This document combines a comprehensive stability audit (auth failures, stuck loading, logout bugs) with the original performance optimization plan. Issues are ordered by **decreasing priority** — fix reliability first, then optimize speed.

---

## Table of Contents

- [Phase 0: Critical Reliability Fixes](#phase-0-critical-reliability-fixes) — P0, fix immediately
- [Phase 1: Auth Architecture Consolidation](#phase-1-auth-architecture-consolidation) — P1, eliminates root causes
- [Phase 2: Error Handling & Resilience](#phase-2-error-handling--resilience) — P1/P2, prevents silent failures
- [Phase 3: Data Fetching Fixes](#phase-3-data-fetching-fixes) — P2, unbounded queries and cache bypass
- [Phase 4: Rendering Optimization](#phase-4-rendering-optimization) — P3, re-render reduction
- [Phase 5: Bundle Size & SSR](#phase-5-bundle-size--ssr) — P3, initial load improvements

---

## Phase 0: Critical Reliability Fixes

**Goal**: Fix the bugs users are actively experiencing — stuck loading states and broken logout.
**Priority**: P0 — do these first.
**Sessions**: 1-2

---

### Task 0.1: Add error handling to AuthProvider's `getUser()` call

**Priority**: P0
**Symptom**: Pages get stuck showing skeleton/loading indefinitely, then work on refresh.

**Root Cause**: `contexts/auth-context.tsx:38` calls `supabase.auth.getUser().then(...)` with **no `.catch()` handler**. If the Supabase auth server is slow, rate-limited, or the network drops momentarily, the promise rejects, `setIsLoading(false)` never runs, and `isLoading` stays `true` forever. Every downstream component checking `useAuth().isLoading` or gating on `useAuth().userId` remains in its loading/skeleton state permanently.

**Current code** (`contexts/auth-context.tsx:34-57`):

```typescript
useEffect(() => {
  const supabase = createBrowserSupabaseClient();
  supabase.auth.getUser().then(async ({ data }) => {
    if (data.user) {
      setUserId(data.user.id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, role")
        .eq("id", data.user.id)
        .single();
      if (profileData) {
        setProfile({ ... });
      }
    }
    setIsLoading(false);
  });
  // NO .catch() — isLoading stays true forever on rejection
```

**Implementation**:

1. Add `.catch()` to the `getUser()` promise chain that sets `isLoading(false)` and clears state.
2. Add a timeout (e.g., 10 seconds) so that even if `getUser()` hangs without rejecting, the app recovers.
3. Add error state to the context so consumers can show an error UI instead of loading forever.

```typescript
// Suggested approach:
useEffect(() => {
  const supabase = createBrowserSupabaseClient();
  let didTimeout = false;

  // Safety timeout — if auth takes too long, stop loading and let the user retry
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    setIsLoading(false);
    setAuthError("Authentication timed out. Please refresh the page.");
  }, 10_000);

  supabase.auth.getUser()
    .then(async ({ data }) => {
      if (didTimeout) return; // Already timed out, ignore
      clearTimeout(timeoutId);
      if (data.user) {
        setUserId(data.user.id);
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("avatar_url, full_name, role")
            .eq("id", data.user.id)
            .single();
          if (profileData) {
            setProfile({ ... });
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
          // User is authenticated but profile fetch failed — set userId, skip profile
        }
      }
      setIsLoading(false);
    })
    .catch((err) => {
      if (didTimeout) return;
      clearTimeout(timeoutId);
      console.error("Auth getUser failed:", err);
      setIsLoading(false);
      setAuthError("Failed to verify authentication. Please refresh.");
    });

  return () => clearTimeout(timeoutId);
}, []);
```

4. Expose `authError` from the context so consumers can display a retry UI.
5. Also add a try/catch around the inner profile fetch (the `await supabase.from("profiles")...` on line 42-46) — if it throws, `setIsLoading(false)` is currently skipped.

**Also fix the duplicate profile fetch**: The `onAuthStateChange` listener (line 62-88) fires `SIGNED_IN` immediately after `getUser()` resolves, causing a **double profile fetch** on mount. Add a guard:

```typescript
// In the onAuthStateChange handler:
if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
  // Skip if this is the initial SIGNED_IN event and we already fetched above
  if (event === "SIGNED_IN" && userId === session.user.id) return;
  // ... existing profile fetch ...
}
```

**Files**: `contexts/auth-context.tsx`

**Verification**: Open the app with Chrome DevTools → Network tab → throttle to "Slow 3G". Navigate to `/dashboard`. The page should either load (slowly) or show an error message — never stay stuck on a skeleton.

---

### Task 0.2: Fix logout button reliability

**Priority**: P0
**Symptom**: Logout button doesn't work sometimes. After refreshing, it works.

**Root Causes** (multiple):

1. **No timeout on `signOut()`** (`auth-context.tsx:95-101`): `await supabase.auth.signOut()` can hang indefinitely on slow networks. The button appears to do nothing.

2. **Race condition with `onAuthStateChange`**: When `signOut()` completes, it triggers `onAuthStateChange(SIGNED_OUT)` which sets `userId=null` and `profile=null`. This causes mass re-renders in all consuming components (Sidebar, Header, MobileNav, PlanCycleProvider, etc.). The `window.location.href = "/login"` fires during this re-render storm and can get swallowed by the browser.

3. **MobileNav `closeMenu()` before `signOut()`** (`components/layout/mobile-nav.tsx:215-218`):
   ```typescript
   onClick={() => {
     closeMenu();  // triggers re-render, may unmount this component
     signOut();    // may not execute if component unmounted
   }}
   ```
   `closeMenu()` calls `setIsOpen(false)` which can unmount the button before `signOut()` runs.

**Implementation**:

1. Add a timeout to `signOut()`:

   ```typescript
   const signOut = useCallback(async () => {
     const supabase = createBrowserSupabaseClient();

     // Race signOut against a timeout — don't let it hang forever
     try {
       await Promise.race([
         supabase.auth.signOut(),
         new Promise((_, reject) =>
           setTimeout(() => reject(new Error("Sign out timed out")), 5000)
         ),
       ]);
     } catch (err) {
       console.error("Sign out error:", err);
       // Force clear local auth state even if the server call failed
     }

     // Always redirect, even if signOut() threw/timed out
     window.location.href = "/login";
   }, []);
   ```

2. Fix MobileNav — call `signOut()` first, don't bother closing the menu:

   ```typescript
   onClick={() => {
     signOut(); // Will do a hard redirect, menu state doesn't matter
   }}
   ```

3. Reset PostHog identity on logout. In `signOut()`, before the redirect:
   ```typescript
   try {
     posthog.reset();
   } catch {}
   ```

**Files**: `contexts/auth-context.tsx`, `components/layout/mobile-nav.tsx`, `components/admin/admin-mobile-nav.tsx`

**Verification**: Click logout on both desktop and mobile nav. Verify it always redirects to `/login` within 5 seconds, even with throttled network.

---

### Task 0.3: Fix Challenge page stuck-loading guard

**Priority**: P0
**Symptom**: Challenge page sometimes stays in skeleton state forever.

**Root Cause**: `app/dashboard/challenge/page.tsx:84-85`:

```typescript
useEffect(() => {
  if (!userId || !selectedCycle) return; // ← exits WITHOUT calling setIsLoading(false)
  // ...
  setIsLoading(true);
  // ...
  setIsLoading(false); // ← only reached if the guard passes
}, [userId, selectedCycle, supabase]);
```

The component starts with `isLoading = true` (line 73). If `userId` is null (AuthProvider still loading) or `selectedCycle` is null (PlanCycleProvider profile not yet loaded), the `useEffect` returns early **without** calling `setIsLoading(false)`. The page shows its skeleton (lines 285-299) forever.

**Implementation**:

Option A (quick fix): Set `isLoading` based on dependency availability:

```typescript
const [isLoading, setIsLoading] = useState(true);

// Derive loading from dependencies
const isReady = !!userId && !!selectedCycle;

useEffect(() => {
  if (!isReady) {
    // Don't set isLoading here — the skeleton will show because isReady is false
    return;
  }
  // ... existing fetch logic ...
}, [isReady, userId, selectedCycle, supabase]);

// In the render:
if (!isReady || isLoading) {
  return <Skeleton />;
}
```

Option B (better): Convert to `useList` from Refine (gets React Query caching for free):

```typescript
const progressQuery = useList({
  resource: "challenge_progress",
  filters: [
    { field: "user_id", operator: "eq", value: userId || "" },
    { field: "plan_cycle", operator: "eq", value: selectedCycle || 0 },
  ],
  sorters: [{ field: "day_number", order: "asc" }],
  pagination: { mode: "off" },
  queryOptions: { enabled: !!userId && !!selectedCycle },
});
```

**Files**: `app/dashboard/challenge/page.tsx`

---

## Phase 1: Auth Architecture Consolidation

**Goal**: Eliminate redundant auth calls, consolidate to a single source of truth. Estimated 50-60% reduction in perceived sluggishness.
**Priority**: P1
**Sessions**: 2-3

---

### Task 1.1: Consolidate to a single Supabase browser client

**Priority**: P1
**Problem**: There are **two separate browser client singletons** with the same export name:

| File                       | Library                                | Singleton Variable      | Used By                                     |
| -------------------------- | -------------------------------------- | ----------------------- | ------------------------------------------- |
| `lib/auth.ts:106-144`      | `@supabase/ssr` `createBrowserClient`  | `browserClientInstance` | AuthContext, Refine, login, hooks (primary) |
| `lib/supabase.ts:14,48-63` | `@supabase/supabase-js` `createClient` | `browserClient`         | Backwards compat, `supabaseClient` export   |

Both export `createBrowserSupabaseClient()`. If any code accidentally imports from `lib/supabase.ts`, it gets a **different** auth state — signing out on one does not affect the other.

**Implementation**:

1. **Delete** the browser client from `lib/supabase.ts` — remove `createBrowserSupabaseClient()` and `browserClient` (lines 14, 48-63). Also remove the `getSupabaseClient()` function (lines 69-74) and the `supabaseClient` export (line 127).
2. Keep only `lib/auth.ts` as the canonical browser client.
3. Keep `lib/supabase.ts` only for `createServerSupabaseClient()` (lines 22-37) and `testDatabaseConnection()`.
4. Search the codebase for any import from `lib/supabase.ts` that uses the browser client and redirect to `lib/auth.ts`.
5. Run: `grep -r "from.*lib/supabase" --include="*.ts" --include="*.tsx"` to find all imports.

**Also fix the no-op lock** in `lib/auth.ts:112-118`:
The `noOpLock` disables Supabase's Navigator Locks API, which prevents multiple tabs from racing on token refresh. This was added to fix "signal is aborted without reason" errors. Instead of disabling locks entirely, use a proper fallback:

```typescript
// Replace noOpLock with a mutex-based fallback for environments without Navigator Locks:
const fallbackLock = (() => {
  const locks = new Map<string, Promise<void>>();
  return async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
    const existing = locks.get(_name);
    if (existing) await existing;
    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    locks.set(_name, promise);
    try {
      return await fn();
    } finally {
      resolve!();
      locks.delete(_name);
    }
  };
})();
```

Or, if the "signal is aborted" errors are resolved in newer `@supabase/ssr` versions, try removing the custom lock entirely and testing.

**Files**: `lib/supabase.ts`, `lib/auth.ts`, all files importing from `lib/supabase.ts`

---

### Task 1.2: Make Refine's authProvider consume AuthContext instead of making independent calls

**Priority**: P1
**Problem**: Refine's `authProvider` in `lib/refine.tsx` has three methods that independently hit Supabase:

| Method             | Call                                                             | Line    |
| ------------------ | ---------------------------------------------------------------- | ------- |
| `check()`          | `supabase.auth.getSession()` (reads local JWT, no server verify) | 139-154 |
| `getPermissions()` | `supabase.auth.getUser()` + `profiles.select("role")`            | 157-174 |
| `getIdentity()`    | `supabase.auth.getUser()` + `profiles.select("*")`               | 176-207 |

This is 2 extra `getUser()` calls + 2 extra profile queries per page load, **on top of** what AuthProvider does.

**Additional problem**: `check()` uses `getSession()` while AuthProvider uses `getUser()`. `getSession()` reads the JWT from local storage without verifying it, while `getUser()` validates against the server. These can disagree — Refine thinks the user is authenticated (stale JWT) while the real session has expired. This can cause redirect loops or stuck states.

**Implementation**:

The challenge is that `authProvider` is a plain object defined at module level (`lib/refine.tsx`), not inside a React component, so it can't use hooks like `useAuth()`. Two approaches:

**Option A (recommended)**: Make `authProvider` methods read from the browser Supabase client's cached session instead of making new calls. Replace `getSession()` in `check()` with `getUser()` for consistency (or accept the perf tradeoff), and share the profile data:

```typescript
// In check(), use getUser() for consistency:
check: async () => {
  const supabase = createBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { authenticated: true };
  return { authenticated: false, redirectTo: "/login" };
},

// In getPermissions() and getIdentity(), use a shared profile cache:
// Create a simple in-memory profile cache that AuthProvider populates
```

**Option B**: Create a wrapping component that passes auth state into a mutable ref, which the authProvider reads:

```typescript
// In the RefineProvider or a new wrapper:
const authRef = useRef({ user: null, profile: null });
const { userId, profile } = useAuth();
authRef.current = { userId, profile };

// Pass authRef to a factory that creates the authProvider
const authProvider = createRefineAuthProvider(authRef);
```

**Files**: `lib/refine.tsx`, `providers/refine-provider.tsx`

---

### Task 1.3: Eliminate redundant `getUser()` calls across hooks

**Priority**: P1
**Problem**: On a single dashboard page load, `supabase.auth.getUser()` is called 5-7 times from different places:

| #   | Location                                         | File:Line                              |
| --- | ------------------------------------------------ | -------------------------------------- |
| 1   | Middleware                                       | `middleware.ts:58`                     |
| 2   | AuthProvider                                     | `auth-context.tsx:38`                  |
| 3   | AuthProvider onAuthStateChange (SIGNED_IN event) | `auth-context.tsx:70-85`               |
| 4   | Refine authProvider.check                        | `lib/refine.tsx:140-143`               |
| 5   | Refine authProvider.getPermissions               | `lib/refine.tsx:158-161`               |
| 6   | Refine authProvider.getIdentity                  | `lib/refine.tsx:177-180`               |
| 7   | useDeactivationGuard                             | `hooks/use-deactivation-guard.ts:23`   |
| 8   | useGamification                                  | `hooks/use-gamification.ts:251-252`    |
| 9   | Profile page                                     | `app/dashboard/profile/page.tsx:26-27` |

Each `getUser()` is a network round-trip to Supabase auth servers.

**Implementation** (after Task 1.2 solves Refine's calls):

1. **Profile page** (`app/dashboard/profile/page.tsx:20-34`): Replace the direct `getUser()` call with `useAuth()`. The page is already inside `<AuthProvider>`. Delete lines 20-34 and use:

   ```typescript
   const { userId } = useAuth();
   const userEmail = // get from profile or a separate light query
   ```

2. **useGamification** (`hooks/use-gamification.ts:246-252`): Replace the `supabase.auth.getUser()` call with accepting `userId` as a parameter (from `useAuth()` in the consuming component) or calling `useAuth()` directly inside the hook.

3. **useDeactivationGuard** (`hooks/use-deactivation-guard.ts:20-23`): Instead of calling `getUser()` every 30 seconds, accept `userId` from `useAuth()` and only query the `profiles` table:

   ```typescript
   export function useDeactivationGuard() {
     const { userId, signOut } = useAuth();
     // ... only query profiles.is_deactivated, skip getUser()
   }
   ```

   Also consider increasing the poll interval from 30s to 120s (or using Supabase Realtime for deactivation events).

4. **Remove duplicate `onAuthStateChange` listeners**. Currently there are 4 independent subscriptions:
   - `auth-context.tsx:62` — AuthProvider
   - `hooks/use-gamification.ts:292` — useGamification
   - `hooks/use-profile-completion.ts:152` — useProfileCompletion
   - Refine internal

   After consolidation, only AuthProvider should subscribe. Other hooks should react to AuthProvider state changes (via `useAuth()` + `useEffect` watching `userId`).

5. **Stop re-fetching profile on TOKEN_REFRESHED** (`auth-context.tsx:70`): Profile data (name, avatar, role) doesn't change just because the auth token was refreshed. Skip the profile fetch for `TOKEN_REFRESHED` events:
   ```typescript
   if (event === "TOKEN_REFRESHED") {
     setUserId(session.user.id); // Update userId in case it changed
     return; // Don't re-fetch profile — it hasn't changed
   }
   ```

**Result**: Reduce from 5-7 `getUser()` calls to 1-2 per page load. Reduce from 4-6 profile queries to 1.

**Files**: `contexts/auth-context.tsx`, `hooks/use-gamification.ts`, `hooks/use-deactivation-guard.ts`, `hooks/use-profile-completion.ts`, `app/dashboard/profile/page.tsx`, `lib/refine.tsx`

---

### Task 1.4: Fix PlanCycleProvider redundant profile fetch

**Priority**: P1
**Problem**: `contexts/plan-cycle-context.tsx:43-47` fetches the profile via Refine's `useList`:

```typescript
const profileQuery = useList<Profile>({
  resource: "profiles",
  filters: [{ field: "id", operator: "eq", value: userId || "" }],
  queryOptions: { enabled: !!userId },
});
```

But `AuthProvider` already fetched the same profile directly via Supabase (lines 42-46 of `auth-context.tsx`). These two fetches use **different caches** — AuthProvider uses raw Supabase, PlanCycleProvider uses Refine/React Query. The data is not shared.

**Implementation**:

Option A: Expand AuthProvider to include the fields PlanCycleProvider needs (`plan_duration_days`, `plan_start_date`, `challenge_start_date`, `current_plan_cycle`, `created_at`). Then PlanCycleProvider reads from `useAuth()` instead of making its own query.

Option B: Have PlanCycleProvider fetch the profile via `useOne` (by id, not `useList` with a filter) so the query key is more specific and cacheable. Then ensure AuthProvider also uses `useOne` through Refine so they share the React Query cache.

Option A is simpler and eliminates a query entirely. Option B improves caching but still has two queries.

**Files**: `contexts/auth-context.tsx`, `contexts/plan-cycle-context.tsx`

---

## Phase 2: Error Handling & Resilience

**Goal**: Ensure errors are visible to users instead of showing as stuck loading or empty pages.
**Priority**: P1/P2
**Sessions**: 2

---

### Task 2.1: Add `isError` handling to all pages — DONE

**Priority**: P1
**Problem**: 8+ pages only check `isLoading` from Refine queries, never `isError`. When a query fails (expired token, RLS policy, network error), `isLoading` transitions to `false` but `isError` is `true`. These pages render with empty data and no feedback — users see blank content or zero counts.

**Pages that need `isError` handling**:

| Page            | File                                 | Current behavior on error          |
| --------------- | ------------------------------------ | ---------------------------------- |
| Admin dashboard | `app/admin/page.tsx`                 | Shows 0 clients, 0 pending reviews |
| Clients list    | `app/admin/clients/page.tsx`         | Shows empty table                  |
| Challengers     | `app/admin/challengers/page.tsx`     | Shows empty list                   |
| Pending reviews | `app/admin/pending-reviews/page.tsx` | Shows empty list                   |
| Diet page       | `app/dashboard/diet/page.tsx`        | Shows empty plan                   |
| Workout page    | `app/dashboard/workout/page.tsx`     | Shows empty plan                   |
| Progress page   | `app/dashboard/progress/page.tsx`    | Shows empty charts                 |
| Check-in page   | `app/dashboard/checkin/page.tsx`     | Shows empty form                   |

**Pages that already handle errors properly** (use as reference):

- `components/dashboard/client-timeline-view.tsx:454-471` — shows "Failed to load your plan" with retry button.

**Implementation**:

For each page, add an error check after the loading check:

```typescript
// Pattern to follow:
const { query: { isLoading, isError, error, refetch } } = useList({ ... });

if (isLoading) return <LoadingSkeleton />;
if (isError) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  );
}
```

**Files**: All 8 pages listed above.

---

### Task 2.2: Add error boundaries for admin and dashboard route segments — DONE

**Priority**: P2
**Problem**: Only `app/error.tsx` (root) and `app/global-error.tsx` exist. If a component inside `/dashboard` or `/admin` throws during render, the error bubbles to the root error boundary, which **replaces the entire page including sidebar and navigation**. The user can't navigate away — they must click "Try again" or edit the URL.

**Implementation**:

1. Create `app/dashboard/error.tsx`:

   ```typescript
   "use client";
   export default function DashboardError({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
         <h2 className="text-xl font-bold">Something went wrong</h2>
         <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
         <button onClick={reset} className="athletic-button px-4 py-2">
           Try Again
         </button>
       </div>
     );
   }
   ```

   This renders **inside** the dashboard layout, so the sidebar/header remain accessible.

2. Create `app/admin/error.tsx` — same pattern.

3. Optionally create more granular boundaries for data-heavy sub-routes:
   - `app/admin/clients/error.tsx`
   - `app/admin/clients/[id]/error.tsx`
   - `app/dashboard/challenge/error.tsx`

**Files**: New files in `app/dashboard/` and `app/admin/`

---

### Task 2.3: Add missing `loading.tsx` files — DONE

**Priority**: P2
**Status**: Partially done. These already exist:

- `app/loading.tsx` (root)
- `app/admin/loading.tsx`
- `app/admin/clients/loading.tsx`
- `app/dashboard/loading.tsx`
- `app/dashboard/checkin/loading.tsx`

**Still missing for**:

- `app/admin/challengers/loading.tsx`
- `app/admin/pending-reviews/loading.tsx`
- `app/admin/config/loading.tsx` (or per sub-route)
- `app/admin/clients/[id]/loading.tsx`
- `app/admin/clients/[id]/plans/loading.tsx`
- `app/dashboard/diet/loading.tsx`
- `app/dashboard/workout/loading.tsx`
- `app/dashboard/progress/loading.tsx`
- `app/dashboard/profile/loading.tsx`
- `app/dashboard/challenge/loading.tsx`

**Implementation**: Create simple spinner loading components for each. Follow the pattern in existing `loading.tsx` files.

**Files**: New files in the route directories listed above.

---

### Task 2.4: Fix notifications dropdown error handling — DONE

**Priority**: P2
**Problem**: `components/layout/notifications-dropdown.tsx` makes direct Supabase calls (bypasses Refine/React Query). If the Supabase call **throws** (not returns an error, but throws), `setIsLoading(false)` never runs and the dropdown stays loading.

**Implementation**:

1. Wrap the fetch in try/catch:

   ```typescript
   const fetchNotifications = useCallback(async () => {
     if (!userId) return;
     const supabase = createBrowserSupabaseClient();
     try {
       const { data, error } = await supabase.from("notifications")...;
       if (error) {
         console.error("Error fetching notifications:", error);
       } else {
         setNotifications(data || []);
       }
     } catch (err) {
       console.error("Notifications fetch threw:", err);
     } finally {
       setIsLoading(false); // Always runs
     }
   }, [userId]);
   ```

2. Better yet, convert to `useList` from Refine to get React Query caching and retry.

**Files**: `components/layout/notifications-dropdown.tsx`

---

### Task 2.5: Fix offline completions stale closure — DONE

**Priority**: P2
**Problem**: `hooks/use-offline-completions.ts:166-193` — the `useEffect` has an empty dependency array `[]` but references `syncQueueInternal` which depends on `queue` and `isSyncing`. When `handleOnline` fires, it calls a stale version that sees the initial empty queue.

**Implementation**: Add `syncQueueInternal` to the dependency array, or use a ref:

```typescript
const syncQueueRef = useRef(syncQueueInternal);
useEffect(() => {
  syncQueueRef.current = syncQueueInternal;
}, [syncQueueInternal]);

useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    syncQueueRef.current(); // Always calls the latest version
  };
  // ...
}, []);
```

**Files**: `hooks/use-offline-completions.ts`

---

### Task 2.6: Fix login page `router.push()` + `router.refresh()` race — DONE

**Priority**: P2
**Problem**: `app/(auth)/login/page.tsx:88-89`:

```typescript
router.push(redirectTo);
router.refresh();
```

`router.push()` and `router.refresh()` fire back-to-back and can race. The `isLoading` state is never reset to `false` after this (intentionally), but if the navigation fails, the login button stays disabled with "Signing in..." forever.

**Implementation**: Remove `router.refresh()` — the hard navigation from `router.push()` to a different route is sufficient. If a full refresh is truly needed, use `window.location.href` instead:

```typescript
// Option A: Just push (recommended)
router.push(redirectTo);

// Option B: If full refresh is needed
window.location.href = redirectTo;
```

**Files**: `app/(auth)/login/page.tsx`

---

### Task 2.7: Fix diet/workout page wrong-day data flash — DONE

**Priority**: P3
**Problem**: `app/dashboard/diet/page.tsx` and `app/dashboard/workout/page.tsx` initialize `dayNumber` to `1`, fire a query for day 1, then update `dayNumber` when the profile loads. This causes a brief flash of wrong-day content.

**Implementation**: Gate the data query on profile being loaded:

```typescript
// Instead of: const [dayNumber, setDayNumber] = useState(1);
// Use: const [dayNumber, setDayNumber] = useState<number | null>(null);
// And gate the query: queryOptions: { enabled: !!userId && dayNumber !== null }
```

**Files**: `app/dashboard/diet/page.tsx`, `app/dashboard/workout/page.tsx`

---

## Phase 3: Data Fetching Fixes

**Goal**: Stop fetching entire database tables. Add pagination, column selection, and date filters.
**Priority**: P2
**Sessions**: 3-4

---

### Task 3.1: Fix admin dashboard unbounded queries — DONE

**Problem**: `app/admin/page.tsx` fetches ALL clients and ALL check-ins with `pagination: { mode: "off" }`. Then filters in JavaScript.

**Implementation**:

1. **Clients query**: Add `meta: { select: "id, full_name, avatar_url, role, plan_start_date" }` to reduce payload. If dashboard truly needs all clients for stats, consider a Supabase RPC that returns aggregated counts.

2. **Check-ins query**: Add date filter (last 7 days only). Add `meta: { select: "id, client_id, submitted_at, reviewed_at" }`.

3. Move JavaScript filtering to Supabase filters where possible.

**Files**: `app/admin/page.tsx`

---

### Task 3.2: Fix clients list page pagination — DONE

**Problem**: `app/admin/clients/page.tsx` fetches ALL clients and ALL check-ins, then paginates in JavaScript.

**Implementation**:

1. Convert to proper server-side pagination: `pagination: { mode: "server", current: page, pageSize: 25 }`
2. Add search/filter UI using Refine's `filters` param.
3. Check-ins: filter to only visible clients' IDs, or fetch counts via RPC.
4. Add `meta: { select: "..." }` to limit columns returned.

**Files**: `app/admin/clients/page.tsx`

---

### Task 3.3: Fix TodaysChallengeActivity component — DONE

**Problem**: `components/admin/todays-challenge-activity.tsx` fetches ALL `challenge_progress` for ALL clients across ALL days, then groups in JavaScript. Grows as clients \* days.

**Implementation**:

1. Add date filter — only fetch today's entries:

   ```typescript
   filters: [
     { field: "challenge_date", operator: "eq", value: new Date().toISOString().split("T")[0] },
   ],
   ```

2. Or create a Supabase view/RPC for today's aggregated challenge stats.

**Files**: `components/admin/todays-challenge-activity.tsx`

---

### Task 3.4: Fix timeline data hooks — safety limits and column selection — DONE

**Problem**: Multiple hooks fetch with `pagination: { mode: "off" }`:

- `hooks/use-timeline-data.ts` — 5 queries (diet, supplement, workout, lifestyle, conditions) all unbounded
- `hooks/use-daily-plan-data.ts` — 5 queries all unbounded
- `hooks/use-client-timeline.ts` — completions query unbounded

**Implementation**:

1. **`use-timeline-data.ts`**: Add `meta: { select: "..." }` to each query. Consider day_number range filters based on current view.

2. **`use-daily-plan-data.ts`**: These already filter by `client_id` AND `day_number`. Change `pagination: { mode: "off" }` to `pageSize: 100` as a safety limit.

3. **`use-client-timeline.ts`**: Plan completions — add `pageSize: 100` safety limit.

4. Add `enabled: false` to queries that don't need to run immediately (e.g., historical cycles).

**Files**: `hooks/use-timeline-data.ts`, `hooks/use-daily-plan-data.ts`, `hooks/use-client-timeline.ts`

---

### Task 3.5: Fix challengers page — worst unbounded queries — DONE

**Problem**: `app/admin/challengers/page.tsx` fetches ALL challenge_progress, ALL assessment_results, AND ALL calculator_results with no user filter and no pagination. These grow unboundedly with every new user.

**Implementation**:

1. Add user ID filters (only fetch for the challengers displayed on the page).
2. If listing all challengers, use server-side pagination.
3. Add `meta: { select: "..." }` to limit columns.
4. Consider an RPC that returns aggregated stats per challenger.

**Files**: `app/admin/challengers/page.tsx`

---

### Task 3.6: Fix challenge dashboard page — bypasses React Query cache — DONE

**Problem**: `app/dashboard/challenge/page.tsx:81-136` uses raw Supabase client calls (`supabase.from(...).select("*")`) instead of Refine hooks. Bypasses React Query caching entirely and re-fetches on every mount.

**Implementation**: Replace raw Supabase calls with `useList`:

```typescript
const progressQuery = useList({
  resource: "challenge_progress",
  filters: [
    { field: "user_id", operator: "eq", value: userId || "" },
    { field: "plan_cycle", operator: "eq", value: selectedCycle || 0 },
  ],
  sorters: [{ field: "day_number", order: "asc" }],
  pagination: { mode: "off" },
  meta: {
    select:
      "day_number, logged_date, steps, water_liters, floors_climbed, protein_grams, sleep_hours, feeling, tomorrow_focus, points_earned",
  },
  queryOptions: { enabled: !!userId && !!selectedCycle },
});
```

**Files**: `app/dashboard/challenge/page.tsx`

---

### Task 3.7: Parallelize gamification hook queries — DONE

**Problem**: `hooks/use-gamification.ts:240-320` has sequential queries: get user → fetch profile → fetch challenge data. Each step waits for the previous.

**Implementation**:

1. Use `useAuth()` from Task 1.3 to get `userId` immediately.
2. Fetch profile and challenge data in parallel using `useList` hooks with `enabled: !!userId`.
3. Remove the nested `.then()` chain and the independent `onAuthStateChange` listener.

**Files**: `hooks/use-gamification.ts`

---

### Task 3.8: Reduce DeactivationGuard polling frequency — DONE

**Problem**: `hooks/use-deactivation-guard.ts` polls `getUser()` + `profiles` query every 30 seconds on every dashboard page. That's 2 network requests every 30 seconds per active user.

**Implementation**:

1. Remove the `getUser()` call (use `useAuth()` from Task 1.3).
2. Increase poll interval from 30s to 120s (or 300s).
3. Or replace with Supabase Realtime subscription on the `profiles` table for the `is_deactivated` column — zero polling, instant deactivation detection.

**Files**: `hooks/use-deactivation-guard.ts`

---

### Task 3.9: Add database indexes — DONE

**Problem**: Common query patterns may not have proper indexes.

**Implementation**: Create a migration to add indexes if missing:

```sql
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_cycle ON challenge_progress(user_id, plan_cycle);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_date ON challenge_progress(challenge_date);
CREATE INDEX IF NOT EXISTS idx_check_ins_client_id ON check_ins(client_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_reviewed_at ON check_ins(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_day ON diet_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_workout_plans_client_day ON workout_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_supplement_plans_client_day ON supplement_plans(client_id, day_number);
CREATE INDEX IF NOT EXISTS idx_lifestyle_plans_client_day ON lifestyle_activity_plans(client_id, day_number);
```

Migration naming: `YYYYMMDD_HHMMSS_add_performance_indexes.sql` in `supabase/migrations/`.

**Files**: New migration file.

---

## Phase 4: Rendering Optimization

**Goal**: Eliminate unnecessary re-renders. Make interactions feel snappy.
**Priority**: P3
**Sessions**: 3-4

---

### Task 4.1: Split PlanCycleContext into data + loading contexts — DONE

**Problem**: `contexts/plan-cycle-context.tsx` wraps the entire dashboard. The context value includes `isLoading` which changes frequently. Every loading state toggle re-renders ALL consumers.

**Implementation**:

Split into two contexts:

```typescript
// PlanCycleDataContext — rarely changes
{
  (userId,
    currentCycle,
    selectedCycle,
    isViewingHistory,
    cycleDetails,
    currentCycleProfile,
    setSelectedCycle);
}

// PlanCycleLoadingContext — changes frequently
{
  isLoading;
}
```

Components that only need data use `usePlanCycleData()`. Only skeleton/spinner components use `usePlanCycleLoading()`.

**Files**: `contexts/plan-cycle-context.tsx`, all consumers of `usePlanCycle()`

---

### Task 4.2: Add React.memo to list item components — DONE

**Problem**: Zero `React.memo` across 253 TSX components. Timeline lists render 30+ items — when parent state changes, ALL items re-render.

**Implementation**: Add `React.memo` to:

1. Timeline item cards (components rendered inside `.map()` in `client-timeline-view.tsx` and `mobile-timeline-view.tsx`)
2. Calendar day buttons in `components/landing/modals/challenge-hub/calendar-tab.tsx` (30+ elements per render)
3. Table row components in admin pages

**Files**: Components in `components/dashboard/`, `components/landing/modals/challenge-hub/`

---

### Task 4.3: Memoize heavy array operations in timeline views — DONE

**Problem**:

- `components/dashboard/mobile-timeline-view.tsx`: `filteredItems`, `groupItemsByPeriod()`, and stats recalculated on every render
- `components/dashboard/client-timeline-view.tsx`: Multiple `useMemo` hooks with large dependency arrays

**Implementation**:

1. **MobileTimelineView**: Wrap `filteredItems`, `groupItemsByPeriod()`, and stats in `useMemo` with proper deps.
2. **ClientTimelineView**: Audit `useMemo` dependency arrays — ensure dependencies are referentially stable.
3. **Calendar tab**: Memoize `Array.from({ length: totalDays })` and `getDateForDay()` results.

**Files**: `components/dashboard/mobile-timeline-view.tsx`, `components/dashboard/client-timeline-view.tsx`, `components/landing/modals/challenge-hub/calendar-tab.tsx`

---

### Task 4.4: Fix ModalContext re-renders — DONE

**Problem**: `contexts/modal-context.tsx` — every modal state change re-renders ALL consumers. Opening/closing any of ~15 modal types re-renders the entire public site tree.

**Implementation**: Split into actions + state contexts:

```typescript
// ModalActionsContext: { openModal, closeModal } — stable, never changes
// ModalStateContext: { activeModal, modalData } — changes on open/close
```

Components that only open/close modals use `useModalActions()` (never re-render).
Only the modal rendering component uses `useModalState()`.

**Files**: `contexts/modal-context.tsx`, all modal trigger components

---

### Task 4.5: Add useCallback to event handlers and debounce inputs — DONE

**Problem**:

- Event handlers recreated on every render, causing child re-renders
- `components/dashboard/food-log-form.tsx` recalculates on every keystroke with no debounce
- Day navigation triggers immediate fetch with no debounce

**Implementation**:

1. Add `useCallback` to event handlers in timeline components passed as props to children.
2. Add debounce (300ms) to food log form quantity input.
3. Add debounce (200ms) to day navigation in timeline views.

**Files**: `components/dashboard/food-log-form.tsx`, timeline view components

---

## Phase 5: Bundle Size & SSR

**Goal**: Reduce initial load time by 1-2 seconds. Shrink client bundle by 30-40%.
**Priority**: P3
**Sessions**: 2-3

---

### Task 5.1: Install and run bundle analyzer — DONE

**Problem**: No visibility into actual bundle composition.

**Implementation**:

1. Install: `npm install --save-dev @next/bundle-analyzer`
2. Add to `next.config.ts`:
   ```typescript
   import withBundleAnalyzer from "@next/bundle-analyzer";
   const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
   ```
3. Run: `ANALYZE=true npm run build`
4. Add `optimizePackageImports` for `lucide-react` in `next.config.ts`.

**Files**: `next.config.ts`, `package.json`

---

### Task 5.2: Dynamic import heavy libraries — DONE

**Problem**:

- Recharts (~7.3MB) loaded statically in `components/admin/progress-charts.tsx` — only used on one admin page
- `html-to-image` (~500KB) loaded statically in `components/landing/modals/results-modal.tsx` — only used when user clicks screenshot

**Implementation**:

1. **Recharts**: Wrap with `next/dynamic`:

   ```typescript
   const ProgressCharts = dynamic(() => import("@/components/admin/progress-charts"), {
     loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
   });
   ```

2. **html-to-image**: Dynamic import at call site:
   ```typescript
   const handleScreenshot = async () => {
     const { toPng } = await import("html-to-image");
     // ...
   };
   ```

**Files**: `components/admin/progress-charts.tsx`, `components/landing/modals/results-modal.tsx`

---

### Task 5.3: Lazy-load third-party analytics — DONE

**Problem**: PostHog and Facebook Pixel loaded in root layout, blocking TTI.

**Implementation**:

1. **Facebook Pixel** (`components/providers/facebook-pixel-provider.tsx`): Change `strategy="afterInteractive"` to `strategy="lazyOnload"`.

2. **PostHog** (`components/providers/posthog-provider.tsx`): Wrap `posthog.init()` in `requestIdleCallback`:
   ```typescript
   const init = () => { posthog.init(...); };
   if ("requestIdleCallback" in window) {
     requestIdleCallback(init);
   } else {
     setTimeout(init, 1);
   }
   ```

**Files**: `components/providers/facebook-pixel-provider.tsx`, `components/providers/posthog-provider.tsx`

---

### Task 5.4: Convert simple pages to Server Components — DONE

**Problem**: 53 out of 72 page files have `"use client"`. Many are simple wrappers.

**Implementation**: For any page that just imports and renders a single client component, remove `"use client"`:

```typescript
// Before:
"use client";
import { DashboardView } from "@/components/dashboard/dashboard-view";
export default function Page() { return <DashboardView />; }

// After:
import { DashboardView } from "@/components/dashboard/dashboard-view";
export default function Page() { return <DashboardView />; }
```

Do NOT convert pages that use hooks. Target: reduce from 74% client pages to ~40%.

**Files**: Audit all `app/**/page.tsx` files.

---

### Task 5.5: Optimize images — DONE

**Problem**: 14 transformation images total ~2.1MB. All JPG, no WebP.

**Implementation**:

1. Convert to WebP: `cwebp -q 80 file.jpg -o file.webp`
2. Update `components/landing/before-after-carousel.tsx`.
3. Ensure all `<Image>` components have proper `width`, `height`, and `sizes`.
4. Consider `placeholder="blur"` for above-the-fold images.

**Expected savings**: ~1.5MB (70% reduction).

**Files**: `public/images/transformations/`, `components/landing/before-after-carousel.tsx`

---

### Task 5.6: Improve the `ssr: false` wrapper experience — DONE

**Problem**: `components/client-refine-wrapper.tsx` uses `dynamic(..., { ssr: false })` on the ENTIRE app. Users see plain "Loading..." text on every initial page load while the Refine JS chunk downloads and parses.

**Implementation** (pick one):

**Option A (safest)**: Keep `ssr: false` but improve the loading state:

- Replace "Loading..." text with a proper skeleton matching the page layout.
- Add smooth fade-in transition.

**Option B (better)**: Wrap only the data-dependent content area in `ssr: false`:

- Root layout renders server-side (static shell, nav).
- Only the content area uses the client wrapper.
- Requires restructuring `<Refine>` placement.

**Option C (best, most effort)**: Fix Refine's SSR compatibility:

- Wrap `useSearchParams` usage in Suspense boundaries.
- May require upgrading Refine or using a different router binding.

**Recommendation**: Start with Option A, try Option B if time permits.

**Files**: `components/client-refine-wrapper.tsx`, `app/layout.tsx`

---

## Appendix A: Complete Auth Call Inventory

Every place in the codebase that calls `supabase.auth.getUser()` or `supabase.auth.getSession()`:

| #   | Location                           | Call Type                                 | File:Line                               | Fixed By Task                            |
| --- | ---------------------------------- | ----------------------------------------- | --------------------------------------- | ---------------------------------------- |
| 1   | Middleware                         | `getUser()` server-side                   | `middleware.ts:58`                      | Keep (required for cookie refresh)       |
| 2   | Middleware role fetch              | `profiles.select()`                       | `middleware.ts:98-102`                  | Already cached (5-min cookie)            |
| 3   | AuthProvider initial               | `getUser()` client-side                   | `auth-context.tsx:38`                   | Task 0.1 (add error handling)            |
| 4   | AuthProvider profile               | `profiles.select()`                       | `auth-context.tsx:42-46`                | Task 1.4 (expand to include plan fields) |
| 5   | AuthProvider onAuthStateChange     | `profiles.select()` duplicate             | `auth-context.tsx:73-77`                | Task 1.3 (skip on TOKEN_REFRESHED)       |
| 6   | Refine authProvider.check          | `getSession()`                            | `lib/refine.tsx:143`                    | Task 1.2                                 |
| 7   | Refine authProvider.getPermissions | `getUser()` + `profiles.select()`         | `lib/refine.tsx:158-171`                | Task 1.2                                 |
| 8   | Refine authProvider.getIdentity    | `getUser()` + `profiles.select("*")`      | `lib/refine.tsx:177-190`                | Task 1.2                                 |
| 9   | useDeactivationGuard               | `getUser()` every 30s                     | `hooks/use-deactivation-guard.ts:23`    | Task 1.3, 3.8                            |
| 10  | useGamification                    | `getUser()` + profile + challenge queries | `hooks/use-gamification.ts:251-252`     | Task 1.3, 3.7                            |
| 11  | useProfileCompletion               | `getUser()` + multiple queries            | `hooks/use-profile-completion.ts`       | Task 1.3                                 |
| 12  | Profile page                       | `getUser()`                               | `app/dashboard/profile/page.tsx:26-27`  | Task 1.3                                 |
| 13  | PlanCycleProvider                  | `useList("profiles")` via Refine          | `contexts/plan-cycle-context.tsx:43-47` | Task 1.4                                 |

---

## Appendix B: Complete List of Unbounded Queries

Every `pagination: { mode: "off" }` in the codebase (52+ instances). Key offenders:

| File                                             | Resource                                                 | Lines     | Growth Rate             | Fix Task |
| ------------------------------------------------ | -------------------------------------------------------- | --------- | ----------------------- | -------- |
| `app/admin/page.tsx`                             | profiles (clients)                                       | ~22       | O(clients)              | 3.1      |
| `app/admin/page.tsx`                             | check_ins                                                | ~32       | O(check_ins)            | 3.1      |
| `app/admin/clients/page.tsx`                     | profiles (clients)                                       | ~51       | O(clients)              | 3.2      |
| `app/admin/clients/page.tsx`                     | check_ins                                                | ~61       | O(check_ins)            | 3.2      |
| `app/admin/challengers/page.tsx`                 | challenge_progress                                       | ~54       | O(users \* days)        | 3.5      |
| `app/admin/challengers/page.tsx`                 | assessment_results                                       | ~63       | O(users)                | 3.5      |
| `app/admin/challengers/page.tsx`                 | calculator_results                                       | ~72       | O(users)                | 3.5      |
| `components/admin/todays-challenge-activity.tsx` | challenge_progress                                       | ~33       | O(users \* days)        | 3.3      |
| `hooks/use-timeline-data.ts`                     | diet_plans, supplements, workouts, lifestyle, conditions | 5 queries | O(plans per client)     | 3.4      |
| `hooks/use-daily-plan-data.ts`                   | 5 plan types                                             | 5 queries | Small (filtered by day) | 3.4      |
| `hooks/use-client-timeline.ts`                   | plan_completions                                         | ~319      | O(completions)          | 3.4      |
| `app/admin/clients/[id]/plans/page.tsx`          | 4 plan types                                             | ~170-201  | O(plans per client)     | 3.4      |

---

## Appendix C: Skeleton Components Without Timeouts

Every skeleton/loading component in the codebase. **None** have timeouts or error fallbacks:

| Component                   | File                                             | Type              |
| --------------------------- | ------------------------------------------------ | ----------------- |
| Root loading                | `app/loading.tsx`                                | Spinner           |
| Admin loading               | `app/admin/loading.tsx`                          | Spinner           |
| Dashboard loading           | `app/dashboard/loading.tsx`                      | Spinner           |
| Clients loading             | `app/admin/clients/loading.tsx`                  | Spinner           |
| Checkin loading             | `app/dashboard/checkin/loading.tsx`              | Spinner           |
| StatsCards skeleton         | `components/admin/stats-cards.tsx`               | `animate-pulse`   |
| ClientTable skeleton        | `components/admin/client-table.tsx`              | `animate-pulse`   |
| TodaysChallengeActivity     | `components/admin/todays-challenge-activity.tsx` | `animate-pulse`   |
| ClientTimelineView skeleton | `components/dashboard/client-timeline-view.tsx`  | `animate-pulse`   |
| ClientTimelineView SSR      | `components/dashboard/client-timeline-view.tsx`  | `animate-pulse`   |
| ClientRefineWrapper         | `components/client-refine-wrapper.tsx`           | "Loading..." text |
| Challenge page skeleton     | `app/dashboard/challenge/page.tsx`               | `animate-pulse`   |
| CheckIn page skeleton       | `app/dashboard/checkin/page.tsx`                 | `animate-pulse`   |
| Profile page skeleton       | `app/dashboard/profile/page.tsx`                 | `animate-pulse`   |
| NotificationsDropdown       | `components/layout/notifications-dropdown.tsx`   | `animate-pulse`   |

---

## Verification Checklist

After each phase, verify:

- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] Manual smoke test: login → dashboard → navigate pages → admin portal
- [ ] Check Network tab: count API calls on dashboard load
  - After Phase 0: Auth calls still redundant, but none hang
  - After Phase 1: Target <5 auth-related calls per page load
  - After Phase 3: Target <10 total API calls per page load
- [ ] Logout test: click logout 5 times in a row on both desktop and mobile — should always redirect
- [ ] Error test: with DevTools → Network → block Supabase URL → verify error UI appears (not stuck loading)
- [ ] Check Performance tab: measure TTI (target: <3s after Phase 5)

---

## How to Use This Document

Each task is self-contained with file paths, line numbers, and implementation details. To work on a task:

1. Tell Claude: "Read `docs/STABILITY_AND_PERFORMANCE_PLAN.md` and implement Task X.Y"
2. After completing tasks in a phase, run the verification checklist
3. Mark completed tasks by adding `DONE` to the heading: `### Task X.Y: ... — DONE`
4. Phases are ordered by priority — complete Phase 0 before moving to Phase 1, etc.
5. Within a phase, tasks can generally be done in any order unless noted otherwise
