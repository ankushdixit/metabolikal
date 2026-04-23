# Metabolikal — Project Metrics

> Generated: 2026-03-23 | All counts are exact (not estimated)

---

## 1. Git History

| Metric               | Value                            |
| -------------------- | -------------------------------- |
| Total commits        | 171                              |
| First commit         | 2026-01-19 15:39:56 +0000        |
| Latest commit        | 2026-03-20 12:07:18 +0000        |
| Development timeline | ~60 days (Jan 19 – Mar 20, 2026) |
| Merge commits (PRs)  | 44                               |
| Contributors         | 2                                |

---

## 2. Test Counts

All test suites were executed. No tests were skipped.

### Unit Tests (Jest)

| Metric           | Count                      |
| ---------------- | -------------------------- |
| Test suites      | 169 passed, 169 total      |
| Individual tests | 4,293 passed, 4,293 total  |
| Failures         | 0                          |
| Test files       | 173 (includes integration) |

### Integration Tests (Jest)

| Metric           | Count                                          |
| ---------------- | ---------------------------------------------- |
| Test suites      | 3 passed, 3 total                              |
| Individual tests | 65 passed, 65 total                            |
| Test files       | 3 (`admin-api`, `auth-flow`, `dashboard-data`) |

### E2E Tests (Playwright)

| Metric           | Count                                                    |
| ---------------- | -------------------------------------------------------- |
| Total test cases | 380 (across 2 browser projects: Desktop Chrome, Pixel 5) |
| Spec files       | 3 (`admin`, `auth`, `dashboard`)                         |
| Browser projects | 2 (chromium, mobile-chrome)                              |

### Accessibility Tests

| Metric                         | Value |
| ------------------------------ | ----- |
| Configured                     | No    |
| jest-axe installed             | No    |
| @axe-core/playwright installed | No    |

### Mutation Tests

| Metric     | Value                                             |
| ---------- | ------------------------------------------------- |
| Configured | No (stryker.conf.\* not found)                    |
| Referenced | Jest config comment mentions Stryker for "tier-3" |

---

## 3. Test Coverage

Generated fresh via `npx jest --coverage`. All metrics exceed the project's 80% threshold.

| Metric         | Total  | Covered | Percentage |
| -------------- | ------ | ------- | ---------- |
| **Statements** | 42,023 | 41,214  | **98.07%** |
| **Branches**   | 5,422  | 4,912   | **90.59%** |
| **Functions**  | 823    | 739     | **89.79%** |
| **Lines**      | 42,023 | 41,214  | **98.07%** |

Coverage threshold configured in project: **80%**

---

## 4. Type Safety

| Setting              | Value         |
| -------------------- | ------------- |
| TypeScript version   | 5.9.3         |
| `strict` mode        | **Enabled**   |
| `target`             | ES2017        |
| `module`             | esnext        |
| `moduleResolution`   | bundler       |
| `isolatedModules`    | true          |
| `noEmit`             | true          |
| `skipLibCheck`       | true          |
| `type-coverage` tool | Not installed |

---

## 5. Codebase Size

| Metric                                 | Count  |
| -------------------------------------- | ------ |
| Source files (.ts/.tsx, non-test)      | 327    |
| Source lines of code                   | 73,002 |
| Test files (.test._ / .spec._)         | 173    |
| Test lines of code                     | 74,770 |
| Test-to-source line ratio              | 1.02:1 |
| API routes (route.ts)                  | 12     |
| React components (.tsx in components/) | 167    |
| Database tables (CREATE TABLE)         | 35     |
| Pages (page.tsx in app/)               | 49     |

---

## 6. Dependencies & Stack

### Core Framework

| Package    | Version |
| ---------- | ------- |
| next       | 16.1.0  |
| react      | 19.2.1  |
| react-dom  | 19.2.1  |
| typescript | 5.9.3   |

### Database & ORM

| Package               | Version |
| --------------------- | ------- |
| @supabase/supabase-js | 2.90.1  |
| @supabase/ssr         | 0.8.0   |
| @refinedev/supabase   | 6.0.1   |

### Data Management (Refine)

| Package                    | Version |
| -------------------------- | ------- |
| @refinedev/core            | 5.0.5   |
| @refinedev/cli             | 2.16.50 |
| @refinedev/nextjs-router   | 7.0.4   |
| @refinedev/react-hook-form | 5.0.2   |
| @refinedev/react-table     | 6.0.1   |

### UI & Styling

| Package                  | Version |
| ------------------------ | ------- |
| tailwindcss              | 4.1.17  |
| @tailwindcss/postcss     | 4.1.17  |
| @radix-ui/react-checkbox | 1.3.3   |
| @radix-ui/react-dialog   | 1.1.15  |
| @radix-ui/react-label    | 2.1.8   |
| @radix-ui/react-select   | 2.2.6   |
| @radix-ui/react-slider   | 1.3.6   |
| class-variance-authority | 0.7.1   |
| clsx                     | 2.1.1   |
| tailwind-merge           | 3.3.1   |
| lucide-react             | 0.553.0 |
| recharts                 | 3.3.0   |
| sonner                   | 2.0.7   |
| vaul                     | 1.1.2   |
| react-swipeable          | 7.0.2   |

