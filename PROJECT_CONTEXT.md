# Project Context: Metabolikal

|               |                                     |
| ------------- | ----------------------------------- |
| **Version**   | v2.0                                |
| **Generated** | 2026-03-20                          |
| **Generator** | project-context skill (Claude Code) |

> This file provides a comprehensive overview of the project for onboarding,
> reference, and AI-assisted development. Re-run the project-context skill to
> regenerate with updated information — increment the version number each time.

## Overview

**Metabolikal** is a metabolic health transformation platform serving as an internal coaching dashboard for high-performing professionals seeking structured lifestyle resets. It provides admin tools for coaches to manage client diet/workout/supplement plans, a client dashboard for daily tracking and check-ins, and a public-facing 30-day challenge with gamification. Built with Next.js 16, Refine, and Supabase.

## Tech Stack

| Category           | Technology             | Version | Purpose                                  |
| ------------------ | ---------------------- | ------- | ---------------------------------------- |
| Framework          | Next.js (App Router)   | 16.1.0  | SSR, routing, API routes                 |
| UI Library         | React                  | 19.2.1  | Component rendering                      |
| Language           | TypeScript             | 5.9.3   | Type safety (strict mode)                |
| CRUD Framework     | Refine                 | 5.0.5   | Headless admin CRUD operations           |
| Backend            | Supabase (PostgreSQL)  | 2.90.1  | Database, auth, storage, RLS             |
| SSR Auth           | @supabase/ssr          | 0.8.0   | Cookie-based server auth                 |
| Components         | shadcn/ui + Radix UI   | Various | Accessible UI primitives                 |
| Styling            | Tailwind CSS           | 4.1.17  | Utility-first CSS (v4, CSS-first config) |
| Forms              | React Hook Form        | 7.66.0  | Form state management                    |
| Validation         | Zod                    | 4.1.12  | Schema validation                        |
| Charts             | Recharts               | 3.3.0   | Data visualization                       |
| Icons              | Lucide React           | 0.553.0 | Icon library (tree-shakeable)            |
| Error Tracking     | Sentry                 | 10.35.0 | Error tracking + session replay          |
| Analytics          | PostHog                | 1.336.1 | Product analytics (reverse-proxied)      |
| Push Notifications | web-push (VAPID)       | 3.6.7   | Browser push notifications               |
| Toasts             | Sonner                 | 2.0.7   | Toast notifications                      |
| Drawers            | Vaul                   | 1.1.2   | Drawer component                         |
| CSV                | PapaParse              | 5.5.3   | CSV import/export                        |
| Testing            | Jest + Testing Library | 30.2.0  | Unit & integration tests                 |
| E2E Testing        | Playwright             | 1.58.2  | Browser-based E2E tests                  |
| Linting            | ESLint                 | 9.39.1  | Code quality (flat config)               |
| Formatting         | Prettier               | 3.6.2   | Code formatting                          |
| Git Hooks          | Husky + lint-staged    | 9.1.7   | Pre-commit enforcement                   |
| Bundle Analysis    | @next/bundle-analyzer  | 16.1.6  | Bundle size debugging                    |

## Architecture

The codebase uses a **hybrid organization** — feature-based routing (Next.js App Router route groups) with layer-based shared code (lib, hooks, contexts, components).

**Key architectural patterns:**

1. **Refine for all CRUD** — `useTable()`, `useForm()`, `useShow()`, `useList()` etc. Never custom fetch/axios
2. **Supabase as backend** — Data provider, auth, RLS policies, storage
3. **React Context for app state** — Auth, modals, plan cycles (split contexts to prevent re-renders)
4. **Route groups** — `(public)`, `(auth)`, `(dashboard)`, `admin` for layout separation
5. **PWA support** — Service worker, push notifications, iOS install prompts

### Directory Structure

