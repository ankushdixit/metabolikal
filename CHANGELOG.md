# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Workout Module**: Complete workout tracking system for clients:
  - Workout plan page (`/dashboard/workout`) displaying exercises grouped by section (Warmup, Main, Cooldown)
  - Exercise items showing name, sets/reps or duration, rest intervals with expand/collapse for instructions
  - Video links opening YouTube in new tab for exercise demonstrations
  - Checkbox completion tracking with optimistic UI updates
  - Progress indicator showing X/Y exercises completed with "Mark All Complete" button
  - Completion celebration message when all exercises are done
  - Rest day state when no workout is scheduled
  - Workout history page (`/dashboard/workout/history`) showing past 30 days of workout completion
  - History entries with completion percentages and exercise summaries
  - Seed data script with 7-day workout program (Upper/Lower/Core split + recovery day)
  - 43 new tests for workout components (workout-progress, workout-item, workout-section)

- **Nutrition Module**: Complete diet plan and food logging system for clients:
  - Diet plan page (`/dashboard/diet`) displaying 6 meal categories in order: pre-workout, post-workout, breakfast, lunch, evening-snack, dinner
  - Meal cards showing food name, calories, protein, and serving size with athletic styling
  - Food alternatives drawer with color-coded options (green=optimal ±10%, red=higher, yellow=lower calories)
  - Vegetarian filter for food alternatives
  - Food log form with serving multipliers (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
  - Custom food search with manual entry option
  - Today's logged items view with delete confirmation
  - Daily progress summary with calorie and protein tracking
  - Sheet UI component for slide-out panels
  - Calorie color utility for visual feedback
  - Seed data script with 20 food items and 7-day diet plans
  - 87 new tests for nutrition components

### Fixed

- **RLS Infinite Recursion**: Fixed Row Level Security policies causing "infinite recursion detected" errors:
  - Created `is_admin()` SECURITY DEFINER function to bypass RLS when checking admin status
  - Recreated all admin policies using the new function
  - Added policy for clients to update their own diet plans

- **Refine Data Provider Auth**: Fixed data provider not sharing authentication session:
  - Updated `lib/refine.tsx` to use SSR-compatible Supabase client from `lib/auth.ts`
  - Data provider now properly inherits user authentication cookies

- **Dashboard Target Calculations**: Fixed TypeError when calculating target calories/protein:
  - Corrected data structure assumptions for diet plan entries
  - Each entry has a single `food_items` object, not an array

- **Client Dashboard Home & Navigation**: Complete dashboard with athletic design matching landing page:
  - Dashboard home page with welcome message and day counter since program start
  - Calorie summary card with progress bar (green/yellow/red states)
  - Protein progress card with gamified messages at different thresholds
  - Quick actions component with Log Food, View Meals, View Workout, Submit Check-In
  - Responsive sidebar navigation with all dashboard links and logout
  - Mobile navigation with hamburger menu and slide-out drawer
  - Athletic-styled layout following landing page design patterns
  - Refine hooks for data fetching (profiles, food_logs, diet_plans)
  - 94 new tests for dashboard components

- **Authentication System**: Complete Supabase Auth integration with:
  - Login, Register, Forgot Password, and Reset Password pages
  - Cookie-based session management using `@supabase/ssr`
  - Role-based access control (admin/client roles)
  - Next.js Middleware for route protection
  - Automatic profile creation on user signup via database trigger
  - Refine authProvider integration for dashboard auth state
  - Form validation with Zod schemas
  - Server-only auth utilities separated from client-safe code

- **Database Schema**: Initial Supabase database setup with:
  - 10 tables: profiles, food_items, diet_plans, food_alternatives, workout_plans, workout_logs, food_logs, check_ins, challenge_progress, assessment_results
  - Row Level Security (RLS) policies for all tables (31 policies)
  - Storage buckets for check-in photos and avatars
  - Triggers for updated_at timestamps and profile auto-creation

- **Gamification System & Challenge Hub**: Complete 30-day challenge tracking system with:
  - `useGamification` hook for state management with localStorage persistence
  - Points calculation for 5 health metrics (Steps, Water, Floors, Protein, Sleep)
  - Tiered point thresholds (e.g., 7K/10K/15K steps for 15/30/45 pts)
  - Week unlocking at 90% completion threshold (6/7 days)
  - Daily visit points (10 pts) and check-in bonus (15 pts)
  - Assessment (25 pts) and Calculator (25 pts) completion bonuses

- **User Guide Modal**: Complete instructions for the 30-day challenge including:
  - 5-step challenge walkthrough
  - Points table with all metrics and tiers
  - 6 key features explanation
  - 7 tips for success

- **Challenge Hub Modal**: Main challenge interface with 3 tabs:
  - Today's Tasks: Daily metrics input with real-time points calculation
  - Journey So Far: Cumulative stats and progress summary
  - 30-Day Calendar: Visual calendar with day status indicators

- **Floating Trays** (desktop only, hidden on mobile):
  - Quick Access Tray: Collapsible links to key modals
  - Points Tray: Total points display with expandable breakdown
  - Day Counter Tray: Current day indicator with quick actions

- **Test Coverage**: 72 new tests for gamification system components

### Fixed

- **Modal Consistency**: Standardized all 11 modals with consistent styling:
  - Unified DialogHeader styling (`p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border`)
  - Standardized DialogTitle to `text-2xl` across all modals
  - Added DialogDescription to all modals (was using `<p>` tags or missing)
  - Standardized content spacing to `space-y-8`
  - Unified card padding to `pl-8`
  - Standardized section header margin to `mb-4`

- **Close Button Visibility**: Added `z-20` to dialog close button to ensure it appears above sticky headers

- **Button Functionality**:
  - Fixed "Take Assessment" button in header (desktop and mobile) - was missing onClick handler
  - Fixed "Take Assessment" button in footer - was missing onClick handler
  - Fixed "30-Day Challenge" button in footer - was missing onClick handler
  - Fixed "Take the Metabolic Assessment" button in High-Performer Trap modal - was missing `onOpenAssessment` prop

- **Elite Programs Modal**: Fixed "MOST POPULAR" badge positioning - added proper spacing and z-index to prevent clipping

- **Transformations Modal**: Changed YouTube videos section from horizontal page overflow to contained horizontal scroll with shorts-style aspect ratio (9:16)

- **Modal Layout Improvements**: Restructured all 13 modals for better UX:
  - Fixed header shift issue on scroll by using flex layout instead of sticky positioning
  - Close button now stays fixed relative to modal frame (absolute positioning)
  - Separated scrollable content from modal frame using `flex-1 overflow-y-auto`
  - Added `overflow-x-hidden` to prevent horizontal scrolling on mobile

- **Modal Responsiveness**: Improved mobile experience across all modals:
  - Challenge Hub: Stats bar now uses 2-column grid on mobile, abbreviated tab labels
  - Journey Tab: Responsive grid layout for stats
  - Calendar Tab: Responsive legend wrapping
  - Real Results Modal: Edge-to-edge YouTube carousel, smaller video cards on mobile

- **Footer Button Styling**: Changed "Take Assessment" button to secondary style for visual hierarchy

- **Copyright Year Consistency**: Updated landing page footer to use dynamic year matching auth pages
