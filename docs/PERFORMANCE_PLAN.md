# Performance Optimization Plan

**Created**: 2026-02-14
**Status**: Not started
**Estimated total effort**: 10-14 sessions across 4 phases

---

## Problem Statement

Both the admin portal and client portal feel sluggish. A comprehensive audit identified 4 systemic root causes:

1. **Redundant auth calls** on every navigation (middleware + 3 layout components)
2. **Unbounded data fetching** — 52+ queries with `pagination: { mode: "off" }`, no React Query caching
3. **No memoization** — zero `React.memo` across 253 components, heavy array ops on every render
4. **No SSR** — 74% of pages are client components, Refine wrapper uses `ssr: false`

---

## Phase 1: Quick Wins (Auth + Caching Defaults)

**Goal**: Eliminate redundant network requests. Estimated 50-60% of perceived sluggishness.
**Sessions**: 2-3

### Task 1.1: Create shared auth context

**Problem**: Sidebar (`components/layout/sidebar.tsx:47-62`), Header (`components/layout/header.tsx:20-37`), and MobileNav (`components/layout/mobile-nav.tsx:59-76`) each independently call `supabase.auth.getUser()` + fetch the profile on mount. That's 3-4 duplicate auth+profile round trips per page load.

**Implementation**:

1. Create `contexts/auth-context.tsx`:
   - Single `useEffect` that calls `supabase.auth.getUser()` once
   - Fetches profile (avatar_url, full_name, role) once
   - Subscribes to `onAuthStateChange` for session updates
   - Exposes `{ user, profile, isLoading, signOut }` via context
   - Memoize context value properly

2. Create `hooks/use-auth.ts`:
   - Thin wrapper: `useContext(AuthContext)` with error if missing

3. Add `<AuthProvider>` to `app/dashboard/layout.tsx` (wraps dashboard tree)
4. Add `<AuthProvider>` to `app/admin/layout.tsx` (wraps admin tree)

5. Refactor consumers:
   - `components/layout/sidebar.tsx` — remove lines 42-63, use `useAuth()` for avatarUrl/userName
   - `components/layout/header.tsx` — remove lines 15-38, use `useAuth()` for avatarUrl/userId
   - `components/layout/mobile-nav.tsx` — remove lines 55-76, use `useAuth()`
   - `components/admin/admin-sidebar.tsx` — use `useAuth()` instead of direct Supabase call
   - `contexts/plan-cycle-context.tsx:42-48` — use `useAuth()` for userId instead of own getUser() call

**Result**: 3-4 auth+profile API calls per page load reduced to 1.

---

### Task 1.2: Add global React Query defaults

**Problem**: No `staleTime` or `cacheTime` configured anywhere. Every component mount triggers a fresh fetch. Only 4 files in the entire app set staleTime. Window focus triggers unnecessary refetches.

**Implementation**:

1. Edit `providers/refine-provider.tsx`:

   ```typescript
   import { QueryClient } from "@tanstack/react-query";

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 2 * 60 * 1000, // 2 minutes
         gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
         refetchOnWindowFocus: false,
         retry: 1,
       },
     },
   });
   ```

2. Pass `queryClient` to `<Refine>` via the `options` prop or wrap with `<QueryClientProvider>`.
   - Check the Refine docs — the `options.reactQuery` config may accept a `clientConfig`
   - If not, create QueryClient and pass to `<QueryClientProvider>` wrapping `<Refine>`

3. Verify existing `staleTime` overrides in these 4 files still work:
   - `hooks/use-meal-types.ts:28` (5 min)
   - `hooks/use-calculator-settings.ts:143` (10 min)
   - `hooks/use-medical-conditions.ts:32` (5 min)
   - `components/admin/food-alternatives-selector.tsx:36` (5 min)

**Result**: Eliminates thousands of redundant refetches across the app.

---

### Task 1.3: Optimize middleware auth

**Problem**: `middleware.ts:55-89` calls `supabase.auth.getUser()` (network request) on EVERY navigation. For /dashboard and /admin routes, it makes a SECOND database query to fetch profile role. This adds 300-800ms to every page transition.