```
metabolikal/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public landing pages
│   ├── (auth)/                   # Login, register, password reset
│   ├── (dashboard)/              # Unused route group (dashboard is at app/dashboard/)
│   ├── dashboard/                # Client dashboard pages
│   │   ├── profile/              # User profile
│   │   ├── checkin/              # Check-in form + history
│   │   ├── progress/             # Progress tracking
│   │   └── challenge/            # 30-day challenge page
│   ├── admin/                    # Admin portal
│   │   ├── clients/              # Client list + detail + plans
│   │   ├── challengers/          # Challenger management
│   │   ├── pending-reviews/      # Check-in review queue
│   │   └── config/               # CRUD for food, supplements, exercises, etc.
│   ├── api/                      # API routes (health, admin, push)
│   ├── auth/callback/            # OAuth callback handler
│   └── thank-you/                # Post-registration thank you
├── components/
│   ├── ui/                       # shadcn/ui primitives (Button, Card, Input, etc.)
│   ├── admin/                    # Admin-specific components
│   ├── dashboard/                # Dashboard components
│   ├── landing/                  # Landing page sections & modals
│   ├── layout/                   # Header, sidebar, navigation
│   └── forms/                    # Form components
├── contexts/                     # React contexts (auth, modal, plan-cycle)
├── hooks/                        # Custom hooks (gamification, calculator, timeline, etc.)
├── lib/                          # Utilities, config, types, validations
│   ├── refine.tsx                # Refine config (data provider, auth provider, resources)
│   ├── auth.ts                   # Client-side auth utilities
│   ├── auth-server.ts            # Server-only auth (getUser, isAdmin)
│   ├── database.types.ts         # Auto-generated Supabase types
│   ├── validations.ts            # Zod schemas for all forms
│   ├── challenge-utils.ts        # Pure gamification calculations
│   ├── constants.ts              # Feature flags, page sizes, hero variants
│   ├── env.ts                    # Environment variable validation (Zod)
│   ├── posthog.ts                # Analytics utilities
│   ├── push-service.ts           # Web push notification service
│   └── utils.ts                  # cn(), generateUUID()
├── providers/                    # Framework providers (Refine, Auth)
├── supabase/
│   ├── migrations/               # 30+ timestamped SQL migrations
│   ├── templates/                # Email templates (invite, reset)
│   ├── seed.sql                  # Seed data
│   └── config.toml               # Local Supabase config
├── docs/                         # PRD, specs, stability plan, formulae guide
├── tests/                        # Integration & E2E tests
├── .github/workflows/            # 5 CI/CD workflows
├── .session/                     # Solokit session-driven development
└── public/                       # Static assets, manifest, service worker
```

### Entry Points

| File                            | Purpose                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `app/layout.tsx`                | Root layout — wraps with providers                                      |
| `app/page.tsx`                  | Public landing page                                                     |
| `app/dashboard/layout.tsx`      | Dashboard layout (AuthProvider + DeactivationGuard + PlanCycleProvider) |
| `app/admin/layout.tsx`          | Admin layout (AuthProvider)                                             |
| `providers/refine-provider.tsx` | Refine framework initialization                                         |
| `contexts/auth-context.tsx`     | Auth state + session management                                         |

## Data Models

### Core Entities & Relationships

```
profiles (users)
├─ 1:M → diet_plans, workout_plans, supplement_plans, lifestyle_activity_plans
├─ 1:M → food_logs, workout_logs, check_ins, challenge_progress
├─ 1:M → plan_cycles, client_conditions, client_plan_limits
├─ 1:M → plan_completions, notifications, push_subscriptions
├─ 1:1 → notification_preferences
├─ 1:M → assessment_results, calculator_results
│
food_items ←→ diet_plans (via food_item_id)
food_items ←→ food_item_alternatives (self-referencing alternatives)
food_items ←→ food_item_conditions (medical condition restrictions)
│
medical_conditions → client_conditions, food_item_conditions
exercises → workout_plans
supplements → supplement_plans
lifestyle_activity_types → lifestyle_activity_plans
meal_types (dynamic reference table for meal categories)
│
plan_templates → template_diet_items, template_supplement_items, etc.
calculator_settings (singleton — configurable formulas/thresholds)
```

### Key Model Details

**Profile** — Central user entity. Key fields: `role`, `is_deactivated`, `plan_start_date`, `plan_duration_days`, `current_plan_cycle`, `challenge_start_date` (preserved on challenger→client upgrade).

