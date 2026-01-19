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

### Changed

- Updated `lib/refine.tsx` to use Supabase data provider
- Updated `providers/refine-provider.tsx` with fallback placeholder provider
- Updated environment example files with Supabase configuration

### Fixed

### Removed
