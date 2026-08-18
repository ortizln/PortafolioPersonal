#!/bin/bash
# ============================================
# monitor.sh — Health check para ALANTEK
# Ejecutar desde cron o manualmente
# ============================================
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
SITE_URL="${SITE_URL:-http://localhost}"
LOG="/var/log/alantek-monitor.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

check() {
  local name="$1" url="$2" expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    echo "[$(timestamp)] OK   $name ($code)"
    return 0
  else
    echo "[$(timestamp)] FAIL $name (expected $expected, got $code)"
    return 1
  fi
}

errors=0

# Backend health
check "API health"    "$API_URL/api/health"       200 || ((errors++))
check "Public company" "$API_URL/api/public/company" 200 || ((errors++))

# Nginx / Frontend
check "Homepage"      "$SITE_URL/"                 200 || ((errors++))
check "Blog page"     "$SITE_URL/portfolio/blog"   200 || ((errors++))

# Uploads (imagen de ejemplo)
check "Uploads proxy" "$SITE_URL/portfolio/uploads/" 200 || ((errors++))

# Docker container
if command -v docker &>/dev/null; then
  status=$(docker inspect --format='{{.State.Status}}' portfolio-api 2>/dev/null || echo "not found")
  if [ "$status" = "running" ]; then
    echo "[$(timestamp)] OK   Docker container: running"
  else
    echo "[$(timestamp)] FAIL Docker container: $status"
    ((errors++))
  fi
fi

# Disk usage
disk_pct=$(df / --output=pcent | tail -1 | tr -d '% ')
if [ "$disk_pct" -gt 90 ]; then
  echo "[$(timestamp)] WARN Disk usage: ${disk_pct}%"
  ((errors++))
else
  echo "[$(timestamp)] OK   Disk usage: ${disk_pct}%"
fi

# DB connectivity (requires psql)
if command -v psql &>/dev/null; then
  if PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h localhost -U postgres -d portfolio_db -c "SELECT 1" &>/dev/null; then
    echo "[$(timestamp)] OK   PostgreSQL: connected"
  else
    echo "[$(timestamp)] FAIL PostgreSQL: unreachable"
    ((errors++))
  fi
fi

echo ""
if [ "$errors" -eq 0 ]; then
  echo "[$(timestamp)] All checks passed ✓"
else
  echo "[$(timestamp)] $errors check(s) FAILED ✗"
fi

exit $errors
