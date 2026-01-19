# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup with Session-Driven Development
- Supabase client configuration with environment validation (`lib/supabase.ts`, `lib/env.ts`)
- Health check endpoint with database connectivity validation (`/api/health`)
- Refine data provider integration with Supabase (`@refinedev/supabase`)
- Comprehensive unit tests for environment validation, Supabase client, and health check endpoint
- API documentation for health check endpoint (`docs/api/README.md`)
- Supabase setup instructions in README
- Database schema migration with 10 tables: profiles, food_items, diet_plans, food_alternatives, workout_plans, food_logs, workout_logs, check_ins, challenge_progress, assessment_results
- Row-Level Security (RLS) policies for all tables with client/admin access patterns
- Storage buckets configuration for checkin-photos (private) and avatars (public)
- TypeScript database types (`lib/database.types.ts`) with full type safety
- Database indexes for optimized queries on client_id, day_number, logged_at, submitted_at
- Schema integration tests verifying table structure, constraints, and RLS policies
- Landing page with Modern Athletic design theme (`app/(public)/page.tsx`)
- Public layout with header and footer components (`app/(public)/layout.tsx`)
- Landing page header with mobile menu toggle (`components/landing/header.tsx`)
- Landing page footer with social icons (`components/landing/footer.tsx`)
- Athletic design system with custom CSS utilities in `app/globals.css`
- Unit tests for landing page components (50 tests total)
- Content and information modals for landing page (`components/landing/modals/`)
  - Calendly booking modal with widget integration
  - Real Results modal with YouTube videos and Instagram links
  - Meet Expert modal with founder bio
  - The Method modal with 4-phase system and 5 pillars
  - Elite Programs modal with 3 program tiers
  - Body Fat Guide modal with reference information
  - High-Performer Trap modal with problem revelation
  - Elite Lifestyles modal with 6 lifestyle cards
- Modal context for shared state management (`contexts/modal-context.tsx`)
- Modal hook for local state management (`hooks/use-modal.ts`)
- shadcn/ui Dialog component (`components/ui/dialog.tsx`)
- Unit tests for all 8 modal components (85 tests)

### Changed

- Updated header to use modal context for "Book a Call" buttons
- Updated footer to use modal context for program links and booking CTAs
- Updated public layout to wrap with ModalProvider
- Updated landing page to use modal context instead of local state
- Added cursor pointer to `.btn-athletic` CSS class
- Fixed ESLint config to disable base `no-unused-vars` rule for TypeScript/JSX compatibility
- Updated `lib/refine.tsx` to use Supabase data provider
- Updated `providers/refine-provider.tsx` with fallback placeholder provider
- Updated environment example files with Supabase configuration

### Fixed

### Removed
