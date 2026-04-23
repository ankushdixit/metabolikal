#!/usr/bin/env bash
#
# Clone Supabase prod database into dev.
#
#   Phase 1 (dump):  pg_dump from prod — READ-ONLY, never writes to prod.
#   Phase 2 (apply): wipes dev and restores from the local dump files.
#                    Then resets every dev user's password to $COMMON_PASSWORD.
#
# Usage:
#   scripts/clone-prod-to-dev.sh dump
#   scripts/clone-prod-to-dev.sh apply
#   scripts/clone-prod-to-dev.sh verify
#
# Env vars (required, read from .env.db-clone if present):
#   PROD_DB_URL        - postgres:// URL for prod (read-only)
#   DEV_DB_URL         - postgres:// URL for dev  (will be wiped)
#   COMMON_PASSWORD    - plaintext password every dev user gets (default: Test123!)
#
# Safety rails:
#   - PROD_DB_URL must contain project-ref $PROD_REF_EXPECTED
#   - DEV_DB_URL  must contain project-ref $DEV_REF_EXPECTED
#   - The two URLs must differ
#   - `apply` prompts for the literal word WIPE before touching dev

set -euo pipefail

# ---------- config ----------
PROD_REF_EXPECTED="uwzodopcuchynisctjzg"
DEV_REF_EXPECTED="hryrlxcwnzvnogihantm"

# Pin PG17 client tools (Supabase runs PG17; older clients refuse to dump)
PG_BIN="/opt/homebrew/opt/postgresql@17/bin"
PG_DUMP="$PG_BIN/pg_dump"
PG_RESTORE="$PG_BIN/pg_restore"
PSQL="$PG_BIN/psql"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DUMP_DIR="$ROOT/.db-clone"

# ---------- colors ----------
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
NC=$'\033[0m'