**Diet Plans** — Per-client daily meal assignments with `food_item_id`, `serving_multiplier`, `meal_category`, quantity fields (`quantity_grams`, `quantity_type`: raw/cooked), and flexible timeline scheduling.

**Check-ins** — Weekly progress submissions with measurements (weight, body composition, 8 body measurements), photos (front/side/back), wellness ratings (1-10), compliance percentages, and admin review fields (`admin_notes`, `flagged_for_followup`, `reviewed_at`).

**Challenge Progress** — Daily metrics for the 30-day challenge: `steps`, `water_liters`, `floors_climbed`, `protein_grams`, `sleep_hours`, `points_earned`. Supports both anonymous visitors (`visitor_id`) and authenticated users (`user_id`).

**Plan Cycles** — Track individual plan periods per client. Fields: `cycle_number`, `start_date`, `duration_days`, `end_date` (generated), `status`. All data tables have `plan_cycle` column for historical segregation.

**Timeline Scheduling** — Shared across all plan types. `time_type` ("fixed"|"relative"|"period"|"all_day"), with `time_start/end` (HH:MM), `time_period` (early_morning through before_sleep), `relative_anchor` (wake_up, pre_workout, etc.).

### Enums & Constants

| Enum                          | Values                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **UserRole**                  | `admin`, `client`, `challenger`                                                                                                             |
| **Gender**                    | `male`, `female`                                                                                                                            |
| **ProfileGender**             | `male`, `female`, `other`, `prefer_not_to_say`                                                                                              |
| **Goal**                      | `fat_loss`, `maintain`, `muscle_gain`                                                                                                       |
| **TimeType**                  | `fixed`, `relative`, `period`, `all_day`                                                                                                    |
| **TimePeriod**                | `early_morning`, `morning`, `midday`, `afternoon`, `evening`, `night`, `before_sleep`                                                       |
| **RelativeAnchor**            | `wake_up`, `pre_workout`, `post_workout`, `breakfast`, `lunch`, `evening_snack`, `dinner`, `sleep`                                          |
| **WorkoutSection**            | `warmup`, `main`, `cooldown`                                                                                                                |
| **SupplementCategory**        | `vitamin`, `mineral`, `protein`, `amino_acid`, `fatty_acid`, `herbal`, `probiotic`, `other`                                                 |
| **ExerciseCategory**          | `strength`, `cardio`, `flexibility`, `balance`, `hiit`, `warmup`, `cooldown`, `other`                                                       |
| **MuscleGroup**               | `chest`, `back`, `shoulders`, `biceps`, `triceps`, `forearms`, `core`, `quadriceps`, `hamstrings`, `glutes`, `calves`, `full_body`, `other` |
| **LifestyleActivityCategory** | `movement`, `mindfulness`, `sleep`, `hydration`, `sunlight`, `social`, `recovery`, `other`                                                  |
| **PlanCompletionType**        | `diet`, `supplement`, `workout`, `lifestyle`                                                                                                |
| **PlanCycleStatus**           | `active`, `completed`, `cancelled`                                                                                                          |
| **QuantityType**              | `raw`, `cooked`                                                                                                                             |
| **NotificationType**          | `message`, `checkin_review`, `system`                                                                                                       |
| **TestimonialVideoType**      | `short`, `landscape`                                                                                                                        |
| **HeroVariant**               | `A`, `B`, `C`, `original`                                                                                                                   |

| Constant                 | Value     | Usage                            |
| ------------------------ | --------- | -------------------------------- |
| `DEFAULT_CHALLENGE_DAYS` | 30        | Default challenge length         |
| `WEEK_UNLOCK_THRESHOLD`  | 0.9 (90%) | % completion to unlock next week |
| `MAX_DAILY_POINTS`       | 150       | Gamification cap per day         |
| `ADMIN_PAGE_SIZE`        | 10        | Admin list pagination            |

### State Machines & Lifecycle Flows

**User Account Lifecycle:**

```
Anonymous Visitor → (register) → Challenger (30-day free)
                                    ↓ (admin upgrade)
                              Client (custom plan, plan_cycle=1)
                                    ↓ (cycle end)
                              Client (plan_cycle=2, ...)
                                    ↓ (admin deactivate)
                              Deactivated (blocked login, data preserved)
                                    ↓ (admin reactivate, rare)
                              Client (new plan cycle)
```

