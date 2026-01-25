#!/bin/bash

# Seed script to create test challenger users via Supabase Admin API
# This creates proper auth users that can actually log in
#
# Usage: ./supabase/seed-challenger-users.sh

cd "$(dirname "$0")/.." || exit 1

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

SUPABASE_URL="${SUPABASE_URL:-https://lbydgfvvsklxeebwnnfg.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    exit 1
fi

echo "Creating test challenger users via Supabase Admin API..."
echo ""

# Function to create a user
create_user() {
    local email=$1
    local password=$2
    local full_name=$3
    local user_id=$4

    echo -n "Creating user: $email... "

    response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"id\": \"${user_id}\",
            \"email\": \"${email}\",
            \"password\": \"${password}\",
            \"email_confirm\": true,
            \"user_metadata\": {
                \"full_name\": \"${full_name}\"
            }
        }" 2>/dev/null)

    # Check if user was created or already exists
    if echo "$response" | grep -q '"id"'; then
        echo "Created"
    elif echo "$response" | grep -q 'already been registered'; then
        echo "Already exists"
    else
        echo "Error"
        echo "  Response: $response"
    fi
}

# Create test challenger users
# Password for all test users: Test123!

create_user "marcus.johnson@email.com" "Test123!" "Marcus Johnson" "c1111111-1111-1111-1111-111111111111"
create_user "emily.rodriguez@email.com" "Test123!" "Emily Rodriguez" "c2222222-2222-2222-2222-222222222222"
create_user "david.kim@email.com" "Test123!" "David Kim" "c3333333-3333-3333-3333-333333333333"
create_user "sophia.patel@email.com" "Test123!" "Sophia Patel" "c4444444-4444-4444-4444-444444444444"
create_user "james.wilson@email.com" "Test123!" "James Wilson" "c5555555-5555-5555-5555-555555555555"
create_user "olivia.martinez@email.com" "Test123!" "Olivia Martinez" "c6666666-6666-6666-6666-666666666666"
create_user "ryan.thompson@email.com" "Test123!" "Ryan Thompson" "c7777777-7777-7777-7777-777777777777"
create_user "ava.nguyen@email.com" "Test123!" "Ava Nguyen" "c8888888-8888-8888-8888-888888888888"

echo ""
echo "Done! Now run the SQL seed script:"
echo "  psql \"\$POSTGRES_URL_NON_POOLING\" -f supabase/seed-challenger-data.sql"
