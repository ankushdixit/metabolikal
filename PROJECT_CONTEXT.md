# METABOLI-K-AL Project Context

> **Purpose**: Use this document to provide Claude with comprehensive context about the project instead of running exploration each time.

---

## 1. Project Overview

**METABOLI-K-AL** is a metabolic health transformation platform serving as an internal coaching dashboard. It's designed for high-performing professionals seeking structured lifestyle resets and metabolic transformation.

**Tagline**: "You Don't Need More Hustle, You Need Rhythm"

### Application Type

- **Client Dashboard**: For plan participants to track diet, workouts, supplements, and lifestyle activities
- **Admin Portal**: For coaches to manage clients, create personalized plans, and track progress
- **Landing Page**: Public-facing site with assessment calculator and challenge hub

### Founder/Coach

Shivashish Sinha - Science-backed metabolic health coaching

---

## 2. Tech Stack

| Layer                  | Technology                     | Version |
| ---------------------- | ------------------------------ | ------- |
| **Framework**          | Next.js (App Router)           | 16.1.0  |
| **Language**           | TypeScript                     | 5.9.3   |
| **UI Framework**       | React                          | 19.2.1  |
| **UI Components**      | shadcn/ui (Radix UI)           | Latest  |
| **Styling**            | Tailwind CSS                   | 4.1.17  |
| **Forms**              | React Hook Form                | 7.66.0  |
| **Validation**         | Zod                            | 4.1.12  |
| **Backend/Database**   | Supabase                       | 2.90.1  |
| **Data Provider**      | Refine.dev + Supabase Provider | 6.0.1   |
| **Routing**            | @refinedev/nextjs-router       | 7.0.4   |
| **Charts**             | Recharts                       | 3.3.0   |
| **Error Tracking**     | Sentry                         | 10.35.0 |
| **Testing**            | Jest + Testing Library         | 30.2.0  |
| **Push Notifications** | web-push                       | 3.6.7   |
| **CSV Parsing**        | PapaParse                      | 5.5.3   |
| **Toasts**             | Sonner                         | 2.0.7   |
| **Swipe Gestures**     | react-swipeable                | 7.0.2   |
| **Sheets/Drawers**     | Vaul                           | 1.1.2   |

### Development Tools

- **Package Manager**: npm
- **CI/CD**: GitHub Actions
- **Git Hooks**: Husky + lint-staged
- **Deployment**: Vercel

---

## 3. Directory Structure

