# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Bulk Notifications for Multiple Clients**: Admin can select multiple clients from the client list and send bulk notifications
  - `BulkNotificationModal` component for composing notifications to selected clients
  - `SelectionActionBar` floating action bar during selection mode with selected count
  - `ClientTable` selection mode with checkboxes (only active clients can be selected)
  - Batch insert of notifications to all selected clients in single operation

- **Client-side Auth Callback Handler**: New `/auth/callback/client` page for handling Supabase auth tokens in URL hash fragments
  - Fixes invited clients being redirected to login instead of password setup
  - Properly extracts access_token and refresh_token from URL hash (not accessible server-side)

- **Test Users Documentation**: `docs/TEST_USERS.md` with complete reference of all seeded test users, credentials, and roles

- **Remote Supabase Reset Script**: New `supabase/reset-remote.sh` unified script for resetting remote Supabase database with migrations and seed data

### Changed

- **Consolidated Seed Files**: Merged 8 separate seed files into unified `seed.sql` and `seed-users.sh`:
  - `seed.sql` contains all library data (food items, supplements, exercises, lifestyle activities, medical conditions, meal types)
  - `seed-users.sh` creates auth users via Supabase Admin API (compatible with hosted Supabase)
  - Removed: `seed-admin-test-data.sql`, `seed-challenger-data.sql`, `seed-challenger-users.sh`, `seed-compatibility-test-data.sql`, `seed-lifestyle-activities.sql`, `seed-nutrition-data.sql`, `seed-test-users.sh`, `seed-workout-data.sql`

### Fixed

- **Invite Client Flow**: Multiple fixes to client invitation process:
  - Explicitly set `role: 'client'` in profile update (trigger default was 'challenger')
  - Detect site URL from request origin headers for dynamic port support in dev
  - Create profile manually if database trigger doesn't fire
  - Handle case where Supabase puts auth tokens in URL hash fragments (client-side extraction)

- **UUID Validation for Test Users**: Fixed validation errors when using test users with zero-padded UUIDs
  - Created shared `uuidSchema` in `lib/validations.ts` using regex instead of Zod's strict `.uuid()`
  - Applied to `reactivate-client`, `deactivate-client`, and `resend-invite` APIs
  - Accepts any valid UUID format including `00000000-0000-0000-0000-000000000206`

- **Profile Trigger Default Role**: Fixed profile creation trigger to use 'challenger' as default role instead of 'client', and properly respect role from user_metadata
  - New migration: `20260128000000_fix_profile_trigger_default_role.sql`

- **Calculator Data Persistence**: Fixed visitor calculator data being lost after signup:
  - Calculator inputs and results now saved to localStorage for all users (not just logged-in users)
  - `migrateLocalStorageToDatabase` now handles both assessment AND calculator data migration
  - Migration automatically triggers when user authenticates (via `useProfileCompletion` hook)

- **Calculator Modal Infinite Loop**: Fixed "Maximum update depth exceeded" error in calculator modal:
  - Replaced Radix Checkbox with visual-only div (parent handles all click interaction)
  - Added `useCallback` to memoize `handleConditionToggle` function
  - Prevents double event triggering from checkbox + parent onClick

- **Mobile Timeline Optimization**: Mobile-first client timeline experience with touch-friendly navigation:
  - `MobileTimelineView` component with collapsible time periods and scroll-to-now button
  - `TimelineMobileHeader` sticky header with day navigation, completion stats, and filters
  - `TimelineSwipeContainer` for swipe gesture navigation between days (left/right)
  - `TimelineItemSheet` bottom sheet using vaul for native-feeling item details
  - `ScrollToNowButton` floating button to jump to current time period
  - `useSwipeNavigation` hook with threshold detection and haptic feedback support
  - `useOfflineCompletions` hook for offline completion queue with localStorage persistence
  - Touch-friendly 44x44px tap targets following Apple HIG guidelines
  - Mobile viewport detection with SSR-safe hydration handling
  - Horizontal stats layout option for compact progress display
  - Full day navigation allowing preview of all plan days (future days read-only)
  - Shared `PlanDayNavigator` component between admin and client views
  - Comprehensive test coverage for all new components