**Implementation**:

1. The `getUser()` call on line 56-58 is required by Supabase to refresh the session cookie — this stays.

2. Cache the role check. Options (pick one):
   - **Option A (recommended)**: Store role in a signed cookie after first profile fetch. On subsequent requests, read from cookie. Invalidate on sign-out or after 5 minutes.
     ```typescript
     // After fetching profile, set a short-lived cookie:
     supabaseResponse.cookies.set("user_role", role, {
       httpOnly: true,
       secure: true,
       sameSite: "lax",
       maxAge: 300, // 5 minutes
     });
     // On next request, check cookie first:
     const cachedRole = request.cookies.get("user_role")?.value;
     if (cachedRole) {
       /* use it, skip DB query */
     }
     ```
   - **Option B**: Encode role in the JWT custom claims via Supabase auth hook (requires Supabase config change + database function)

3. Clear the role cookie on sign-out (add to sign-out handler in auth context)

**Result**: Profile DB query eliminated for most navigations. Only runs on first visit or after cookie expires.

---

### Task 1.4: Add loading.tsx files for major routes

**Problem**: No `loading.tsx` exists for `/dashboard` or `/admin` routes. During navigation, users see nothing — the app appears frozen.

**Implementation**:

1. Create `app/dashboard/loading.tsx`:

   ```typescript
   export default function DashboardLoading() {
     return (
       <div className="flex min-h-[50vh] items-center justify-center">
         <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
       </div>
     );
   }
   ```

2. Create `app/admin/loading.tsx` — same pattern
3. Create `app/admin/clients/loading.tsx` — same pattern (this page is data-heavy)
4. Create `app/dashboard/checkin/loading.tsx` — same pattern

**Result**: Instant visual feedback during navigation.

---

### Task 1.5: Lazy-load third-party analytics

**Problem**: PostHog and Facebook Pixel are loaded in the root layout (`app/layout.tsx:107-108`), wrapping the entire app. Facebook Pixel uses `strategy="afterInteractive"` which delays TTI.

**Implementation**:

1. **Facebook Pixel** (`components/providers/facebook-pixel-provider.tsx:39`):
   - Change `strategy="afterInteractive"` to `strategy="lazyOnload"`

2. **PostHog** (`components/providers/posthog-provider.tsx:8-33`):
   - Wrap the `posthog.init()` call in a `requestIdleCallback` or `setTimeout(..., 0)` so it doesn't block the main thread during hydration:
     ```typescript
     useEffect(() => {
       if (
         typeof window === "undefined" ||
         !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
         posthog.__loaded
       )
         return;
       const init = () => {
         posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
           /* existing config */
         });
       };
       if ("requestIdleCallback" in window) {
         requestIdleCallback(init);
       } else {
         setTimeout(init, 1);
       }
     }, []);
     ```

**Result**: Faster TTI, analytics load without blocking rendering.

---

## Phase 2: Data Fetching Fixes

**Goal**: Stop fetching entire database tables. Add pagination, column selection, and date filters.
**Sessions**: 3-4

### Task 2.1: Fix admin dashboard unbounded queries

**Problem**: `app/admin/page.tsx` fetches ALL clients and ALL check-ins with `pagination: { mode: "off" }`. Then filters in JavaScript (lines 49-66).

**Implementation**:

1. **Clients query** (lines 30-36):
   - Change to `pagination: { mode: "server", current: 1, pageSize: 50 }` or keep `mode: "off"` but add `meta: { select: "id, full_name, avatar_url, role, plan_start_date" }` to reduce payload
   - If the dashboard truly needs all clients for stats, consider a Supabase RPC function that returns aggregated counts

2. **Check-ins query** (lines 40-46):
   - Add date filter: only fetch last 7 days of check-ins
   - Add `meta: { select: "id, client_id, submitted_at, reviewed_at" }` — only fields needed for dashboard stats

3. Move JavaScript filtering (lines 49-66) to Supabase filters where possible

**Files**: `app/admin/page.tsx`

---

### Task 2.2: Fix clients list page pagination

