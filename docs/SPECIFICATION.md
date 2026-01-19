# METABOLI-K-AL / Metabolical.com

## Complete Project Specification

**Version:** 3.0
**Date:** January 19, 2026
**Status:** Ready for Rebuild
**Stack:** Solokit Dashboard Refine (Tier 4)

---

> **Build Command:** `solokit create metabolikal --stack dashboard_refine --tier 4`

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Part 1: Marketing Landing Page](#2-part-1-marketing-landing-page)
3. [Part 2: Client Platform](#3-part-2-client-platform)
4. [Technical Stack](#4-technical-stack)
5. [Design System](#5-design-system)
6. [Data Models](#6-data-models)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Gamification System](#8-gamification-system)
9. [Calculator & Assessment Logic](#9-calculator--assessment-logic)
10. [Development Phases](#10-development-phases)
11. [Success Metrics](#11-success-metrics)

---

## 1. PROJECT OVERVIEW

### 1.1 Two-Part System

This project consists of two interconnected but distinct parts:

| Part       | Name                        | Purpose                                      | Audience                           |
| ---------- | --------------------------- | -------------------------------------------- | ---------------------------------- |
| **Part 1** | METABOLI-K-AL Landing Page  | Lead generation, brand awareness, free tools | Public visitors, potential clients |
| **Part 2** | Metabolical Client Platform | Client management, diet/workout tracking     | Existing clients, admin/coach      |

### 1.2 Brand Identity

**Brand Name:** METABOLI-K-AL (stylized with K emphasized)

- Logo: Circular logo with "METABOLIKAL" text
- Tagline: "You Don't Need More Hustle, You Need Rhythm"
- Secondary tagline: "Reprogram your rhythm. Master your metabolism."
- Footer tagline: "Reset Your Rhythm, Reclaim Your Life"

**Founder:** Shivashish Sinha (Metabolic Transformation Specialist)

**Target Audience:** High-performing professionals, C-suite executives, entrepreneurs

### 1.3 Domain

**Primary Domain:** metabolikal.com (or metabolical.com)

---

## 2. PART 1: MARKETING LANDING PAGE

### 2.1 Page Structure Overview

The landing page is a single-page application with the following sections (in order):

| #   | Section ID        | Section Name           | Type    |
| --- | ----------------- | ---------------------- | ------- |
| 1   | `home`            | Hero Section           | On Page |
| 2   | `transformations` | Real Transformations   | On Page |
| 3   | -                 | Revelation Section     | On Page |
| 4   | `about`           | About METABOLI-K-AL    | On Page |
| 5   | -                 | The Difference Section | On Page |
| 6   | `challenge`       | Metabolic Challenge    | On Page |
| 7   | -                 | Footer                 | Footer  |

### 2.2 Header Component

**Elements:**

- Logo (circular image + text: METABOLI**K**AL)
- Desktop Navigation: Home, Transformations, About, Challenge
- Header Buttons: "Take Assessment", "Book a Call"
- Mobile hamburger menu

**Mobile Menu Items:**

- Home, Transformations, About, Challenge
- Take Assessment, Book a Call, 30-Day Challenge

### 2.3 Floating UI Elements (Trays)

#### 2.3.1 Quick Access Tray (Left Side)

- Toggle button with chevron icon
- Slides out to reveal quick action buttons:
  1. Real Results
  2. Meet Expert
  3. The Metaboli-k-al Method
  4. Metaboli-k-al Transformation Programs

#### 2.3.2 Points Tray (Right Side - Top)

- Shows gamification stats:
  - Total Points
  - Metabolic Health Score (/100)
  - Status message
- Points Breakdown:
  - Day Streak
  - Assessment Points
  - Calculator Points
  - Daily Visit Points

#### 2.3.3 Day Counter Tray (Right Side - Bottom)

- Shows current challenge day
- Quick links: View Today's Tasks, Open Challenge Hub

### 2.4 Hero Section

**Content:**

- Main Quote (in quotation marks, attributed to founder)
- Subtitle explaining what METABOLI-K-AL is
- Three CTA buttons (stacked):
  1. Primary: "Claim Your FREE Strategy Session" (red, pulsing)
  2. Secondary: "Not Sure if You Need a Coach? Take the Assessment" (orange, pulsing)
  3. Tertiary: "Prove Your Consistency - Earn Your Personalized Metaboli-k-al Plan" (green, pulsing)
- Tagline
- Feature Stats Box (horizontal):
  - 4 Phases | COMPLETE SYSTEM
  - 180 Minutes | WEEKLY TRAINING
  - Zero Burnout | SUSTAINABLE INTENSITY

### 2.5 Transformations Section

**Content:**

- Title: "REAL PEOPLE. REAL TRANSFORMATIONS."
- Subtitle about executives mastering metabolic systems
- Button: "View Transformation Gallery" (opens modal)

### 2.6 Revelation Section

**Content:**

- Badge: "THE REVELATION"
- Title: "YOU DON'T LACK DISCIPLINE. YOUR SYSTEM LACKS CALIBRATION."
- Intro text about high-performers
- Two buttons:
  1. "THE HIGH-PERFORMER TRAP: What You Don't Know Yet" (opens modal)
  2. "See Who We Work With" (opens modal)

### 2.7 About Section

**Content:**

- Title: "ABOUT METABOLI-K-AL"
- Subtitle about metabolism being king
- Three quick link buttons:
  1. Meet Shivashish Sinha - The Creator
  2. The Metaboli-k-al Method
  3. Metaboli-k-al Transformation Programs

**Accordion Cards:**

1. THE DISCOVERY - About founding story and science
2. WHY WE'RE METABOLI-K-AL - Brand philosophy

### 2.8 Difference Section

**Content:**

- Title: "THE METABOLI-K-AL DIFFERENCE"
- Accordion Cards:
  1. Personal, Not Automated
  2. Science-Based, Tested
  3. Built for Elite Lifestyles
- Bottom Statement: "YOU DON'T NEED MORE HUSTLE, YOU NEED RHYTHM."

### 2.9 Challenge Section

**Content:**

- Badge: "STILL NOT SURE?, TAKE THE CHALLENGE"
- Title: "START YOUR METABOLIC CHALLENGE"
- Subtitle about professionals transforming
- Buttons:
  1. "How the 30-Day Challenge Works" (opens guide modal)
  2. "Launch 30-Day Challenge Hub" (opens challenge hub modal)
- Tags: Science-Backed, Personalized, Sustainable

### 2.10 Footer

**Sections:**

1. Logo + tagline + social links (YouTube, Instagram)
2. Quick Links: Home, Transformations, About, Challenge
3. Programs: Elite Programs, The Method, 30-Day Hall of Fame
4. Get Started: Take Assessment button, Book Strategy Call button
5. Copyright + social links

**Social Links:**

- YouTube: @Metabolikal_1
- Instagram: @metabolikal

---

## 2.11 Modal Specifications

### Modal 1: Assessment Modal

**Purpose:** Lifestyle assessment with 7 sliders

**Slider Configuration:**
| # | Slider Name | Icon | Low Label | High Label |
|---|-------------|------|-----------|------------|
| 1 | Sleep & Recovery | bed | Tossing, turning, waking tired | 8h deep sleep, wake refreshed |
| 2 | Body Confidence | heart | Avoid mirrors, hide body | Command presence |
| 3 | Nutrition Strategy Mastery | utensils | Stress eating, guilt cycles | Fuel for performance |
| 4 | Mental Clarity | brain | Foggy, slow decisions | Laser-sharp execution |
| 5 | Stress Management | shield-heart | Reactive, overwhelmed | Calm under pressure |
| 6 | Support System | users | Isolated, going solo | Elite peer support |
| 7 | Hydration | water | Barely drinking, dehydrated | Optimal hydration (3-4L/day) |

**Slider Range:** 0-10, default value: 5
**Buttons:** Cancel, Continue to Calculator

---

### Modal 2: Calculator Modal

**Purpose:** BMR/TDEE calculation with physical metrics

**Form Fields:**

| Field          | Type              | Options/Placeholder                                                         |
| -------------- | ----------------- | --------------------------------------------------------------------------- |
| Gender         | Select            | Male, Female                                                                |
| Age            | Number            | "Enter your age"                                                            |
| Current Weight | Number (kg)       | "Enter your weight"                                                         |
| Height         | Number (cm)       | "Enter your height"                                                         |
| Body Fat %     | Number (optional) | Link to guide modal                                                         |
| Activity Level | Select            | Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active |
| Goal           | Select            | Fat Loss, Maintain Weight, Muscle Gain                                      |
| Goal Weight    | Number (kg)       | "Enter your target weight"                                                  |

**Medical Conditions Section:**
Checkboxes with metabolic impact percentages:

| Condition                | Description                             | Impact |
| ------------------------ | --------------------------------------- | ------ |
| Hypothyroidism           | Underactive Thyroid                     | -8%    |
| PCOS                     | Polycystic Ovary Syndrome (Female only) | -10%   |
| Type 2 Diabetes          | -                                       | -12%   |
| Insulin Resistance       | Pre-diabetes                            | -10%   |
| Sleep Apnea              | Poor recovery                           | -7%    |
| Metabolic Syndrome       | -                                       | -15%   |
| On Thyroid Medication    | Managed                                 | -3%    |
| Chronic Fatigue Syndrome | -                                       | -8%    |
| None of the above        | No conditions                           | 0%     |

**Display:** Show "Estimated Metabolic Impact: X%"
**Privacy Notice:** Medical information is private and never shared
**Disclaimer:** Calculator provides estimates only, not medical advice

**Buttons:** Cancel, Calculate Results

---

### Modal 3: Results Modal

**Purpose:** Display calculated results
**Content:** Dynamically generated based on assessment + calculator inputs
**Buttons:** Share Results, Book Metabolic Breakthrough Call

---

### Modal 4: Real Results Modal

**Purpose:** Transformation gallery and social proof

**Sections:**

1. YouTube Videos carousel - transformation stories
2. Main results image (before/after transformations)
3. Social media connection section
4. Instagram CTA cards:
   - Before & After Stories
   - Client Wins
   - Learn & Level Up
5. Main Instagram follow button

---

### Modal 5: Meet Expert Modal

**Purpose:** Founder bio and credentials

**Content:**

- Expert photo
- Name: Shivashish Sinha
- Title: Founder & Metabolic Transformation Specialist
- Featured quote
- Personal story (3 paragraphs)
- Credentials table
- Social links (Instagram, YouTube)
- CTA: "Reset your Rhythm"

---

### Modal 6: The Method Modal

**Purpose:** Explain the 4-phase METABOLI-K-AL method

**Phases:**

| Phase | Name             | Subtitle         | Duration |
| ----- | ---------------- | ---------------- | -------- |
| 0     | BASELINE & AUDIT | Foundation Phase | 4-5 days |
| 1     | REBALANCE        | Reset Phase      | -        |
| 2     | REWIRE           | Building Phase   | -        |
| 3     | REINFORCE        | Freedom Phase    | -        |

**Each phase includes:**

- Purpose statement
- Tools/Includes list
- Outcome statement

**5 Pillars Section:**

1. Metabolic Reset Protocol
2. Rhythm-Based Nutrition
3. Strategic Movement Design
4. Stress & Recovery Optimization
5. Mindset & Identity Transformation

---

### Modal 7: Elite Programs Modal

**Purpose:** Display coaching program tiers

**Programs:**

| Program                | Type                     | Level           | Highlight          |
| ---------------------- | ------------------------ | --------------- | ------------------ |
| Core Reset             | Monthly Coaching         | Starting Point  | -                  |
| Rhythm Rewire          | Quarterly Intensive      | Complete System | MOST POPULAR badge |
| The Fulmane Experience | 4-Month Elite Mentorship | Elite Level     | -                  |

**Each program includes:**

- What You Get list
- Perfect For description

**All Programs Include Section:**

- The METABOLI-K-AL Method features
- Performance Integration features

**CTA:** Book Your Strategy Session

---

### Modal 8: Body Fat Guide Modal

**Purpose:** Visual guide for estimating body fat %

**Men's Ranges:**
| Range | Category | Description |
|-------|----------|-------------|
| 5-9% | Essential | Competitive bodybuilders |
| 10-14% | Athletic | Fitness models |
| 15-19% | Fitness | Active individuals |
| 20-24% | Average | General population |
| 25%+ | Elevated | Higher health risk |

**Women's Ranges:**
| Range | Category | Description |
|-------|----------|-------------|
| 10-14% | Essential | Competitive athletes |
| 15-19% | Athletic | Fitness competitors |
| 20-24% | Fitness | Active women |
| 25-31% | Average | General population |
| 32%+ | Elevated | Higher health risk |

**Quick Estimation Tips included**

---

### Modal 9: User Guide Modal (30-Day Challenge)

**Purpose:** Explain how the challenge works

**5 Steps:**

1. Complete Prerequisites (Assessment + Calculator)
2. Track 5 Daily Metrics
3. Earn Points Daily (max 150/day)
4. Progressive Targets (+10% daily)
5. Unlock New Weeks (90% completion required)

**Points System Table:**
| Metric | Target | Points |
|--------|--------|--------|
| Daily Steps | 7k→15pts, 10k→30pts, 15k→45pts | 15-45 |
| Water Intake | 3.0-4.5 Liters | 15 |
| Floors Climbed | 4→15pts, 14+→45pts | 15-45 |
| Protein | 70g+ (based on weight) | 15 |
| Sleep Hours | 7+ hours | 15 |
| Daily Check-in | Submit your log | 15 |
| **MAXIMUM DAILY** | | **150** |

**6 Key Features explained**
**Tips for Success list**

---

### Modal 10: Challenge Hub Modal

**Purpose:** 30-day challenge tracking interface

**Overview Stats:**

- Current Day
- Total Points
- Week Unlocked
- Completion %

**3 Tabs:**

1. **Today's Tasks** - Daily metric tracking form
2. **Journey So Far** - Progress summary
3. **30-Day Calendar** - Visual calendar view

**Today's Tasks Tab:**

- 5 metric input fields (Steps, Water, Floors, Protein, Sleep)
- Daily reflection fields
- Points display
- Save button

**Week Unlocking:** Requires 90% completion of current week

---

### Modal 11: Day Progress Modal

**Purpose:** Day-specific task view
**Content:** Dynamically generated

---

### Modal 12: High-Performer Trap Modal

**Purpose:** Pain point awareness content

**3 Trap Items:**

1. Decision Fatigue Hits at 3PM
2. Peak Performance Inconsistency
3. "Tried Everything" Frustration

**Revelation Section:**

- Statement about needing a METABOLIC OPERATING SYSTEM

**3 CTAs:**

1. Claim Your FREE Strategy Session
2. Take the Metabolic Assessment
3. Start the 30-Day Challenge

---

### Modal 13: Elite Lifestyles Modal

**Purpose:** Target audience identification

**6 Lifestyle Cards:**

1. C-SUITE EXECUTIVES
2. HIGH-PERFORMANCE ENTREPRENEURS
3. GLOBAL PROFESSIONALS
4. ELITE PERFORMERS
5. PROFESSIONALS
6. NOW YOU!! (highlighted)

**CTA:** Claim Your FREE Strategy Session

---

### Modal 14: Calendly Modal

**Purpose:** Strategy call booking
**Content:** Embedded Calendly widget
**Title:** Book Your Strategy Call
**Subtitle:** Let's engineer your metabolic transformation

---

## 3. PART 2: CLIENT PLATFORM

### 3.1 Overview

Private platform for paying clients to access personalized diet plans, workout routines, and submit progress check-ins. Replaces Google Sheets workflow.

### 3.2 User Roles

| Role        | Access                                              |
| ----------- | --------------------------------------------------- |
| Admin/Coach | All client data, check-in review, plan modification |
| Client      | Own data only: diet plan, workout plan, check-ins   |

### 3.3 Core Modules

#### 3.3.1 Authentication Module

- Client login with email/password
- Admin login
- Session management (localStorage/sessionStorage)
- Access control per role

#### 3.3.2 Nutrition Module

**Daily Meal Structure (7 meals):**

1. Workout Time (configurable)
2. Pre-Workout Meal
3. Post-Workout Meal
4. Breakfast
5. Lunch
6. Evening Snacks
7. Dinner

**Features:**

- Default food items per meal
- Click to view alternatives (5-8 per meal)
- Color-coded calorie system:
  - Green: Within ±10% of target (optimal)
  - Red: >10% above target (higher calories)
  - Yellow/Amber (optional): <10% below target
- Vegetarian/Non-vegetarian filter
- Real-time calorie counter
- Real-time protein counter with gamification
- Manual food logging

#### 3.3.3 Workout Module

**Exercise Entry Fields:**

- Exercise name
- Sets and reps (e.g., 3 sets × 12 reps)
- Duration (for cardio/timed)
- Rest intervals
- Instructions/notes
- Video links (optional)

**Features:**

- Completion checkboxes
- Progress indicator (e.g., 5/8 exercises done)
- Workout history log

#### 3.3.4 Check-In Module

**Client Check-In Form Fields:**

_Basic Metrics:_

- Date of check-in
- Current weight
- Body measurements (chest, waist, hips, arms, thighs)
- Body fat % (optional)

_Progress Photos:_

- Front view
- Side view
- Back view

_Subjective Feedback (1-10 scales):_

- Energy levels
- Sleep quality
- Stress levels
- Overall mood

_Compliance:_

- Diet adherence %
- Workout adherence %
- Challenges faced (text)

_Goals & Notes:_

- Progress toward goals (text)
- Questions for coach (text)
- Additional comments (text)

**Admin Review Dashboard:**

- Client selector (dropdown/search)
- Check-in history sorted by date
- Side-by-side metric comparison
- Progress photos gallery
- Weight/measurement charts
- Admin notes/feedback per check-in
- Follow-up flagging

### 3.4 Client Dashboard

**Upon Login Display:**

- Today's Overview: Day number, date
- Calorie Summary: Consumed vs. remaining
- Protein Progress: Visual progress bar
- Quick Actions:
  - View today's meals
  - View today's workout
  - Submit check-in
  - Log food

**Navigation Menu:**

- Dashboard (home)
- Diet Plan (daily view)
- Workout Plan (daily view)
- Check-In
- Progress History
- Profile/Settings

---

## 4. TECHNICAL STACK

### 4.1 Solokit Stack: Dashboard Refine

This project will be built using **Solokit's Dashboard Refine stack** - a production-ready CRUD-first framework perfect for this application.

**Why Dashboard Refine:**

- Built-in CRUD operations for diet plans, workouts, check-ins, food database
- Admin dashboard features (sidebar, tables, filtering) for coach interface
- shadcn/ui components included for beautiful, accessible UI
- Backend-agnostic data provider - connects to Supabase
- Authentication patterns built-in
- Works for both landing page AND client platform in one codebase

### 4.2 Core Technologies

| Technology          | Version | Purpose                    |
| ------------------- | ------- | -------------------------- |
| **Next.js**         | 16.x    | Full-stack React framework |
| **React**           | 19.x    | UI library                 |
| **TypeScript**      | 5.x     | Type safety                |
| **Refine**          | 5.x     | CRUD framework with hooks  |
| **shadcn/ui**       | latest  | UI component library       |
| **Tailwind CSS**    | 4.x     | Utility-first styling      |
| **Zod**             | 4.x     | Schema validation          |
| **React Hook Form** | latest  | Form management            |

### 4.3 Backend & Database

| Technology            | Purpose                            |
| --------------------- | ---------------------------------- |
| **Supabase**          | Backend-as-a-Service               |
| **PostgreSQL**        | Database (via Supabase)            |
| **Supabase Auth**     | Authentication & user management   |
| **Supabase Storage**  | File uploads (progress photos)     |
| **Supabase Realtime** | Real-time subscriptions (optional) |

### 4.4 Refine Data Provider

```typescript
// Connect Refine to Supabase
import { dataProvider } from "@refinedev/supabase";
import { supabaseClient } from "./supabase";

export const refineDataProvider = dataProvider(supabaseClient);
```

### 4.5 Key Refine Hooks

| Hook          | Use Case                                             |
| ------------- | ---------------------------------------------------- |
| `useList()`   | Fetch diet plans, workouts, check-ins with filtering |
| `useOne()`    | Get single client, single check-in                   |
| `useCreate()` | Submit check-ins, log food                           |
| `useUpdate()` | Update diet selections, mark exercises complete      |
| `useDelete()` | Remove food logs                                     |
| `useForm()`   | Check-in form, assessment form                       |
| `useTable()`  | Admin client list, check-in history                  |

### 4.6 External Services

| Service                | Purpose                              |
| ---------------------- | ------------------------------------ |
| **Supabase**           | Auth, Database, Storage (all-in-one) |
| **Calendly**           | Strategy call booking (embed)        |
| **Vercel**             | Deployment & hosting                 |
| **Google Tag Manager** | Analytics                            |
| **Google AdSense**     | Monetization (optional)              |

### 4.7 Project Structure

```
metabolikal/
├── app/
│   ├── (public)/                    # Public routes (landing page)
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Public layout
│   │   └── [...sections]/           # Landing page sections
│   │
│   ├── (auth)/                      # Auth routes
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                 # Protected client routes
│   │   ├── layout.tsx               # Dashboard layout with sidebar
│   │   ├── page.tsx                 # Client dashboard home
│   │   ├── diet/
│   │   │   ├── page.tsx             # Daily diet plan
│   │   │   └── [day]/page.tsx       # Specific day view
│   │   ├── workout/
│   │   │   ├── page.tsx             # Daily workout
│   │   │   └── [day]/page.tsx
│   │   ├── checkin/
│   │   │   ├── page.tsx             # Check-in form
│   │   │   └── history/page.tsx     # Past check-ins
│   │   └── progress/page.tsx        # Progress charts
│   │
│   ├── (admin)/                     # Protected admin routes
│   │   ├── layout.tsx               # Admin layout
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx             # Client list
│   │   │   └── [id]/page.tsx        # Individual client review
│   │   ├── food-database/
│   │   │   ├── page.tsx             # Food items list
│   │   │   └── create/page.tsx      # Add food item
│   │   └── plans/
│   │       └── [clientId]/page.tsx  # Manage client plans
│   │
│   └── api/                         # API routes (webhooks, etc.)
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── landing/                     # Landing page components
│   │   ├── hero.tsx
│   │   ├── modals/
│   │   │   ├── assessment-modal.tsx
│   │   │   ├── calculator-modal.tsx
│   │   │   ├── challenge-hub-modal.tsx
│   │   │   └── ...
│   │   └── sections/
│   ├── dashboard/                   # Client dashboard components
│   │   ├── calorie-counter.tsx
│   │   ├── protein-progress.tsx
│   │   ├── meal-card.tsx
│   │   └── workout-item.tsx
│   └── admin/                       # Admin components
│       ├── client-table.tsx
│       ├── checkin-review.tsx
│       └── progress-chart.tsx
│
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── refine.tsx                   # Refine configuration
│   ├── validations.ts               # Zod schemas
│   └── utils.ts                     # Helper functions
│
├── providers/
│   └── refine-provider.tsx          # Refine context provider
│
├── hooks/
│   ├── use-gamification.ts          # Points, streaks logic
│   ├── use-calculator.ts            # BMR/TDEE calculations
│   └── use-assessment.ts            # Assessment scoring
│
└── types/
    └── index.ts                     # TypeScript types
```

### 4.8 Authentication Flow

```
1. User visits /login
2. Supabase Auth handles email/password or OAuth
3. On success, Refine's authProvider redirects:
   - role: "client" → /dashboard
   - role: "admin" → /admin
4. Protected routes check session via middleware
5. Row-Level Security (RLS) in Supabase ensures data isolation
```

### 4.9 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Android Chrome)

### 4.10 Responsive Breakpoints

| Breakpoint | Target         | Tailwind Class |
| ---------- | -------------- | -------------- |
| Mobile     | < 640px        | `sm:`          |
| Tablet     | 640px - 1024px | `md:` / `lg:`  |
| Desktop    | > 1024px       | `xl:`          |

### 4.11 Deployment

| Environment | Platform | URL                   |
| ----------- | -------- | --------------------- |
| Production  | Vercel   | metabolikal.com       |
| Preview     | Vercel   | pr-\*.vercel.app      |
| Database    | Supabase | [project].supabase.co |

### 4.12 Quality Tier

Using **Solokit Tier 4: Production-Ready** which includes:

- Linting & formatting (ESLint, Prettier)
- Type checking (TypeScript strict mode)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Git hooks (Husky)
- Security scanning
- Error monitoring (Sentry)
- Performance monitoring (OpenTelemetry)
- Health check endpoints

---

## 5. DESIGN SYSTEM

### 5.1 Color Palette

**Landing Page (METABOLI-K-AL):**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Red | #FF0000 | CTAs, accents, emphasis |
| Dark Orange | #FF6B00 | Secondary actions, highlights |
| Premium Gold | #FFD700 | Premium elements, badges |
| Elite Amber | #FFA500 | Warnings, attention |
| Dark Background | #0a0a0a | Main background |
| Dark Gray | #1a1a1a | Section backgrounds |
| Light Gray | #2a2a2a | Card backgrounds |

**Client Platform (Metabolical):**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Purple | #667eea | Brand, CTAs |
| Success Green | #10b981 | Optimal choices, achievements |
| Warning Red | #ef4444 | High calories, alerts |
| Info Blue | #3b82f6 | Information, metrics |
| Neutral Gray | #64748b | Text, borders |

### 5.2 Typography

**Primary Font:** Inter (Google Fonts)
**Display Font:** Orbitron (Landing page headers)

**Weights:** 300, 400, 500, 600, 700, 800, 900

### 5.3 Button Styles

| Type         | Style                               |
| ------------ | ----------------------------------- |
| Primary      | Solid fill, shadow, pulse animation |
| Secondary    | Outline with hover fill             |
| Gold/Premium | Gold gradient with glow             |
| Green CTA    | Green gradient (challenge)          |

### 5.4 Animation Effects

| Effect           | Usage                 |
| ---------------- | --------------------- |
| pulse-glow       | Primary CTAs          |
| pulse-glow-green | Challenge CTA         |
| pulse-glow-gold  | Premium buttons       |
| floating         | Decorative elements   |
| success-pulse    | Completion indicators |

---

## 6. DATA MODELS (Supabase/PostgreSQL)

All tables use Supabase with Row-Level Security (RLS) for data isolation.

### 6.1 Profiles Table (extends Supabase Auth)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
-- Admins can read all profiles
```

### 6.2 Food Items Table

```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  carbs DECIMAL(5,1),
  fats DECIMAL(5,1),
  serving_size TEXT NOT NULL, -- e.g., "100g", "1 cup"
  is_vegetarian BOOLEAN DEFAULT false,
  meal_types TEXT[] DEFAULT '{}', -- ['breakfast', 'lunch', 'snack']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Public read, admin write
```

### 6.3 Diet Plans Table

```sql
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  meal_category TEXT NOT NULL CHECK (meal_category IN (
    'pre-workout', 'post-workout', 'breakfast',
    'lunch', 'evening-snack', 'dinner'
  )),
  food_item_id UUID NOT NULL REFERENCES food_items(id),
  serving_multiplier DECIMAL(3,1) DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, day_number, meal_category)
);

-- RLS: Clients read own, admins read/write all
```

### 6.4 Food Alternatives Table

```sql
CREATE TABLE food_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id),
  is_optimal BOOLEAN DEFAULT false, -- Green highlight
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links alternative food options to each meal in diet plan
```

### 6.5 Workout Plans Table

```sql
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_minutes INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  instructions TEXT,
  video_url TEXT,
  section TEXT CHECK (section IN ('warmup', 'main', 'cooldown')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Clients read own, admins read/write all
```

### 6.6 Food Logs Table

```sql
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  food_item_id UUID REFERENCES food_items(id), -- NULL for manual entry
  food_name TEXT, -- For manual entry
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  serving_multiplier DECIMAL(3,1) DEFAULT 1.0,
  meal_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Clients read/write own, admins read all
```

### 6.7 Workout Logs Table

```sql
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(client_id, workout_plan_id, DATE(completed_at))
);

-- RLS: Clients read/write own, admins read all
```

### 6.8 Check-Ins Table

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Measurements
  weight DECIMAL(5,1) NOT NULL,
  body_fat_percent DECIMAL(4,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  arms_cm DECIMAL(5,1),
  thighs_cm DECIMAL(5,1),

  -- Photos (Supabase Storage URLs)
  photo_front TEXT,
  photo_side TEXT,
  photo_back TEXT,

  -- Subjective Ratings (1-10)
  energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 10),
  sleep_rating INTEGER CHECK (sleep_rating BETWEEN 1 AND 10),
  stress_rating INTEGER CHECK (stress_rating BETWEEN 1 AND 10),
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),

  -- Compliance
  diet_adherence INTEGER CHECK (diet_adherence BETWEEN 0 AND 100),
  workout_adherence INTEGER CHECK (workout_adherence BETWEEN 0 AND 100),

  -- Text Fields
  challenges TEXT,
  progress_notes TEXT,
  questions TEXT,

  -- Admin Fields
  admin_notes TEXT,
  flagged_for_followup BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Clients read/write own, admins read/write all
```

### 6.9 Challenge Progress Table (Public/Anonymous)

```sql
CREATE TABLE challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL, -- localStorage ID or user ID
  user_id UUID REFERENCES profiles(id), -- NULL for anonymous
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metrics
  steps INTEGER DEFAULT 0,
  water_liters DECIMAL(3,1) DEFAULT 0,
  floors_climbed INTEGER DEFAULT 0,
  protein_grams INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1) DEFAULT 0,

  -- Reflection
  feeling TEXT,
  tomorrow_focus TEXT,

  -- Points
  points_earned INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(visitor_id, day_number)
);

-- RLS: Users read/write by visitor_id match
```

### 6.10 Assessment Results Table (Public/Anonymous)

```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Lifestyle Scores (0-10)
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 10),
  body_score INTEGER CHECK (body_score BETWEEN 0 AND 10),
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 0 AND 10),
  mental_score INTEGER CHECK (mental_score BETWEEN 0 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 0 AND 10),
  support_score INTEGER CHECK (support_score BETWEEN 0 AND 10),
  hydration_score INTEGER CHECK (hydration_score BETWEEN 0 AND 10),

  -- Calculator Inputs
  gender TEXT CHECK (gender IN ('male', 'female')),
  age INTEGER,
  weight_kg DECIMAL(5,1),
  height_cm DECIMAL(5,1),
  body_fat_percent DECIMAL(4,1),
  activity_level TEXT,
  medical_conditions TEXT[],
  metabolic_impact_percent DECIMAL(4,1),
  goal TEXT CHECK (goal IN ('fat_loss', 'maintain', 'muscle_gain')),
  goal_weight_kg DECIMAL(5,1),

  -- Calculated Results
  bmr INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  health_score INTEGER,
  lifestyle_score INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users read/write by visitor_id match
```

### 6.11 Supabase Storage Buckets

```sql
-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('checkin-photos', 'checkin-photos', false),
  ('avatars', 'avatars', true);

-- RLS policies for checkin-photos bucket
-- Clients can upload to their own folder: {user_id}/*
-- Admins can read all
```

### 6.12 Database Functions

```sql
-- Get daily calorie summary for a client
CREATE OR REPLACE FUNCTION get_daily_calories(
  p_client_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_calories INTEGER,
  total_protein DECIMAL,
  meal_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(calories), 0)::INTEGER,
    COALESCE(SUM(protein), 0),
    COUNT(*)::INTEGER
  FROM food_logs
  WHERE client_id = p_client_id
    AND DATE(logged_at) = p_date;
END;
$$ LANGUAGE plpgsql;

-- Get client's diet plan target calories
CREATE OR REPLACE FUNCTION get_daily_target(p_client_id UUID, p_day INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(fi.calories * dp.serving_multiplier), 0)::INTEGER
    FROM diet_plans dp
    JOIN food_items fi ON fi.id = dp.food_item_id
    WHERE dp.client_id = p_client_id AND dp.day_number = p_day
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 7. THIRD-PARTY INTEGRATIONS

### 7.1 Calendly

**Widget:** Inline embed for booking calls
**Script:** https://assets.calendly.com/assets/external/widget.js
**CSS:** https://assets.calendly.com/assets/external/widget.css

### 7.2 Google Tag Manager

**Container ID:** GTM-ML5TLT5R
**Placement:** Head (script) + Body (noscript iframe)

### 7.3 Google AdSense

**Client ID:** ca-pub-2923746348204240

### 7.4 YouTube Embeds

**Channel:** @Metabolikal_1
**Usage:** Transformation videos in Real Results modal

### 7.5 Instagram

**Handle:** @metabolikal
**Usage:** Social proof links, follow CTAs

---

## 8. GAMIFICATION SYSTEM

### 8.1 Points System

**Daily Points Breakdown:**
| Action | Points |
|--------|--------|
| Daily Visit | 10 |
| Complete Assessment | Variable |
| Complete Calculator | Variable |
| Steps (7k/10k/15k) | 15/30/45 |
| Water Intake (3-4.5L) | 15 |
| Floors (4/14+) | 15/45 |
| Protein (70g+) | 15 |
| Sleep (7+ hrs) | 15 |
| Daily Check-in | 15 |
| **Max Daily Total** | **150** |

### 8.2 Progressive Targets

- Each metric target increases by 10% based on previous achievement
- Formula: `tomorrow_target = today_achievement × 1.10`

### 8.3 Week Unlocking

- Week 1: Always unlocked
- Weeks 2-4: Requires 90% completion of previous week
- Calculation: 6 out of 7 days completed

### 8.4 Metabolic Health Score

- Range: 0-100
- Calculated from assessment + calculator results
- Displayed in Points Tray

### 8.5 Streaks

- Day streak counter for consecutive challenge completions
- Displayed in Points Tray and Journey tab

### 8.6 Certificates

- 30-day completion certificate (personalized)
- Generated upon completing all 30 days

---

## 9. CALCULATOR & ASSESSMENT LOGIC

### 9.1 BMR Calculation

**Mifflin-St Jeor Equation:**

- Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
- Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161

**With Body Fat (Katch-McArdle):**

- Lean Mass = weight × (1 - bodyFat/100)
- BMR = 370 + (21.6 × leanMass)

### 9.2 Activity Multipliers

| Level             | Multiplier |
| ----------------- | ---------- |
| Sedentary         | 1.2        |
| Lightly Active    | 1.375      |
| Moderately Active | 1.55       |
| Very Active       | 1.725      |
| Extremely Active  | 1.9        |

### 9.3 TDEE Calculation

`TDEE = BMR × activityMultiplier`

### 9.4 Medical Condition Adjustments

Apply metabolic impact as multiplier:
`adjustedBMR = BMR × (1 - totalMetabolicImpact/100)`

### 9.5 Goal-Based Calorie Targets

| Goal        | Adjustment          |
| ----------- | ------------------- |
| Fat Loss    | TDEE - 500 calories |
| Maintain    | TDEE                |
| Muscle Gain | TDEE + 300 calories |

### 9.6 Lifestyle Score Calculation

Average of 7 assessment slider values (0-10 each)
`lifestyleScore = (sleep + body + nutrition + mental + stress + support + hydration) / 7 × 10`

### 9.7 Health Score Calculation

Combination of lifestyle score and physical metrics
Formula in metabolikal-final.js

---

## 10. DEVELOPMENT PHASES

### Phase 0: Solokit Setup (Day 1)

- [ ] Initialize project with Solokit Dashboard Refine stack (Tier 4)
- [ ] Configure Supabase project (database, auth, storage)
- [ ] Set up environment variables
- [ ] Configure Refine data provider for Supabase
- [ ] Run database migrations (create all tables)
- [ ] Deploy initial skeleton to Vercel
- [ ] Verify CI/CD pipeline working

### Phase 1: Landing Page Structure (Week 1)

- [ ] Create public route group `(public)/`
- [ ] Build layout with header and footer components
- [ ] Create Hero section component
- [ ] Create Transformations section component
- [ ] Create Revelation section component
- [ ] Create About section with accordion
- [ ] Create Difference section with accordion
- [ ] Create Challenge section component
- [ ] Implement mobile responsive navigation
- [ ] Add floating trays (Quick Access, Points, Day Counter)

### Phase 2: Landing Page Modals (Week 2)

- [ ] Create modal base component with shadcn/ui Dialog
- [ ] Assessment Modal (7 sliders with react-hook-form)
- [ ] Calculator Modal (all form fields + medical conditions)
- [ ] Results Modal (dynamic display with calculations)
- [ ] Real Results Modal (YouTube embeds, image gallery)
- [ ] Meet Expert Modal
- [ ] The Method Modal (phase cards, pillars)
- [ ] Elite Programs Modal (3 program cards)
- [ ] Body Fat Guide Modal
- [ ] High-Performer Trap Modal
- [ ] Elite Lifestyles Modal
- [ ] Calendly Modal (embed integration)

### Phase 3: Gamification System (Week 2-3)

- [ ] Create `use-gamification` hook for points/streaks
- [ ] Implement localStorage persistence for anonymous users
- [ ] User Guide Modal (challenge explanation)
- [ ] Challenge Hub Modal with 3 tabs
- [ ] 30-day calendar component
- [ ] Daily metrics tracking form
- [ ] Week unlocking logic (90% completion)
- [ ] Progressive targets calculation (+10%)
- [ ] Points display in floating tray
- [ ] Sync with Supabase when user logs in

### Phase 4: Authentication (Week 3)

- [ ] Configure Supabase Auth (email/password)
- [ ] Create login page `/login`
- [ ] Create registration page `/register`
- [ ] Implement Refine authProvider
- [ ] Create middleware for protected routes
- [ ] Role-based redirects (client → dashboard, admin → admin)
- [ ] Profile creation on signup (profiles table)
- [ ] Password reset flow

### Phase 5: Client Dashboard (Week 4)

- [ ] Create dashboard route group `(dashboard)/`
- [ ] Dashboard layout with sidebar navigation
- [ ] Dashboard home page with:
  - [ ] Today's overview (day number, date)
  - [ ] Calorie summary component (consumed/remaining)
  - [ ] Protein progress bar with gamification
  - [ ] Quick action buttons
- [ ] Create `use-daily-calories` hook with Refine
- [ ] Create `use-daily-target` hook

### Phase 6: Nutrition Module (Week 4-5)

- [ ] Diet plan page `/dashboard/diet`
- [ ] Meal card component with:
  - [ ] Default food item display
  - [ ] Click to expand alternatives
  - [ ] Color-coded calorie indicators (green/red)
  - [ ] Vegetarian filter toggle
- [ ] Food alternatives modal/drawer
- [ ] One-click food swap with optimistic updates
- [ ] Manual food logging form
- [ ] Food search (query food_items table)
- [ ] Real-time calorie counter updates

### Phase 7: Workout Module (Week 5-6)

- [ ] Workout plan page `/dashboard/workout`
- [ ] Workout item component with:
  - [ ] Exercise name, sets, reps, duration
  - [ ] Instructions expandable
  - [ ] Completion checkbox
- [ ] Section grouping (warmup, main, cooldown)
- [ ] Progress indicator (X/Y exercises complete)
- [ ] Workout log creation on completion
- [ ] Workout history page

### Phase 8: Check-In Module (Week 6-7)

- [ ] Check-in form page `/dashboard/checkin`
- [ ] Multi-step form with react-hook-form + zod
- [ ] Measurement inputs (weight, body measurements)
- [ ] Photo upload with Supabase Storage
  - [ ] Front/side/back photo slots
  - [ ] Image preview and crop
- [ ] Subjective rating sliders (energy, sleep, stress, mood)
- [ ] Compliance percentage inputs
- [ ] Text fields (challenges, progress, questions)
- [ ] Form validation and submission
- [ ] Check-in history page `/dashboard/checkin/history`

### Phase 9: Admin Dashboard (Week 7-8)

- [ ] Admin route group `(admin)/`
- [ ] Admin layout with sidebar
- [ ] Client list page with Refine useTable
  - [ ] Search and filter clients
  - [ ] Quick stats per client
- [ ] Individual client review page `/admin/clients/[id]`
  - [ ] Client profile summary
  - [ ] Weight progress chart (Chart.js/Recharts)
  - [ ] Check-in history timeline
  - [ ] Expandable check-in cards
  - [ ] Progress photos gallery
  - [ ] Admin notes input
  - [ ] Flag for follow-up toggle
- [ ] Food database management `/admin/food-database`
  - [ ] Food items list with CRUD
  - [ ] Bulk import (CSV)
- [ ] Diet plan editor `/admin/plans/[clientId]`

### Phase 10: Polish & Launch (Week 8-9)

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness audit
- [ ] Performance optimization (Lighthouse score > 90)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics integration (GTM, Google Analytics)
- [ ] SEO optimization (meta tags, OG images)
- [ ] Production environment setup
- [ ] Final QA testing
- [ ] Launch 🚀

---

## 11. SUCCESS METRICS

### 11.1 Landing Page Metrics

| Metric                     | Target |
| -------------------------- | ------ |
| Assessment completion rate | > 50%  |
| Calculator completion rate | > 40%  |
| Challenge signup rate      | > 30%  |
| Strategy call booking rate | > 10%  |

### 11.2 Client Platform Metrics

| Metric                   | Target              |
| ------------------------ | ------------------- |
| Daily active users       | 80%+ of client base |
| Check-in completion rate | 90%+                |
| Food logging frequency   | 5+ days/week        |
| Coach review time        | < 5 minutes/client  |

### 11.3 Business Metrics

| Metric                        | Target        |
| ----------------------------- | ------------- |
| Time saved on data management | 80% reduction |
| Client retention increase     | +25%          |
| Client capacity increase      | 2x            |
| Client satisfaction score     | 4.5+/5.0      |

---

## APPENDIX A: FILE REFERENCES

### Existing Assets to Preserve

**Images:**

- metabolikal-logo-ultimate.png (main logo)
- metabolikal-logo-circular.png
- metabolikal-logo-alt.png
- shivashish-lifestyle.jpg (founder photo)
- proven-results-v2.jpg (transformation results)
- real-results-testimonials.jpg
- rhythm-circle-black.png (decorative)
- circle-white.png (decorative)

### Reference Files

**For Copy:** See LANDING_PAGE_COPY.md
**For Mockups:** See /mockups/ directory

---

## APPENDIX B: SECURITY NOTES

### Static Website Limitations

**Cannot Implement:**

- Secure server-side authentication
- Encrypted password storage
- Server-side file processing
- Email/SMS notifications
- Role-based access control enforcement

**Recommended for Production:**

- Migrate to proper backend (Node.js, Python, PHP)
- Use JWT or session-based authentication
- Implement password hashing (bcrypt)
- Use secure file upload service
- Add HTTPS/SSL

---

**END OF SPECIFICATION**