```
metabolikal/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with Refine provider
│   ├── globals.css               # Tailwind v4 theme
│   │
│   ├── (dashboard)/              # Client authenticated routes
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Home: ClientTimelineView
│   │   ├── profile/              # Client profile
│   │   ├── checkin/              # Check-in submission
│   │   └── progress/             # Progress tracking
│   │
│   ├── admin/                    # Admin portal (role-gated)
│   │   ├── layout.tsx            # Admin layout
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── clients/              # Client management
│   │   ├── config/               # Configuration CRUD
│   │   │   ├── food-items/
│   │   │   ├── supplements/
│   │   │   ├── exercises/
│   │   │   ├── lifestyle-activities/
│   │   │   ├── meal-types/
│   │   │   └── conditions/
│   │   ├── challengers/          # Challenge hub
│   │   └── pending-reviews/      # Check-in review queue
│   │
│   ├── auth/                     # Authentication
│   │   └── callback/             # OAuth callbacks
│   │
│   ├── api/                      # Route handlers
│   │   ├── health/               # Health check
│   │   ├── admin/                # Admin operations
│   │   │   ├── invite-client/
│   │   │   ├── resend-invite/
│   │   │   ├── deactivate-client/
│   │   │   └── reactivate-client/
│   │   └── push/                 # Push notifications
│   │       ├── subscribe/
│   │       ├── unsubscribe/
│   │       ├── send/
│   │       └── test/
│   │
│   └── (public)/                 # Landing page routes
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Navigation & layout
│   ├── admin/                    # Admin components
│   ├── dashboard/                # Client dashboard
│   ├── landing/                  # Public landing page
│   ├── push/                     # Push notification UI
│   └── pwa/                      # PWA support
│
├── lib/                          # Utilities and services
│   ├── refine.tsx                # Refine configuration
│   ├── auth.ts                   # Client auth utilities
│   ├── auth-server.ts            # Server auth functions
│   ├── supabase.ts               # Supabase client setup
│   ├── database.types.ts         # DB TypeScript types
│   ├── validations.ts            # Zod schemas
│   ├── constants.ts              # App constants
│   ├── push-service.ts           # Push notification service
│   ├── csv-parser.ts             # CSV import utilities
│   ├── results-insights.ts       # Health score calculations
│   └── utils/                    # Utility functions
│       ├── lane-packing.ts       # Timeline layout algorithm
│       ├── calorie-colors.ts     # Visual calorie indicators
│       ├── completion-stats.ts   # Progress calculation
│       ├── timeline.ts           # Timeline helpers
│       └── plan-dates.ts         # Date calculation
│
├── hooks/                        # Custom React hooks
│   ├── use-client-timeline.ts    # Client timeline data
│   ├── use-daily-plan-data.ts    # Daily plan view
│   ├── use-timeline-data.ts      # Admin timeline data
│   ├── use-client-profile-data.ts
│   ├── use-push-subscription.ts  # Push notification state
│   ├── use-gamification.ts       # Streaks/achievements
│   ├── use-assessment-storage.ts # Assessment persistence
│   ├── use-calculator.ts         # Metabolic calculator
│   └── use-swipe-navigation.ts   # Touch gestures
│
├── providers/                    # React context providers
│   └── refine-provider.tsx       # Refine.dev provider
│
├── middleware.ts                 # Route protection
│
├── supabase/                     # Database
│   ├── migrations/               # SQL migrations (22 total)
│   ├── seed.sql                  # Library data seeding
│   └── config.toml               # Supabase config
│
├── public/                       # Static assets
│   ├── icons/                    # PWA icons
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
│
├── docs/                         # Documentation
│   ├── PRD.md
│   └── SPECIFICATION.md
│
└── .session/                     # Solokit SDD
    ├── specs/                    # Work item specs
    ├── tracking/                 # Work items & learnings
    └── guides/                   # Development guides
```

---

## 4. Key Features

### Client Features

- **Timeline Dashboard**: Real-time view of daily meals, supplements, workouts, lifestyle plans
- **Plan Completion Tracking**: Mark items complete with progress visualization
- **Food Swapping**: Swap foods with alternatives filtered by medical conditions
- **Weekly Check-ins**: Submit measurements and compliance scores
- **Progress Tracking**: Historical timeline with date navigation
- **Push Notifications**: PWA notifications for updates and reminders
- **Profile Management**: Plan info, medical conditions, macro targets

### Admin Features

- **Client Management**: Invite, activate/deactivate, manage profiles
- **Plan Building**: Visual timeline editor with drag-drop
- **Check-in Review**: Queue of pending check-ins with flagging
- **Configuration Management**: Food items, supplements, exercises, lifestyle activities, meal types, medical conditions
- **Bulk Operations**: Multi-client invites, bulk push notifications
- **Analytics Dashboard**: Client count, pending reviews, flagged clients

### Technical Features

- **Role-based Access**: admin/client/challenger roles with middleware protection
- **Invitation-based Onboarding**: Email invitations with password setup
- **Flexible Time Scheduling**: Fixed time, relative anchors, time periods, all-day
- **PWA Support**: Offline capability, push notifications, iOS standalone mode
- **Mobile Optimization**: Safe areas, swipe gestures, bottom sheets

---

## 5. Database Schema

### Core Tables

**Authentication & Profiles**:

- `profiles` - User profiles with role, contact, avatar, plan dates
- `notification_preferences` - Push settings with quiet hours
- `push_subscriptions` - Device push subscriptions

**Planning**:

- `diet_plans` - Meal assignments with scheduling
- `supplement_plans` - Supplement assignments
- `workout_plans` - Exercise assignments
- `lifestyle_plans` - Lifestyle activity assignments
- `plan_completions` - Item completion tracking

**Macros & Limits**:

- `client_plan_limits` - Daily calorie/macro targets (date ranges)

**Master Data**:

- `food_items` - Nutrition database (calories, macros, conditions)
- `food_item_alternatives` - Food swap mappings
- `food_item_conditions` - Food-condition compatibility
- `supplements` - Supplement library
- `exercises` - Exercise database
- `lifestyle_activities` - Lifestyle templates
- `meal_types` - Meal categories
- `medical_conditions` - Conditions with metabolic impact

**Tracking**:

- `check_ins` - Weekly check-in submissions
- `notifications` - Notification records
- `assessment_results` - Assessment responses
- `client_conditions` - Client medical conditions
- `invitations` - Invite tracking

---

## 6. API Routes

### Health & Status

- `GET /api/health` - Application health check

### Admin Operations (require admin auth)

- `POST /api/admin/invite-client` - Create and invite client
- `POST /api/admin/resend-invite` - Resend invitation
- `POST /api/admin/deactivate-client` - Deactivate client
- `POST /api/admin/reactivate-client` - Reactivate client

### Push Notifications

- `POST /api/push/subscribe` - Register device
- `POST /api/push/unsubscribe` - Unregister device
- `POST /api/push/send` - Send notification (admin)
- `POST /api/push/test` - Test notification

### Data Operations

All CRUD through Refine's Supabase data provider.

---

## 7. Authentication & Authorization

### Roles

- **admin**: Full access to admin portal and client management
- **client**: Access to dashboard, own plan, check-ins, profile
- **challenger**: Landing page only (free 30-day challenge)

### Key Auth Functions (lib/auth.ts, lib/auth-server.ts)

```typescript
canAccessDashboard(role); // Check if client/admin
canAccessAdmin(role); // Check if admin only
isChallenger(role); // Check if challenger
createBrowserSupabaseClient(); // Client-side Supabase
createServerSupabaseClient(); // Server-side Supabase
getUser(); // Get current user
getUserProfile(); // Get user with role
isAdmin(); // Check if current user is admin
```

### Middleware Protection

- Protects `/dashboard` and `/admin` routes
- Blocks deactivated users
- Blocks challengers from dashboard
- Blocks non-admins from admin portal

---

## 8. State Management

### Approach

- No Redux/Zustand - uses React Query via Refine
- Server state via Refine hooks
- Local state via useState
- Context for authentication

### Key Hooks

**Refine Data Hooks**:

- `useList()` - Fetch list
- `useOne()` - Fetch single
- `useCreate()` / `useUpdate()` / `useDelete()` - Mutations
- `useForm()` - Form with validation

**Custom Hooks**:

- `useClientTimeline()` - Client's daily plan
- `useDailyPlanData()` - All 4 plan types for a day
- `useTimelineData()` - Admin plan data
- `useClientProfileData()` - Client profile, plan, conditions
- `usePushSubscription()` - Push notification state
- `useGamification()` - Streaks and achievements

---

## 9. UI System

### Design System

- shadcn/ui components (Radix UI primitives)
- Tailwind CSS v4 with CSS variables
- 16 semantic color tokens
- Dark mode via `.dark` class
- Athletic/sports-themed visuals

### Key Component Categories

**Layout**: Header, Sidebar, MobileNav, AdminSidebar, AdminHeader

**Dashboard**: ClientTimelineView, MobileTimelineView, TimelineGrid, FoodAlternativesDrawer, ProfilePlanCard, TimelineDateNav

**Admin**: TimelineEditor, ClientTable, StatsCards, BulkNotificationModal

**Landing**: HeroSection, CalculatorModal, AssessmentModal, ResultsModal

**PWA**: PushPermissionPrompt, NotificationSettings, IOSInstallPrompt

---

## 10. Environment Variables

