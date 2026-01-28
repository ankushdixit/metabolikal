#!/bin/bash

# =============================================================================
# UNIFIED SEED SCRIPT FOR ALL TEST USERS
# =============================================================================
#
# Creates auth users via Supabase Admin API that match the UUIDs in seed.sql.
# The profile creation trigger will automatically create profiles when auth
# users are created.
#
# USAGE:
#   ./supabase/seed-users.sh
#
# Then run seed.sql to update profiles with full test data.
#
# Password for ALL test users: Test123!
#
# =============================================================================

# Don't use set -e as ((var++)) returns 1 when var is 0

cd "$(dirname "$0")/.." || exit 1

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

SUPABASE_URL="${SUPABASE_URL:-https://lbydgfvvsklxeebwnnfg.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    echo ""
    echo "Add this to your .env.local file:"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Password for all test users
PASSWORD="Test123!"

echo "=============================================="
echo "Creating test users via Supabase Admin API"
echo "=============================================="
echo ""
echo "Password for all users: $PASSWORD"
echo ""

# Counters
CREATED=0
EXISTS=0
ERRORS=0

# Function to create a user with role metadata
# The trigger will use the role from user_metadata if provided
create_user() {
    local user_id=$1
    local email=$2
    local full_name=$3
    local role=$4
    local role_hint=$5

    printf "  %-12s %-35s %-20s " "$role_hint" "$email" "$full_name"

    response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"id\": \"${user_id}\",
            \"email\": \"${email}\",
            \"password\": \"${PASSWORD}\",
            \"email_confirm\": true,
            \"user_metadata\": {
                \"full_name\": \"${full_name}\",
                \"role\": \"${role}\"
            }
        }" 2>/dev/null)

    if echo "$response" | grep -q '"id"'; then
        echo "[CREATED]"
        ((CREATED++))
    elif echo "$response" | grep -q 'already been registered'; then
        echo "[EXISTS]"
        ((EXISTS++))
    else
        echo "[ERROR]"
        echo "      Response: $response"
        ((ERRORS++))
    fi
}

# =============================================================================
# ADMIN USER
# =============================================================================
echo "--- ADMIN ---"
create_user "00000000-0000-0000-0000-000000000100" "admin@metabolikal.com" "Admin User" "admin" "[ADMIN]"
echo ""

# =============================================================================
# CLIENT USERS
# =============================================================================
echo "--- CLIENTS ---"
create_user "00000000-0000-0000-0000-000000000201" "active.client@test.com" "Alex Thompson" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000202" "struggling.client@test.com" "Jordan Martinez" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000203" "new.client@test.com" "Sam Wilson" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000204" "success.client@test.com" "Morgan Chen" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000205" "brandnew.client@test.com" "Casey Rivera" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000206" "deactivated.client@test.com" "Taylor Brown" "client" "[CLIENT]"
create_user "00000000-0000-0000-0000-000000000207" "conditions.client@test.com" "Jamie Parker" "client" "[CLIENT]"
echo ""

# =============================================================================
# CHALLENGER USERS
# =============================================================================
echo "--- CHALLENGERS ---"
create_user "00000000-0000-0000-0000-000000000301" "active.challenger@test.com" "Riley Johnson" "challenger" "[CHALLENGER]"
create_user "00000000-0000-0000-0000-000000000302" "completed.challenger@test.com" "Avery Williams" "challenger" "[CHALLENGER]"
create_user "00000000-0000-0000-0000-000000000303" "new.challenger@test.com" "Quinn Davis" "challenger" "[CHALLENGER]"
create_user "00000000-0000-0000-0000-000000000304" "inactive.challenger@test.com" "Peyton Miller" "challenger" "[CHALLENGER]"
create_user "00000000-0000-0000-0000-000000000305" "upgrade.challenger@test.com" "Cameron Lee" "challenger" "[CHALLENGER]"
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=============================================="
echo "DONE!"
echo "=============================================="
echo ""
echo "Summary:"
echo "  Created: $CREATED"
echo "  Already existed: $EXISTS"
echo "  Errors: $ERRORS"
echo ""
echo "Total: 13 users (1 Admin, 7 Clients, 5 Challengers)"
echo ""
if [ $ERRORS -gt 0 ]; then
    echo "WARNING: Some users failed to create. Check errors above."
    echo ""
fi
echo "Next step - run the SQL seed to populate test data:"
echo "  psql \"\$DATABASE_URL\" -f supabase/seed.sql"
echo ""
echo "Or run the full reset script:"
echo "  ./supabase/reset-remote.sh"
echo ""
echo "=============================================="
echo "TEST CREDENTIALS"
echo "=============================================="
echo ""
echo "Admin Login:"
echo "  Email:    admin@metabolikal.com"
echo "  Password: $PASSWORD"
echo ""
echo "Sample Client Login:"
echo "  Email:    active.client@test.com"
echo "  Password: $PASSWORD"
echo ""
echo "Sample Challenger Login:"
echo "  Email:    active.challenger@test.com"
echo "  Password: $PASSWORD"
echo ""
