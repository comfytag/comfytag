#!/bin/bash

# ComfyTag Docker Build & Health Test Script
# Purpose: Validate Docker images locally before pushing to GitHub
# Usage: ./scripts/test-docker-builds.sh

set -e

echo "🐳 ComfyTag Docker Build & Health Test"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Build Docker Images
echo ""
echo "${YELLOW}[1/6]${NC} Building Docker images..."
if docker compose -f docker-compose.prod.yml build --no-cache > /tmp/docker-build.log 2>&1; then
    echo "${GREEN}✓${NC} Docker images built successfully"
    ((TESTS_PASSED++))
else
    echo "${RED}✗${NC} Docker build failed. See /tmp/docker-build.log"
    cat /tmp/docker-build.log
    ((TESTS_FAILED++))
    exit 1
fi

# Test 2: Validate docker-compose.prod.yml
echo ""
echo "${YELLOW}[2/6]${NC} Validating docker-compose.prod.yml..."
if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} docker-compose.prod.yml is valid"
    ((TESTS_PASSED++))
else
    echo "${RED}✗${NC} docker-compose.prod.yml has errors"
    ((TESTS_FAILED++))
    exit 1
fi

# Test 3: Start containers
echo ""
echo "${YELLOW}[3/6]${NC} Starting containers (timeout: 60s)..."
if timeout 60 docker compose -f docker-compose.prod.yml up -d > /tmp/docker-start.log 2>&1; then
    echo "${GREEN}✓${NC} Containers started"
    ((TESTS_PASSED++))
    sleep 10  # Wait for services to stabilize
else
    echo "${RED}✗${NC} Failed to start containers"
    docker compose -f docker-compose.prod.yml logs
    ((TESTS_FAILED++))
    exit 1
fi

# Test 4: Verify containers are running (not restarting)
echo ""
echo "${YELLOW}[4/6]${NC} Checking container health (must be 'Up', not 'Restarting')..."
UNHEALTHY=0

for service in web partner admin api nginx redis; do
    STATUS=$(docker compose -f docker-compose.prod.yml ps | grep "comfytag-$service" | awk '{print $NF}' 2>/dev/null || echo "MISSING")

    if [[ "$STATUS" == *"Up"* ]]; then
        echo "${GREEN}✓${NC} comfytag-$service: $STATUS"
    elif [[ "$STATUS" == "MISSING" ]]; then
        echo "${YELLOW}⊘${NC} comfytag-$service: Not found (may not be in compose)"
    else
        echo "${RED}✗${NC} comfytag-$service: $STATUS (UNHEALTHY)"
        ((UNHEALTHY++))
    fi
done

if [ $UNHEALTHY -eq 0 ]; then
    ((TESTS_PASSED++))
else
    echo "${RED}✗${NC} $UNHEALTHY container(s) unhealthy or restarting"
    ((TESTS_FAILED++))
fi

# Test 5: Verify critical files exist in images
echo ""
echo "${YELLOW}[5/6]${NC} Verifying critical files in Docker images..."
FILES_OK=0
FILES_MISSING=0

for app in web partner admin; do
    FILE="/app/apps/$app/server.js"
    if docker run --rm comfytag-$app ls -la $FILE > /dev/null 2>&1; then
        echo "${GREEN}✓${NC} comfytag-$app: $FILE exists"
        ((FILES_OK++))
    else
        echo "${RED}✗${NC} comfytag-$app: $FILE NOT FOUND (CRITICAL ERROR)"
        ((FILES_MISSING++))
    fi
done

if [ $FILES_MISSING -eq 0 ]; then
    ((TESTS_PASSED++))
else
    echo "${RED}✗${NC} $FILES_MISSING critical file(s) missing from Docker images"
    ((TESTS_FAILED++))
    exit 1
fi

# Test 6: Smoke test endpoints
echo ""
echo "${YELLOW}[6/6]${NC} Testing endpoints respond..."
ENDPOINTS_OK=0
ENDPOINTS_FAILED=0

declare -A ENDPOINTS=(
    ["Web"]="http://localhost:3000"
    ["Partner"]="http://localhost:3001"
    ["Admin"]="http://localhost:3002"
    ["API"]="http://localhost:4002/api/health"
)

for name in "${!ENDPOINTS[@]}"; do
    url="${ENDPOINTS[$name]}"
    if timeout 5 curl -sf "$url" > /dev/null 2>&1; then
        echo "${GREEN}✓${NC} $name: responding"
        ((ENDPOINTS_OK++))
    else
        echo "${RED}✗${NC} $name: NOT responding (URL: $url)"
        ((ENDPOINTS_FAILED++))
    fi
done

if [ $ENDPOINTS_FAILED -eq 0 ]; then
    ((TESTS_PASSED++))
else
    echo "${RED}✗${NC} $ENDPOINTS_FAILED endpoint(s) not responding"
    ((TESTS_FAILED++))
fi

# Cleanup
echo ""
echo "${YELLOW}Cleaning up...${NC}"
docker compose -f docker-compose.prod.yml down > /dev/null 2>&1

# Summary
echo ""
echo "========================================"
echo "Test Summary: ${GREEN}${TESTS_PASSED} passed${NC}, ${RED}${TESTS_FAILED} failed${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "${GREEN}✓ All tests passed! Docker images are safe to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. git add ."
    echo "  2. git commit -m 'Your changes'"
    echo "  3. git push origin main"
    echo "  4. GitHub Actions will validate and deploy automatically"
    exit 0
else
    echo ""
    echo "${RED}✗ Some tests failed. Do not push to GitHub until fixed.${NC}"
    exit 1
fi
