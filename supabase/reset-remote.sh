#!/bin/bash

# =============================================================================
# REMOTE SUPABASE RESET SCRIPT
# =============================================================================
#
# This script orchestrates a full reset of the remote Supabase database:
#   1. Links to remote project (if not already linked)
#   2. Pushes all migrations
#   3. Creates auth users via Admin API
#   4. Runs seed data
#
# USAGE:
#   ./supabase/reset-remote.sh
#
# REQUIREMENTS:
#   - Supabase CLI installed (npx supabase or supabase)
#   - .env.local with SUPABASE_SERVICE_ROLE_KEY
#   - psql available (for running seed.sql)
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/.." || exit 1

echo ""
echo -e "${BLUE}=============================================="
echo "  METABOLI-K-AL Remote Database Reset"
echo -e "==============================================${NC}"
echo ""

# =============================================================================
# STEP 0: Load environment variables
# =============================================================================

echo -e "${YELLOW}[0/5] Loading environment variables...${NC}"

if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
    echo -e "${GREEN}      Loaded .env.local${NC}"
else
    echo -e "${RED}      ERROR: .env.local not found${NC}"
    exit 1
fi

# Check required variables
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}      ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local${NC}"
    exit 1
fi

# Use DATABASE_URL or fall back to POSTGRES_URL
DATABASE_URL="${DATABASE_URL:-$POSTGRES_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}      ERROR: DATABASE_URL or POSTGRES_URL not found in .env.local${NC}"
    echo -e "${YELLOW}      Add your Supabase database URL to .env.local:${NC}"
    echo "      DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    exit 1
fi

SUPABASE_URL="${SUPABASE_URL:-https://lbydgfvvsklxeebwnnfg.supabase.co}"

echo -e "${GREEN}      SUPABASE_URL: $SUPABASE_URL${NC}"
echo ""

# =============================================================================
# STEP 1: Check Supabase CLI and link status
# =============================================================================

echo -e "${YELLOW}[1/5] Checking Supabase CLI...${NC}"

# Determine which supabase command to use
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
elif npx supabase --version &> /dev/null 2>&1; then
    SUPABASE_CMD="npx supabase"
else
    echo -e "${RED}      ERROR: Supabase CLI not found${NC}"
    echo "      Install with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}      Using: $SUPABASE_CMD${NC}"

# Check if linked to remote
if [ -f "supabase/.temp/project-ref" ]; then
    PROJECT_REF=$(cat supabase/.temp/project-ref 2>/dev/null || echo "")
    if [ -n "$PROJECT_REF" ]; then
        echo -e "${GREEN}      Already linked to project: $PROJECT_REF${NC}"
    fi
fi
echo ""

# =============================================================================
# STEP 2: Push migrations to remote
# =============================================================================

echo -e "${YELLOW}[2/5] Pushing migrations to remote...${NC}"
echo ""

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo -e "      Found ${MIGRATION_COUNT} migration files"
echo ""

echo -e "${BLUE}      Running: $SUPABASE_CMD db push --linked${NC}"
echo ""

$SUPABASE_CMD db push --linked

echo ""
echo -e "${GREEN}      Migrations pushed successfully${NC}"
echo ""

# =============================================================================
# STEP 3: Create auth users
# =============================================================================

echo -e "${YELLOW}[3/5] Creating auth users via Admin API...${NC}"
echo ""

# Run the seed-users.sh script
if [ -f "supabase/seed-users.sh" ]; then
    chmod +x supabase/seed-users.sh
    ./supabase/seed-users.sh
else
    echo -e "${RED}      ERROR: supabase/seed-users.sh not found${NC}"
    exit 1
fi

echo ""

# =============================================================================
# STEP 4: Run seed data
# =============================================================================

echo -e "${YELLOW}[4/5] Running seed data...${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}      ERROR: psql not found${NC}"
    echo "      Install PostgreSQL client or run seed.sql manually via Supabase Dashboard"
    echo ""
    echo "      Manual option:"
    echo "      1. Go to Supabase Dashboard > SQL Editor"
    echo "      2. Paste contents of supabase/seed.sql"
    echo "      3. Click 'Run'"
    exit 1
fi

echo -e "${BLUE}      Running: psql \"\$DATABASE_URL\" -f supabase/seed.sql${NC}"
echo ""

# Run seed.sql with psql
psql "$DATABASE_URL" -f supabase/seed.sql

echo ""
echo -e "${GREEN}      Seed data inserted successfully${NC}"
echo ""

# =============================================================================
# STEP 5: Verification
# =============================================================================

echo -e "${YELLOW}[5/5] Verifying data...${NC}"
echo ""

# Quick verification query
psql "$DATABASE_URL" -c "
SELECT
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'client') as clients,
    (SELECT COUNT(*) FROM profiles WHERE role = 'challenger') as challengers,
    (SELECT COUNT(*) FROM food_items) as food_items,
    (SELECT COUNT(*) FROM check_ins) as check_ins;
"

echo ""

# =============================================================================
# DONE
# =============================================================================

echo -e "${GREEN}=============================================="
echo "  RESET COMPLETE!"
echo -e "==============================================${NC}"
echo ""
echo "Test Credentials:"
echo "  Admin:      admin@metabolikal.com / Test123!"
echo "  Client:     active.client@test.com / Test123!"
echo "  Challenger: active.challenger@test.com / Test123!"
echo ""
echo "Next steps:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Login with test credentials above"
echo ""
