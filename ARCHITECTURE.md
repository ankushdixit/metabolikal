# Metabolikal Architecture Guide

Architecture patterns, code conventions, and reference for the Metabolikal coaching dashboard.

For comprehensive project context (data models, API surface, permissions, enums, state machines), see **PROJECT_CONTEXT.md**.

## Stack Overview

| Component                 | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| **Refine 5**              | Headless CRUD framework — all data ops via hooks      |
| **Next.js 16**            | App Router, SSR, API routes                           |
| **Supabase**              | PostgreSQL database, Auth (JWT/cookies), RLS, Storage |
| **shadcn/ui + Radix**     | Accessible UI primitives                              |
| **Tailwind CSS v4**       | CSS-first utility styling                             |
| **React Hook Form + Zod** | Form state + schema validation                        |
| **Recharts**              | Data visualization                                    |
| **Sentry**                | Error tracking + session replay                       |
| **PostHog**               | Product analytics (reverse-proxied via `/ingest`)     |

## Architecture Decisions

### 1. Refine for all CRUD

All data operations go through Refine hooks → Supabase data provider. Never write custom fetch/axios for CRUD.

**Hooks used throughout the codebase:**

- `useList()` — fetch collections (admin client lists, food items, etc.)
- `useOne()` — fetch single record
- `useForm()` — create/edit forms with React Hook Form integration
- `useShow()` — detail pages
- `useCreate()`, `useUpdate()`, `useDelete()` — mutations

**Data provider**: `@refinedev/supabase` configured in `lib/refine.tsx` with `createBrowserSupabaseClient()`.

**React Query defaults** (in `providers/refine-provider.tsx`):

- `staleTime: 2min` — data considered fresh, no refetch on mount
- `gcTime: 5min` — cached data persists
- `refetchOnWindowFocus: false`
- `retry: 1`

### 2. Supabase as backend

- **Auth**: JWT sessions in HTTP-only cookies via `@supabase/ssr`
- **RLS**: Row-level security on all tables — users see own data, admins see all
- **Storage**: `checkin-photos` (private), `avatars` (public) buckets
- **Migrations**: `supabase/migrations/` — 30+ timestamped SQL files

**Two Supabase clients:**

- `createBrowserSupabaseClient()` in `lib/auth.ts` — singleton for client-side
- `createServerSupabaseClient()` in `lib/auth-server.ts` — per-request for server components/API routes

### 3. Route organization

```
app/
├── (public)/              # Landing pages (no auth)
├── (auth)/                # Login, register, password reset
├── dashboard/             # Client portal (AuthProvider + DeactivationGuard + PlanCycleProvider)
│   ├── profile/
│   ├── checkin/ + checkin/history/
│   ├── progress/
│   └── challenge/
├── admin/                 # Admin portal (AuthProvider)
│   ├── clients/ + clients/[id]/ + clients/[id]/plans/
│   ├── challengers/
│   ├── pending-reviews/
│   └── config/            # CRUD for food-items, supplements, exercises, etc.
│       ├── food-items/ + food-items/create/ + food-items/edit/[id]/
│       ├── supplements/ + supplements/create/ + supplements/edit/[id]/
│       ├── exercises/, meal-types/, conditions/, lifestyle-activities/
│       ├── testimonial-photos/, testimonial-videos/
│       ├── templates/ + templates/create/ + templates/[id]/edit/
│       └── calculator-settings/
├── api/
│   ├── health/            # GET — health check
│   ├── admin/             # POST — invite-client, deactivate, reactivate, upgrade, send-message, resend-invite
│   └── push/              # POST — subscribe, unsubscribe, verify, send, test
└── auth/callback/         # OAuth callback handler
```

**Key layout wrappers:**

- `app/dashboard/layout.tsx` — AuthProvider + DeactivationGuard + PlanCycleProvider
- `app/admin/layout.tsx` — AuthProvider
- `app/layout.tsx` — Root layout with RefineProvider

### 4. shadcn/ui component system

Components in `components/ui/`. Theme via CSS variables in `app/globals.css`. Don't install competing UI libraries.

### 5. Context architecture (split to prevent re-renders)

- **AuthContext** (`contexts/auth-context.tsx`) — session, profile, role. Module-level `authStateCache` for non-React consumers
- **PlanCycleContext** (`contexts/plan-cycle-context.tsx`) — split into Data + Loading contexts
- **ModalContext** (`contexts/modal-context.tsx`) — split into Actions + State contexts (16+ modal types)

## Code Patterns

### Admin list page with useList

```typescript
// app/admin/clients/page.tsx (simplified)
"use client";

import { useList } from "@refinedev/core";
import { useAuth } from "@/contexts/auth-context";
import { ClientTable } from "@/components/admin/client-table";
import type { Profile } from "@/lib/database.types";

export default function ClientsPage() {
  const { userId } = useAuth();

  const { query } = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    sorters: [{ field: "full_name", order: "asc" }],
    pagination: { pageSize: 500 },
    meta: { select: "id, full_name, email, phone, avatar_url, role, created_at" },
    queryOptions: { enabled: !!userId },
  });

  return <ClientTable data={query.data?.data || []} isLoading={query.isLoading} />;
}
```