### Fixed

- **Hydration errors**: Fixed nested button elements causing React hydration errors in mobile view
- **Flash of empty state**: Fixed "Plan Not Configured" flash during SSR/hydration with proper loading states
- **Day navigation**: Fixed day switcher not working due to URL state management issues - simplified to React state

- **Timeline History View & Activity Filters**: Enhanced client timeline with historical navigation and filtering capabilities:
  - `TimelineDateNav` component with calendar picker, prev/next navigation, and "Today" button
  - `TimelineFilters` component with activity type toggles (Meals, Supplements, Workouts, Lifestyle)
  - `TimelineStats` component showing completion percentages, streaks, and trends by type
  - `useTimelineHistory` hook for managing historical data with caching
  - URL-based state persistence for date and filter selections
  - Historical day styling (read-only mode for past days)
  - `completion-stats.ts` utility library for calculating completion metrics
  - Comprehensive test coverage for all new components

- **Client Timeline Dashboard - Today's Plan View**: Complete client-facing timeline dashboard replacing separate diet/workout pages:
  - `ClientTimelineView` component reusing admin's `TimelineGrid` and `DaySelectorTabs` for consistent UI
  - `useClientTimeline` hook with plan completion tracking, macro limits, and day navigation
  - `TimelineTargetsCard` compact component showing calories, protein, carbs, fats with progress bars
  - `TimelineItemExpanded` modal for viewing item details and marking completions
  - Individual item completion - mark each food/supplement/exercise separately within grouped items
  - Partial completion status display ("2/5 done") with Complete All / Clear All buttons
  - "Today" button to quickly return when viewing different days
  - Future day preview with read-only mode (can't mark completions for future days)
  - Plan preview before start date with countdown banner
  - `plan_completions` database table with RLS policies for tracking item completions
  - Simplified client sidebar: removed old Diet/Workout pages, renamed to "Today's Plan"
  - Comprehensive test coverage (33 new tests)

- **Enhanced Client Profile Page**: Added plan information, health conditions, and macro targets sections to the client profile page:
  - `ProfilePlanCard` component showing plan start date, duration, progress bar, days remaining, and end date
  - `ProfileConditionsCard` component displaying medical conditions with expandable descriptions
  - `ProfileTargetsCard` component showing current macro limits (calories, protein, carbs, fats) with date ranges
  - `useClientProfileData` hook for fetching conditions and plan limits with plan progress calculation
  - Badges for "STARTING SOON" and "COMPLETED" plan states
  - Upcoming targets preview when future limits are scheduled
  - Empty states for each section when data not configured
  - Loading skeletons for async data
  - Collapsible sections on mobile
  - Comprehensive test coverage (66 new tests)

- **Daily Plan View for Plans Tab**: Complete redesign of the Plans tab to show a daily view of all 4 plan types:
  - `useDailyPlanData` hook for fetching all plan data (Diet, Supplements, Workout, Lifestyle) for a specific day
  - `PlanDayNavigator` component with day navigation arrows, "Today" badge, and "Go to day" input
  - `DailyDietSection` showing meals grouped by category with calorie/protein totals
  - `DailySupplementsSection` showing supplements grouped by time of day (morning/afternoon/evening)
  - `DailyWorkoutSection` showing exercises grouped by section (warmup/main/cooldown) with duration
  - `DailyLifestyleSection` showing lifestyle activities with target values
  - `DailyPlanView` container with 2x2 grid layout (responsive to single column on mobile)
  - Requires plan_start_date to be set (shows CTA when not set)
  - Warning banner when no macro limits exist for the selected day
  - Edit button disabled when limits are missing for the day
  - Defaults to "today" based on plan_start_date calculation
  - Single "Edit Plan in Timeline" button links to timeline editor
  - Comprehensive test coverage (34 new tests)

### Fixed

- **Copy Day Modal UI**: Limited day selection to 14 days starting from source day instead of showing all days (fixes unwieldy UI for long plans)
- **Day Selector Gap**: Removed flex-1 from day buttons container to eliminate large gap between days and navigation arrows

- **Client Detail Header Enhancement**: Enhanced the admin client detail page header with more useful information at a glance:
  - Gender displayed with icon (♂/♀/⚧) when set
  - Age calculated and displayed from date of birth (e.g., "Age 32")
  - Medical conditions displayed as styled chips/tags below quick stats
  - Graceful handling when DOB, gender, or conditions not set (hidden)
  - Fetches condition names via joined query with medical_conditions table
  - Comprehensive test coverage (19 tests for new display elements)

- **Food-Condition Compatibility Warnings**: Warns admins when adding food items that may be incompatible with a client's medical conditions:
  - `useFoodCompatibility` hook that cross-references food_item_conditions with client conditions
  - `FoodWarningDialog` component showing incompatible conditions with Cancel/Add Anyway options
  - Inline warning indicator in MealItemForm when food is selected
  - Client conditions fetched via `useTimelineData` hook with medical_conditions join
  - Seed data SQL script for testing (`supabase/seed-compatibility-test-data.sql`)
  - Comprehensive test coverage (13 tests for useFoodCompatibility hook)

- **Week-Based Day Selector Navigation**: Improved day selector for plans with many days (>14):
  - Shows 7 days at a time instead of all days (like travel booking sites)
  - Navigation buttons: first week (<<), previous week (<), next week (>), last week (>>)
  - Week indicator showing current range and week number
  - "Go to day..." input for direct navigation to any day
  - Resolves scroll issues with long plans (60+ days)

- **Plan Limits Management UI**: New UI for managing date-range based macro limits for client diet plans:
  - `useClientPlanLimits` hook with CRUD operations using Refine hooks
  - Utility functions for date overlap detection and range categorization (current/future/past)
  - `PlanLimitsManager` component displaying current, future, and past limit ranges
  - Current range highlighted, future ranges with edit/delete buttons, past ranges collapsed
  - `AddLimitRangeModal` for adding/editing limit ranges with form validation
  - Real-time date overlap detection with visual warnings
  - Required fields: max calories, min protein; optional: max protein, min/max carbs, min/max fats, notes
  - Integrated into Plan Settings section of client detail page
  - Comprehensive test coverage (57 tests across 3 test files)

- **Edit Client Profile Modal**: New modal for editing existing client profiles from the admin client detail page:
  - Edit all personal info fields: name, email, phone, date of birth, gender, address
  - Edit plan settings: plan start date, plan duration (with preset buttons and custom input)
  - Manage medical conditions: add/remove conditions with gender restriction indicators
  - Pre-populates all fields with existing client data
  - Uses Refine hooks (`useUpdate`, `useCreate`, `useDeleteMany`) for data mutations
  - Syncs conditions by detecting added/removed conditions
  - "Edit Profile" button added to client detail page header
  - Zod validation schema (`updateClientSchema`) for form validation
  - Comprehensive test coverage (26 tests)

- **Add Client Modal Enhancement**: Enhanced the Add Client modal to collect additional information at client creation:
  - Phone number field with E.164 validation (e.g., +919876543210)
  - Plan Start Date picker to set when Day 1 begins
  - Plan Duration selector with preset buttons (7, 14, 21, 28, 30, 60, 90 days) plus custom input
  - Medical Conditions multi-select that fetches from database, with gender restriction indicators
  - Selected conditions shown as removable tags
  - API route updated to save all new fields and insert client_conditions records
  - Comprehensive test coverage (26 tests)

- **Database Schema - Client Conditions & Plan Limits**: Added foundational database tables for client management:
  - `client_conditions` table to link clients with medical conditions for food compatibility warnings
  - `client_plan_limits` table for date-range based calorie and macro limits with non-overlapping constraint
  - PostgreSQL exclusion constraint using btree_gist to prevent overlapping date ranges per client
  - RLS policies: admins can CRUD, clients can read their own data
  - TypeScript types and comprehensive test coverage (38 type tests passing)
  - Required fields: max_calories_per_day, min_protein_per_day; optional: max_protein, min/max carbs, min/max fats

- **Plan Start Date and Duration Settings**: Added ability to configure client plan start dates and duration:
  - New `plan_start_date` and `plan_duration_days` columns on profiles table
  - Plan Settings UI in client Plans tab showing start date, duration, and calculated end date
  - Day selector tabs now show calendar dates alongside day numbers when start date is set
  - "Today" highlighting for the current day based on plan start date
  - "Go to day" input for quick navigation on plans with many days
  - Scroll buttons for navigating day tabs on long plans (>14 days)
  - Support for plans up to 365 days (removed 7-day limit)
  - Migration to remove day_number upper limit constraints from supplement_plans and lifestyle_activity_plans

- **Plan Date Utilities** (`lib/utils/plan-dates.ts`): New utility functions for working with plan dates:
  - `getDayDate()` - Get calendar date for a day number
  - `getDayNumber()` - Get day number for a calendar date
  - `formatDayLabel()` - Format "Day X - Mon, Jan 27" labels
  - `isToday()`, `isPastDay()`, `isFutureDay()` - Date comparison helpers
  - `parsePlanDate()`, `formatPlanDateForStorage()` - Date parsing utilities
  - Comprehensive test suite (32 tests)

- **Client Management Enhancement Work Items**: Created 7 detailed work items for comprehensive client page improvements:
  - Database schema for client conditions and plan limits tables
  - Add Client modal enhancement with phone, plan settings, conditions
  - Client Profile Editor modal
  - Client Detail Header enhancement with gender, age, conditions display
  - Plan Limits Management UI for date-range based macro limits
  - Plans Tab Redesign with daily view of all 4 plan types
  - Food-Condition Compatibility Warnings when adding diet items

- **Full Lucide Icon Library for IconSelector**: Expanded icon selection from 12 curated icons to 1500+ Lucide icons:
  - Search input to filter icons by name
  - Pagination (60 icons per page) for browsing
  - Selected icon display with name preview
  - Backward compatible with existing icon values (kebab-case storage)

### Changed

- **Admin Sidebar Reorganization**: Reorganized admin navigation with improved grouping:
  - Moved Food Items and Supplements under Configuration section
  - Updated URLs from `/admin/food-database` to `/admin/config/food-items`
  - Updated URLs from `/admin/supplements` to `/admin/config/supplements`
  - Consistent navigation structure across sidebar and mobile nav

- **Admin UI Consistency Improvements**:
  - Added Utensils icon to Food Items table name column (matching Supplements/Exercises pattern)
  - Added Order column to Conditions table (matching Meal Types pattern)
  - Consistent icon + name display pattern across all config tables

- **Admin Lifestyle Activities Library Management**: Full CRUD interface for managing the lifestyle activity types master library:
  - Lifestyle activities list page at `/admin/config/lifestyle-activities` with data table, search by name, filter by category, and pagination (10 items per page)
  - Create activity type page at `/admin/config/lifestyle-activities/create` with form validation
  - Edit activity type page at `/admin/config/lifestyle-activities/edit/[id]` with pre-populated data
  - Reusable `LifestyleActivityTypeForm` component with category selection (8 categories: movement, mindfulness, sleep, hydration, sunlight, social, recovery, other), visual icon picker (12 Lucide icons), default target value/unit, description, rationale, and active toggle
  - `IconSelector` component for visual icon selection with `RenderIcon` and `getIconComponent` helpers
  - Soft delete functionality (deactivates activity types) with confirmation dialog and usage warning for items used in lifestyle plans
  - Zod validation schema with `LIFESTYLE_ACTIVITY_CATEGORIES` and `LIFESTYLE_ACTIVITY_ICONS` constants
  - Navigation link added under Configuration section in admin sidebar and mobile nav
  - Seed SQL file with 10 common lifestyle activities (Daily Steps, Sunlight Exposure, Gratitude Journaling, Evening Walk, Hydration, Sleep, Floor Climbing, Meditation, Social Connection, Active Recovery)
  - 38 new tests for icon selector (16 tests) and form component (22 tests)

- **Admin Exercises Library Management**: Full CRUD interface for managing the exercises master library:
  - Exercises list page at `/admin/config/exercises` with data table, search by name, filter by category, filter by muscle group, and pagination
  - Create exercise page at `/admin/config/exercises/create` with form validation
  - Edit exercise page at `/admin/config/exercises/edit/[id]` with pre-populated data
  - Reusable `ExerciseForm` component with category selection (8 types), muscle group selection (13 groups), equipment, default sets/reps/duration, rest seconds, difficulty rating (1-5 stars), instructions, video URL, and thumbnail URL
  - Soft delete functionality (deactivates exercises) with confirmation dialog and usage warning
  - Zod validation schema for exercise data with EXERCISE_CATEGORIES and MUSCLE_GROUPS constants
  - Navigation link added under Configuration section in admin sidebar and mobile nav

- **Admin Supplements Database Management**: Full CRUD interface for managing the supplements master library:
  - Supplements list page at `/admin/supplements` with data table, search by name, filter by category, and pagination
  - Create supplement page at `/admin/supplements/create` with form validation
  - Edit supplement page at `/admin/supplements/edit/[id]` with pre-populated data
  - Reusable `SupplementForm` component with category selection, dosage fields, instructions, and notes
  - Delete functionality with confirmation dialog and usage protection (prevents deletion if supplement is used in client plans)
  - Zod validation schema for supplement data
  - Navigation links added to admin sidebar and mobile nav
  - Unit tests for the form component (19 tests)

- **Timeline Database Schema and Master Libraries**: Foundation for the "Today's Plan" timeline view:
  - New scheduling enums: `time_type` (fixed, relative, period, all_day), `time_period` (early_morning through before_sleep), `relative_anchor` (wake_up, meals, workout, sleep)
  - Category enums: `supplement_category`, `exercise_category`, `muscle_group`, `lifestyle_activity_category`
  - Master library tables: `supplements`, `exercises`, `lifestyle_activity_types` with reusable definitions
  - Plan tables: `supplement_plans`, `lifestyle_activity_plans` linking clients to library items with scheduling
  - Enhanced `workout_plans` with exercise library reference and timeline scheduling fields
  - Enhanced `diet_plans` with timeline scheduling fields and migration from meal_category
  - RLS policies: admin manages all, clients view active library items and own plans
  - Seed data: 12 common supplements, 37 exercises, 12 lifestyle activity types
  - TypeScript types for all new tables and scheduling interfaces
  - Timeline utility functions for time conversion, relative time calculation, sorting, and display formatting
  - Comprehensive test suite (76 tests, 95% coverage)

- **Bulk Food Import via CSV**: New CSV import functionality for the food database:
  - "Import CSV" button on Food Database page linking to `/admin/food-database/import`
  - Downloadable CSV template with correct column headers
  - Drag-and-drop file upload with visual feedback
  - Client-side CSV parsing using PapaParse library
  - Comprehensive validation: required fields, data types, value ranges
  - Duplicate detection within CSV and against existing database entries
  - Preview table with error highlighting before import
  - Option to skip invalid rows or cancel entire import
  - Batch import with progress indicator
  - Success/failure summary after import

- **Visual Alternatives Linking**: New dedicated page for managing food alternatives at `/admin/food-database/alternatives`:
  - "Manage Alternatives" button on Food Database page
  - Two-panel interface: left panel for selecting primary food, right panel for managing alternatives
  - Search and filter in both panels
  - Visual display of food items with name, calories, protein, and serving size
  - Click-to-add and click-to-remove alternatives
  - Bidirectional linking option (if A→B, also create B→A)
  - Pending changes tracking with add/remove counts
  - Batch save for efficiency
  - Visual indicator showing which foods already have alternatives

- **Client Progress Page with Charts and Photos**: New progress tracking page for clients at `/dashboard/progress`:
  - Tabbed interface with "Progress Charts" and "Photos" tabs
  - Weight trend line chart with date range filtering (30 days, 90 days, All Time)
  - Body measurements trend chart (Arms, Chest, Thighs, Waist)
  - Progress photos gallery grouped by check-in date
  - Side-by-side photo comparison mode with view selector (Front/Side/Back)
  - Photo lightbox for full-size viewing
  - Empty state with CTA to submit first check-in
  - Reuses existing admin components for consistency

- **Editable Client Profile**: Clients can now edit their personal information:
  - Edit button on Personal Information section
  - Editable fields: Full Name, Phone, Date of Birth, Gender, Address
  - Save/Cancel functionality with validation (Full Name required)
  - Success/error feedback messages
  - Account Details section remains read-only (Email, Member Since, Role)

- **Client Profile Page with Photo Upload and Password Reset**: Complete profile management for clients at `/dashboard/profile`:
  - Profile photo upload with preview, supporting JPG/PNG/WebP (max 5MB)
  - Photos stored in Supabase Storage `avatars` bucket with cache-busting URLs
  - Profile details display: name, email, phone, DOB, gender, address, member since
  - Security section with "Change Password" button that sends reset email via Supabase Auth
  - Profile photo displayed in header, sidebar, and mobile navigation
  - Responsive layout with loading skeletons
  - Next.js Image configuration for Supabase storage hostname

- **Client Deactivation Feature**: Admin ability to temporarily disable client access:
  - New database fields: `is_deactivated`, `deactivated_at`, `deactivation_reason` on profiles table
  - Multi-layer enforcement: middleware blocks deactivated users, auth callback redirects on login, login provider returns error
  - API endpoints: `POST /api/admin/deactivate-client` and `POST /api/admin/reactivate-client`
  - Admin UI: "Deactivated" filter tab on clients page, status indicator, deactivate/reactivate action buttons
  - Database migration with indexes for efficient querying

- **Custom Supabase Auth Email Templates**: Branded invite emails for new clients:
  - Custom HTML template with METABOLI-K-AL branding (dark theme, orange accents)
  - Configured in `supabase/config.toml` and pushed via CLI
  - Template includes welcome message, feature list, and branded CTA button

- **Toast Notification System**: Consistent feedback for admin actions across the app:
  - Installed `sonner` toast library with dark theme styling
  - Converted all admin actions from browser alerts to styled toasts
  - Updated: client invite, resend invite, deactivate/reactivate, send message, food database CRUD, config CRUD
  - Kept inline errors for form validation context (auth pages, server validation)

### Changed

- **Simplified Dashboard Navigation**: Removed redundant "Profile" link from sidebar navigation:
  - Profile now accessed only via user mini card at top of sidebar
  - Cleaner navigation focused on feature pages
  - Applied to both desktop sidebar and mobile navigation

- **Invite Performance Optimization**: Removed slow `listUsers()` O(n) check from invite API:
  - Let `inviteUserByEmail()` handle duplicate email detection natively
  - Expected improvement: ~500ms-2s faster per invite (scales with user count)

- **Enhanced Food Item Form with Quantities, Conditions, and Alternatives**: Expanded food item management with three new capabilities:
  - **Quantity Information**: Raw and cooked quantity fields to track weight changes during cooking (e.g., 100g raw chicken = 75g cooked)
  - **Avoid For Conditions**: Multi-select to mark foods that should be avoided for specific medical conditions (e.g., high-sugar foods for diabetics)
  - **Food Alternatives**: Search and link other food items as substitutes for diet plan flexibility
  - New database tables: `food_item_conditions` and `food_item_alternatives` junction tables with proper RLS policies
  - New columns: `raw_quantity` and `cooked_quantity` added to `food_items` table
  - New components: `ConditionSelector` and `FoodAlternativesSelector` for the enhanced form
  - Updated create and edit pages to handle junction table relationships
  - 43 new tests for new components and updated form

- **Admin Configuration for Meal Types and Medical Conditions**: Dynamic admin interface for managing calculator and food form options:
  - New database tables `meal_types` and `medical_conditions` with proper RLS policies
  - Admin CRUD pages at `/admin/config/meal-types` and `/admin/config/conditions`
  - Meal types management with name, slug, display order, and active status
  - Medical conditions management with metabolic impact percentage and gender restrictions
  - New `useMealTypes` and `useMedicalConditions` hooks for fetching from database
  - Calculator modal now fetches conditions dynamically from database
  - Food item form now fetches meal types dynamically from database
  - Fallback to hardcoded defaults when database tables don't exist
  - Configuration section added to admin sidebar navigation
  - 18 new tests for hooks, updated existing tests with proper mocks

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
