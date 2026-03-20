# CLAUDE.md — Metabolikal

## Project Overview

Metabolikal is a metabolic health coaching dashboard. Three user roles: **admin** (coaches), **client** (paying clients with custom plans), **challenger** (free 30-day challenge participants). Backend is Supabase (PostgreSQL + Auth + RLS). Frontend is Next.js 16 + Refine + React 19 + shadcn/ui + Tailwind CSS v4.

**Read these files for context:**

- **PROJECT_CONTEXT.md** — Data models, API surface, permissions, enums, state machines, business config, test counts
- **ARCHITECTURE.md** — Code patterns, Tailwind v4 config, troubleshooting

---

## Critical Rules

### 1. Refine hooks for ALL CRUD operations

Use `useList()`, `useOne()`, `useCreate()`, `useUpdate()`, `useDelete()`, `useForm()`, `useShow()`, `useTable()`. NEVER write custom fetch/axios calls for data operations. All CRUD goes through the Supabase data provider configured in `lib/refine.tsx`.

### 2. File organization

| What                          | Where                                    |
| ----------------------------- | ---------------------------------------- |
| Client dashboard pages        | `app/dashboard/`                         |
| Admin pages                   | `app/admin/`                             |
| Admin config CRUD             | `app/admin/config/[resource]/`           |
| Public pages                  | `app/(public)/`                          |
| Auth pages                    | `app/(auth)/`                            |
| API routes                    | `app/api/`                               |
| Shared components             | `components/`                            |
| UI primitives (shadcn)        | `components/ui/`                         |
| Custom hooks                  | `hooks/`                                 |
| React contexts                | `contexts/`                              |
| Refine + data provider config | `lib/refine.tsx`                         |
| Zod validation schemas        | `lib/validations.ts`                     |
| Supabase types                | `lib/database.types.ts`                  |
| Pure utility functions        | `lib/challenge-utils.ts`, `lib/utils.ts` |
| Auth (client-side)            | `lib/auth.ts`                            |
| Auth (server-only)            | `lib/auth-server.ts`                     |
| Constants & feature flags     | `lib/constants.ts`                       |
| Environment validation        | `lib/env.ts`                             |

### 3. UI components

Use shadcn/ui from `components/ui/`. Follow the existing CSS variable theming in `app/globals.css`. Use Tailwind CSS for styling. Don't install competing UI libraries.

### 4. Validation

All form data and API inputs must use Zod schemas from `lib/validations.ts`. Use `zodResolver` with `useForm()` for forms. Use `.parse()` or `.safeParse()` in API routes.

### 5. Auth patterns

- Server-side admin checks: `isAdmin()` from `lib/auth-server.ts`
- Client-side auth: `useAuth()` from `contexts/auth-context.tsx`
- RLS on all Supabase tables — users see own data, admins see all
- Deactivation enforced at app layer (not RLS) to avoid recursive subqueries

### 6. Tests alongside implementation

Tests go in `__tests__/` directories colocated with source files. Use Jest + React Testing Library for unit tests. Test utilities in `__tests__/test-utils.tsx` provide `renderWithProviders()`, mock factories. 80% coverage target.

---

## How to Add a New Feature

1. **Zod schema** → `lib/validations.ts`
2. **Resource config** → `lib/refine.tsx` (add to `refineResources`)
3. **List page** → `app/admin/my-resource/page.tsx` using `useList()`
4. **Create/Edit pages** → `app/admin/my-resource/create/page.tsx` using `useForm()`
5. **Form component** → `components/admin/my-resource-form.tsx`
6. **Tests** → `__tests__/` alongside each file
7. **Navigation link** → `components/layout/sidebar.tsx`
8. **Quality check** → `npm run lint && npm run type-check && npm test`

---

## Quality Gates

**Coverage target**: 80%

All changes must pass before completion:

- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Coverage meets 80% (`npm run test:coverage`)
- [ ] Pre-commit hooks pass (Husky + lint-staged)

