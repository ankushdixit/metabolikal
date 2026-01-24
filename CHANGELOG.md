# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Enhanced Results Modal with Comprehensive Content Sections**: Expanded results display with personalized insights:
  - Health score status tier labels (Elite/Good/Moderate/Needs Attention) with descriptions
  - Physical Metrics vs Lifestyle Factors score breakdown section
  - Personalized Metabolic Profile showing Base Metabolism vs Lifestyle-Adjusted comparison
  - Lifestyle boost calculation banner showing calories/day increase percentage
  - METABOLI-K-AL Action Plan section with goal-based strategy (Fat Loss/Maintenance/Muscle Building)
  - Priority Action Plan with 3 personalized recommendations based on lowest scoring assessment categories
  - New `lib/results-insights.ts` utility for tier calculation, action plan strategies, and recommendation generation
  - 70 new/updated tests for results modal and insights utility

- **Assessment History with Local Storage and Score Comparison**: localStorage persistence for anonymous users completing assessments:
  - `useAssessmentStorage` hook for saving/loading assessment data from localStorage
  - "Welcome Back" banner in assessment modal showing last assessment date and previous score
  - Pre-population of assessment sliders with previous values for returning users
  - Score comparison section in results modal showing improvement, same score, or decreased messaging
  - Automatic migration of localStorage data to database on login/signup
  - 25 new tests for storage hook and modal components
  - Green-tinted styling matching athletic design system

- **Custom Thank You Page After Calendly Booking**: Branded confirmation page at `/thank-you` route:
  - Success confirmation with green checkmark icon
  - Pre-session checklist with 3 steps (Check Inbox, Complete Form, Show Up Ready)
  - Session expectations section with 4 bullet points
  - Primary CTA to homepage, secondary CTA opens assessment modal
  - Floating decorative icons (Star, Trophy, Crown) with pulse animations
  - Follows Modern Athletic design system (athletic-card, btn-athletic, gradient-electric)
  - Standalone layout without header/footer for focused post-booking experience
  - URL parameter support (`?modal=assessment`) for deep-linking to modals
  - Full test coverage (25 tests)

- **YouTube Shorts Carousel on Landing Page**: Moved all transformation videos from modal to landing page for immediate visibility:
  - 12 YouTube Shorts (portrait 9:16) displayed in horizontally scrollable carousel
  - 3 full-length testimonial videos (landscape 16:9) appended to carousel end
  - Lazy loading via IntersectionObserver for performance
  - Navigation arrows on desktop, swipe support on mobile
  - Mixed aspect ratio support with bottom alignment

- **Before/After Photo Carousel in Modal**: New carousel component for transformation photos:
  - Side-by-side before/after image layout
  - Navigation arrows and dot indicators
  - Keyboard navigation (left/right arrows)
  - Auto-advance option with configurable interval
  - Graceful image error handling with fallback UI
  - Full accessibility support (ARIA attributes, screen reader announcements)

- **Transformation Data Module**: New data structure for client transformations:
  - TypeScript interface for transformation data
  - Placeholder data for 6 client transformations
  - Located at `lib/data/transformations.ts`

### Changed

- **Real Results Modal**: Restructured for better content hierarchy:
  - Renamed to "Transformation Gallery"
  - YouTube videos moved to landing page (no longer in modal)
  - Now features Before/After photo carousel as primary content
  - Instagram social section retained
  - Button text changed from "View Transformation Gallery" to "View Before & After Gallery"

- **Hero Section A/B Testing Variants**: Created 3 new hero section messaging variants for conversion testing:
  - **Variant A (Problem-Solution)**: "Tired of Diets That Ignore Your Demanding Schedule?" - addresses visitor frustration, positions Metabolikal as solution
  - **Variant B (Results-Focused)**: "Reclaim Your Energy. Lose the Weight. Keep Your Schedule." - leads with measurable outcomes, animated counters
  - **Variant C (Identity-Positioning)**: "You Don't Need Another Diet. You Need a System." - creates self-identification, exclusivity positioning
  - **Original**: Preserved founder quote variant for comparison
  - HeroController component for easy variant switching via `NEXT_PUBLIC_HERO_VARIANT` env var
  - Shared components (HeroBackground, HeroCTA, HeroEyebrow, HeroStatsCard) for consistency
  - Comprehensive test suite with 46 tests covering all variants and controller

