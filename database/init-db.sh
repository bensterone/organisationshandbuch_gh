#!/usr/bin/env bash
# =============================================================
#  ORGANISATIONSHANDBUCH — DATABASE INITIALIZATION SCRIPT
# =============================================================
# This script:
#  - Reads DB settings from .env (backend or root)
#  - Drops and recreates the database
#  - Runs schema.sql and seed.sql
#  - Works with both local MySQL and Docker containers
# =============================================================

set -e

# --- Locate .env file (backend or project root) ---
if [ -f "../backend/.env" ]; then
  ENV_FILE="../backend/.env"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
else
  ENV_FILE=""
fi

if [ -n "$ENV_FILE" ]; then
  echo "📄 Loading environment variables from $ENV_FILE"
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "⚠️  No .env file found — falling back to defaults"
fi

# --- Default fallbacks ---
DB_NAME="${DB_DATABASE:-organisationshandbuch}"
DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"

# ANSI colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${YELLOW}=== Organisationhandbuch DB Init ===${NC}"
echo -e "Database: ${GREEN}$DB_NAME${NC}"
echo -e "Host: ${GREEN}$DB_HOST${NC}  Port: ${GREEN}$DB_PORT${NC}"
echo -e "User: ${GREEN}$DB_USER${NC}"
echo ""

read -p "⚠️  This will DROP and RECREATE the database '$DB_NAME'. Continue? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled."
  exit 0
fi

# --- Choose MySQL command (Docker or local) ---
MYSQL_CMD="mysql -u$DB_USER"
if [[ -n "$DB_PASS" ]]; then
  MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
fi
MYSQL_CMD="$MYSQL_CMD -h $DB_HOST -P $DB_PORT"

# --- Detect Docker MySQL container ---
if docker ps --format '{{.Names}}' | grep -qw mysql; then
  echo -e "${YELLOW}🐳 Detected running MySQL container named 'mysql'${NC}"
  MYSQL_CMD="docker exec -i mysql mysql -u$DB_USER"
  if [[ -n "$DB_PASS" ]]; then
    MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
  fi
fi

# --- Run schema + seed ---
echo -e "${GREEN}1️⃣  Creating schema...${NC}"
$MYSQL_CMD < schema.sql

echo -e "${GREEN}2️⃣  Inserting demo data...${NC}"
$MYSQL_CMD < seed.sql

echo -e "${GREEN}✅ Database '$DB_NAME' initialized successfully.${NC}"
echo ""
echo -e "You can now connect with:"
echo -e "  ${YELLOW}mysql -u $DB_USER -p $DB_NAME${NC}"
echo ""
echo -e "Default demo users:"
echo -e "  • admin@company.com (admin)"
echo -e "  • editor@company.com (editor)"
echo -e "  • viewer@company.com (viewer)"
