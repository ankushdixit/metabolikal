# Metabolikal

A metabolic health transformation platform — an internal coaching dashboard for managing client diet plans, workout programs, supplement schedules, and lifestyle activities. Includes a public-facing 30-day challenge with gamification.

## Tech Stack

| Layer          | Technology                                | Version         |
| -------------- | ----------------------------------------- | --------------- |
| Framework      | Next.js (App Router)                      | 16.1.0          |
| Language       | TypeScript (strict)                       | 5.9.3           |
| UI             | React + shadcn/ui + Radix UI              | 19.2.1          |
| CRUD           | Refine (headless)                         | 5.0.5           |
| Backend        | Supabase (PostgreSQL, Auth, Storage, RLS) | 2.90.1          |
| Styling        | Tailwind CSS v4                           | 4.1.17          |
| Forms          | React Hook Form + Zod                     | 7.66.0 / 4.1.12 |
| Charts         | Recharts                                  | 3.3.0           |
| Error Tracking | Sentry                                    | 10.35.0         |
| Analytics      | PostHog (reverse-proxied)                 | 1.336.1         |
| Push           | Web Push (VAPID)                          | 3.6.7           |
| Testing        | Jest + Testing Library + Playwright       | 30.2.0 / 1.58.2 |

## User Roles

| Role           | Access                                                        |
| -------------- | ------------------------------------------------------------- |
| **Admin**      | Full access — manage clients, config, plans, review check-ins |
| **Client**     | Dashboard — track meals, workouts, check-ins, progress        |
| **Challenger** | Landing page — 30-day challenge with gamification             |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials (see below)

# 3. Start dev server
npm run dev
# Visit http://localhost:3000
```

### Required Environment Variables

Get these from your [Supabase project dashboard](https://supabase.com) > Project Settings > API:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional: `SUPABASE_SERVICE_ROLE_KEY` (admin operations), `NEXT_PUBLIC_SENTRY_DSN` (error tracking), `NEXT_PUBLIC_POSTHOG_KEY` (analytics), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (push notifications). See `.env.production.example` for all options.

### Health Check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"...","database":"connected"}
```

## Project Structure

```
app/
├── (public)/              # Landing pages
├── (auth)/                # Login, register, password reset
├── dashboard/             # Client dashboard (profile, checkin, progress, challenge)
├── admin/                 # Admin portal (clients, challengers, config, pending-reviews)
├── api/                   # API routes (health, admin/*, push/*)
└── auth/callback/         # OAuth callback
components/
├── ui/                    # shadcn/ui primitives
├── admin/                 # Admin components
├── dashboard/             # Dashboard components
├── landing/               # Landing page + modals
└── layout/                # Header, sidebar, nav
contexts/                  # AuthContext, ModalContext, PlanCycleContext
hooks/                     # useGamification, useCalculator, useTimeline, etc.
lib/                       # refine.tsx, validations.ts, auth.ts, challenge-utils.ts, etc.
providers/                 # RefineProvider
supabase/migrations/       # 30+ SQL migrations
```

## Commands

### Development

```bash
npm run dev          # Dev server
npm run build        # Production build
npm start            # Production server
```

### Quality

```bash
npm test             # Unit tests (Jest)
npm run test:coverage  # Coverage report (target: 80%)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
npm run type-check   # TypeScript strict
npm run format       # Prettier
```

### Pre-commit Hooks

Husky + lint-staged run automatically on `git commit`:

- JS/TS: `eslint --fix` + `prettier --write`
- JSON/MD/CSS: `prettier --write`

## CI/CD

5 GitHub Actions workflows on PR/push to main:

| Workflow            | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `test.yml`          | Unit + integration + E2E + smoke tests     |
| `quality-check.yml` | Type-check, lint, format, build            |
| `security.yml`      | npm audit, dependency review, Gitleaks     |
| `build.yml`         | Bundle analysis                            |
| `deploy.yml`        | Vercel deploy + Sentry release (main only) |

**Deployment**: Vercel (triggered via webhook). Database: Supabase managed cloud.

## Documentation

| File                                     | Purpose                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_CONTEXT.md`                     | Comprehensive project context — data models, API surface, permissions, enums, state machines, testing counts, business config |
| `ARCHITECTURE.md`                        | Stack architecture patterns, code examples, Tailwind v4 config, troubleshooting                                               |
| `CLAUDE.md`                              | AI development guidelines, critical rules, quality gates                                                                      |
| `docs/PRD.md`                            | Product requirements document                                                                                                 |
| `docs/SPECIFICATION.md`                  | Technical specifications                                                                                                      |
| `docs/STABILITY_AND_PERFORMANCE_PLAN.md` | 6-phase optimization roadmap                                                                                                  |
| `docs/COMPLETE-FORMULAE-GUIDE.md`        | Metabolic formula reference                                                                                                   |
| `docs/TEST_USERS.md`                     | Test account credentials                                                                                                      |

## Session-Driven Development (Solokit)

This project uses Solokit for structured AI-augmented development sessions.

```bash
/work-new              # Create work item
/work-list             # List work items
/start [id]            # Start session
/status                # Session status
/validate              # Check quality gates
/end                   # Complete session
/learn                 # Capture learning
```

Work items: `.session/tracking/work_items.json` (use `sk` CLI, never edit directly)
Specs: `.session/specs/`
History: `.session/history/`
