# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