**Problem**: `app/admin/clients/page.tsx:54-73` fetches ALL clients and ALL check-ins with no pagination. This is an O(n) growth problem.

**Implementation**:

1. Convert to proper server-side pagination:
   - Clients: `pagination: { mode: "server", current: page, pageSize: 25 }`
   - Add a search/filter UI that uses Refine's `filters` param
   - Check-ins: filter to only the currently visible clients' IDs, or fetch counts via RPC

2. Add `meta: { select: "..." }` to limit columns returned

**Files**: `app/admin/clients/page.tsx`

---

### Task 2.3: Fix TodaysChallengeActivity component

**Problem**: `components/admin/todays-challenge-activity.tsx:31-37` fetches ALL `challenge_progress` for ALL clients across ALL days, then groups in JavaScript (lines 62-93). This grows as clients \* days.

**Implementation**:

1. Add date filter — only fetch today's entries:

   ```typescript
   filters: [
     { field: "challenge_date", operator: "eq", value: new Date().toISOString().split("T")[0] },
   ],
   ```

2. Or better: create a Supabase view/RPC that returns today's aggregated challenge stats:

   ```sql
   -- View: today_challenge_summary
   SELECT user_id, COUNT(*) as completed_tasks, SUM(points) as total_points
   FROM challenge_progress
   WHERE challenge_date = CURRENT_DATE
   GROUP BY user_id;
   ```

3. Remove client-side grouping logic (lines 62-93)

**Files**: `components/admin/todays-challenge-activity.tsx`

---

### Task 2.4: Fix timeline data hooks — pagination and column selection

**Problem**: Multiple hooks fetch entire tables with `pagination: { mode: "off" }`:

- `hooks/use-timeline-data.ts` — 5 queries (diet, supplement, workout, lifestyle, conditions) all unbounded
- `hooks/use-daily-plan-data.ts` — 5 queries all unbounded
- `hooks/use-client-timeline.ts` — completions query unbounded

**Implementation**:

1. **`hooks/use-timeline-data.ts`** (lines 620-696):
   - All 5 queries already filter by `client_id` which is good
   - Add `meta: { select: "..." }` to each query — only fetch columns used in the timeline UI
   - For diet/supplement/workout/lifestyle plans, consider adding a day_number range filter based on the current view (e.g., current week +/- 7 days)

2. **`hooks/use-daily-plan-data.ts`** (lines 198-274):
   - These queries filter by `client_id` AND `day_number` which is already efficient
   - But `pagination: { mode: "off" }` is unnecessary when filtering by specific day — change to `pageSize: 100` as a safety limit

3. **`hooks/use-client-timeline.ts`** (lines 329-340):
   - Plan completions: add `pageSize: 100` safety limit

4. Add `enabled: false` to queries that don't need to run immediately (e.g., historical cycles)

**Files**: `hooks/use-timeline-data.ts`, `hooks/use-daily-plan-data.ts`, `hooks/use-client-timeline.ts`

---

### Task 2.5: Fix challenge dashboard page (bypasses cache)

**Problem**: `app/dashboard/challenge/page.tsx:84-136` uses raw Supabase client calls (`supabase.from(...).select("*")`) instead of Refine hooks. This bypasses React Query caching entirely and re-fetches on every mount.

**Implementation**:

1. Replace raw Supabase calls with `useList` from Refine:

   ```typescript
   const { data } = useList({
     resource: "challenge_progress",
     filters: [
       { field: "user_id", operator: "eq", value: userId },
       { field: "plan_cycle", operator: "eq", value: currentCycle },
     ],
     pagination: { mode: "off" },
     meta: {
       select:
         "day_number, water_completed, steps_completed, sleep_completed, workout_completed, points, challenge_date",
     },
   });
   ```

2. This gets automatic caching from the React Query defaults set in Task 1.2

**Files**: `app/dashboard/challenge/page.tsx`

---

### Task 2.6: Parallelize waterfall queries in gamification hook

**Problem**: `hooks/use-gamification.ts:203-283` has sequential queries in a useEffect: get user -> fetch profile -> fetch challenge data. Each step waits for the previous.

**Implementation**:

1. Use the auth context from Task 1.1 to get `userId` immediately (no getUser() call needed)
2. Fetch profile and challenge data in parallel using `useList` hooks with `enabled: !!userId`
3. Remove the nested `.then()` chain and replace with declarative Refine hooks

**Files**: `hooks/use-gamification.ts`

---

### Task 2.7: Add database indexes (verify and create)

**Problem**: Common query patterns may not have proper indexes.

**Implementation**:

1. Create a migration to add indexes if missing:

   ```sql
   -- Verify these exist, create if not:
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

2. Follow existing migration naming: `YYYYMMDD_HHMMSS_add_performance_indexes.sql`

**Files**: New migration in `supabase/migrations/`

---

## Phase 3: Rendering Optimization

**Goal**: Eliminate unnecessary re-renders. Make interactions (tab switching, day navigation, modals) feel snappy.
**Sessions**: 3-4

### Task 3.1: Split PlanCycleContext into data + loading contexts

**Problem**: `contexts/plan-cycle-context.tsx` wraps the entire dashboard. The context value includes `isLoading` (line 111) which changes frequently. Every loading state toggle re-renders ALL consumers.

**Implementation**:

1. Split into two contexts:

   ```typescript
   // PlanCycleDataContext — rarely changes (only when user/cycle changes)
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

2. Components that only need data (most of them) use `usePlanCycleData()`
3. Components that need loading state use `usePlanCycleLoading()` — only the skeleton/spinner components

**Files**: `contexts/plan-cycle-context.tsx`, all consumers of `usePlanCycle()`

---

### Task 3.2: Add React.memo to list item components

**Problem**: Zero `React.memo` usage across 253 TSX components. Timeline lists render 30+ items — when parent state changes, ALL items re-render even if their props haven't changed.

**Implementation**:

Add `React.memo` to these high-impact components:

1. Timeline item cards (whatever component renders individual items in the timeline lists):
   - Search for components rendered inside `.map()` calls in `client-timeline-view.tsx` and `mobile-timeline-view.tsx`
   - Wrap with `React.memo`

2. Calendar day buttons in `components/landing/modals/challenge-hub/calendar-tab.tsx`:
   - Extract day button into a memoized component
   - Currently creates 30+ elements every render (line 35-36)

3. Any table row components in admin pages

**Pattern**:

```typescript
const TimelineItemCard = React.memo(function TimelineItemCard(props: Props) {
  // ... existing component body
});
```

**Files**: Components in `components/dashboard/`, `components/landing/modals/challenge-hub/`

---

### Task 3.3: Memoize heavy array operations in timeline views

**Problem**:

- `components/dashboard/mobile-timeline-view.tsx:494-537`: `filteredItems`, `groupItemsByPeriod()`, and stats recalculated on every render
- `components/dashboard/client-timeline-view.tsx:207-263`: Multiple `useMemo` hooks with large dependency arrays that change too often

**Implementation**:

1. **MobileTimelineView**:
   - Wrap `filteredItems` in `useMemo` with proper deps
   - Wrap `groupItemsByPeriod()` call in `useMemo`
   - Wrap stats calculations in `useMemo`

2. **ClientTimelineView**:
   - Audit the `useMemo` dependency arrays — are dependencies referentially stable?
   - If `planProgress` is a new object on every render, memoize it upstream
   - Consider using `useRef` + comparison for expensive calculations

3. **Calendar tab** (`calendar-tab.tsx:35-36`):
   - Memoize the `Array.from({ length: totalDays })` array
   - Memoize `getDateForDay()` results

**Files**: `components/dashboard/mobile-timeline-view.tsx`, `components/dashboard/client-timeline-view.tsx`, `components/landing/modals/challenge-hub/calendar-tab.tsx`

---

### Task 3.4: Fix ModalContext re-renders

**Problem**: `contexts/modal-context.tsx:47-52` — every modal state change re-renders ALL consumers. Opening/closing any of ~15 modal types causes the entire public site tree to re-render.

**Implementation**:

1. Use a stable callback pattern:

   ```typescript
   // Instead of putting activeModal in the context value,
   // use a ref + subscription pattern, or split into:
   // - ModalActionsContext: { openModal, closeModal } (stable, never changes)
   // - ModalStateContext: { activeModal, modalData } (changes on open/close)
   ```

2. Components that only need to open/close modals (buttons, CTAs) use `useModalActions()` — never re-render
3. Only the modal rendering component uses `useModalState()` — re-renders when modal changes

**Files**: `contexts/modal-context.tsx`, all modal trigger components

---

### Task 3.5: Add useCallback to event handlers and debounce inputs

**Problem**:

- Event handlers recreated on every render, causing child re-renders
- `components/dashboard/food-log-form.tsx:97-103` recalculates on every keystroke with no debounce
- Day navigation triggers immediate fetch with no debounce

**Implementation**:

1. Add `useCallback` to event handlers in timeline components that are passed as props to child components
2. Add debounce (300ms) to food log form quantity input
3. Add debounce (200ms) to day navigation in timeline views

**Files**: `components/dashboard/food-log-form.tsx`, timeline view components

---

### Task 3.6: Stabilize Supabase client creation

**Problem**: Multiple components create their own Supabase client via `useMemo(() => createBrowserSupabaseClient(), [])`. While `useMemo` prevents recreation within a component, having multiple instances means multiple auth state subscriptions.

**Implementation**:

1. This is mostly solved by Task 1.1 (shared auth context)
2. For remaining direct Supabase usage outside auth (e.g., storage uploads), create a shared client:
   ```typescript
   // lib/auth.ts — add a singleton browser client
   let browserClient: SupabaseClient | null = null;
   export function getBrowserSupabaseClient() {
     if (!browserClient) {
       browserClient = createBrowserSupabaseClient();
     }
     return browserClient;
   }
   ```
3. Replace all `useMemo(() => createBrowserSupabaseClient(), [])` with `getBrowserSupabaseClient()`

**Files**: `lib/auth.ts`, all components with `createBrowserSupabaseClient()` in useMemo

---

## Phase 4: Bundle Size & SSR

**Goal**: Reduce initial load time by 1-2 seconds. Shrink client bundle by 30-40%.
**Sessions**: 2-3

### Task 4.1: Install and run bundle analyzer

**Problem**: No visibility into actual bundle composition. Can't make data-driven decisions about what to optimize.

**Implementation**:

1. Install: `npm install --save-dev @next/bundle-analyzer`
2. Add to `next.config.ts`:
   ```typescript
   import withBundleAnalyzer from "@next/bundle-analyzer";
   const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
   // Wrap the export
   ```
3. Run: `ANALYZE=true npm run build`
4. Document findings — identify the actual largest chunks
5. Add `optimizePackageImports` to next.config.ts:
   ```typescript
   experimental: {
     optimizePackageImports: ['lucide-react'],
   },
   ```

**Files**: `next.config.ts`, `package.json` (devDependencies)

---

### Task 4.2: Dynamic import heavy libraries

**Problem**:

- Recharts (7.3MB) loaded statically in `components/admin/progress-charts.tsx` — only used on one admin page
- `html-to-image` (500KB) loaded statically in `components/landing/modals/results-modal.tsx:43` — only used when user clicks screenshot

**Implementation**:

1. **Recharts**: Wrap the chart component with `next/dynamic`:

   ```typescript
   const ProgressCharts = dynamic(() => import("@/components/admin/progress-charts"), {
     loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
   });
   ```

2. **html-to-image**: Dynamic import at call site:
   ```typescript
   // Instead of: import { toPng } from "html-to-image";
   // At call site:
   const handleScreenshot = async () => {
     const { toPng } = await import("html-to-image");
     const dataUrl = await toPng(elementRef.current);
     // ...
   };
   ```

**Files**: `components/admin/progress-charts.tsx`, `components/landing/modals/results-modal.tsx`

---

### Task 4.3: Convert simple pages to Server Components

**Problem**: 53 out of 72 page files have `"use client"`. Many are simple wrapper pages that don't need client-side interactivity.

**Implementation** (start with lowest-risk pages):