- **Mobile Challenge Tray**: New floating tray for mobile devices showing challenge progress:
  - Compact collapsed bar showing Day, Points, and Streak
  - Expandable view with full stats and "Open Challenge Hub" button
  - Responsive design: mobile tray on small screens, desktop trays on larger screens

- **Real Client Testimonials**: Updated transformations gallery with actual YouTube content:
  - 12 YouTube Shorts in horizontally scrollable section
  - 3 full-length testimonial videos in new dedicated section

### Changed

- **Calendly Integration**: Configured production Calendly booking:
  - Set actual Calendly link for strategy call booking
  - Increased modal height to 90vh for better widget display
  - Added dark mode styling matching site theme (background, text, accent colors)
  - Fixed race condition causing intermittent widget loading failures

- **Challenge Hub Navigation**: Improved challenge-related CTAs across landing page:
  - "Start 30-Day Challenge" in hero now scrolls to challenge section instead of opening modal
  - Added cursor-pointer for proper hover state
  - Fixed footer "30-Day Challenge" link to open challenge hub (was opening assessment)
  - Fixed "Start the 30-Day Challenge" button in High Performer Trap modal

- **Day Counter Tray**: Simplified by removing redundant "View Today's Tasks" button (both buttons did the same thing)

- **Challenger Role & Gated Challenge Hub**: Full implementation of challenge access control:
  - New "challenger" user role (default for new registrations)
  - Login Required modal prompting unauthenticated users to sign in
  - Profile Incomplete modal requiring assessment + calculator completion before challenge access
  - Database migration adding challenger role constraint and calculator_results table
  - Challenge progress now persists to database instead of localStorage
  - useGamification hook refactored for database storage with proper auth integration
  - useProfileCompletion hook for checking assessment/calculator completion status
  - Middleware blocks challengers from /dashboard routes (redirects to landing with upgrade_required error)

- **Admin Challengers Management**: New admin page for managing challenge participants:
  - Challengers list page (`/admin/challengers`) with search and pagination
  - Stats display showing days completed, total points, profile completion status
  - "Upgrade to Client" action to convert challengers to full clients
  - Last active date tracking from challenge progress entries

### Added (Previous)

- **Food Logging Functionality**: Connected "Log Food" button on client dashboard to actual food logging:
  - Integrated FoodSearch and FoodLogForm components with dashboard
  - Added food search query with database lookup
  - Implemented handleLogFood for logging from database items
  - Implemented handleLogCustomFood for manual food entry
  - Calorie and protein totals update after logging

### Changed

- **Seed Data for All Test Users**: Updated seed scripts to create data for all 5 test users:
  - `seed-nutrition-data.sql` now creates diet plans with food alternatives for all clients
  - `seed-workout-data.sql` now creates detailed workout plans for all clients
  - Both scripts use dynamic loops instead of single-user hardcoded IDs

- **Cyclic Day Number Calculation**: Diet and workout plans now cycle through 7-day program:
  - Day 8 becomes Day 1, Day 15 becomes Day 1, etc.
  - Fixed issue where users enrolled for 8+ days saw "No Diet Plan Available"
  - Applied to dashboard, diet page, and workout page

### Fixed

- **Hydration Error**: Added `suppressHydrationWarning` to html and body tags in root layout to prevent hydration errors from browser extensions adding attributes

- **Dialog Positioning on Mobile**: Fixed dialogs being stuck to left side on mobile instead of full-screen:
  - Added `sm:` prefix to max-width classes in 5 dialog components
  - Dialogs now properly full-screen on mobile, centered on desktop
  - Affected: food-search, food-log-form, todays-logs, photos-gallery, food-database delete dialog

- **Dialog Width on Desktop**: Added default `sm:max-w-lg` to base DialogContent component so dialogs have sensible max-width without explicit class

- **Check-In Form Submission**: Fixed "Submit Check-In" button not working on step 4:
  - Added parseOptionalNumber helper to handle empty number inputs returning NaN
  - Empty optional measurement fields now correctly pass validation
  - Weight field still properly validates as required

- **Sentry Error Monitoring**: Integrated Sentry for production error tracking:
  - Client-side error capture with session replay
  - Server-side error tracking with sensitive data redaction
  - Edge runtime support for middleware errors
  - Global error boundary UI component
  - Configurable via environment variables (NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT)

### Changed

