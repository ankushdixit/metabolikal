# METABOLI-K-AL - Product Requirements Document

## Executive Summary

METABOLI-K-AL is a two-part digital platform for metabolic health transformation targeting high-performing professionals, C-suite executives, and entrepreneurs. **Part 1** is a marketing landing page with interactive tools (lifestyle assessment, BMR/TDEE calculator, 30-day challenge gamification) for lead generation and brand awareness. **Part 2** is a client management platform replacing Google Sheets workflows, enabling personalized diet plans, workout tracking, progress check-ins, and coach review capabilities. The platform combines sophisticated gamification with science-backed metabolic calculations to convert visitors into paying clients and streamline the client coaching experience.

---

## Problem Statement

### The Problem

Metabolic transformation coach Shivashish Sinha faces two interconnected challenges:

1. **Lead Generation & Qualification**: High-performing professionals need compelling, interactive tools to understand their metabolic health status before booking coaching calls. Generic landing pages don't demonstrate expertise or provide value upfront.

2. **Client Management Inefficiency**: Current client management via Google Sheets is time-consuming, error-prone, and doesn't scale. Coaches spend excessive time on data entry rather than coaching. Clients lack a professional portal to view plans and submit check-ins.

### Goals

| Metric                     | Target         | Measurement                                |
| -------------------------- | -------------- | ------------------------------------------ |
| Assessment completion rate | > 50%          | Visitors who complete all 7 sliders        |
| Calculator completion rate | > 40%          | Visitors who complete BMR/TDEE calculation |
| Challenge signup rate      | > 30%          | Visitors who start 30-day challenge        |
| Strategy call booking rate | > 10%          | Visitors who book via Calendly             |
| Coach review time          | < 5 min/client | Time to review weekly check-in             |
| Client check-in completion | 90%+           | Weekly check-in submission rate            |
| Data management time saved | 80% reduction  | Coach admin time vs Google Sheets          |

### Non-Goals

- Mobile native apps (web-responsive only)
- Real-time chat or messaging system
- Payment processing or subscription management
- Email marketing automation
- Wearable device integrations
- AI-powered recommendations
- Multi-coach/team features

---

## User Personas

### Persona 1: The High-Performing Executive (Visitor)

- **Who**: C-suite executives, entrepreneurs, global professionals aged 35-55 managing demanding careers
- **Needs**: Quick assessment of metabolic health, actionable insights, proof that coaching works for people like them
- **Pain Points**: Decision fatigue, energy crashes at 3PM, tried multiple diets without lasting results, skeptical of generic fitness programs
- **Journey**: Discovers site via social/referral → Takes assessment for curiosity → Sees concerning score → Explores method/programs → Books strategy call

### Persona 2: The Active Client

- **Who**: Paying coaching clients in one of three program tiers (Core Reset, Rhythm Rewire, Fulmane Experience)
- **Needs**: Easy access to daily diet/workout plans, ability to swap food choices, track progress, submit weekly check-ins
- **Pain Points**: Forgetting what to eat, losing motivation without visible progress, difficult to coordinate check-ins via messaging
- **Journey**: Logs in daily → Views today's meals/workout → Logs food consumption → Marks workouts complete → Submits weekly check-in with photos

### Persona 3: The Coach (Admin)

- **Who**: Shivashish Sinha, the founder and primary coach
- **Needs**: Quick overview of all clients, easy check-in review, ability to modify diet/workout plans, flag clients needing attention
- **Pain Points**: Hours spent in spreadsheets, missing client updates, no visual progress tracking, manual data entry
- **Journey**: Reviews dashboard → Identifies clients needing attention → Reviews check-ins with side-by-side comparison → Adds notes/feedback → Updates plans as needed

---

## Technical Constraints

### Stack

- **Framework**: `dashboard_refine` (Refine + Next.js 16 + shadcn/ui)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password)
- **File Storage**: Supabase Storage (check-in photos, avatars)
- **Deployment**: Vercel (metabolikal.com)

### External Dependencies

| Service            | Purpose                     | Rate Limits                      | Auth Method   |
| ------------------ | --------------------------- | -------------------------------- | ------------- |
| Supabase           | Auth, DB, Storage, Realtime | Free tier: 500MB DB, 1GB storage | API Key + RLS |
| Calendly           | Strategy call booking       | N/A (embed only)                 | Public embed  |
| YouTube            | Video embeds                | N/A (iframe)                     | Public embed  |
| Google Tag Manager | Analytics                   | N/A                              | GTM-ML5TLT5R  |

### Performance Requirements

- Landing page: LCP < 2.5s, FID < 100ms, CLS < 0.1
- API response time: < 200ms for CRUD operations
- Image uploads: Support files up to 10MB
- Concurrent users: Support 100+ simultaneous visitors, 20+ logged-in clients

### Security Requirements

- **Authentication**: Supabase Auth with email/password, secure session management
- **Authorization**: Role-based (admin/client) with Row-Level Security (RLS) in PostgreSQL
- **Data handling**: Medical conditions data encrypted at rest (Supabase default), never exposed in client bundles
- **File uploads**: Validate image types, virus scanning via Supabase policies

### Technical Rules

- **Must use**: Refine hooks for ALL CRUD operations, shadcn/ui components, Zod for validation
- **Must not use**: Custom fetch/axios for CRUD, alternative UI libraries, direct SQL outside migrations
- **Browser support**: Chrome, Firefox, Safari, Edge (latest 2 versions), iOS Safari, Android Chrome

---

## MVP Definition

### Must Have (MVP)

**Part 1: Landing Page**

