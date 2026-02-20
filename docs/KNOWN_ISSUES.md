# Known Issues

Bugs and issues found during manual testing that are **not related** to the stability/performance plan work. To be triaged and fixed separately.

**Created**: 2026-02-20

---

## Issue 1: Challenge "Starts in 0 days" when plan starts in the future — FIXED

**Severity**: Medium
**Found on**: /dashboard/profile (MY PLAN card)
**Fixed**: 2026-02-20

**Root cause**: `getDaysSinceStart()` clamped to minimum 1 even for future start dates, causing all downstream components to show "Day 1" and "Starts in 0 days" for plans that haven't started yet.

**Fix**: Changed `getDaysSinceStart()` to return 0 for future start dates. Added `daysUntilStart()` helper. Updated `GamificationState` with `isBeforeStart` and `daysUntilPlanStart`. Fixed all 11 affected consumer files to show "Starting Soon" / "Starts in X days" and prevent challenge progress saves before plan start.

---

## Issue 2: Orphaned /dashboard/diet and /dashboard/workout pages — FIXED

**Severity**: Low
**Found on**: /dashboard/diet, /dashboard/workout (accessible via URL only)
**Fixed**: 2026-02-20

Route files removed. Diet, workout, supplement, and lifestyle activities are consolidated into "Today's Plan" (/dashboard).

---