### Forms & Validation

| Package             | Version |
| ------------------- | ------- |
| react-hook-form     | 7.66.0  |
| @hookform/resolvers | 5.2.2   |
| zod                 | 4.1.12  |

### Error Tracking & Analytics

| Package        | Version |
| -------------- | ------- |
| @sentry/nextjs | 10.35.0 |
| posthog-js     | 1.336.1 |

### File Handling & Media

| Package       | Version |
| ------------- | ------- |
| html-to-image | 1.11.13 |
| papaparse     | 5.5.3   |

### Real-time & Push Notifications

| Package  | Version |
| -------- | ------- |
| web-push | 3.6.7   |

### Infrastructure

| Package     | Version |
| ----------- | ------- |
| server-only | 0.0.1   |

### Testing Tools

| Package                     | Version |
| --------------------------- | ------- |
| jest                        | 30.2.0  |
| jest-environment-jsdom      | 30.2.0  |
| ts-jest                     | 29.4.5  |
| @testing-library/react      | 16.3.0  |
| @testing-library/dom        | 10.4.0  |
| @testing-library/jest-dom   | 6.9.1   |
| @testing-library/user-event | 14.5.2  |
| @playwright/test            | 1.58.2  |
| @types/jest                 | 30.0.0  |

### Build & Dev Tools

| Package                          | Version |
| -------------------------------- | ------- |
| eslint                           | 9.39.1  |
| eslint-config-next               | 16.1.0  |
| @typescript-eslint/eslint-plugin | 8.46.3  |
| @typescript-eslint/parser        | 8.46.3  |
| prettier                         | 3.6.2   |
| husky                            | 9.1.7   |
| lint-staged                      | 16.2.6  |
| @next/bundle-analyzer            | 16.1.6  |
| ts-node                          | 10.9.2  |
| globals                          | 16.5.0  |

---

## 7. Key Features

### User Roles

- **Admin** — coaches managing clients, diet/workout plans, supplements, config
- **Client** — paying clients with custom plans and progress tracking
- **Challenger** — free 30-day challenge participants with gamification

### Core Features

- **Diet plan management** — meal types, food items, alternatives, CSV import
- **Workout plan management** — exercises, templates, scheduling
- **Supplement tracking** — supplement plans and schedules
- **Lifestyle activities** — activity tracking and logging
- **Daily check-ins** — client self-reporting with history
- **Progress tracking** — charts, metrics, and timeline views
- **30-day challenge** — gamification with streaks, points, flame heatmap
- **Admin dashboard** — client overview, today's challenge activity, pending reviews
- **Config CRUD** — 9 admin-configurable resource types
- **Challenger → Client upgrade** — conversion flow with plan preservation
- **Push notifications** — Web Push (VAPID) with subscribe/unsubscribe/test
- **PWA** — standalone mode, manifest, service worker, mobile-optimized
- **CSV import** — bulk food item import via PapaParse
- **Image export** — progress snapshots via html-to-image
- **Error tracking** — Sentry integration
- **Product analytics** — PostHog integration
- **CI/CD** — 5 GitHub Actions workflows, Vercel deployment

### Technical Highlights

- Next.js 16 + React 19 (latest stack)
- Supabase with Row-Level Security on all tables
- Refine framework for all CRUD operations
- Tailwind CSS v4 with CSS variable theming
- Zod validation on all forms and API inputs
- Pre-commit hooks (Husky + lint-staged)
- 98% statement coverage, 91% branch coverage

---

## 8. Project Identity

| Field         | Value                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name          | metabolikal                                                                                                                                                                                                                     |
| Version       | 0.1.0                                                                                                                                                                                                                           |
| Description   | Metabolic health transformation platform — internal coaching dashboard for managing client diet plans, workout programs, supplement schedules, and lifestyle activities with a public-facing 30-day challenge with gamification |
| Live demo URL | Not published                                                                                                                                                                                                                   |

---

## Landing Page Summary

| Metric                 | Value                            |
| ---------------------- | -------------------------------- |
| Total commits          | 171                              |
| Development timeline   | Jan 19 – Mar 20, 2026 (60 days)  |
| Contributors           | 2                                |
| Pull requests (merges) | 44                               |
| Unit tests             | 4,293                            |
| Integration tests      | 65                               |
| E2E tests              | 380                              |
| Accessibility tests    | None configured                  |
| Mutation tests         | Not configured (Stryker planned) |
| Statement coverage     | 98.07%                           |
| Branch coverage        | 90.59%                           |
| Function coverage      | 89.79%                           |
| Line coverage          | 98.07%                           |
| Type safety            | TypeScript strict mode enabled   |
| Total API routes       | 12                               |
| Total DB tables        | 35                               |
| Total pages            | 49                               |
| Total source files     | 327                              |
| Total source LOC       | 73,002                           |
| Total test files       | 173                              |
| Total test LOC         | 74,770                           |
| React components       | 167                              |
| Dependencies           | 29 production, 18 dev            |