1. **`app/dashboard/page.tsx`** (16 lines) — likely just renders a client component. Remove `"use client"`, keep the child component as client.

2. **Simple wrapper pages** — any page that just imports and renders a single client component can become a server component:

   ```typescript
   // Before (client component):
   "use client";
   import { DashboardView } from "@/components/dashboard/dashboard-view";
   export default function Page() { return <DashboardView />; }

   // After (server component):
   import { DashboardView } from "@/components/dashboard/dashboard-view";
   export default function Page() { return <DashboardView />; }
   ```

3. Do NOT convert pages that use hooks (useSearchParams, usePathname, useState, etc.) — those must remain client components

4. Target: reduce from 74% client pages to ~40%

**Files**: Audit all `app/**/page.tsx` files — convert where safe

---

### Task 4.4: Optimize images

**Problem**: 14 transformation images in `public/images/transformations/` total 2.1MB. Largest is 248KB. All JPG, no WebP.

**Implementation**:

1. Convert all transformation images to WebP format:

   ```bash
   # Using cwebp or sharp
   for f in public/images/transformations/*.jpg; do
     cwebp -q 80 "$f" -o "${f%.jpg}.webp"
   done
   ```

2. Update `components/landing/before-after-carousel.tsx` to reference `.webp` files

3. Ensure all `<Image>` components have proper `width`, `height`, and `sizes` attributes for responsive loading

4. Consider using `placeholder="blur"` with `blurDataURL` for above-the-fold images

**Expected savings**: ~1.5MB (70% reduction)

**Files**: `public/images/transformations/`, `components/landing/before-after-carousel.tsx`

---

### Task 4.5: Address Refine SSR wrapper

**Problem**: `components/client-refine-wrapper.tsx` uses `ssr: false` on the dynamic import, which disables SSR for the ENTIRE app. Users see "Loading..." on every page load.

**Implementation**:

This is the hardest task because Refine uses `useSearchParams` which causes SSR issues. Options:

1. **Option A (safer)**: Keep `ssr: false` but improve the loading state:
   - Replace the plain "Loading..." text with a proper skeleton that matches the page layout
   - Add smooth fade-in transition
   - This doesn't fix the SSR issue but reduces perceived sluggishness

2. **Option B (better but riskier)**: Wrap only the Refine-dependent parts in `ssr: false`:
   - The root layout renders server-side (static shell, navigation)
   - Only the data-dependent content area uses the client wrapper
   - This requires restructuring how `<Refine>` wraps the app

3. **Option C (best, most effort)**: Fix Refine's SSR compatibility:
   - Wrap `useSearchParams` usage in Suspense boundaries
   - Use Next.js `useSearchParams()` with Suspense fallback
   - May require upgrading Refine or using a different router binding

**Recommendation**: Start with Option A (quick), then try Option B if time permits.

**Files**: `components/client-refine-wrapper.tsx`, `app/layout.tsx`

---

## Verification Checklist

After each phase, verify:

- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] Manual smoke test: login -> dashboard -> navigate pages -> admin portal
- [ ] Check network tab: count API calls on dashboard load (target: <5 after Phase 1)
- [ ] Check Performance tab: measure TTI (target: <3s after Phase 4)

---

## Files Index

Quick reference of all files that need changes, by phase:

### Phase 1

| File                                               | Task | Change                            |
| -------------------------------------------------- | ---- | --------------------------------- |
| `contexts/auth-context.tsx`                        | 1.1  | NEW — shared auth context         |
| `hooks/use-auth.ts`                                | 1.1  | NEW — auth hook                   |
| `components/layout/sidebar.tsx`                    | 1.1  | Remove direct Supabase auth calls |
| `components/layout/header.tsx`                     | 1.1  | Remove direct Supabase auth calls |
| `components/layout/mobile-nav.tsx`                 | 1.1  | Remove direct Supabase auth calls |
| `components/admin/admin-sidebar.tsx`               | 1.1  | Remove direct Supabase auth calls |
| `contexts/plan-cycle-context.tsx`                  | 1.1  | Use auth context for userId       |
| `app/dashboard/layout.tsx`                         | 1.1  | Add AuthProvider                  |
| `app/admin/layout.tsx`                             | 1.1  | Add AuthProvider                  |
| `providers/refine-provider.tsx`                    | 1.2  | Add QueryClient defaults          |
| `middleware.ts`                                    | 1.3  | Cache role in cookie              |
| `app/dashboard/loading.tsx`                        | 1.4  | NEW — loading skeleton            |
| `app/admin/loading.tsx`                            | 1.4  | NEW — loading skeleton            |
| `app/admin/clients/loading.tsx`                    | 1.4  | NEW — loading skeleton            |
| `app/dashboard/checkin/loading.tsx`                | 1.4  | NEW — loading skeleton            |
| `components/providers/facebook-pixel-provider.tsx` | 1.5  | Change to lazyOnload              |
| `components/providers/posthog-provider.tsx`        | 1.5  | Defer init to idle callback       |