- **Mobile Responsiveness**: Comprehensive mobile-first improvements across the application:
  - Dialog component now full-screen on mobile with proper inset handling
  - All 13 landing page modals use responsive max-width (sm:max-w-\*) classes
  - Landing page hero section uses responsive gaps and padding
  - Check-in progress indicator improved for small screens
  - Close button on modals enlarged for better touch targets on mobile

- **Performance Optimization**: Reduced initial bundle size:
  - All 13 landing page modals now use dynamic imports with next/dynamic
  - Modals only loaded when opened, not on initial page load

- **SEO Improvements**: Enhanced metadata for search engines and social sharing:
  - Comprehensive Open Graph tags with site title, description, and images
  - Twitter card configuration for large image previews
  - Proper viewport meta tag with theme color support
  - Robots configuration for search engine indexing
  - Canonical URL and alternate links support

- **Food Database Management**: Admin interface for managing food items used in diet plans:
  - Food database page (`/admin/food-database`) with searchable list, pagination (10 items/page)
  - Create food item page (`/admin/food-database/create`) with full form validation
  - Edit food item page (`/admin/food-database/edit/[id]`) for updating existing items
  - Food item form with all nutritional fields: name, calories, protein, carbs, fats, serving size
  - Vegetarian flag with leaf badge indicator in list view
  - Multi-select meal type tags (breakfast, lunch, dinner, snack, pre-workout, post-workout)
  - Delete protection checking usage in diet_plans and food_alternatives before allowing deletion
  - Zod validation schema for food items with proper constraints
  - Navigation item added to admin sidebar (desktop and mobile)
  - 44 new tests for food item form component and validation schema
  - Athletic design matching existing admin pages

- **Admin Dashboard & Client Management**: Complete admin interface for coaches to manage clients:
  - Admin layout with fixed sidebar navigation (Dashboard, Clients, Pending Reviews)
  - Admin dashboard home (`/admin`) with stats cards showing Total Clients, Pending Reviews, Flagged Clients
  - Quick actions for viewing all clients and reviewing pending check-ins
  - Recent check-ins preview with direct review links
  - Client list page (`/admin/clients`) with search, filters (All/Active/Flagged), and pagination
  - Client detail/review page (`/admin/clients/[id]`) with tabbed interface:
    - Check-ins tab: Expandable check-in cards with all data, admin notes, flag toggle, mark reviewed action
    - Progress tab: Weight and body fat trend charts with date range selector (7d/30d/90d/All)
    - Photos tab: Photo gallery with compare mode for before/after views
    - Plans tab: Diet and workout plan summaries
  - Pending reviews page (`/admin/pending-reviews`) listing all unreviewed check-ins
  - Mobile-responsive admin navigation with slide-out drawer
  - Athletic design system matching client dashboard (sharp edges, gradient accents, uppercase tracking)
  - 69 new tests for admin components (admin-sidebar, stats-cards, client-table, progress-charts, photos-gallery)
  - Test data seed scripts for creating admin and test client accounts with realistic data

### Fixed

- **Sidebar Scrolling**: Fixed dashboard sidebar scrolling with content instead of staying fixed:
  - Made sidebar fixed position with full viewport height
  - Added proper overflow handling for navigation items
  - Ensured logout button always visible at bottom
  - Added margin offset to main content area for fixed sidebar width

### Added

- **Check-In Module**: Weekly check-in system for client progress tracking:
  - Multi-step check-in form (`/dashboard/checkin`) with 4 steps:
    - Step 1: Measurements - weight (required), body fat %, body measurements (chest, waist, hips, arms, thighs)
    - Step 2: Progress Photos - three upload slots (front, side, back) with Supabase Storage integration
    - Step 3: Subjective Ratings - energy, sleep, stress, mood on 1-10 scale with sliders
    - Step 4: Compliance & Notes - diet/workout adherence percentages, challenges, progress notes, questions for coach
  - Photo upload component with file validation (jpg/png/webp, max 10MB), preview, and remove functionality
  - Duplicate check-in warning when submitting multiple times in the same week
  - Check-in history page (`/dashboard/checkin/history`) with expandable entries
  - Expandable history items showing all measurements, photos with lightbox, ratings, compliance, and notes
  - Color-coded ratings and compliance indicators (green/yellow/red based on values)
  - Zod validation schema for check-in form data
  - 30 new tests for check-in components

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