```bash
# Supabase
SUPABASE_URL
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Next.js
NEXT_PUBLIC_SITE_URL
NODE_ENV

# Sentry
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_CONTACT_EMAIL
```

---

## 11. Development Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm start             # Start production

# Quality
npm test              # Run tests
npm run test:coverage # Coverage report
npm run lint          # Linting
npm run type-check    # TypeScript check
npm run format        # Prettier format

# Solokit (Session-Driven Development)
/start [id]           # Start session
/status               # Check session status
/validate             # Validate quality gates
/end                  # End session
/work-list            # List work items
/work-new             # Create work item
/learn                # Capture learning
```

---

## 12. Code Patterns

### Component Pattern

```typescript
interface ComponentProps {
  prop: string;
}

export function Component({ prop }: ComponentProps) {
  return <div>{prop}</div>;
}
```

### Form Pattern (Refine + React Hook Form + Zod)

```typescript
const {
  refineCore: { onFinish },
  register,
  handleSubmit,
} = useForm({
  refineCoreProps: {
    resource: "resource",
    action: "create",
  },
  resolver: zodResolver(schema),
});
```

### Data Fetching Pattern

```typescript
const {
  query: { data, isLoading },
} = useList({
  resource: "resource",
  filters: [{ field: "id", operator: "eq", value: "123" }],
});
```

---

## 13. Special Features

### Timeline Scheduling

- **Fixed time**: Specific clock time (e.g., 8:00 AM)
- **Relative anchors**: wake-up, pre-workout, post-workout, meals, sleep
- **Time periods**: early morning, morning, midday, afternoon, evening, night, before sleep
- **Relative offset**: Minutes before/after anchor

### Food Swap System

- Clients can swap foods in timeline
- Filtered by medical condition compatibility
- Calorie comparison indicators (optimal/higher/lower)
- Uses `food_item_alternatives` table

### Push Notification System

- VAPID authentication with web-push
- Notification type preferences (checkin, messages, system, plan updates)
- Quiet hours support
- iOS PWA installation guide

### Mobile Timeline

- Swipe gestures for day navigation
- Collapsible time periods
- Bottom sheet for item details
- Offline completion queue with localStorage

### Assessment & Calculator

- 7-point health assessment (sleep, body, nutrition, mental, stress, support, hydration)
- TDEE calculation (Mifflin-St Jeor formula)
- Medical condition impact on calories
- localStorage persistence for visitors

---

## 14. Quality Requirements

- **Test Coverage Target**: 80%
- **Pre-commit Hooks**: Husky + lint-staged
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode
- **Formatting**: Prettier
- **Error Tracking**: Sentry

---

## 15. Architecture Rules

1. **Use Refine hooks for ALL CRUD operations** - Never implement custom CRUD logic
2. **Data Provider Pattern** - All API communication through Supabase data provider
3. **UI Components** - Use shadcn/ui from `components/ui/`
4. **Route Protection** - Middleware enforces role-based access
5. **Validation** - Zod schemas for all forms
6. **Error Handling** - Try/catch + toast notifications (Sonner)

---

## 16. File Reference

| File                    | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `CLAUDE.md`             | AI guidance and project guidelines      |
| `ARCHITECTURE.md`       | Stack architecture (detailed patterns)  |
| `PROJECT_CONTEXT.md`    | This file - project overview for Claude |
| `lib/refine.tsx`        | Refine configuration                    |
| `lib/database.types.ts` | Database TypeScript types               |
| `lib/validations.ts`    | Zod schemas                             |
| `middleware.ts`         | Route protection                        |
| `.session/specs/`       | Work item specifications                |

---

## 17. Recent Development

### Latest Features

1. Push notification system with PWA support
2. Food swap directly in timeline
3. Bulk client notifications
4. Mobile timeline with swipe navigation
5. Timeline history view
6. Enhanced admin client details

### Recent Fixes

- iPhone safe area handling
- PWA icons
- UUID validation
- Invite client flow improvements
- Calculator data persistence