### Phase 2

| File                                                | Task | Change                                |
| --------------------------------------------------- | ---- | ------------------------------------- |
| `app/admin/page.tsx`                                | 2.1  | Add column selection, date filters    |
| `app/admin/clients/page.tsx`                        | 2.2  | Add server-side pagination            |
| `components/admin/todays-challenge-activity.tsx`    | 2.3  | Add date filter or use RPC            |
| `hooks/use-timeline-data.ts`                        | 2.4  | Add column selection, safety limits   |
| `hooks/use-daily-plan-data.ts`                      | 2.4  | Add safety pageSize limits            |
| `hooks/use-client-timeline.ts`                      | 2.4  | Add safety pageSize limits            |
| `app/dashboard/challenge/page.tsx`                  | 2.5  | Replace raw Supabase with useList     |
| `hooks/use-gamification.ts`                         | 2.6  | Use auth context, parallelize queries |
| `supabase/migrations/YYYYMMDD_add_perf_indexes.sql` | 2.7  | NEW — database indexes                |

### Phase 3

| File                                                       | Task | Change                              |
| ---------------------------------------------------------- | ---- | ----------------------------------- |
| `contexts/plan-cycle-context.tsx`                          | 3.1  | Split into data + loading contexts  |
| Timeline item components                                   | 3.2  | Add React.memo                      |
| `components/landing/modals/challenge-hub/calendar-tab.tsx` | 3.2  | Memoize day buttons                 |
| `components/dashboard/mobile-timeline-view.tsx`            | 3.3  | Memoize array operations            |
| `components/dashboard/client-timeline-view.tsx`            | 3.3  | Fix useMemo deps                    |
| `contexts/modal-context.tsx`                               | 3.4  | Split into actions + state contexts |
| `components/dashboard/food-log-form.tsx`                   | 3.5  | Add debounce                        |
| `lib/auth.ts`                                              | 3.6  | Add singleton browser client        |

### Phase 4

| File                                           | Task | Change                                       |
| ---------------------------------------------- | ---- | -------------------------------------------- |
| `next.config.ts`                               | 4.1  | Add bundle analyzer + optimizePackageImports |
| `package.json`                                 | 4.1  | Add @next/bundle-analyzer devDep             |
| `components/admin/progress-charts.tsx`         | 4.2  | Dynamic import Recharts                      |
| `components/landing/modals/results-modal.tsx`  | 4.2  | Dynamic import html-to-image                 |
| Multiple `app/**/page.tsx` files               | 4.3  | Remove unnecessary "use client"              |
| `public/images/transformations/*.jpg`          | 4.4  | Convert to WebP                              |
| `components/landing/before-after-carousel.tsx` | 4.4  | Update image references                      |
| `components/client-refine-wrapper.tsx`         | 4.5  | Improve loading / explore SSR                |

---

## How to Use This Plan

Each task is self-contained with enough context for a fresh Claude session. To work on a task:

1. Tell Claude: "I'm working on the performance plan. Please read `docs/PERFORMANCE_PLAN.md` and implement Task X.Y"
2. Claude will have all the file paths, line numbers, and implementation details needed
3. After completing tasks in a phase, run the verification checklist
4. Mark completed tasks by changing `###` to `### ~~Task X.Y~~ DONE`