### Admin config CRUD with useForm

```typescript
// app/admin/config/food-items/create/page.tsx (simplified)
"use client";

import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { foodItemSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FoodItemCreate() {
  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    refineCoreProps: { resource: "food_items", action: "create", redirect: "list" },
    resolver: zodResolver(foodItemSchema),
  });

  return (
    <form onSubmit={handleSubmit(onFinish)} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="calories">Calories</label>
        <Input id="calories" type="number" {...register("calories", { valueAsNumber: true })} />
      </div>
      <Button type="submit" disabled={formLoading}>
        {formLoading ? "Creating..." : "Create Food Item"}
      </Button>
    </form>
  );
}
```

### API route pattern

```typescript
// app/api/admin/invite-client/route.ts (simplified)
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-server";
import { inviteClientSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = inviteClientSchema.parse(body);

    // ... business logic with Supabase service role client
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
```

**API route conventions:**

- Check auth/permissions first (`isAdmin()`)
- Validate with Zod `.parse()` (throws on error)
- Catch `ZodError` separately for 400 responses
- Return `{ success: boolean, error?: string }` structure
- Log unexpected errors with `console.error()`

### Custom hook pattern (Supabase direct)

```typescript
// hooks/use-my-hook.ts (pattern)
export function useMyHook() {
  const auth = useOptionalAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.from("table").select();
      if (cancelled) return;
      setData(data);
      setIsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { data, isLoading };
}
```

**Hook conventions:**

- `useMemo()` for Supabase client (prevent recreation)
- Cancellation flag to prevent state updates after unmount
- Support `useAuth()` inside AuthProvider, fallback to `getUser()` outside

### Test pattern

```typescript
// hooks/__tests__/use-gamification.test.ts (simplified)
import { calculateStepsPoints, calculateWaterPoints } from "../use-gamification";

describe("Points Calculation", () => {
  describe("calculateStepsPoints", () => {
    it("returns 0 for steps below 7000", () => {
      expect(calculateStepsPoints(6999)).toBe(0);
    });
    it("returns 15 for steps between 7000-9999", () => {
      expect(calculateStepsPoints(7000)).toBe(15);
    });
    it("returns 45 for steps 15000+", () => {
      expect(calculateStepsPoints(15000)).toBe(45);
    });
  });
});
```

```typescript
// app/api/admin/invite-client/__tests__/route.test.ts (simplified)
import { POST } from "../route";
import * as authServerModule from "@/lib/auth-server";

jest.mock("@/lib/auth-server", () => ({ isAdmin: jest.fn(), getUser: jest.fn() }));

describe("POST /api/admin/invite-client", () => {
  it("returns 401 when not admin", async () => {
    (authServerModule.isAdmin as jest.Mock).mockResolvedValue(false);
    const request = new Request("http://localhost/api/admin/invite-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

**Test conventions:**

- Colocated in `__tests__/` directories alongside source
- Mock external deps (Supabase, auth) with `jest.mock()`
- Test shared utilities in `__tests__/test-utils.tsx` — `renderWithProviders()`, mock factories
- Test behavior and edge cases, not implementation
- Global mocks in `jest.setup.ts`: Supabase client, ResizeObserver, PointerEvent

### Validation schemas

```typescript
// lib/validations.ts (examples from actual project)
import { z } from "zod";

export const foodItemSchema = z.object({
  name: z.string().min(1).max(100),
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  serving_size: z.number().min(1).max(5000),
  is_vegetarian: z.boolean(),
  avoid_for_conditions: z.array(z.string()).optional().nullable(),
});

export const checkInSchema = z.object({
  weight: z.number().min(20).max(300),
  energy_rating: z.number().min(1).max(10),
  sleep_rating: z.number().min(1).max(10),
  diet_adherence: z.number().min(0).max(100),
  workout_adherence: z.number().min(0).max(100),
  challenges: z.string().max(1000).optional().nullable(),
});