```bash
npm test                 # Unit tests
npm run test:coverage    # Coverage report
npm run test:integration # Integration tests
npm run test:e2e         # Playwright E2E
npm run lint             # ESLint
npm run type-check       # TypeScript strict
```

---

## Anti-Patterns

- **Don't** write custom fetch/axios for CRUD — use Refine hooks
- **Don't** bypass the Supabase data provider for API calls
- **Don't** skip Zod validation on form data or API inputs
- **Don't** bypass pre-commit hooks with `--no-verify`
- **Don't** commit code that fails linting or type checking
- **Don't** hardcode magic numbers — put them in `lib/constants.ts`
- **Don't** use `console.log()` for diagnostics — only `console.error()` for errors
- **Don't** edit `.session/tracking/work_items.json` or `learnings.json` directly — use `sk` CLI

---

## Behavior Guidelines

1. **Check existing patterns first** — read similar files before writing new code. Maintain consistency.
2. **Ask when ambiguous** — don't guess requirements, architectural decisions, or when a task could affect other areas.
3. **Validate your work** — run `/validate` after changes. Ensure tests, linting, and type checking pass.
4. **Give equal attention** — if creating multiple work items, each spec file should be equally detailed.

### Writing PRDs

1. **Always read `.session/guides/PRD_WRITING_GUIDE.md` first** — mandatory
2. Use vertical slices, not horizontal layers
3. Include technical constraints, acceptance criteria, error cases
4. Reference `.session/guides/STACK_GUIDE.md` for stack considerations
5. Save at `docs/PRD.md`

---

## Solokit (Session-Driven Development)

Commands available as slash commands (`/start`, `/end`) or via `sk` CLI. Slash commands preferred.

### Core Workflow

```bash
/start [work_item_id]    # Start session (generates briefing)
/status                  # Check session progress
/validate                # Run quality gates without ending
/end                     # Complete session (runs validations, captures learnings)
```

### Work Items

```bash
/work-new                # Create work item (interactive)
/work-list               # List all (filter: --status, --type, --milestone)
/work-show <id>          # Show details
/work-update <id>        # Update (--status, --priority, --add-dependency, --set-urgent)
/work-delete <id>        # Delete
/work-next               # Next recommended item
/work-graph              # Dependency visualization
```

Valid types: `feature`, `bug`, `refactor`, `security`, `integration_test`, `deployment`
Valid priorities: `critical`, `high`, `medium`, `low`

NEVER create work items by editing `work_items.json` directly. Always use `sk` commands.

### Specs

- Stored in `.session/specs/{work_item_id}.md` (auto-created from templates)
- Fill in ALL sections: Overview, Acceptance Criteria, Technical Approach, Dependencies, Testing Requirements
- If creating multiple items, give equal detail to each

### Learnings

```bash
/learn                          # Capture a learning
/learn-show                     # View all (--category, --tag filters)
/learn-search "query"           # Search
```

Capture during `/end` (preferred) or via `/learn`. Never add learnings to commit messages or random files.

**Rules**: Always end sessions with `/end`. Never start a new session without ending the current one. Never abandon sessions.

---

## Key Files

| File                                     | Purpose                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `PROJECT_CONTEXT.md`                     | Comprehensive project context (models, API, permissions, enums, tests) |
| `ARCHITECTURE.md`                        | Stack patterns, code examples, Tailwind v4, troubleshooting            |
| `docs/PRD.md`                            | Product requirements                                                   |
| `docs/SPECIFICATION.md`                  | Technical specifications                                               |
| `docs/STABILITY_AND_PERFORMANCE_PLAN.md` | 6-phase performance roadmap                                            |
| `docs/COMPLETE-FORMULAE-GUIDE.md`        | Metabolic formula reference                                            |
| `docs/TEST_USERS.md`                     | Test account credentials                                               |
| `.session/guides/PRD_WRITING_GUIDE.md`   | PRD authoring guide (MUST follow for PRDs)                             |
| `.session/guides/STACK_GUIDE.md`         | Stack selection guide                                                  |
| `.session/specs/`                        | Work item specifications                                               |
