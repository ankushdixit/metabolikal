# Known Issues

Bugs and issues found during manual testing that are **not related** to the stability/performance plan work. To be triaged and fixed separately.

**Created**: 2026-02-20

---

## Issue 1: Challenge "Starts in 0 days" when plan starts in the future

**Severity**: Medium
**Found on**: /dashboard/profile (MY PLAN card)
**Client**: Mamta Srivastava (plan_start_date: 2026-02-26)

The profile plan card shows "Starts in 0 days" with 0% progress, but the plan starts Feb 26 — 6 days from now (today is Feb 20). The countdown calculation is wrong.

Additionally, the challenge page (/dashboard/challenge) shows "1 days completed" with Day 1 checked on the calendar for Feb 26, even though that date hasn't arrived yet. The floating tray also shows "Day 1 / 89 days remaining" which is incorrect for a plan that hasn't started.

**Expected behavior**: "Starts in 6 days", no days completed, Day 1 should not be checked.

**Likely cause**: The days-since-start calculation in `lib/challenge-utils.ts` (`getDaysSinceStart`) or the plan card component doesn't correctly handle future start dates. There may also be a `challenge_progress` row in the DB for a date that hasn't occurred yet.

---

## Issue 2: Orphaned /dashboard/diet and /dashboard/workout pages

**Severity**: Low
**Found on**: /dashboard/diet, /dashboard/workout (accessible via URL only)

These pages are accessible by typing the URL directly but have no sidebar links. Diet, workout, supplement, and lifestyle activities were consolidated into "Today's Plan" (/dashboard). These orphaned pages:

- Still fetch data independently (unbounded queries)
- Are listed in the stability plan for error handling fixes (Task 2.1, 2.7) that may be unnecessary
- Could confuse anyone who discovers them via URL

**Recommendation**: Consider removing these route files to reduce dead code and skip unnecessary stability plan tasks for them.

---