export type FoodItemFormData = z.infer<typeof foodItemSchema>;
export type CheckInFormData = z.infer<typeof checkInSchema>;
```

### Configuring Refine resources

```typescript
// lib/refine.tsx (actual configuration pattern)
export const refineResources = [
  {
    name: "calculator_settings",
    list: "/admin/config/calculator-settings",
    // Singleton — no create/delete
  },
  {
    name: "plan_templates",
    list: "/admin/config/templates",
    create: "/admin/config/templates/create",
    edit: "/admin/config/templates/:id/edit",
    meta: { canDelete: true },
  },
  // Template child resources
  { name: "template_diet_items" },
  { name: "template_supplement_items" },
  { name: "template_workout_items" },
  { name: "template_lifestyle_items" },
];
```

## Key Files Reference

| File                              | Purpose                                                | When to Modify                       |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| `lib/refine.tsx`                  | Refine config, data provider, auth provider, resources | Adding resources, changing auth flow |
| `lib/validations.ts`              | All Zod schemas                                        | Adding/changing forms                |
| `lib/database.types.ts`           | Auto-generated Supabase types                          | After migration changes              |
| `lib/auth.ts`                     | Client-side auth (role helpers, browser client)        | Auth flow changes                    |
| `lib/auth-server.ts`              | Server-only auth (isAdmin, getUser, signIn/Out)        | API route auth changes               |
| `lib/challenge-utils.ts`          | Pure gamification calculations                         | Challenge logic changes              |
| `lib/constants.ts`                | Feature flags, page sizes, hero variants               | Config changes                       |
| `lib/env.ts`                      | Environment variable validation                        | Adding env vars                      |
| `contexts/auth-context.tsx`       | AuthProvider + authStateCache                          | Auth state changes                   |
| `contexts/plan-cycle-context.tsx` | Plan cycle state (split contexts)                      | Plan cycle logic                     |
| `contexts/modal-context.tsx`      | Modal state (split contexts)                           | Adding modals                        |
| `hooks/use-gamification.ts`       | Challenge state hook                                   | Gamification changes                 |
| `providers/refine-provider.tsx`   | Refine context provider                                | React Query config changes           |
| `app/globals.css`                 | Theme variables + Tailwind v4 config                   | Colors, theming                      |
| `components/ui/*`                 | shadcn/ui primitives                                   | Rarely (customize via CSS)           |

## Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4** with CSS-first configuration via `@theme` blocks.

### Configuration Files

| File                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `app/globals.css`    | Main CSS: `@import "tailwindcss"`, `@theme` block, shadcn/ui color tokens |
| `tailwind.config.ts` | Minimal config (only needed for plugins)                                  |
| `postcss.config.mjs` | PostCSS configuration with `@tailwindcss/postcss`                         |

### Color System

Complete shadcn/ui color system defined in `globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(222.2 47.4% 11.2%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-muted: hsl(210 40% 96.1%);
  --color-muted-foreground: hsl(215.4 16.3% 46.9%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-accent: hsl(210 40% 96.1%);
  --color-card: hsl(0 0% 100%);
  --color-popover: hsl(0 0% 100%);
  /* ... more tokens */
}
```

### Available Color Utilities

| Utility                                         | Usage                 |
| ----------------------------------------------- | --------------------- |
| `bg-background`, `text-foreground`              | Base colors           |
| `bg-primary`, `text-primary-foreground`         | Primary actions       |
| `bg-secondary`, `text-secondary-foreground`     | Secondary actions     |
| `bg-destructive`, `text-destructive-foreground` | Destructive actions   |
| `bg-muted`, `text-muted-foreground`             | Muted/disabled states |
| `bg-accent`, `text-accent-foreground`           | Accent/highlight      |
| `bg-card`, `text-card-foreground`               | Card components       |
| `bg-popover`, `text-popover-foreground`         | Popover/dropdown      |
| `border-border`, `bg-input`, `ring-ring`        | Form elements         |

### Dark Mode

Via `.dark` class on `<html>`:

```css
.dark {
  --color-background: hsl(222.2 84% 4.9%);
  --color-foreground: hsl(210 40% 98%);
  /* ... dark mode overrides */
}
```

### Adding Custom Colors

```css
@theme {
  --color-success: hsl(142.1 76.2% 36.3%);
  --color-success-foreground: hsl(355.7 100% 97.3%);
  --color-warning: hsl(47.9 95.8% 53.1%);
  --color-warning-foreground: hsl(26 83.3% 14.1%);
}
```

### Border Radius

```css
@theme {
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}
```

### Key Differences from Tailwind v3

| v3                                       | v4                                   |
| ---------------------------------------- | ------------------------------------ |
| `@tailwind base/components/utilities`    | `@import "tailwindcss"`              |
| `tailwind.config.ts` theme.extend.colors | `@theme { --color-*: value }` in CSS |
| `hsl(var(--primary))` in config          | `--color-primary: hsl(...)` directly |
| `content: [...]` in config               | Automatic content detection          |
| `darkMode: "class"` in config            | `.dark { }` CSS overrides            |

## Troubleshooting

### Form Validation Not Working

1. Ensure `zodResolver` is passed to `useForm`
2. Check that schema field names match form field names
3. Verify error messages are displayed (`errors.fieldName?.message`)

### Styling Issues

1. Verify `globals.css` is imported in root layout
2. Check CSS variable definitions in `@theme` block
3. Ensure `@tailwindcss/postcss` is in `postcss.config.mjs`

### Type Errors with Refine Hooks

1. Use generics: `useList<Profile>()`, `useForm<FoodItemFormData>()`
2. Check types match `lib/database.types.ts`
3. Access data as `query.data?.data` (Refine wraps results)

### Auth Issues

1. Check `authStateCache` population in `contexts/auth-context.tsx`
2. Server-side: use `createServerSupabaseClient()` (not browser client)
3. Deactivation blocks login for non-admins — check `is_deactivated` on profile

## External References

- [Refine.dev Documentation](https://refine.dev/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