- [ ] Hero section with brand messaging and CTAs
- [ ] Transformations section with Real Results modal
- [ ] Revelation section with High-Performer Trap and Elite Lifestyles modals
- [ ] About section with Meet Expert and Method modals
- [ ] Difference section with accordion cards
- [ ] Challenge section linking to challenge hub
- [ ] Footer with navigation and social links
- [ ] Assessment modal (7 lifestyle sliders)
- [ ] Calculator modal (BMR/TDEE with medical conditions)
- [ ] Results modal (calculated metabolic numbers)
- [ ] Calendly integration modal
- [ ] 30-Day Challenge Hub (3 tabs: Today's Tasks, Journey, Calendar)
- [ ] Gamification system (points, streaks, week unlocking)
- [ ] Mobile-responsive design
- [ ] Floating trays (Quick Access, Points, Day Counter)

**Part 2: Client Platform**

- [ ] Authentication (login/registration)
- [ ] Client dashboard with daily overview
- [ ] Diet plan view with meal cards
- [ ] Food alternatives system with calorie color-coding
- [ ] Workout plan view with completion tracking
- [ ] Check-in form (measurements, photos, ratings)
- [ ] Check-in history view
- [ ] Admin dashboard with client list
- [ ] Admin check-in review with progress charts
- [ ] Food database management (admin)

### Should Have (Post-MVP)

- [ ] Elite Programs modal with detailed tiers
- [ ] Body Fat Guide modal
- [ ] Progress photos gallery comparison
- [ ] Manual food logging with search
- [ ] Workout video links
- [ ] Export check-in data (CSV)
- [ ] Email notifications for check-in reminders
- [ ] Dark mode toggle

### Won't Have (Out of Scope)

- Native mobile apps
- Real-time messaging/chat
- Payment processing
- Multi-language support
- Wearable integrations (Apple Watch, Fitbit)
- AI meal recommendations
- Social features (leaderboards, community)
- Automated email sequences

---

## User Stories

### Phase 0: Infrastructure & Foundation

#### Story 0.1: Health Check & Supabase Configuration

**As a** developer
**I want** working infrastructure with database connectivity
**So that** the application has a solid foundation

**Acceptance Criteria:**

**Health Check Endpoint:**

1. Given the server is running
   When I call GET /api/health
   Then I receive `{ status: "ok", timestamp: [ISO date], database: "connected" }`
   And response time is < 100ms

2. Given the database is unreachable
   When I call GET /api/health
   Then I receive `{ status: "degraded", database: "disconnected" }`
   And HTTP status is 503

**Supabase Configuration:** 3. Given valid environment variables
When the app starts
Then Supabase client initializes without errors
And auth, database, and storage are accessible

4. Given missing SUPABASE_URL or SUPABASE_ANON_KEY
   When the app tries to start
   Then it fails with clear error message
   And no partial initialization occurs

**Technical Notes:**

- Create `lib/supabase.ts` with client configuration
- Configure Refine data provider with `@refinedev/supabase`
- Set up environment validation with Zod in `lib/env.ts`
- Create `/api/health/route.ts`

**Testing Requirements:**

- Unit: Environment validation catches missing vars
- Unit: Health check returns correct format
- Integration: Supabase client can query database

**Dependencies:** None
**Complexity:** M

---

#### Story 0.2: Database Schema Migration

**As a** developer
**I want** all database tables created with proper security
**So that** the application has proper data storage

**Acceptance Criteria:**

1. Given Supabase is connected
   When I run migrations
   Then all 11 tables are created:
   - profiles, food_items, diet_plans, food_alternatives
   - workout_plans, food_logs, workout_logs, check_ins
   - challenge_progress, assessment_results
     And all foreign key constraints are in place
     And RLS policies are enabled

2. Given RLS is enabled on profiles
   When a client queries profiles
   Then they only see their own profile
   And admins can see all profiles

3. Given RLS is enabled on diet_plans
   When a client queries diet_plans
   Then they only see their own plans
   And admins can see and modify all plans

4. Given RLS is enabled on check_ins
   When a client creates a check-in
   Then it's associated with their user ID
   And they can only view their own check-ins
   And admins can view and add notes to all check-ins

5. Given storage buckets are configured
   Then `checkin-photos` bucket exists (private)
   And `avatars` bucket exists (public)
   And RLS policies restrict access appropriately

**Technical Notes:**

- Database schema detailed in Data Models section
- Use Supabase migrations or SQL editor
- Create indexes on: client_id (all tables), day_number, logged_at, submitted_at
- Storage path pattern: `checkin-photos/{user_id}/{date}/{view}.jpg`

**Testing Requirements:**

- Integration: Each table accepts valid data
- Integration: RLS policies enforce access control
- Integration: Foreign key constraints work

**Dependencies:** Story 0.1
**Complexity:** L

---

### Phase 1: Landing Page

#### Story 1.1: Landing Page Structure & All Sections

**As a** visitor
**I want** to see a professional landing page with all content sections
**So that** I can explore METABOLI-K-AL's offerings and take action

**Acceptance Criteria:**

**Header:**

1. Given I visit the homepage
   When the page loads
   Then I see the header with:
   - Circular logo + "METABOLIKAL" text (K emphasized)
   - Desktop navigation: Home, Transformations, About, Challenge
   - Two header buttons: "Take Assessment", "Book a Call"
     And the header is fixed at the top

2. Given I am on mobile (< 640px)
   When I view the header
   Then navigation links are hidden
   And a hamburger menu icon is visible
   When I tap the hamburger
   Then a mobile menu slides open with: Home, Transformations, About, Challenge, Take Assessment, Book a Call, 30-Day Challenge

3. Given I click a navigation link
   When the target section exists
   Then the page smooth-scrolls to that section
   And the URL hash updates (#about, #transformations, etc.)

**Hero Section:** 4. Given I am on the landing page
When the hero section loads
Then I see:

- Main quote: "MY CLIENTS COMPLAIN THAT I MAKE THEM EAT TOO MUCH"
- Attribution: "— Shivashish Sinha - Founder | Metaboli-k-al"
- Subtitle: "METABOLI-K-AL is the structured lifestyle reset engineered for high-performing professionals who live off calendars, deadlines, and chaos."
- Three stacked CTA buttons with pulse animations:
  - Primary (red): "Claim Your FREE Strategy Session"
  - Secondary (orange): "Not Sure if You Need a Coach? Take the Assessment"
  - Tertiary (green): "Prove Your Consistency - Earn Your Personalized Metaboli-k-al Plan"
- Subtext: "30 days of tracking → Unlock your custom plan"
- Tagline: "Reprogram your rhythm. Master your metabolism."
- Feature stats box: "4 Phases | COMPLETE SYSTEM", "180 Minutes | WEEKLY TRAINING", "Zero Burnout | SUSTAINABLE INTENSITY"

5. Given I click "Claim Your FREE Strategy Session"
   Then the Calendly modal opens

6. Given I click "Take the Assessment"
   Then the Assessment modal opens

7. Given I click "Prove Your Consistency"
   Then the Challenge Hub modal opens

**Transformations Section:** 8. Given I scroll to the transformations section (id="transformations")
Then I see:

- Title: "REAL PEOPLE. REAL TRANSFORMATIONS."
- Subtitle: "See the results of executives who mastered their metabolic operating system"
- Button: "View Transformation Gallery"

9. Given I click "View Transformation Gallery"
   Then the Real Results modal opens

**Revelation Section:** 10. Given I view the revelation section
Then I see: - Badge: "THE REVELATION" - Title: "YOU DON'T LACK DISCIPLINE. YOUR SYSTEM LACKS CALIBRATION." - Intro: "The inconvenient truth about why high-performers struggle with energy and transformation" - Two buttons: "THE HIGH-PERFORMER TRAP: What You Don't Know Yet →", "See Who We Work With →"

11. Given I click "THE HIGH-PERFORMER TRAP"
    Then the High-Performer Trap modal opens

12. Given I click "See Who We Work With"
    Then the Elite Lifestyles modal opens

**About Section:** 13. Given I view the about section (id="about")
Then I see: - Title: "ABOUT METABOLI-K-AL" - Subtitle: "Because Metabolism is King — and you deserve a sovereign approach to transformation" - Three quick link buttons: - "Meet Shivashish Sinha - The Creator" → opens Meet Expert modal - "The Metaboli-k-al Method" → opens Method modal - "Metaboli-k-al transformation programs" → opens Elite Programs modal

14. Given I view the accordion cards
    Then I see two expandable cards (collapsed by default):
    - "THE DISCOVERY" - Content about founding story and science
    - "WHY WE'RE METABOLI-K-AL" - Content about metabolism being king

15. Given I click an accordion card header
    Then it expands to show content
    And other cards remain in their current state

**Difference Section:** 16. Given I view the difference section
Then I see: - Title: "THE METABOLI-K-AL DIFFERENCE" - Three accordion cards: - "Personal, Not Automated" - "Every elite client works directly with Shivashish..." - "Science-Based, Tested" - "This isn't trendy—it's tested..." - "Built for Elite Lifestyles" - "No extreme protocols, no unsustainable demands..." - Bottom statement: "YOU DON'T NEED MORE HUSTLE, YOU NEED RHYTHM."

**Challenge Section:** 17. Given I view the challenge section (id="challenge")
Then I see: - Badge: "STILL NOT SURE?, TAKE THE CHALLENGE" - Title: "START YOUR METABOLIC CHALLENGE" - Subtitle: "Join professionals transforming their metabolic systems with proven strategies" - Button: "How the 30-Day Challenge Works" → opens User Guide modal - Button: "Launch 30-Day Challenge Hub" → opens Challenge Hub modal - Tags: "Science-Backed", "Personalized", "Sustainable"

**Footer:** 18. Given I scroll to the footer
Then I see five sections: - Logo + tagline "Reset Your Rhythm, Reclaim Your Life" + social icons (YouTube, Instagram) - Quick Links: Home, Transformations, About, Challenge (scroll to sections) - Programs: Elite Programs, The Method, 30-Day Hall of Fame (open modals) - Get Started: Take Assessment button, Book Strategy Call button - Copyright: "© 2024 METABOLI-K-AL. All rights reserved." + social links

19. Given I click YouTube icon
    Then new tab opens to https://youtube.com/@Metabolikal_1

20. Given I click Instagram icon
    Then new tab opens to https://instagram.com/metabolikal

**Technical Notes:**

- Create `app/(public)/page.tsx` for landing page
- Create `app/(public)/layout.tsx` for public layout
- Create component structure:
  - `components/landing/header.tsx`
  - `components/landing/sections/hero.tsx`
  - `components/landing/sections/transformations.tsx`
  - `components/landing/sections/revelation.tsx`
  - `components/landing/sections/about.tsx`
  - `components/landing/sections/difference.tsx`
  - `components/landing/sections/challenge.tsx`
  - `components/landing/footer.tsx`
- Use shadcn/ui Accordion component for expandable cards
- Dark background (#0a0a0a) with color accents: red (#FF0000), orange (#FF6B00), gold (#FFD700), green (#10b981)
- CSS animations: pulse-glow, pulse-glow-green, pulse-glow-gold
- Use section IDs for navigation: home, transformations, about, challenge

**Testing Requirements:**

- Unit: Header renders all navigation items
- Unit: Mobile menu toggles correctly
- Unit: All CTAs render with correct text
- Unit: Accordions expand/collapse correctly
- Unit: All section content renders
- E2E: Navigation scrolls to correct sections
- E2E: Modal trigger buttons work

**Dependencies:** Story 0.1
**Complexity:** L

---

#### Story 1.2: Content & Information Modals

**As a** visitor
**I want** to view detailed information in modals
**So that** I can learn more without leaving the page

**Acceptance Criteria:**

**Real Results Modal:**

1. Given I open the Real Results modal
   Then I see:
   - Title: "Real People. Real Transformations."
   - YouTube section: "Watch Real Client Transformations" with horizontal scrollable carousel of video embeds
   - Main transformation results image (proven-results-v2.jpg)
   - Social section: "Connect With Our Community"
   - Three Instagram cards:
     - "Before & After Stories" - "Real clients, real results, real transformations"
     - "Client Wins" - "Daily posts of metabolic breakthroughs"
     - "Learn & Level Up" - "Metabolic tips & transformation strategies"
   - Main Instagram button: "Follow @metabolikal for Daily Transformations" → opens instagram.com/metabolikal

**Meet Expert Modal:** 2. Given I open the Meet Expert modal
Then I see:

- Title: "Meet Your Expert"
- Expert photo (shivashish-lifestyle.jpg)
- Name: "Shivashish Sinha"
- Title: "Founder & Metabolic Transformation Specialist"
- Quote: "Fat loss isn't about eating less. It's about burning better..."
- Three paragraphs of personal story (starting with "I was exactly where you are...")
- Credentials table:
  - Specialization: High-Performing Professionals | Executive Health
  - Philosophy: Reset Your Rhythm, Reclaim Your Life
- Social links: "Follow My Journey" (Instagram), "Watch, Learn & Level Up" (YouTube)
- CTA: "Reset your Rhythm" → opens Calendly modal

**The Method Modal:** 3. Given I open the Method modal
Then I see:

- Title: "The METABOLI-K-AL Method"
- Subtitle: "Beyond Fat Loss: Executive Metabolic Mastery"
- Intro quote about elite transformation
- Four phase cards:

| Phase | Name             | Subtitle         | Duration |
| ----- | ---------------- | ---------------- | -------- |
| 0     | BASELINE & AUDIT | Foundation Phase | 4-5 days |
| 1     | REBALANCE        | Reset Phase      | -        |
| 2     | REWIRE           | Building Phase   | -        |
| 3     | REINFORCE        | Freedom Phase    | -        |

Each phase showing: Purpose, Tools/Includes list, Outcome

- Phase 0 includes: Lifestyle & rhythm audit, Goal-setting & optimization framework, Personalized metabolic strategy
- Phase 1 includes: Glucose optimization protocols, Premium anti-inflammatory nutrition, Circadian rhythm & sleep optimization, Executive movement & mindfulness
- Phase 2 includes: Strength & mobility protocols, Macro precision & timing, High-performer routines, Executive consistency systems
- Phase 3 includes: Executive dining & social protocols, Strategic fasting & nutrition timing, Performance journaling, Identity-based transformation

- Five Pillars section with cards:
  1.  Metabolic Reset Protocol
  2.  Rhythm-Based Nutrition
  3.  Strategic Movement Design
  4.  Stress & Recovery Optimization
  5.  Mindset & Identity Transformation

**Elite Programs Modal:** 4. Given I open the Elite Programs modal
Then I see:

- Title: "Elite Transformation Programs"
- Intro: "Three premium tiers of coaching..."
- Three program cards:

**Core Reset** (Monthly Coaching - Starting Point):

- Personalized onboarding & comprehensive assessment
- Weekly routines & progress tracking
- WhatsApp daily check-ins & accountability
- Custom food strategy for your lifestyle integration
- 4 phase progression system
- Perfect for: Executives ready to establish foundational health habits

**Rhythm Rewire** (Quarterly Intensive - MOST POPULAR badge):

- Everything in Core Reset +
- Bi-weekly 1:1 coaching calls with Shivashish
- Periodized training programs (4-phase system)
- Executive stress management toolkit
- Sleep optimization & leadership integration
- Bounce-back protocols for setbacks
- Perfect for: Busy executives who want complete transformation

**The Fulmane Experience** (4-Month Elite Mentorship - Elite Level):

- Everything in Rhythm Rewire +
- Weekly 1:1 strategy sessions with Shivashish
- Access to exclusive content library
- 24/7 WhatsApp priority support
- Leadership & executive identity coaching
- VIP priority support & direct access
- Perfect for: C-suite executives who want the ultimate transformation

- "All Programs Include" section:
  - The METABOLI-K-AL Method features
  - Performance Integration features

- CTA: "Book Your Strategy Session" → opens Calendly modal

**Body Fat Guide Modal:** 5. Given I open the Body Fat Guide modal (from Calculator)
Then I see:

- Title: "Body Fat Percentage Guide"
- Intro about estimation vs professional methods

Men's ranges:
| Range | Category | Description |
|-------|----------|-------------|
| 5-9% | Essential | Competitive bodybuilders |
| 10-14% | Athletic | Fitness models |
| 15-19% | Fitness | Active individuals |
| 20-24% | Average | General population |
| 25%+ | Elevated | Higher health risk |

Women's ranges:
| Range | Category | Description |
|-------|----------|-------------|
| 10-14% | Essential | Competitive athletes |
| 15-19% | Athletic | Fitness competitors |
| 20-24% | Fitness | Active women |
| 25-31% | Average | General population |
| 32%+ | Elevated | Higher health risk |

- Quick Estimation Tips section
- "Close Guide" button → returns to Calculator modal

**High-Performer Trap Modal:** 6. Given I open the High-Performer Trap modal
Then I see:

- Title: "THE HIGH-PERFORMER TRAP REVEALED"
- Three trap items:
  1.  "Decision Fatigue Hits at 3PM" - Million-dollar decisions compromised by metabolic crashes
  2.  "Peak Performance Inconsistency" - Brilliant one day, brain fog the next
  3.  "'Tried Everything' Frustration" - Elite strategies that work for everyone else fail you
- Revelation section: "You weren't designed for generic solutions... They're lacking a METABOLIC OPERATING SYSTEM designed for their demands."
- Three CTAs:
  - "Claim Your FREE Strategy Session" → Calendly modal
  - "Take the Metabolic Assessment" → Assessment modal
  - "Start the 30-Day Challenge" → Challenge Hub modal
- Footer: "Choose your path to metabolic optimization"

**Elite Lifestyles Modal:** 7. Given I open the Elite Lifestyles modal
Then I see:

- Title: "WE UNDERSTAND YOUR LIFESTYLE"
- Six lifestyle cards:
  1.  C-SUITE EXECUTIVES - "Where 9-5 isn't even a concept—just meetings, leadership, and perpetual demands."
  2.  HIGH-PERFORMANCE ENTREPRENEURS - "Who answer to no one but their vision and performance metrics."
  3.  GLOBAL PROFESSIONALS - "Where 6 countries in 8 weeks means metabolic chaos—not boundaries."
  4.  ELITE PERFORMERS - "Who live to scale peak performance, not survive the hamster wheel."
  5.  PROFESSIONALS - "Whose demanding careers require metabolic excellence."
  6.  NOW YOU!! (highlighted) - "Ready for your transformation?"
- CTA: "Claim Your FREE Strategy Session" → Calendly modal

**Calendly Modal:** 8. Given I open the Calendly modal
Then I see:

- Title: "Book Your Strategy Call"
- Subtitle: "Let's engineer your metabolic transformation"
- Embedded Calendly widget (functional booking interface)
- Close button

9. Given the Calendly widget loads
   Then I can select available times
   And complete booking without leaving the modal

**Technical Notes:**

- Create modal components in `components/landing/modals/`:
  - real-results-modal.tsx
  - meet-expert-modal.tsx
  - method-modal.tsx
  - elite-programs-modal.tsx
  - body-fat-guide-modal.tsx
  - high-performer-trap-modal.tsx
  - elite-lifestyles-modal.tsx
  - calendly-modal.tsx
- Use shadcn/ui Dialog component as base
- Load Calendly scripts: https://assets.calendly.com/assets/external/widget.js
- YouTube embeds use iframe with privacy-enhanced mode
- All modals should have close button and backdrop click to close

**Testing Requirements:**

- Unit: All modals render with correct content
- Unit: Phase cards display all information
- Unit: Program cards show correct features
- Unit: CTAs in modals trigger correct actions
- Integration: Calendly widget loads and is interactive
- Integration: YouTube embeds load

**Dependencies:** Story 1.1
**Complexity:** L

---

#### Story 1.3: Assessment, Calculator & Results Flow

**As a** visitor
**I want** to assess my lifestyle and calculate my metabolic numbers
**So that** I understand my health status and next steps

**Acceptance Criteria:**

**Assessment Modal:**

1. Given I open the Assessment modal
   Then I see:
   - Title: "METABOLI-K-AL Assessment"
   - Intro: "Complete your lifestyle assessment to discover your metabolic health score and personalized action plan."
   - 7 sliders with icons and labels
   - Cancel and "Continue to Calculator" buttons

2. Given I view each slider (range 0-10, default 5)
   Then I see:

   | #   | Slider                     | Icon         | Low Label                      | High Label                    |
   | --- | -------------------------- | ------------ | ------------------------------ | ----------------------------- |
   | 1   | Sleep & Recovery           | bed          | Tossing, turning, waking tired | 8h deep sleep, wake refreshed |
   | 2   | Body Confidence            | heart        | Avoid mirrors, hide body       | Command presence              |
   | 3   | Nutrition Strategy Mastery | utensils     | Stress eating, guilt cycles    | Fuel for performance          |
   | 4   | Mental Clarity             | brain        | Foggy, slow decisions          | Laser-sharp execution         |
   | 5   | Stress Management          | shield-heart | Reactive, overwhelmed          | Calm under pressure           |
   | 6   | Support System             | users        | Isolated, going solo           | Elite peer support            |
   | 7   | Hydration                  | droplet      | Barely drinking, dehydrated    | Optimal hydration (3-4L/day)  |

3. Given I drag a slider
   Then the value updates in real-time (0-10)
   And visual feedback shows the new position

4. Given I click "Cancel"
   Then the modal closes
   And no data is saved

5. Given I click "Continue to Calculator"
   Then the Assessment modal closes
   And the Calculator modal opens
   And my slider values are preserved in state

**Calculator Modal:** 6. Given the Calculator modal opens
Then I see:

- Title: "Metabolic Calculator"
- Intro: "Enter your physical metrics to calculate your personalized metabolic numbers."
- Form fields for physical metrics
- Medical conditions section
- Privacy notice and disclaimer
- Cancel and "Calculate Results" buttons

7. Given I view the form fields
   Then I see:
   - Gender (select): Male, Female
   - Age (number): "Enter your age"
   - Current Weight (number, kg): "Enter your weight"
   - Height (number, cm): "Enter your height"
   - Body Fat % (number, optional): with "Don't know your body fat %? View guide" link
   - Activity Level (select)
   - Goal (select): Fat Loss, Maintain Weight, Muscle Gain
   - Goal Weight (number, kg): "This will help us calculate your estimated timeline..."

8. Given I view Activity Level options
   Then I see:
   - Sedentary (little or no exercise) - multiplier 1.2
   - Lightly Active (1-3 days/week) - multiplier 1.375
   - Moderately Active (3-5 days/week) - multiplier 1.55
   - Very Active (6-7 days/week) - multiplier 1.725
   - Extremely Active (physical job + training) - multiplier 1.9

9. Given I view Medical Conditions section
   Then I see checkboxes with metabolic impact:
   - Hypothyroidism (Underactive Thyroid) - Reduces metabolism by ~8%
   - PCOS (Female only) - Reduces metabolic efficiency by ~10%
   - Type 2 Diabetes - Reduces metabolic efficiency by ~12%
   - Insulin Resistance / Pre-diabetes - Reduces metabolic efficiency by ~10%
   - Sleep Apnea - Reduces metabolism by ~7% (poor recovery)
   - Metabolic Syndrome - Significant metabolic impact (~15%)
   - On Thyroid Medication (Managed) - Minor residual impact (~3%)
   - Chronic Fatigue Syndrome - Reduces metabolic function (~8%)
   - None of the above - I don't have any of these conditions (0%)

10. Given I check/uncheck medical conditions
    Then "Estimated Metabolic Impact: X%" updates in real-time
    And impacts sum (capped at reasonable maximum)

11. Given I click "View guide" link
    Then the Body Fat Guide modal opens
    And Calculator modal remains in background

12. Given I see the privacy notice
    Then I see: "Your medical information is private and never shared."
    And disclaimer: "This calculator provides estimates only and does not replace professional medical advice."

13. Given I leave required fields empty
    When I click "Calculate Results"
    Then validation errors show inline:
    - "Gender is required"
    - "Age is required"
    - "Weight is required"
    - "Height is required"
    - "Activity level is required"
    - "Goal is required"

14. Given I fill all required fields
    When I click "Calculate Results"
    Then calculations run using:

    **BMR (Mifflin-St Jeor):**
    - Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
    - Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161

    **BMR with Body Fat (Katch-McArdle):**
    - Lean Mass = weight × (1 - bodyFat/100)
    - BMR = 370 + (21.6 × leanMass)

    **TDEE:**
    - TDEE = BMR × activityMultiplier

    **Adjusted for Medical Conditions:**
    - adjustedTDEE = TDEE × (1 - totalMetabolicImpact/100)

    **Target Calories:**
    - Fat Loss: TDEE - 500
    - Maintain: TDEE
    - Muscle Gain: TDEE + 300

    And the Results modal opens

**Results Modal:** 15. Given calculations complete
When the Results modal opens
Then I see: - Title: "Your METABOLI-K-AL Results" - Metabolic Health Score (0-100) - Lifestyle Score (average of 7 sliders × 10) - BMR value - TDEE value - Target Calories (based on goal) - Protein recommendation - Personalized insights based on scores

16. Given my health score is < 50
    Then I see urgent messaging: "Your metabolic system needs a reset..."

17. Given my health score is 50-70
    Then I see moderate messaging: "Good foundation with optimization opportunities..."

18. Given my health score is > 70
    Then I see positive messaging: "Strong metabolic base, let's fine-tune..."

19. Given I click "Share Results"
    Then share options appear (copy link, social share)

20. Given I click "Book Metabolic Breakthrough Call"
    Then the Calendly modal opens

21. Given I complete the full assessment flow
    Then results save to assessment_results table (with visitor_id from localStorage)
    And gamification points are awarded (assessment + calculator completion)

**Technical Notes:**

- Create `components/landing/modals/assessment-modal.tsx`
- Create `components/landing/modals/calculator-modal.tsx`
- Create `components/landing/modals/results-modal.tsx`
- Create `hooks/use-calculator.ts` for BMR/TDEE calculation logic
- Create `hooks/use-assessment.ts` for lifestyle score calculation
- Use react-hook-form with Zod validation
- Store visitor_id in localStorage for anonymous tracking
- Use shadcn/ui Slider component
- Activity multipliers: { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extreme: 1.9 }
- Medical impacts: { hypothyroidism: 8, pcos: 10, diabetes: 12, insulin: 10, apnea: 7, metabolic: 15, thyroidMed: 3, fatigue: 8 }

**Testing Requirements:**

- Unit: All 7 sliders render with correct labels
- Unit: Slider values update on drag
- Unit: Form validation shows errors for required fields
- Unit: BMR calculations are correct for male/female
- Unit: Katch-McArdle formula works with body fat
- Unit: TDEE calculations apply correct multipliers
- Unit: Medical condition impacts sum correctly
- Unit: Target calories adjust based on goal
- Unit: Health score calculation is correct
- Integration: Results save to database with visitor_id

**Dependencies:** Story 1.1
**Complexity:** L

---

#### Story 1.4: Gamification System & Challenge Hub

**As a** visitor
**I want** to participate in the 30-day challenge with gamification
**So that** I build habits and stay motivated

**Acceptance Criteria:**

**User Guide Modal:**

1. Given I open the User Guide modal
   Then I see:
   - Title: "How the 30-Day Challenge Works"
   - Welcome: "Welcome to Your Transformation Journey!"
   - Description of the 30-Day METABOLI-K-AL Challenge

2. Given I view the 5 steps
   Then I see:
   1. Complete Prerequisites - Take the Health Assessment and complete the Advanced Calculator
   2. Track 5 Daily Metrics - Log Steps, Water, Floors, Protein, Sleep
   3. Earn Points Daily - Up to 150 points per day
   4. Progressive Targets - Each target increases by 10% based on previous achievement
   5. Unlock New Weeks - Complete 90% of each week to unlock the next

3. Given I view the points table
   Then I see:
   | Metric | Target | Points |
   |--------|--------|--------|
   | Daily Steps | 7k→15pts, 10k→30pts, 15k→45pts | 15-45 |
   | Water Intake | 3.0-4.5 Liters | 15 |
   | Floors Climbed | 4→15pts, 14+→45pts | 15-45 |
   | Protein | 70g+ (based on weight) | 15 |
   | Sleep Hours | 7+ hours | 15 |
   | Daily Check-in | Submit your log | 15 |
   | **MAXIMUM DAILY** | | **150** |

4. Given I view the 6 key features
   Then I see:
   - Same-Day Edits - Edit your log unlimited times on the same day
   - Progressive Targets - Tomorrow's target = Today's achievement × 1.10
   - Week Unlocking - Complete 90% of each week to unlock the next
   - One-Per-Day Points - Points awarded once daily
   - 30-Day Calendar - Visual calendar shows progress
   - Completion Certificate - Earn a personalized certificate after 30 days

5. Given I view Tips for Success
   Then I see 7 tips including: Log daily, Start small, Use edits wisely, Track progress, 90% rule, Zero is okay, Stay motivated

6. Given I click "Launch Challenge Hub Now"
   Then the Challenge Hub modal opens

**Challenge Hub Modal - Overview:** 7. Given I open the Challenge Hub modal
Then I see:

- Title: "30-Day METABOLI-K-AL Challenge Hub"
- Overview stats bar: Current Day, Total Points, Week Unlocked, Completion %
- Three tabs: Today's Tasks, Journey So Far, 30-Day Calendar

8. Given I am a first-time visitor
   Then I see: Day 1, 0 pts, Week 1, 0%

9. Given I have previous progress
   Then stats reflect my actual data from localStorage or database

**Today's Tasks Tab:** 10. Given I am on Today's Tasks tab
Then I see: - Day indicator: "Day [X] - Daily Tasks" - Instructions: "Complete all tasks to earn maximum points and unlock tomorrow!" - 5 metric input fields: - Steps (number) - Water (liters, number) - Floors Climbed (number) - Protein (grams, number) - Sleep Hours (number) - Points display: "Today's Metrics Points: [X] pts" - Reflection section: - "How are you feeling today?" (text input) - "What's your focus for tomorrow?" (text input) - "Today's Points: X / 150" - "Save Today's Progress" button - Note: "Points will be finalized tomorrow. You can edit today's log anytime!"

11. Given I enter values in metric fields
    Then points calculate in real-time:
    - Steps: 0-6999→0pts, 7000-9999→15pts, 10000-14999→30pts, 15000+→45pts
    - Water: <3.0L→0pts, 3.0L+→15pts
    - Floors: 0-3→0pts, 4-13→15pts, 14+→45pts
    - Protein: <70g→0pts, 70g+→15pts
    - Sleep: <7h→0pts, 7h+→15pts
    - Check-in bonus: 15pts (for saving)

12. Given I click "Save Today's Progress"
    When all fields have values (including 0)
    Then data saves to localStorage (anonymous) or database (logged in)
    And success message appears
    And stats update

13. Given I try to save without any values
    Then I see prompt: "Please enter at least one metric"

14. Given it's after midnight
    When I try to edit yesterday's log
    Then I am prevented from editing
    And I see: "Yesterday's log is locked"

**Journey So Far Tab:** 15. Given I am on Journey So Far tab
Then I see: - Title: "Your Journey So Far" - Subtitle: "Track your progress and celebrate your wins!" - Summary stats: - Day Streak (consecutive days with any metrics logged) - Total Points (all time) - Total Steps (cumulative) - Total Water (cumulative liters)

16. Given I have no progress yet
    Then all stats show 0
    And encouraging message displays

17. Given I have logged multiple days
    Then stats reflect accurate totals

**30-Day Calendar Tab:** 18. Given I am on 30-Day Calendar tab
Then I see: - Title: "30-Day Challenge Calendar" - 30-day calendar grid (5 rows × 7 columns, days 1-30) - Visual indicators: - Completed days: checkmark/green - Current day: highlighted border - Locked days: gray/padlock icon - Future unlocked days: outline only

19. Given Week 1 is active
    Then days 1-7 are unlocked
    And days 8-30 show locked indicator
    And notice: "Complete 90% of this week's tasks to unlock the next 7 days!"

20. Given I completed 6/7 days of Week 1 (90%+)
    Then Week 2 (days 8-14) automatically unlocks
    And visual indicators update

21. Given I click a completed day
    Then a Day Progress modal/drawer opens showing that day's metrics

22. Given I click a locked day
    Then nothing happens or tooltip shows "Complete Week X to unlock"

**Floating Trays:** 23. Given I am on the landing page (not in modal)
Then I see three floating elements: - Quick Access Tray (left side) - Points Tray (right side, top) - Day Counter Tray (right side, bottom)

24. **Quick Access Tray:**
    Given I view the left side
    Then I see a collapsed tray with chevron toggle
    When I click the toggle
    Then tray slides out showing:
    - Real Results → opens Real Results modal
    - Meet Expert → opens Meet Expert modal
    - The Metaboli-k-al Method → opens Method modal
    - Metaboli-k-al transformation programs → opens Elite Programs modal

25. **Points Tray:**
    Given I view the points tray
    Then I see:
    - Total Points: [X]
    - Metabolic Health: [Y]/100
    - Status message (based on completion)
    - Breakdown section:
      - Day Streak: [X]
      - Assessment: [X] pts
      - Calculator: [X] pts
      - Daily Visit: [X] pts

26. Given I haven't completed assessment
    Then status shows: "Complete assessment to see your score"

27. **Day Counter Tray:**
    Given I view the day counter tray
    Then I see:
    - "30-Day Challenge"
    - "Day [X]"
    - Buttons:
      - "View Today's Tasks" → opens Challenge Hub to Today tab
      - "Open Challenge Hub" → opens Challenge Hub modal

28. Given I am on mobile (< 768px)
    Then floating trays are hidden or minimized
    And accessible via alternative UI (bottom bar or hamburger menu)

**Gamification Hook:** 29. Given the gamification system is initialized
Then it tracks: - Visitor ID (from localStorage) - Current challenge day - Total points - Day streak (consecutive days) - Week unlocked status - Assessment completion points - Calculator completion points - Daily visit points (10 pts, once per day)

30. Given a user logs in
    Then localStorage data syncs to database (challenge_progress table)
    And points persist across devices

**Technical Notes:**

- Create `components/landing/modals/user-guide-modal.tsx`
- Create `components/landing/modals/challenge-hub-modal.tsx`
- Create `components/landing/modals/challenge-hub/todays-tasks.tsx`
- Create `components/landing/modals/challenge-hub/journey-tab.tsx`
- Create `components/landing/modals/challenge-hub/calendar-tab.tsx`
- Create `components/landing/floating-trays/quick-access-tray.tsx`
- Create `components/landing/floating-trays/points-tray.tsx`
- Create `components/landing/floating-trays/day-counter-tray.tsx`
- Create `hooks/use-gamification.ts` for state management
- Generate visitor_id on first visit: `crypto.randomUUID()`
- Store in localStorage: `metabolikal_visitor_id`, `metabolikal_challenge_data`
- Week unlocking logic: 90% = 6 out of 7 days with any data logged
- Progressive targets formula: `tomorrow_target = today_achievement × 1.10`
- Streak breaks if a day is completely missed (0 values don't break streak)
- Use CSS transitions for tray slide animations
- Fixed position for trays, z-indexed above content but below modals

**Testing Requirements:**

- Unit: All 5 metric inputs render
- Unit: Points calculate correctly for each threshold
- Unit: Save button stores data to localStorage
- Unit: Same-day edits work, previous day edits blocked
- Unit: Journey stats calculate correctly
- Unit: Calendar renders 30 days
- Unit: Week unlocking at 90% threshold
- Unit: Floating trays render and toggle
- Unit: Gamification hook tracks all point sources
- Integration: LocalStorage persists between sessions
- Integration: Data syncs to database on login

**Dependencies:** Story 1.1, Story 1.3
**Complexity:** XL

---

### Phase 2: Authentication

#### Story 2.1: Authentication System

**As a** user
**I want** to log in, register, and manage my password
**So that** I can access my personalized content securely

**Acceptance Criteria:**

**Login:**

1. Given I am not logged in
   When I visit /login
   Then I see:
   - Title: "Welcome Back"
   - Email input
   - Password input
   - Login button
   - "Forgot password?" link
   - "Don't have an account? Register" link

2. Given I enter valid credentials
   When I click Login
   Then I am authenticated
   And redirected to /dashboard (client) or /admin (admin based on role)

3. Given I enter invalid credentials
   When I click Login
   Then I see error: "Invalid email or password"
   And I remain on login page

4. Given I enter invalid email format
   When I click Login
   Then I see inline error: "Invalid email address"

5. Given I leave password empty
   When I click Login
   Then I see inline error: "Password is required"

**Registration (Admin-created accounts only for MVP):** 6. Given I visit /register
Then I see:

- Title: "Create Your Account"
- Full name input
- Email input
- Password input (min 8 characters)
- Confirm password input
- Register button
- "Already have an account? Login" link

7. Given I fill valid registration details
   When I click Register
   Then account is created in Supabase Auth
   And profile is created in profiles table (role: 'client')
   And I am redirected to /login with message: "Account created. Please log in."

8. Given passwords don't match
   When I click Register
   Then I see error: "Passwords do not match"

**Password Reset:** 9. Given I click "Forgot password?"
Then I see form with:

- Email input
- "Send Reset Link" button
- "Back to login" link

10. Given I enter my registered email
    When I click "Send Reset Link"
    Then Supabase sends reset email
    And I see: "Check your email for reset instructions"

11. Given I click the link in email
    Then I am taken to /reset-password
    And I see:
    - New password input
    - Confirm password input
    - "Reset Password" button

12. Given I enter matching valid passwords
    When I click "Reset Password"
    Then password updates
    And I am redirected to /login with message: "Password reset successful"

**Protected Routes:** 13. Given I am not logged in
When I visit /dashboard/_ or /admin/_
Then I am redirected to /login

14. Given I am logged in as client (role: 'client')
    When I visit /admin/\*
    Then I am redirected to /dashboard
    And I see toast: "Access denied"

15. Given I am logged in as admin (role: 'admin')
    When I visit /dashboard/_ or /admin/_
    Then I can access both areas

16. Given my session expires
    When I try to access any protected route
    Then I am redirected to /login

**Technical Notes:**

- Create `app/(auth)/login/page.tsx`
- Create `app/(auth)/register/page.tsx`
- Create `app/(auth)/forgot-password/page.tsx`
- Create `app/(auth)/reset-password/page.tsx`
- Create `app/(auth)/layout.tsx` (minimal layout for auth pages)
- Create `middleware.ts` for route protection
- Use Supabase Auth: signInWithPassword, signUp, resetPasswordForEmail, updateUser
- Configure Refine authProvider for role-based redirects
- Check role from profiles table via RLS-enabled query
- Store session in cookies (Supabase SSR helpers)

**Testing Requirements:**

- Unit: Login form validation works
- Unit: Registration form validation works
- Unit: Password reset form validation works
- Integration: Successful login creates session
- Integration: Invalid credentials show error
- Integration: Client cannot access admin routes
- Integration: Admin can access all routes
- Integration: Password reset email sends

**Dependencies:** Story 0.2
**Complexity:** L

---

### Phase 3: Client Dashboard

#### Story 3.1: Client Dashboard Home & Navigation

**As a** client
**I want** a dashboard with overview and navigation
**So that** I can see today's priorities and access all features

**Acceptance Criteria:**

**Dashboard Home:**

1. Given I am logged in as client
   When I visit /dashboard
   Then I see:
   - Welcome message: "Welcome back, [Name]"
   - Today's date and day number (days since program start)
   - Calorie summary card
   - Protein progress card
   - Quick action buttons

2. Given I view the calorie summary card
   Then I see:
   - "Today's Calories" title
   - Consumed: X cal (sum of today's food_logs)
   - Target: Y cal (sum from diet_plan for today)
   - Remaining: Z cal (target - consumed)
   - Visual progress bar (consumed/target)
   - Color: green if on track, yellow if close to limit, red if over

3. Given I view the protein progress card
   Then I see:
   - "Protein Progress" title
   - Consumed: X g
   - Target: Y g
   - Progress bar with percentage
   - Gamified message:
     - < 50%: "Keep going! You've got this."
     - 50-79%: "Great progress! Almost there."
     - 80-99%: "Almost at your goal!"
     - 100%+: "Protein goal crushed!"

4. Given I view quick action buttons
   Then I see:
   - "View Today's Meals" → navigates to /dashboard/diet
   - "View Today's Workout" → navigates to /dashboard/workout
   - "Submit Check-In" → navigates to /dashboard/checkin
   - "Log Food" → opens food logging modal/form

**Sidebar Navigation:** 5. Given I am on any dashboard page
Then I see a sidebar with:

- Logo/brand at top
- Navigation links (with icons):
  - Dashboard (home icon) - /dashboard
  - Diet Plan (utensils icon) - /dashboard/diet
  - Workout Plan (dumbbell icon) - /dashboard/workout
  - Check-In (clipboard icon) - /dashboard/checkin
  - Progress History (chart icon) - /dashboard/progress
  - Profile/Settings (user icon) - /dashboard/profile
- Logout button at bottom

6. Given I am on a specific page
   Then that nav item is highlighted/active

7. Given I am on mobile (< 1024px)
   Then sidebar is collapsed by default
   And hamburger icon toggles it
   And clicking a link closes the sidebar

**Technical Notes:**

- Create `app/(dashboard)/layout.tsx` with sidebar
- Create `app/(dashboard)/page.tsx` for dashboard home
- Update `components/layout/sidebar.tsx` with client navigation
- Create `components/dashboard/calorie-summary.tsx`
- Create `components/dashboard/protein-progress.tsx`
- Use Refine useList to fetch today's food_logs filtered by client_id and date
- Calculate daily target by fetching diet_plans for current day_number
- Day number = Math.floor((now - profile.created*at) / (1000 * 60 \_ 60 \* 24)) + 1
- Use lucide-react icons

**Testing Requirements:**

- Unit: Dashboard renders all cards
- Unit: Calorie calculation is correct
- Unit: Protein progress shows correct percentage
- Unit: Quick actions navigate correctly
- Unit: Sidebar nav items render with icons
- Unit: Active state highlights current page
- Unit: Mobile sidebar toggles

**Dependencies:** Story 2.1
**Complexity:** M

---

#### Story 3.2: Nutrition Module

**As a** client
**I want** to view my diet plan, see alternatives, and log food
**So that** I know what to eat and track my intake

**Acceptance Criteria:**

**Diet Plan View:**

1. Given I visit /dashboard/diet
   Then I see:
   - Title: "Today's Diet Plan"
   - Date and day number
   - 6 meal cards in order:
     1. Pre-Workout Meal
     2. Post-Workout Meal
     3. Breakfast
     4. Lunch
     5. Evening Snacks
     6. Dinner
   - Daily totals summary at bottom

2. Given I view a meal card
   Then I see:
   - Meal category name (e.g., "Breakfast")
   - Primary food item name
   - Calories and protein for item
   - "See Alternatives" button
   - "Log This" button (quick log)

3. Given I view daily totals
   Then I see:
   - Total Calories: X
   - Total Protein: Y g
   - Visual comparison to target (progress bar)

4. Given I have no diet plan for today
   Then I see: "No diet plan available for today. Contact your coach."

**Food Alternatives:** 5. Given I click "See Alternatives" on a meal card
Then a drawer/sheet opens showing:

- Current selection (highlighted)
- 5-8 alternative food options
- Each showing: name, calories, protein, serving size

6. Given I view alternative items
   Then I see color-coded borders:
   - Green: Within ±10% of meal's target calories (optimal)
   - Red: >10% above target (higher calories)
   - Yellow/Amber: <10% below target (lower calories, optional)

7. Given I view vegetarian filter
   Then I see toggle: "Show vegetarian only"
   When I enable it
   Then only items with is_vegetarian=true show

8. Given I click an alternative item
   Then:
   - That food becomes my selection for this meal
   - Drawer closes
   - Meal card updates with new food item
   - Daily totals recalculate
   - Change saves to database (diet_plans.food_item_id updates)

**Food Logging:** 9. Given I click "Log This" on a meal card
Then a quick log form appears:

- Food item name (pre-filled, read-only)
- Serving multiplier: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Calculated calories and protein based on multiplier
- "Log Food" button

10. Given I select a multiplier and click "Log Food"
    Then:
    - food_log entry is created
    - Dashboard calorie/protein counters update
    - Success toast: "Food logged!"
    - Form closes

11. Given I want to log something not on my plan
    When I click "Log Custom Food" (from dashboard or diet page)
    Then I see:
    - Search field to search food_items
    - Results list as I type (min 2 characters)
    - Click to select an item

12. Given I can't find my food in search
    When I click "Add Manual Entry"
    Then I see form:
    - Food name (text, required)
    - Calories (number, required)
    - Protein (number, required)
    - Meal category (select)
      And I can save this custom entry to food_logs

13. Given I view today's logged items
    Then I see a list/section showing:
    - All food_logs for today
    - Each with: name, calories, protein, time logged
    - Delete button on each

14. Given I click delete on a food log
    Then confirmation appears
    When I confirm
    Then log is deleted
    And counters update

**Technical Notes:**

- Create `app/(dashboard)/diet/page.tsx`
- Create `components/dashboard/meal-card.tsx`
- Create `components/dashboard/food-alternatives-drawer.tsx`
- Create `components/dashboard/food-log-form.tsx`
- Create `components/dashboard/food-search.tsx`
- Use Refine useList for diet_plans (filter by client_id, day_number)
- Use Refine useList for food_alternatives (filter by diet_plan_id)
- Use Refine useUpdate for changing food selection
- Use Refine useCreate for food_logs
- Use Refine useDelete for removing logs
- Use Refine useList for food_items search (filter by name ILIKE)
- Join diet_plans with food_items for nutrition data
- Color coding logic: compare food.calories to average meal target

**Testing Requirements:**

- Unit: All 6 meal cards render
- Unit: Food items display with calories/protein
- Unit: Alternatives drawer shows items with color coding
- Unit: Vegetarian filter works
- Unit: Selection change updates UI
- Unit: Food logging creates entry
- Unit: Multiplier calculates correctly
- Unit: Search finds food items
- Unit: Manual entry saves
- Unit: Delete removes log
- Integration: Diet plan data loads from database
- Integration: Food selection persists
- Integration: Logs persist and update counters

**Dependencies:** Story 3.1, Story 0.2
**Complexity:** XL

---

#### Story 3.3: Workout Module

**As a** client
**I want** to view my workout and mark exercises complete
**So that** I follow my training plan and track progress

**Acceptance Criteria:**

**Workout Plan View:**

1. Given I visit /dashboard/workout
   Then I see:
   - Title: "Today's Workout"
   - Date and day number
   - Progress indicator: "X/Y exercises completed"
   - Exercise list grouped by section
   - "Mark All Complete" button

2. Given I view exercises
   Then they are grouped by section in order:
   - Warmup (if any)
   - Main
   - Cooldown (if any)
     Each section has a header

3. Given I view an exercise item
   Then I see:
   - Checkbox (for completion)
   - Exercise name
   - Sets × Reps (e.g., "3 sets × 12 reps") OR Duration (e.g., "20 minutes")
   - Rest interval (e.g., "Rest: 60s")
   - Expand/collapse arrow

4. Given I expand an exercise
   Then I see:
   - Detailed instructions text
   - Video link (if available) - opens YouTube in new tab

5. Given I have no workout for today
   Then I see: "Rest day! No workout scheduled." or "No workout plan available. Contact your coach."

**Exercise Completion:** 6. Given I check an exercise checkbox
Then:

- Checkbox fills with checkmark animation
- Exercise row shows completed style (subtle strikethrough or checkmark badge)
- Progress indicator updates ("X/Y exercises completed")
- workout_log entry is created for this exercise

7. Given I uncheck an exercise
   Then:
   - Checkbox empties
   - Exercise row returns to normal style
   - Progress indicator updates
   - workout_log entry is deleted

8. Given I click "Mark All Complete"
   Then all exercises are checked
   And progress shows "Y/Y exercises completed"
   And all workout_logs are created

9. Given all exercises are complete
   Then I see:
   - Congratulatory message: "Workout complete! Great job!"
   - Success animation (optional: confetti)

**Workout History:** 10. Given I want to view past workouts
When I click "View History" or navigate to /dashboard/workout/history
Then I see: - List of past workout days - Each showing: date, completion percentage, exercises done

**Technical Notes:**

- Create `app/(dashboard)/workout/page.tsx`
- Create `components/dashboard/workout-item.tsx`
- Create `components/dashboard/workout-section.tsx`
- Use Refine useList for workout_plans (filter by client_id, day_number, order by section then display_order)
- Use Refine useList for workout_logs (filter by client_id, date)
- Use Refine useCreate/useDelete for workout_logs
- Track completion by workout_plan_id + DATE(completed_at)
- Optimistic UI updates for smooth checkbox interaction
- Group exercises by section field

**Testing Requirements:**

- Unit: Exercise items render correctly
- Unit: Sections group properly (warmup, main, cooldown)
- Unit: Instructions expand/collapse
- Unit: Checkbox toggles state
- Unit: Progress counter updates
- Unit: Mark All Complete works
- Unit: Completion message shows when done
- Integration: workout_logs persist

**Dependencies:** Story 3.1, Story 0.2
**Complexity:** L

---

#### Story 3.4: Check-In Module

**As a** client
**I want** to submit weekly check-ins with measurements and photos
**So that** my coach can track my progress

**Acceptance Criteria:**

**Check-In Form - Step 1: Measurements:**

1. Given I visit /dashboard/checkin
   Then I see a multi-step form, starting with measurements:
   - Step indicator: "Step 1 of 4: Measurements"
   - Date (auto-filled with today, read-only)
   - Current weight (kg, required)
   - Body fat % (optional)
   - Measurements (all optional, in cm):
     - Chest
     - Waist
     - Hips
     - Arms
     - Thighs
   - "Next" button

2. Given I enter valid measurements
   When I click "Next"
   Then I proceed to Step 2: Photos

3. Given I leave weight empty
   When I click "Next"
   Then I see error: "Weight is required"

**Check-In Form - Step 2: Photos:** 4. Given I am on Step 2
Then I see:

- Step indicator: "Step 2 of 4: Progress Photos"
- Three upload slots:
  - Front view
  - Side view
  - Back view
- Each with upload area, preview, and remove button
- "Back" and "Next" buttons
- Note: "Photos are optional but help track visual progress"

5. Given I click an upload area
   Then file picker opens
   And only images are allowed (jpg, png, webp)
   And max file size is 10MB

6. Given I select a valid image
   Then:
   - Upload progress indicator shows
   - Image uploads to Supabase Storage
   - Preview displays in the slot

7. Given I select an invalid file
   Then I see error: "Invalid file type" or "File too large (max 10MB)"

8. Given I click remove on a preview
   Then preview is removed
   And file is deleted from storage

9. Given I click "Next" (photos optional)
   Then I proceed to Step 3: Ratings

**Check-In Form - Step 3: Subjective Ratings:** 10. Given I am on Step 3
Then I see: - Step indicator: "Step 3 of 4: How You're Feeling" - Four sliders (1-10 scale, default 5): - Energy levels (1=Exhausted, 10=Energized) - Sleep quality (1=Terrible, 10=Excellent) - Stress levels (1=Overwhelmed, 10=Calm) - Overall mood (1=Low, 10=Great) - "Back" and "Next" buttons

11. Given I drag a slider
    Then value updates and displays current number

12. Given I click "Next"
    Then I proceed to Step 4: Notes

**Check-In Form - Step 4: Compliance & Notes:** 13. Given I am on Step 4
Then I see: - Step indicator: "Step 4 of 4: Compliance & Notes" - Diet adherence % (slider 0-100%, default 80%) - Workout adherence % (slider 0-100%, default 80%) - Text areas: - Challenges faced (optional) - Progress toward goals (optional) - Questions for coach (optional) - Additional comments (optional) - "Back" and "Submit Check-In" buttons

14. Given I click "Submit Check-In"
    Then:
    - All data validates
    - Check-in record creates in database
    - Success message: "Check-in submitted successfully!"
    - Redirect to /dashboard/checkin/history

15. Given I already submitted a check-in this week
    When I try to submit another
    Then I see warning: "You've already submitted a check-in this week. Submit anyway?"
    And I can choose to proceed or cancel

16. Given submission fails
    Then I see error message
    And form data is preserved
    And I can retry

**Check-In History:** 17. Given I visit /dashboard/checkin/history
Then I see: - Title: "Check-In History" - List of past check-ins (newest first) - Each showing: date, weight, completion badge

18. Given I click a check-in entry
    Then it expands to show:
    - All measurements
    - Thumbnail photos (click to enlarge)
    - All ratings
    - Compliance percentages
    - Notes

19. Given I have no check-ins
    Then I see: "No check-ins yet. Submit your first check-in!"
    And link to /dashboard/checkin

20. Given I click a photo thumbnail
    Then lightbox opens with full-size image

**Technical Notes:**

- Create `app/(dashboard)/checkin/page.tsx`
- Create `app/(dashboard)/checkin/history/page.tsx`
- Create `components/dashboard/checkin-form/` with step components:
  - measurements-step.tsx
  - photos-step.tsx
  - ratings-step.tsx
  - notes-step.tsx
- Create `components/dashboard/photo-upload.tsx`
- Create `lib/validations.ts` with checkInSchema (Zod)
- Use react-hook-form with multi-step state
- Use Supabase Storage for photos: `checkin-photos/{user_id}/{date}/{front|side|back}.jpg`
- Use Refine useCreate for check_ins
- Use Refine useList for check-in history
- Generate signed URLs for private photo display

**Testing Requirements:**

- Unit: All form steps render correctly
- Unit: Weight validation works
- Unit: Photo upload accepts valid images
- Unit: Photo upload rejects invalid files
- Unit: All sliders render and update
- Unit: Form submission collects all data
- Unit: History list renders check-ins
- Unit: Expansion shows all details
- Integration: Photos upload to Supabase Storage
- Integration: Check-in saves to database
- Integration: History loads from database

**Dependencies:** Story 3.1, Story 0.2
**Complexity:** XL

---

### Phase 4: Admin Dashboard

#### Story 4.1: Admin Dashboard & Client Management

**As an** admin
**I want** to view all clients and review their progress
**So that** I can provide effective coaching

**Acceptance Criteria:**

**Admin Dashboard Home:**

1. Given I am logged in as admin
   When I visit /admin
   Then I see:
   - Title: "Admin Dashboard"
   - Stats cards:
     - Total active clients
     - Check-ins pending review (reviewed_at IS NULL)
     - Clients flagged for follow-up
   - Quick actions: "View All Clients", "Review Pending Check-ins"

**Client List:** 2. Given I visit /admin/clients
Then I see:

- Title: "All Clients"
- Search input (searches name and email)
- Filter tabs: All, Active, Flagged
- Table with columns:
  - Name
  - Email
  - Last Check-in Date
  - Flag indicator (if flagged_for_followup)
  - "View" action button

3. Given I type in search
   Then table filters in real-time to matching names/emails

4. Given I select "Flagged" filter
   Then only clients with flagged_for_followup=true show

5. Given I click "View" on a client row
   Then I navigate to /admin/clients/[id]

6. Given there are many clients
   Then pagination controls appear (10 per page)

**Client Review Page:** 7. Given I visit /admin/clients/[id]
Then I see:

- Client header: name, email, avatar, program start date
- Quick stats: current weight, latest check-in date, days in program
- Tab navigation: Check-ins, Progress Charts, Photos, Plans

**Check-ins Tab:** 8. Given I view the Check-ins tab
Then I see:

- List of all check-ins (newest first)
- Each showing: date, weight, reviewed badge (if reviewed)
- Click to expand

9. Given I expand a check-in
   Then I see:
   - All measurements with comparison to previous check-in:
     - "Weight: 82kg (↓2kg from last)"
   - Photos (thumbnails, click to enlarge)
   - All ratings
   - Compliance percentages
   - Client's notes/challenges/questions
   - Admin section:
     - Admin notes text area
     - "Flag for follow-up" toggle
     - "Mark as reviewed" button
     - Reviewed timestamp (if reviewed)

10. Given I add admin notes and click save
    Then notes save to check_ins.admin_notes

11. Given I toggle "Flag for follow-up"
    Then flagged_for_followup updates
    And flag icon appears on check-in and client list

12. Given I click "Mark as reviewed"
    Then:
    - reviewed_at = now()
    - reviewed_by = my user ID
    - "Reviewed" badge appears
    - Pending count decreases

**Progress Charts Tab:** 13. Given I view Progress Charts tab
Then I see: - Weight over time (line chart) - Date range selector (Last 30 days, 90 days, All time) - Measurements chart (multi-line: waist, chest, etc.)

14. Given I change date range
    Then charts update to show selected period

**Photos Tab:** 15. Given I view Photos tab
Then I see: - Gallery of all progress photos - Grouped by check-in date - Click to enlarge any photo - "Compare" button to select two dates for side-by-side

16. Given I click "Compare"
    Then I can select two check-in dates
    And see front/side/back photos side by side

**Plans Tab:** 17. Given I view Plans tab
Then I see: - Current diet plan summary (meals and total calories) - Current workout plan summary (exercises per day) - "Edit Diet Plan" button → /admin/plans/[clientId]/diet - "Edit Workout Plan" button → /admin/plans/[clientId]/workout

**Technical Notes:**

- Create `app/(admin)/page.tsx`
- Create `app/(admin)/layout.tsx` with admin sidebar
- Create `app/(admin)/clients/page.tsx`
- Create `app/(admin)/clients/[id]/page.tsx`
- Create `components/admin/client-table.tsx`
- Create `components/admin/checkin-review.tsx`
- Create `components/admin/progress-chart.tsx`
- Create `components/admin/photos-gallery.tsx`
- Use Refine useTable for client list with search and filters
- Use Refine useOne for single client
- Use Refine useList for client's check-ins
- Use Refine useUpdate for admin notes, flags, reviewed status
- Use Recharts or Chart.js for progress visualization
- Join profiles with check_ins for aggregations

**Testing Requirements:**

- Unit: Stats cards display correct counts
- Unit: Client table renders with all columns
- Unit: Search filters correctly
- Unit: Filter tabs work
- Unit: Check-in expansion shows all details
- Unit: Admin notes save
- Unit: Flag toggle updates
- Unit: Mark reviewed updates timestamp
- Unit: Charts render with data
- Unit: Photo gallery displays images
- Integration: All data loads from database
- Integration: Updates persist

**Dependencies:** Story 2.1, Story 0.2
**Complexity:** XL

---

#### Story 4.2: Food Database Management

**As an** admin
**I want** to manage the food database
**So that** I can create diet plans with accurate nutritional information

**Acceptance Criteria:**

**Food List:**

1. Given I visit /admin/food-database
   Then I see:
   - Title: "Food Database"
   - Search input
   - "Add Food Item" button
   - Table with columns:
     - Name
     - Calories
     - Protein
     - Serving Size
     - Vegetarian (icon/badge)
     - Actions (Edit, Delete)

2. Given I type in search
   Then table filters to matching food names

3. Given there are many items
   Then pagination controls appear

**Create Food Item:** 4. Given I click "Add Food Item"
Then I see a form with:

- Name (text, required)
- Calories (number, required)
- Protein (number, required)
- Carbs (number, optional)
- Fats (number, optional)
- Serving size (text, required) - e.g., "100g", "1 cup", "1 medium"
- Is vegetarian (checkbox)
- Meal types (multi-select): Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout
- Cancel and Save buttons

5. Given I fill required fields and click Save
   Then food item is created
   And I'm redirected to list with success message
   And new item appears in table

6. Given I leave required fields empty
   When I click Save
   Then validation errors show

**Edit Food Item:** 7. Given I click Edit on a food item row
Then form opens pre-filled with item data

8. Given I modify fields and click Save
   Then item updates
   And table reflects changes

**Delete Food Item:** 9. Given I click Delete on a food item row
Then confirmation dialog appears: "Delete [Food Name]? This cannot be undone."

10. Given I confirm deletion
    Then item is deleted (or soft-deleted)
    And removed from table

11. Given the food item is used in diet plans
    Then deletion is blocked
    And I see: "Cannot delete: This food is used in X diet plans"

**Technical Notes:**

- Create `app/(admin)/food-database/page.tsx`
- Create `app/(admin)/food-database/create/page.tsx`
- Create `app/(admin)/food-database/edit/[id]/page.tsx`
- Create `lib/validations.ts` with foodItemSchema
- Use Refine useTable for list
- Use Refine useCreate, useUpdate, useDelete for CRUD
- Check for usage in diet_plans/food_alternatives before delete

**Testing Requirements:**

- Unit: Table renders food items
- Unit: Search filters correctly
- Unit: Create form validates
- Unit: Edit form pre-fills correctly
- Unit: Delete confirmation works
- Integration: CRUD operations persist
- Integration: Used items cannot be deleted

**Dependencies:** Story 4.1
**Complexity:** M

---

### Phase 5: Polish & Production Readiness

#### Story 5.1: Mobile Responsiveness, Performance & Monitoring

**As a** user
**I want** a fast, accessible experience on any device
**So that** I can use the app effectively

**Acceptance Criteria:**

**Mobile Responsiveness:**

1. Given I am on mobile (< 640px)
   When I view the landing page
   Then:
   - All sections stack vertically
   - Text is readable without zooming
   - CTAs are tappable (min 44px height)
   - Images scale appropriately
   - No horizontal scrolling

2. Given I am on mobile
   When I view modals
   Then:
   - Modals are full-screen or near-full
   - Scrolling works within modal
   - Close button is easily accessible

3. Given I am on tablet (640-1024px)
   When I view any page
   Then layout adapts (2-column where appropriate)

4. Given I am on mobile client dashboard
   Then:
   - Sidebar is hidden by default
   - Bottom navigation or hamburger provides access
   - All features are accessible
   - Forms are usable with mobile keyboard

**Performance:** 5. Given Lighthouse audit on landing page
Then scores are:

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

6. Given landing page load
   Then:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

7. Given images on page
   Then:
   - Images use Next.js Image component with optimization
   - Images are lazy-loaded below the fold
   - Images have width/height to prevent CLS
   - WebP format used where supported

8. Given JavaScript bundles
   Then:
   - Modals are dynamically imported (code splitting)
   - Unused code is tree-shaken
   - Third-party scripts (Calendly, GTM) are async/deferred

**Error Monitoring:** 9. Given Sentry is configured
Then:

- Client-side errors are captured with stack traces
- Server-side errors are captured
- Source maps are uploaded for debugging
- Environment is tagged (production/preview)

10. Given an unhandled error occurs
    Then:
    - Error is reported to Sentry
    - User sees friendly error page (not stack trace)
    - Error includes user context if logged in

11. Given an API error occurs
    Then:
    - Error is logged with request context
    - Appropriate HTTP status code returns
    - Sensitive data is redacted from logs

**SEO:** 12. Given search engines crawl the landing page
Then: - Page title: "METABOLI-K-AL - You Don't Need More Hustle, You Need Rhythm" - Meta description is set - Open Graph tags are configured - Canonical URL is set

**Technical Notes:**

- Use Tailwind responsive prefixes: sm (640px), md (768px), lg (1024px), xl (1280px)
- Use Next.js Image component for all images
- Use dynamic imports: `const Modal = dynamic(() => import('./modal'))`
- Install @sentry/nextjs, configure sentry.client.config.ts and sentry.server.config.ts
- Create app/error.tsx for error boundary
- Add meta tags in app/layout.tsx or use generateMetadata
- Test on real devices: iOS Safari, Android Chrome
- Use Vercel Analytics for Core Web Vitals monitoring

**Testing Requirements:**

- Run Lighthouse CI in GitHub Actions
- E2E: Critical paths work on mobile viewport
- Manual: Test on real iOS and Android devices
- Unit: Error boundary catches and displays errors
- Integration: Errors appear in Sentry dashboard

**Dependencies:** All previous stories
**Complexity:** L

---

## Data Models

### profiles

| Field      | Type        | Constraints                           |
| ---------- | ----------- | ------------------------------------- |
| id         | uuid        | Primary key, references auth.users    |
| email      | text        | Unique, not null                      |
| full_name  | text        | Not null                              |
| phone      | text        | Optional                              |
| role       | text        | 'admin' or 'client', default 'client' |
| avatar_url | text        | Optional                              |
| created_at | timestamptz | Auto-generated                        |
| updated_at | timestamptz | Auto-updated                          |

### food_items

| Field         | Type         | Constraints              |
| ------------- | ------------ | ------------------------ |
| id            | uuid         | Primary key              |
| name          | text         | Not null                 |
| calories      | integer      | Not null                 |
| protein       | decimal(5,1) | Not null                 |
| carbs         | decimal(5,1) | Optional                 |
| fats          | decimal(5,1) | Optional                 |
| serving_size  | text         | Not null                 |
| is_vegetarian | boolean      | Default false            |
| meal_types    | text[]       | Array of meal categories |
| created_at    | timestamptz  | Auto-generated           |
| updated_at    | timestamptz  | Auto-updated             |

### diet_plans

| Field              | Type         | Constraints                                                              |
| ------------------ | ------------ | ------------------------------------------------------------------------ |
| id                 | uuid         | Primary key                                                              |
| client_id          | uuid         | FK to profiles, not null                                                 |
| day_number         | integer      | >= 1                                                                     |
| meal_category      | text         | Enum: pre-workout, post-workout, breakfast, lunch, evening-snack, dinner |
| food_item_id       | uuid         | FK to food_items                                                         |
| serving_multiplier | decimal(3,1) | Default 1.0                                                              |
| notes              | text         | Optional                                                                 |
| created_at         | timestamptz  | Auto-generated                                                           |
| updated_at         | timestamptz  | Auto-updated                                                             |
|                    |              | Unique(client_id, day_number, meal_category)                             |

### food_alternatives

| Field         | Type        | Constraints                     |
| ------------- | ----------- | ------------------------------- |
| id            | uuid        | Primary key                     |
| diet_plan_id  | uuid        | FK to diet_plans                |
| food_item_id  | uuid        | FK to food_items                |
| is_optimal    | boolean     | Default false (green highlight) |
| display_order | integer     | Default 0                       |
| created_at    | timestamptz | Auto-generated                  |

### workout_plans

| Field            | Type        | Constraints                  |
| ---------------- | ----------- | ---------------------------- |
| id               | uuid        | Primary key                  |
| client_id        | uuid        | FK to profiles               |
| day_number       | integer     | >= 1                         |
| exercise_name    | text        | Not null                     |
| sets             | integer     | Optional                     |
| reps             | integer     | Optional                     |
| duration_minutes | integer     | Optional                     |
| rest_seconds     | integer     | Default 60                   |
| instructions     | text        | Optional                     |
| video_url        | text        | Optional                     |
| section          | text        | Enum: warmup, main, cooldown |
| display_order    | integer     | Default 0                    |
| created_at       | timestamptz | Auto-generated               |
| updated_at       | timestamptz | Auto-updated                 |

### food_logs

| Field              | Type         | Constraints                        |
| ------------------ | ------------ | ---------------------------------- |
| id                 | uuid         | Primary key                        |
| client_id          | uuid         | FK to profiles                     |
| logged_at          | timestamptz  | Default now()                      |
| food_item_id       | uuid         | FK to food_items (null for manual) |
| food_name          | text         | For manual entries                 |
| calories           | integer      | Not null                           |
| protein            | decimal(5,1) | Not null                           |
| serving_multiplier | decimal(3,1) | Default 1.0                        |
| meal_category      | text         | Not null                           |
| created_at         | timestamptz  | Auto-generated                     |

### workout_logs

| Field           | Type        | Constraints                                            |
| --------------- | ----------- | ------------------------------------------------------ |
| id              | uuid        | Primary key                                            |
| client_id       | uuid        | FK to profiles                                         |
| workout_plan_id | uuid        | FK to workout_plans                                    |
| completed_at    | timestamptz | Default now()                                          |
| notes           | text        | Optional                                               |
|                 |             | Unique(client_id, workout_plan_id, date(completed_at)) |

### check_ins

| Field                | Type         | Constraints    |
| -------------------- | ------------ | -------------- |
| id                   | uuid         | Primary key    |
| client_id            | uuid         | FK to profiles |
| submitted_at         | timestamptz  | Default now()  |
| weight               | decimal(5,1) | Not null       |
| body_fat_percent     | decimal(4,1) | Optional       |
| chest_cm             | decimal(5,1) | Optional       |
| waist_cm             | decimal(5,1) | Optional       |
| hips_cm              | decimal(5,1) | Optional       |
| arms_cm              | decimal(5,1) | Optional       |
| thighs_cm            | decimal(5,1) | Optional       |
| photo_front          | text         | Storage URL    |
| photo_side           | text         | Storage URL    |
| photo_back           | text         | Storage URL    |
| energy_rating        | integer      | 1-10           |
| sleep_rating         | integer      | 1-10           |
| stress_rating        | integer      | 1-10           |
| mood_rating          | integer      | 1-10           |
| diet_adherence       | integer      | 0-100          |
| workout_adherence    | integer      | 0-100          |
| challenges           | text         | Optional       |
| progress_notes       | text         | Optional       |
| questions            | text         | Optional       |
| admin_notes          | text         | Optional       |
| flagged_for_followup | boolean      | Default false  |
| reviewed_at          | timestamptz  | Optional       |
| reviewed_by          | uuid         | FK to profiles |
| created_at           | timestamptz  | Auto-generated |

### challenge_progress

| Field          | Type         | Constraints                         |
| -------------- | ------------ | ----------------------------------- |
| id             | uuid         | Primary key                         |
| visitor_id     | text         | Not null (localStorage ID)          |
| user_id        | uuid         | FK to profiles (null for anonymous) |
| day_number     | integer      | 1-30                                |
| logged_date    | date         | Default current_date                |
| steps          | integer      | Default 0                           |
| water_liters   | decimal(3,1) | Default 0                           |
| floors_climbed | integer      | Default 0                           |
| protein_grams  | integer      | Default 0                           |
| sleep_hours    | decimal(3,1) | Default 0                           |
| feeling        | text         | Optional                            |
| tomorrow_focus | text         | Optional                            |
| points_earned  | integer      | Default 0                           |
| created_at     | timestamptz  | Auto-generated                      |
| updated_at     | timestamptz  | Auto-updated                        |
|                |              | Unique(visitor_id, day_number)      |

### assessment_results

| Field                    | Type         | Constraints                           |
| ------------------------ | ------------ | ------------------------------------- |
| id                       | uuid         | Primary key                           |
| visitor_id               | text         | Not null                              |
| user_id                  | uuid         | FK to profiles (null for anonymous)   |
| assessed_at              | timestamptz  | Default now()                         |
| sleep_score              | integer      | 0-10                                  |
| body_score               | integer      | 0-10                                  |
| nutrition_score          | integer      | 0-10                                  |
| mental_score             | integer      | 0-10                                  |
| stress_score             | integer      | 0-10                                  |
| support_score            | integer      | 0-10                                  |
| hydration_score          | integer      | 0-10                                  |
| gender                   | text         | 'male' or 'female'                    |
| age                      | integer      |                                       |
| weight_kg                | decimal(5,1) |                                       |
| height_cm                | decimal(5,1) |                                       |
| body_fat_percent         | decimal(4,1) | Optional                              |
| activity_level           | text         |                                       |
| medical_conditions       | text[]       |                                       |
| metabolic_impact_percent | decimal(4,1) |                                       |
| goal                     | text         | 'fat_loss', 'maintain', 'muscle_gain' |
| goal_weight_kg           | decimal(5,1) |                                       |
| bmr                      | integer      | Calculated                            |
| tdee                     | integer      | Calculated                            |
| target_calories          | integer      | Calculated                            |
| health_score             | integer      | Calculated                            |
| lifestyle_score          | integer      | Calculated                            |
| created_at               | timestamptz  | Auto-generated                        |

---

## API Specifications

### Authentication Endpoints (Supabase Auth)

**POST /auth/v1/signup**

- Creates new user account
- Request: `{ email, password, options: { data: { full_name } } }`
- Response: `{ user, session }`

**POST /auth/v1/token?grant_type=password**

- Login with email/password
- Request: `{ email, password }`
- Response: `{ access_token, refresh_token, user }`

**POST /auth/v1/logout**

- Logout current session
- Auth: Required

### Refine Data Provider Endpoints (via Supabase)

All CRUD operations use Refine's data provider connected to Supabase. No custom API routes needed for standard operations.

**Resources:**

- `profiles` - User profiles
- `food_items` - Food database
- `diet_plans` - Client diet plans
- `food_alternatives` - Diet plan alternatives
- `workout_plans` - Client workout plans
- `food_logs` - Food consumption logs
- `workout_logs` - Exercise completion logs
- `check_ins` - Client check-ins
- `challenge_progress` - 30-day challenge data
- `assessment_results` - Assessment/calculator results

### Custom API Routes

**GET /api/health**

- Health check endpoint
- Response: `{ status: "ok", timestamp: string, database: "connected"|"disconnected" }`

---

## Success Metrics

| Metric                     | Target  | Measurement Method                               |
| -------------------------- | ------- | ------------------------------------------------ |
| Assessment completion rate | > 50%   | assessment_results created / unique visitors     |
| Calculator completion rate | > 40%   | Results with BMR/TDEE / assessment starts        |
| Challenge signup rate      | > 30%   | challenge_progress with day_1 / unique visitors  |
| Strategy call booking rate | > 10%   | Calendly bookings / unique visitors              |
| Daily active client rate   | 80%+    | Clients with food_log today / total clients      |
| Check-in completion rate   | 90%+    | Weekly check-ins / expected check-ins            |
| Coach review time          | < 5 min | Average time from check-in submit to reviewed_at |
| Page load time (LCP)       | < 2.5s  | Vercel Analytics                                 |
| Lighthouse Performance     | > 90    | CI/CD check                                      |
| Test coverage              | 80%+    | Vitest coverage report                           |

---

## Risks and Mitigations

| Risk                         | Likelihood | Impact | Mitigation                                  |
| ---------------------------- | ---------- | ------ | ------------------------------------------- |
| Supabase free tier limits    | Medium     | High   | Monitor usage, upgrade before launch        |
| Complex gamification bugs    | Medium     | Medium | Extensive unit tests for point calculations |
| Mobile UX issues             | Medium     | High   | Mobile-first design, real device testing    |
| Photo upload failures        | Low        | Medium | Retry logic, clear error messages           |
| Calculator accuracy concerns | Low        | High   | Clear disclaimers, reference medical advice |
| Anonymous data loss          | Medium     | Low    | Prompt to create account after engagement   |

---

## Story Summary

| Phase     | Stories | Description                                                          |
| --------- | ------- | -------------------------------------------------------------------- |
| 0         | 2       | Infrastructure: Health check, Supabase, Database schema              |
| 1         | 4       | Landing Page: Structure, Modals, Assessment/Calculator, Gamification |
| 2         | 1       | Authentication: Login, Register, Password reset, Protected routes    |
| 3         | 4       | Client Dashboard: Home, Nutrition, Workout, Check-in                 |
| 4         | 2       | Admin Dashboard: Client management, Food database                    |
| 5         | 1       | Polish: Mobile, Performance, Monitoring                              |
| **Total** | **14**  |                                                                      |

---

_PRD Version: 2.0_
_Last Updated: January 19, 2026_
_Status: Draft_