**Plan Cycle Lifecycle:**

```
active → completed (plan period ends or admin marks)
active → cancelled (early termination)
```

**Check-in Review Lifecycle:**

```
Submitted (reviewed_at=null) → Reviewed (reviewed_at set, admin_notes optional)
                              → Flagged (flagged_for_followup=true, notification sent)
```

### Frontend State Management

- **AuthContext** — User session, profile, role. Module-level `authStateCache` for non-React consumers (Refine auth provider)
- **PlanCycleContext** — Split into Data + Loading contexts. Reads `current_plan_cycle` from AuthContext; fetches `plan_cycles` table only when viewing history
- **ModalContext** — Split into Actions + State contexts. 16+ modal types for landing page
- **useGamification hook** — Challenge state: currentDay, totalDays, points, streak, weekUnlocked. Pure calculations in `challenge-utils.ts`
- **React Query (via Refine)** — Global defaults: 2min staleTime, 5min gcTime, no refetchOnWindowFocus, 1 retry

## API Surface

### Authentication

| Method | Route            | Auth    | Purpose                                                          |
| ------ | ---------------- | ------- | ---------------------------------------------------------------- |
| GET    | `/auth/callback` | Session | OAuth callback, email confirm, password reset, invite acceptance |

### Health Check

| Method | Route         | Auth | Purpose                                                       |
| ------ | ------------- | ---- | ------------------------------------------------------------- |
| GET    | `/api/health` | None | System health + database connectivity (200 ok / 503 degraded) |

### Admin Endpoints

| Method | Route                           | Auth  | Purpose                                                   |
| ------ | ------------------------------- | ----- | --------------------------------------------------------- |
| POST   | `/api/admin/invite-client`      | Admin | Create client user + send invite email                    |
| POST   | `/api/admin/resend-invite`      | Admin | Resend invitation email                                   |
| POST   | `/api/admin/deactivate-client`  | Admin | Deactivate client account                                 |
| POST   | `/api/admin/reactivate-client`  | Admin | Reactivate client + new plan cycle                        |
| POST   | `/api/admin/upgrade-challenger` | Admin | Upgrade challenger to client, preserve challenge progress |
| POST   | `/api/admin/send-message`       | Admin | Send notification to client                               |

### Push Notification Endpoints

| Method | Route                   | Auth  | Purpose                                |
| ------ | ----------------------- | ----- | -------------------------------------- |
| POST   | `/api/push/subscribe`   | User  | Subscribe device to push notifications |
| POST   | `/api/push/verify`      | User  | Check if subscription exists           |
| POST   | `/api/push/unsubscribe` | User  | Remove push subscription               |
| POST   | `/api/push/test`        | User  | Send test push to own devices          |
| POST   | `/api/push/send`        | Admin | Send push to specified users           |

### Refine Data Provider (CRUD via Supabase)

All other data operations go through Refine hooks → Supabase data provider. No custom API routes for CRUD.

**Configured Resources:** `calculator_settings` (singleton), `plan_templates`, `template_diet_items`, `template_supplement_items`, `template_workout_items`, `template_lifestyle_items`

## Permissions & Access Control

### Role-Permission Matrix

| Capability                           | Admin | Client | Challenger |
| ------------------------------------ | :---: | :----: | :--------: |
| Admin portal (`/admin/*`)            |   ✓   |   ✗    |     ✗      |
| Client dashboard (`/dashboard/*`)    |   ✓   |   ✓    |     ✗      |
| Landing page + challenge             |   ✓   |   ✓    |     ✓      |
| Manage clients (invite/deactivate)   |   ✓   |   ✗    |     ✗      |
| Manage config (food/supplements/etc) |   ✓   |   ✗    |     ✗      |
| Review check-ins                     |   ✓   |   ✗    |     ✗      |
| Create/edit plan templates           |   ✓   |   ✗    |     ✗      |
| Submit check-ins                     |   ✗   |   ✓    |     ✗      |
| Log food/workouts                    |   ✗   |   ✓    |     ✗      |
| Track challenge progress             |   ✗   |   ✓    |     ✓      |
| Take assessment/calculator           |   ✓   |   ✓    |     ✓      |
| Manage own push preferences          |   ✓   |   ✓    |     ✗      |

