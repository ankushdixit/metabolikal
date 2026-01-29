# Test Users Reference

This document lists all test users seeded in the database for development and testing purposes.

> **Password**: All test users use the password `Test123!`

---

## Admin Users

| Name       | Email                 | Role  | Notes           |
| ---------- | --------------------- | ----- | --------------- |
| Admin User | admin@metabolikal.com | admin | Main admin user |

---

## Client Users

| Name            | Email                       | Role   | Status      | Notes                                    |
| --------------- | --------------------------- | ------ | ----------- | ---------------------------------------- |
| Alex Thompson   | active.client@test.com      | client | Active      | Good progress, 45 days                   |
| Jordan Martinez | struggling.client@test.com  | client | Flagged     | Struggling, flagged for follow-up        |
| Sam Wilson      | new.client@test.com         | client | Active      | New client with pending reviews, 14 days |
| Morgan Chen     | success.client@test.com     | client | Active      | Long-term success, 90 days               |
| Casey Rivera    | brandnew.client@test.com    | client | Active      | Brand new, just started (3 days)         |
| Taylor Brown    | deactivated.client@test.com | client | Deactivated | Requested pause                          |
| Jamie Parker    | conditions.client@test.com  | client | Active      | Female, has medical conditions (PCOS)    |

---

## Challenger Users

| Name           | Email                         | Role       | Status    | Notes                                 |
| -------------- | ----------------------------- | ---------- | --------- | ------------------------------------- |
| Riley Johnson  | active.challenger@test.com    | challenger | Active    | Mid-challenge (day 15), good progress |
| Avery Williams | completed.challenger@test.com | challenger | Completed | Finished 30-day challenge             |
| Quinn Davis    | new.challenger@test.com       | challenger | Active    | Just started (day 1)                  |
| Peyton Miller  | inactive.challenger@test.com  | challenger | Inactive  | Started 20 days ago, stopped at day 5 |
| Cameron Lee    | upgrade.challenger@test.com   | challenger | Completed | Ready for upgrade, high engagement    |

---

## Quick Copy Reference

### Admin Login

```
Email: admin@metabolikal.com
Password: Test123!
```

### Active Client Login

```
Email: active.client@test.com
Password: Test123!
```

### Active Challenger Login

```
Email: active.challenger@test.com
Password: Test123!
```

---

## User Roles Overview

| Role       | Access                                               |
| ---------- | ---------------------------------------------------- |
| admin      | Full admin dashboard, manage all clients/challengers |
| client     | Client dashboard, view assigned plans, check-ins     |
| challenger | Limited access, 30-day challenge features            |

---

## Seeding Instructions

Users are seeded via `supabase/seed.sql`. To reset and reseed:

```bash
# Local Supabase
supabase db reset

# Remote Supabase
# 1. Run seed-users.sh first (creates auth users)
# 2. Run seed.sql in Supabase Dashboard SQL Editor
```