say()  { printf '%s\n' "$*"; }
ok()   { printf '%s✓%s %s\n' "$GREEN" "$NC" "$*"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$NC" "$*"; }
err()  { printf '%s✗%s %s\n' "$RED" "$NC" "$*" >&2; }
step() { printf '\n%s==>%s %s\n' "$BLUE" "$NC" "$*"; }

# ---------- env loading ----------
if [ -f "$ROOT/.env.db-clone" ]; then
    # shellcheck disable=SC1090,SC1091
    set -a; . "$ROOT/.env.db-clone"; set +a
fi

: "${PROD_DB_URL:?PROD_DB_URL must be set (put it in .env.db-clone)}"
: "${DEV_DB_URL:?DEV_DB_URL must be set (put it in .env.db-clone)}"
COMMON_PASSWORD="${COMMON_PASSWORD:-Test123!}"

# ---------- guards ----------
if [[ "$PROD_DB_URL" != *"$PROD_REF_EXPECTED"* ]]; then
    err "PROD_DB_URL does not contain expected project ref '$PROD_REF_EXPECTED'."
    exit 1
fi
if [[ "$DEV_DB_URL" != *"$DEV_REF_EXPECTED"* ]]; then
    err "DEV_DB_URL does not contain expected project ref '$DEV_REF_EXPECTED'."
    exit 1
fi
if [ "$PROD_DB_URL" = "$DEV_DB_URL" ]; then
    err "PROD_DB_URL and DEV_DB_URL are identical — refusing to proceed."
    exit 1
fi
if [ ! -x "$PG_DUMP" ] || [ ! -x "$PG_RESTORE" ] || [ ! -x "$PSQL" ]; then
    err "Postgres 17 client tools not found at $PG_BIN"
    err "Install with: brew install postgresql@17"
    exit 1
fi

# ---------- phases ----------

phase_dump() {
    step "Phase 1 / DUMP — reading from prod (ref: $PROD_REF_EXPECTED)"
    mkdir -p "$DUMP_DIR"

    say "Dump directory: $DUMP_DIR"
    say ""

    # A. public schema: full schema + data, custom format for pg_restore --clean
    say "[1/3] Dumping public schema (schema + data)..."
    "$PG_DUMP" "$PROD_DB_URL" \
        --schema=public \
        --format=custom \
        --no-owner \
        --no-privileges \
        --file="$DUMP_DIR/public.dump"
    ok "  → $DUMP_DIR/public.dump ($(du -h "$DUMP_DIR/public.dump" | cut -f1))"

    # B. auth data (users + identities only; mfa_factors is empty on prod)
    say "[2/3] Dumping auth data (users, identities)..."
    "$PG_DUMP" "$PROD_DB_URL" \
        --data-only \
        --format=custom \
        --no-owner \
        --no-privileges \
        --table=auth.users \
        --table=auth.identities \
        --file="$DUMP_DIR/auth.dump"
    ok "  → $DUMP_DIR/auth.dump ($(du -h "$DUMP_DIR/auth.dump" | cut -f1))"

    # C. storage.buckets only (not objects; blobs aren't being copied)
    say "[3/3] Dumping storage.buckets..."
    "$PG_DUMP" "$PROD_DB_URL" \
        --data-only \
        --format=custom \
        --no-owner \
        --no-privileges \
        --table=storage.buckets \
        --file="$DUMP_DIR/storage.dump"
    ok "  → $DUMP_DIR/storage.dump ($(du -h "$DUMP_DIR/storage.dump" | cut -f1))"

    say ""
    say "Contents preview:"
    say "  public.dump  — $(("$PG_RESTORE" -l "$DUMP_DIR/public.dump" | grep -c '^'))  entries"
    say "  auth.dump    — $(("$PG_RESTORE" -l "$DUMP_DIR/auth.dump"   | grep -c '^'))  entries"
    say "  storage.dump — $(("$PG_RESTORE" -l "$DUMP_DIR/storage.dump" | grep -c '^')) entries"

    say ""
    # Row count baseline captured at dump time
    say "Recording row-count baseline from prod..."
    "$PSQL" "$PROD_DB_URL" -At -F'|' \
        -c "SELECT 'auth.users', COUNT(*) FROM auth.users
            UNION ALL SELECT 'auth.identities', COUNT(*) FROM auth.identities
            UNION ALL SELECT 'storage.buckets', COUNT(*) FROM storage.buckets;" \
        > "$DUMP_DIR/prod-baseline.txt"
    "$PSQL" "$PROD_DB_URL" -At -F'|' \
        -c "SELECT schemaname||'.'||tablename,
                   (xpath('/row/c/text()', xml_count))[1]::text::int
            FROM (
                SELECT schemaname, tablename,
                       query_to_xml(
                         format('SELECT COUNT(*) AS c FROM %I.%I', schemaname, tablename),
                         true, true, '') AS xml_count
                FROM pg_tables WHERE schemaname='public'
            ) t ORDER BY 1;" \
        >> "$DUMP_DIR/prod-baseline.txt"
    ok "  → $DUMP_DIR/prod-baseline.txt"

    say ""
    ok "DUMP complete. Prod was only read from."
    say ""
    say "Next: ${GREEN}scripts/clone-prod-to-dev.sh apply${NC}"
}

phase_apply() {
    step "Phase 2 / APPLY — wiping and restoring dev (ref: $DEV_REF_EXPECTED)"

    if [ ! -f "$DUMP_DIR/public.dump" ] \
    || [ ! -f "$DUMP_DIR/auth.dump" ] \
    || [ ! -f "$DUMP_DIR/storage.dump" ]; then
        err "Missing dump files. Run '$0 dump' first."
        exit 1
    fi

    warn "About to WIPE the dev database at project ref: $DEV_REF_EXPECTED"
    warn "All data in dev's public, and in auth.users/identities and storage.buckets, will be deleted."
    printf "Type the word %sWIPE%s to confirm: " "$RED" "$NC"
    read -r confirm
    if [ "$confirm" != "WIPE" ]; then
        err "Aborted (you typed '$confirm')."
        exit 1
    fi

    # Build a filtered TOC that skips the dump's CREATE SCHEMA public
    # (we pre-create it ourselves so btree_gist can be installed in it
    # before the EXCLUDE USING gist constraint on client_plan_limits needs it).
    say "[1/6] Preparing filtered TOC..."
    "$PG_RESTORE" -l "$DUMP_DIR/public.dump" \
        | grep -v '2615 2200 SCHEMA - public' \
        | grep -v 'COMMENT - SCHEMA public' \
        > "$DUMP_DIR/public.toc"
    ok "  toc: $(wc -l < "$DUMP_DIR/public.toc") entries"

    # Wipe dev. CASCADE follows FKs into public tables (e.g. profiles) and
    # into auth.identities/sessions/etc. Dropping public also cascades into
    # any extensions it hosts (btree_gist) and the on_auth_user_created
    # trigger which references public.handle_new_user().
    say "[2/6] Wiping dev database..."
    "$PSQL" "$DEV_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
TRUNCATE auth.users CASCADE;
TRUNCATE storage.buckets CASCADE;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL  ON SCHEMA public TO postgres, service_role;

-- Prod hosts btree_gist in public (used by an EXCLUDE USING gist constraint
-- in public.client_plan_limits). pg_dump --schema=public does NOT dump
-- extensions, so we must install it ourselves before any constraint needs it.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
COMMIT;
SQL
    ok "  dev wiped"

    # Three-section restore because we have a circular dependency between
    # schemas:
    #   - public.profiles has FK profiles.id -> auth.users(id), so auth data
    #     must exist before public FKs are added.
    #   - on_auth_user_created trigger on auth.users calls
    #     public.handle_new_user(), so public functions must exist before auth
    #     data is loaded.
    # Solution: pre-data (tables/functions) -> all data -> post-data (FKs,
    # indexes, policies, triggers).
    say "[3/6] Pre-data: tables, types, functions..."
    "$PG_RESTORE" \
        --dbname="$DEV_DB_URL" \
        --no-owner --no-privileges \
        --single-transaction \
        --section=pre-data \
        --use-list="$DUMP_DIR/public.toc" \
        "$DUMP_DIR/public.dump"
    ok "  pre-data restored"

    # Data load: --disable-triggers would be ideal but requires table
    # ownership we don't have on auth.* and storage.*. We omit it because the
    # only trigger we care about (on_auth_user_created) does not exist yet —
    # it was cascade-dropped in the wipe step and is not in the public dump
    # (the trigger lives on auth.users). It is reinstalled in step [5/6].
    say "[4/6] Data: auth -> public -> storage..."
    "$PG_RESTORE" --dbname="$DEV_DB_URL" --no-owner --no-privileges \
        --data-only --single-transaction "$DUMP_DIR/auth.dump"
    "$PG_RESTORE" --dbname="$DEV_DB_URL" --no-owner --no-privileges \
        --data-only --single-transaction \
        --use-list="$DUMP_DIR/public.toc" "$DUMP_DIR/public.dump"
    "$PG_RESTORE" --dbname="$DEV_DB_URL" --no-owner --no-privileges \
        --data-only --single-transaction "$DUMP_DIR/storage.dump"
    ok "  data restored"

    say "[5/6] Post-data: constraints, FKs, indexes, triggers, policies..."
    "$PG_RESTORE" \
        --dbname="$DEV_DB_URL" \
        --no-owner --no-privileges \
        --single-transaction \
        --section=post-data \
        --use-list="$DUMP_DIR/public.toc" \
        "$DUMP_DIR/public.dump"
    ok "  post-data restored"

    # Reapply Supabase's standard grants on public. Because we dumped with
    # --no-privileges, GRANTs to anon/authenticated/service_role did NOT
    # come across — without this, RLS-authenticated queries from the app
    # fail with "permission denied for table <x>", the middleware silently
    # falls back to role='challenger', and the user gets bounced to
    # /?error=upgrade_required. btree_gist operator functions emit harmless
    # "no privileges were granted" warnings because we don't own them.
    say "  reapplying public grants for anon/authenticated/service_role..."
    "$PSQL" "$DEV_DB_URL" -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<'SQL'
GRANT ALL ON ALL TABLES    IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES  TO postgres, anon, authenticated, service_role;
SQL
    ok "  grants applied"

    # The on_auth_user_created trigger lives on auth.users (outside our
    # public-only dump), so we reapply the migration that defines it.
    local trigger_mig="$ROOT/supabase/migrations/20260120000000_add_profile_creation_trigger.sql"
    if [ -f "$trigger_mig" ]; then
        say "  reapplying on_auth_user_created trigger from migration..."
        "$PSQL" "$DEV_DB_URL" -v ON_ERROR_STOP=1 -f "$trigger_mig" >/dev/null
        ok "  trigger reapplied"
    else
        warn "  trigger migration not found at $trigger_mig — skipping"
    fi

    # Reset every password + clear pending-auth state. confirmed_at is a
    # generated column in current Supabase (LEAST of email/phone confirmed_at)
    # so we only touch email_confirmed_at.
    say "[6/6] Resetting every user's password to the common value..."
    "$PSQL" "$DEV_DB_URL" -v ON_ERROR_STOP=1 \
        -v pw="$COMMON_PASSWORD" <<'SQL'
UPDATE auth.users SET
    encrypted_password         = crypt(:'pw', gen_salt('bf')),
    email_confirmed_at         = COALESCE(email_confirmed_at, now()),
    recovery_token             = '',
    recovery_sent_at           = NULL,
    confirmation_token         = '',
    confirmation_sent_at       = NULL,
    email_change_token_current = '',
    email_change_token_new     = '',
    email_change               = '',
    reauthentication_token     = '',
    reauthentication_sent_at   = NULL,
    banned_until               = NULL,
    updated_at                 = now();

-- Force all existing sessions to expire.
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
SQL
    ok "  all dev users now have password: $COMMON_PASSWORD"

    say ""
    ok "APPLY complete."
    say ""
    say "Next: ${GREEN}scripts/clone-prod-to-dev.sh verify${NC}"
}

phase_verify() {
    step "Phase 3 / VERIFY — comparing dev against prod baseline"

    if [ ! -f "$DUMP_DIR/prod-baseline.txt" ]; then
        err "No baseline file — run 'dump' first."
        exit 1
    fi

    local tmp_dev
    tmp_dev="$(mktemp)"

    "$PSQL" "$DEV_DB_URL" -At -F'|' \
        -c "SELECT 'auth.users', COUNT(*) FROM auth.users
            UNION ALL SELECT 'auth.identities', COUNT(*) FROM auth.identities
            UNION ALL SELECT 'storage.buckets', COUNT(*) FROM storage.buckets;" \
        > "$tmp_dev"
    "$PSQL" "$DEV_DB_URL" -At -F'|' \
        -c "SELECT schemaname||'.'||tablename,
                   (xpath('/row/c/text()', xml_count))[1]::text::int
            FROM (
                SELECT schemaname, tablename,
                       query_to_xml(
                         format('SELECT COUNT(*) AS c FROM %I.%I', schemaname, tablename),
                         true, true, '') AS xml_count
                FROM pg_tables WHERE schemaname='public'
            ) t ORDER BY 1;" \
        >> "$tmp_dev"

    say ""
    printf '%-45s %10s %10s %s\n' "table" "prod" "dev" ""
    printf '%-45s %10s %10s %s\n' "-----" "----" "---" ""
    local diff_count=0
    while IFS='|' read -r name prod_ct; do
        dev_ct="$(grep "^${name}|" "$tmp_dev" | cut -d'|' -f2 || true)"
        dev_ct="${dev_ct:-?}"
        if [ "$prod_ct" = "$dev_ct" ]; then
            marker="${GREEN}OK${NC}"
        else
            marker="${RED}DIFF${NC}"
            diff_count=$((diff_count + 1))
        fi
        printf '%-45s %10s %10s %b\n' "$name" "$prod_ct" "$dev_ct" "$marker"
    done < "$DUMP_DIR/prod-baseline.txt"

    rm -f "$tmp_dev"

    say ""
    if [ "$diff_count" -eq 0 ]; then
        ok "All row counts match prod baseline."
    else
        warn "$diff_count table(s) differ from prod. Review above."
    fi
}

# ---------- main ----------
case "${1:-}" in
    dump)   phase_dump ;;
    apply)  phase_apply ;;
    verify) phase_verify ;;
    *)
        say "usage: $0 {dump|apply|verify}"
        say ""
        say "  dump    Dump prod to $DUMP_DIR (read-only on prod)"
        say "  apply   Wipe dev and restore from dumps (prompts for WIPE)"
        say "  verify  Compare dev row counts against the prod baseline"
        exit 1
        ;;
esac