### Authorization Layers

1. **API Routes** — `isAdmin()` check from `lib/auth-server.ts` (server-side)
2. **Supabase RLS** — Row-level security on all tables. Users see own data; admins see all
3. **AuthContext** — Client-side role-based rendering and navigation
4. **DeactivationGuard** — Polls `is_deactivated` every 120s on dashboard; signs out if deactivated
5. **Login handler** — Blocks deactivated non-admin users from signing in

**Note:** No middleware.ts — auth enforcement is at RLS + component + API layers. Deactivation is app-layer only (not RLS) to avoid recursive subquery issues.

## Key Patterns & Conventions

### Naming Conventions

- **Components**: PascalCase (`ClientTable.tsx`, `AddClientModal.tsx`)
- **Hooks**: kebab-case with `use-` prefix (`use-gamification.ts`)
- **Utilities**: kebab-case (`challenge-utils.ts`, `csv-parser.ts`)
- **API routes**: kebab-case directories (`/api/admin/invite-client`)
- **Tests**: colocated in `__tests__/` folders with `.test.ts(x)` suffix
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_CHALLENGE_DAYS`)
- **Imports**: All use `@/` path alias

### Common Code Patterns (with examples)

**1. API Route Pattern** (`app/api/health/route.ts`):

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const isConnected = await testDatabaseConnection();
  return NextResponse.json(
    { status: isConnected ? "ok" : "degraded", timestamp: new Date().toISOString() },
    { status: isConnected ? 200 : 503 }
  );
}
```

**2. Dashboard Page with Refine** (`app/admin/clients/page.tsx` pattern):

```typescript
"use client";
import { useList } from "@refinedev/core";
import { useAuth } from "@/contexts/auth-context";

export default function ClientsPage() {
  const { userId } = useAuth();
  const { query } = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    queryOptions: { enabled: !!userId },
  });
  return <ClientTable data={query.data?.data || []} isLoading={query.isLoading} />;
}
```

**3. Test Pattern** (`hooks/__tests__/use-gamification.test.ts` pattern):

```typescript
import { calculateStepsPoints } from "../use-gamification";

describe("calculateStepsPoints", () => {
  it("returns 0 for steps below 7000", () => {
    expect(calculateStepsPoints(6999)).toBe(0);
  });
  it("returns 45 for steps 15000+", () => {
    expect(calculateStepsPoints(15000)).toBe(45);
  });
});
```

**4. Form Pattern** (React Hook Form + Zod):

```typescript
"use client";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function CreatePage() {
  const { register, handleSubmit, formState: { errors }, refineCore: { onFinish } } = useForm({
    resolver: zodResolver(mySchema),
  });
  return <form onSubmit={handleSubmit(onFinish)}>...</form>;
}
```

### How to Add a New Feature

1. **Validation schema** → `lib/validations.ts` (Zod schema + inferred type)
2. **Resource config** → `lib/refine.tsx` (add to `refineResources` array)
3. **List page** → `app/admin/my-resource/page.tsx` (use `useList()`)
4. **Create/Edit pages** → `app/admin/my-resource/create/page.tsx` (use `useForm()`)
5. **Form component** → `components/admin/my-resource-form.tsx`
6. **Tests** → `__tests__/` directories alongside each file
7. **Navigation** → `components/layout/sidebar.tsx` (add link)
8. **Quality check** → `npm run lint && npm run type-check && npm test`

### Business Configuration

**Gamification Points (per day, max 150):**
| Metric | Threshold | Points |
|--------|-----------|--------|
| Steps | ≥15,000 / ≥10,000 / ≥7,000 | 45 / 30 / 15 |
| Water | ≥3.0L | 15 |
| Floors | ≥14 / ≥4 | 45 / 15 |
| Protein | ≥70g | 15 |
| Sleep | ≥7h | 15 |
| Check-in bonus | submitted | 15 |

**Challenge Duration:**

