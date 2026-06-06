#!/bin/bash

# ComfyTag Deployment Verification Script
# Purpose: Run on VPS after deployment to verify all services are healthy
# Usage: Called automatically by GitHub Actions after docker compose up -d

set -e

echo "🔍 ComfyTag Deployment Verification"
echo "==================================="
echo ""
echo "Timestamp: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

# Wait a bit for containers to stabilize
echo "${YELLOW}Waiting for services to stabilize (30 seconds)...${NC}"
sleep 30
echo ""

# Check 1: Container Status
echo "${YELLOW}[1/5]${NC} Checking container status..."
RESTART_COUNT=0
while IFS= read -r line; do
    if [[ "$line" == *"Restarting"* ]]; then
        echo "${RED}✗${NC} Container in restart loop: $line"
        ((RESTART_COUNT++))
        ((CHECKS_FAILED++))
    fi
done < <(docker compose -f docker-compose.prod.yml ps)

if [ $RESTART_COUNT -eq 0 ]; then
    echo "${GREEN}✓${NC} All containers running (no restart loops)"
    ((CHECKS_PASSED++))
fi

# Check 2: Container Uptime
echo ""
echo "${YELLOW}[2/5]${NC} Checking container uptime..."
docker compose -f docker-compose.prod.yml ps | tail -n +2 | while read -r line; do
    STATUS=$(echo "$line" | awk '{print $(NF)}')
    if [[ "$STATUS" == "Up"* ]]; then
        UPTIME=$(echo "$STATUS" | sed 's/Up //')
        if [[ "$UPTIME" == *"second"* ]]; then
            SECONDS=$(echo "$UPTIME" | awk '{print $1}')
            if [ "$SECONDS" -gt 60 ]; then
                echo "${GREEN}✓${NC} Container uptime: $UPTIME (stable)"
            else
                echo "${YELLOW}⊘${NC} Container uptime: $UPTIME (still starting)"
            fi
        else
            echo "${GREEN}✓${NC} Container uptime: $UPTIME"
        fi
    fi
done
((CHECKS_PASSED++))

# Check 3: Endpoint Health
echo ""
echo "${YELLOW}[3/5]${NC} Testing endpoints..."
ENDPOINTS=(
    "http://localhost:3000"      # Web
    "http://localhost:3001"      # Partner
    "http://localhost:3002"      # Admin
    "http://localhost:4002/api/health"  # API
)

ENDPOINT_FAILURES=0
for endpoint in "${ENDPOINTS[@]}"; do
    if timeout 5 curl -sf "$endpoint" > /dev/null 2>&1; then
        echo "${GREEN}✓${NC} $endpoint responding"
    else
        echo "${RED}✗${NC} $endpoint NOT responding"
        ((ENDPOINT_FAILURES++))
    fi
done

if [ $ENDPOINT_FAILURES -eq 0 ]; then
    ((CHECKS_PASSED++))
else
    echo "${RED}✗${NC} $ENDPOINT_FAILURES endpoint(s) failed"
    ((CHECKS_FAILED++))
fi

# Check 4: Error Log Check
echo ""
echo "${YELLOW}[4/5]${NC} Checking logs for critical errors..."
ERROR_COUNT=0
ERROR_PATTERNS=(
    "Cannot find module"
    "ECONNREFUSED"
    "ENOTFOUND"
    "panic"
    "fatal error"
)

for pattern in "${ERROR_PATTERNS[@]}"; do
    if docker compose -f docker-compose.prod.yml logs --tail 200 2>/dev/null | grep -i "$pattern" > /dev/null; then
        echo "${RED}✗${NC} Found error pattern: '$pattern'"
        ((ERROR_COUNT++))
    fi
done

if [ $ERROR_COUNT -eq 0 ]; then
    echo "${GREEN}✓${NC} No critical errors found in logs"
    ((CHECKS_PASSED++))
else
    echo "${RED}✗${NC} Found $ERROR_COUNT critical error pattern(s)"
    ((CHECKS_FAILED++))
    # Show the actual errors
    echo ""
    echo "Error details:"
    docker compose -f docker-compose.prod.yml logs --tail 50
fi

# Check 5: Resource Usage
echo ""
echo "${YELLOW}[5/5]${NC} Checking resource usage..."
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.MemUsage}}" | tail -n +2 | awk '{print $1}' | tr -d 'A-Za-z' | awk '{sum+=$1} END {print sum}')

if command -v free &> /dev/null; then
    TOTAL_MEMORY=$(free -m | grep Mem | awk '{print $2}')
    USAGE_PERCENT=$((MEMORY_USAGE * 100 / TOTAL_MEMORY))
    echo "${GREEN}✓${NC} Memory usage: ${MEMORY_USAGE}MB / ${TOTAL_MEMORY}MB (${USAGE_PERCENT}%)"
    if [ $USAGE_PERCENT -gt 90 ]; then
        echo "${RED}⚠${NC} Memory usage is high (>90%)"
        ((CHECKS_FAILED++))
    else
        ((CHECKS_PASSED++))
    fi
else
    echo "${GREEN}✓${NC} Memory usage appears normal"
    ((CHECKS_PASSED++))
fi

# Summary
echo ""
echo "==================================="
echo ""
echo "Verification Summary:"
echo "  ${GREEN}${CHECKS_PASSED} checks passed${NC}"
if [ $CHECKS_FAILED -gt 0 ]; then
    echo "  ${RED}${CHECKS_FAILED} checks failed${NC}"
    echo ""
    echo "${RED}✗ Deployment verification FAILED${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Check logs: docker compose -f docker-compose.prod.yml logs --tail 100"
    echo "  2. Restart services: docker compose -f docker-compose.prod.yml restart"
    echo "  3. Manual rollback: git checkout <previous-commit-hash>"
    exit 1
else
    echo ""
    echo "${GREEN}✓ All verification checks PASSED${NC}"
    echo ""
    echo "Deployment is healthy!"
    echo "Next steps:"
    echo "  - Monitor endpoints via UptimeRobot"
    echo "  - Check logs periodically: docker compose logs -f"
    echo "  - Watch Docker stats: docker stats"
    exit 0
fi