- Challengers: Fixed 30 days from `created_at`
- Clients: `plan_duration_days` (custom)
- Upgraded challengers: `totalDays = gap(challenge_start_date → plan_start_date) + plan_duration_days`

**Week Unlock:** 90% completion of current week (6/7 days) unlocks next week. Visual only — all past + current day are always editable.

**Hero A/B Testing:** Variant A (Problem-Solution), B (Results), C (Identity, current default), original (Founder quote). Set via `NEXT_PUBLIC_HERO_VARIANT` env var.

## Configuration

### Required Environment Variables

| Variable                        | Scope  | Purpose                   |
| ------------------------------- | ------ | ------------------------- |
| `SUPABASE_URL`                  | Server | Supabase project endpoint |
| `SUPABASE_ANON_KEY`             | Server | Supabase anonymous key    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client | Public Supabase endpoint  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Public anonymous key      |

### Optional Environment Variables

| Variable                                                                     | Scope  | Purpose                                |
| ---------------------------------------------------------------------------- | ------ | -------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`                                                  | Server | Admin operations (invite, upgrade)     |
| `NEXT_PUBLIC_SENTRY_DSN`                                                     | Client | Error tracking                         |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`                        | Build  | Sentry source maps                     |
| `NEXT_PUBLIC_POSTHOG_KEY`                                                    | Client | Product analytics                      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CONTACT_EMAIL` | Both   | Web push notifications                 |
| `NEXT_PUBLIC_HERO_VARIANT`                                                   | Client | A/B test hero section (A/B/C/original) |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`                                              | Client | Facebook tracking                      |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`                                            | Client | Vercel web vitals                      |
| `ANALYZE`                                                                    | Build  | Enable bundle analyzer (true/false)    |

### Environment Validation

`lib/env.ts` uses Zod schemas for runtime validation. `validateEnv()` (server) and `validateClientEnv()` (client) ensure required vars are present.

### Next.js Config Highlights

- **Security headers**: HSTS (2yr), X-Frame-Options SAMEORIGIN, nosniff, XSS protection, Permissions-Policy (no camera/mic/geo)
- **PostHog reverse proxy**: `/ingest/*` → `us.i.posthog.com` (bypass ad blockers)
- **Sentry tunnel**: `/monitoring` route (bypass ad blockers)
- **Package optimization**: Tree-shaking for `lucide-react`, `recharts`
- **Redirects**: `/admin/food-database` → `/admin/config/food-items`, `/admin/supplements` → `/admin/config/supplements`

## Testing

### Test Counts

| Category                  | Test Files | Test Cases |
| ------------------------- | ---------- | ---------- |
| Unit (hooks)              | 25         | 1,304      |
| Unit (components)         | 93         | 1,935      |
| Unit (lib/utils)          | 22         | 1,039      |
| Unit (contexts/providers) | 4          | 127        |
| Unit (pages)              | 11         | 222        |
| Unit (API routes)         | 7          | 282        |
| Unit (UI primitives)      | 3          | 68         |
| Integration               | 3          | 91         |
| E2E (Playwright)          | 3          | 180        |
| **Total**                 | **172**    | **5,537**  |

### Testing Strategy

- **Jest** (unit + integration): jsdom environment, v8 coverage, `@/` path alias support
- **Playwright** (E2E): Chromium + Mobile Chrome, parallel locally, single worker in CI
- **Test utilities**: `__tests__/test-utils.tsx` — `renderWithProviders()`, mock factories for auth profiles, Supabase client
- **Jest setup**: Global mocks for Supabase (`@supabase/ssr`), ResizeObserver, PointerEvent
- **Coverage target**: 80% (Standard tier)

### Running Tests

```bash
npm test                    # All unit tests
npm run test:coverage       # With coverage report
npm run test:integration    # Integration tests only
npm run test:e2e            # Playwright E2E
npm run lint                # ESLint check
npm run type-check          # TypeScript strict
```

## CI/CD & Deployment

### GitHub Actions Workflows (5)

| Workflow            | Trigger                   | Jobs                                                                                                      |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `test.yml`          | PR + push to main/develop | Unit tests + coverage (Codecov), integration (PostgreSQL 16), E2E (Playwright), smoke test, mutation test |
| `quality-check.yml` | PR + push                 | Type-check, lint, format check, production build                                                          |
| `security.yml`      | PR + push + weekly        | npm audit (critical), dependency review, Gitleaks secrets scan                                            |
| `build.yml`         | PR + push                 | Bundle analysis (artifact upload)                                                                         |
| `deploy.yml`        | Push to main only         | Build → Vercel webhook → Sentry release → optional Lighthouse CI                                          |

### Deployment

- **Platform**: Vercel (triggered via webhook from GitHub Actions)
- **Database**: Supabase managed cloud (PostgreSQL 17 locally)
- **Migrations**: `supabase/migrations/` — 30+ timestamped files, format `YYYYMMDDHHMMSS_description.sql`

### Pre-commit Hooks (Husky + lint-staged)

- JS/TS files: `eslint --fix` + `prettier --write`
- JSON/MD/CSS: `prettier --write`

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# 3. Start development server
npm run dev
# Visit http://localhost:3000

# 4. Health check
curl http://localhost:3000/api/health
```

### Supabase Local Development

- PostgreSQL 17 on port 54322
- API (PostgREST) on port 54321
- Studio on port 54323
- Email testing (Inbucket) on port 54324
- Max 1000 rows per query
- Custom email templates in `supabase/templates/`

## Documentation & Resources

| Document                          | Location         | Purpose                                                             |
| --------------------------------- | ---------------- | ------------------------------------------------------------------- |
| README.md                         | Root             | Quick start guide                                                   |
| ARCHITECTURE.md                   | Root             | 712 lines — detailed code patterns, conventions, troubleshooting    |
| CLAUDE.md                         | Root             | 689 lines — AI development guidelines, quality gates, Solokit usage |
| PRD.md                            | docs/            | 2,256 lines — complete product requirements                         |
| SPECIFICATION.md                  | docs/            | 1,568 lines — technical specifications                              |
| STABILITY_AND_PERFORMANCE_PLAN.md | docs/            | 6-phase performance optimization roadmap                            |
| COMPLETE-FORMULAE-GUIDE.md        | docs/            | Metabolic formula reference                                         |
| TEST_USERS.md                     | docs/            | Test account credentials                                            |
| KNOWN_ISSUES.md                   | docs/            | Current known issues                                                |
| PRD_WRITING_GUIDE.md              | .session/guides/ | Mandatory guide for PRD authoring                                   |
| STACK_GUIDE.md                    | .session/guides/ | Stack selection documentation                                       |
| .session/specs/                   | .session/        | 20+ work item specification files                                   |

### Solokit Session-Driven Development

The project uses Solokit for structured development sessions. Key commands: `/start`, `/end`, `/validate`, `/status`, `/work-new`, `/work-list`, `/learn`. Work items tracked in `.session/tracking/work_items.json` (always use `sk` CLI, never edit directly).

## Security & Performance

### Authentication

- **Supabase Auth** with JWT sessions stored in HTTP-only cookies
- Singleton browser client prevents connection exhaustion
- Custom mutex-based lock for token refresh (avoids "signal aborted" errors)
- Module-level `authStateCache` eliminates redundant `getUser()` calls

### Security Patterns

- **RLS on all tables** — Users see own data, admins see all
- **Server-side admin checks** — `isAdmin()` on every admin API route
- **Input validation** — Zod schemas on all API inputs and forms
- **Sentry data redaction** — password, token, secret, authorization fields redacted
- **Session replay privacy** — All text masked, media blocked
- **Gitleaks** — Weekly + PR secrets scanning
- **npm audit** — Critical-level dependency scanning

### Performance Patterns

- **React Query defaults** — 2min staleTime, 5min gcTime (avoid over-fetching)
- **Auth state cache** — Module-level cache eliminates getUser()/profile queries per page
- **Package tree-shaking** — `optimizePackageImports` for lucide-react, recharts
- **PostHog deferred init** — Uses `requestIdleCallback` to avoid blocking hydration
- **Sentry sampling** — 10% transactions, 10% session replay (100% on error)
- **HSTS preload** — 2-year max-age with preload flag
- **Service worker** — PWA offline support, no-cache policy on sw.js
