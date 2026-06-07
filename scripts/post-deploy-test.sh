#!/bin/bash

# ComfyTag Post-Deployment Verification
# Run this on VPS AFTER deployment to verify services are healthy
# Usage: ssh deploy@YOUR_VPS_IP "cd /home/deploy/comfytag && ./scripts/post-deploy-test.sh"

set -e

VPS_DEPLOYMENT_LOG="/tmp/comfytag-deploy-$(date +%s).log"

echo "════════════════════════════════════════════════════════" | tee -a $VPS_DEPLOYMENT_LOG
echo "  ✅ ComfyTag Post-Deployment Verification" | tee -a $VPS_DEPLOYMENT_LOG
echo "════════════════════════════════════════════════════════" | tee -a $VPS_DEPLOYMENT_LOG
echo "Timestamp: $(date)" | tee -a $VPS_DEPLOYMENT_LOG
echo ""

# Phase 1: Check git status
echo "Phase 1: Git Status" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG
CURRENT_COMMIT=$(git log --oneline -1)
echo "Deployed commit: $CURRENT_COMMIT" | tee -a $VPS_DEPLOYMENT_LOG

# Phase 2: Docker container status
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 2: Docker Container Status" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

UNHEALTHY_COUNT=0
docker compose -f docker-compose.prod.yml ps | tee -a $VPS_DEPLOYMENT_LOG
echo "" | tee -a $VPS_DEPLOYMENT_LOG

# Check each container status
for CONTAINER in comfytag-api comfytag-web comfytag-partner comfytag-admin comfytag-nginx comfytag-redis-prod; do
  STATUS=$(docker ps --filter "name=$CONTAINER" --format "{{.Status}}" 2>/dev/null || echo "Not Found")
  if [[ $STATUS == *"Exited"* ]] || [[ $STATUS == *"Dead"* ]]; then
    echo "❌ $CONTAINER: $STATUS" | tee -a $VPS_DEPLOYMENT_LOG
    UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
  elif [[ $STATUS == *"Up"* ]]; then
    echo "✅ $CONTAINER: $STATUS" | tee -a $VPS_DEPLOYMENT_LOG
  fi
done

if [ $UNHEALTHY_COUNT -gt 0 ]; then
  echo "" | tee -a $VPS_DEPLOYMENT_LOG
  echo "⚠️  $UNHEALTHY_COUNT container(s) not running! Checking logs..." | tee -a $VPS_DEPLOYMENT_LOG

  for CONTAINER in comfytag-api comfytag-web comfytag-partner comfytag-admin; do
    echo "" | tee -a $VPS_DEPLOYMENT_LOG
    echo "=== Logs for $CONTAINER ===" | tee -a $VPS_DEPLOYMENT_LOG
    docker compose -f docker-compose.prod.yml logs $CONTAINER --tail 30 2>&1 | tee -a $VPS_DEPLOYMENT_LOG
  done
  exit 1
fi

# Phase 3: Port connectivity
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 3: Port Connectivity" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

PORTS=("3000:web" "3001:partner" "3002:admin" "4002:api" "6379:redis" "80:nginx")
PORT_ERRORS=0

for PORT_PAIR in "${PORTS[@]}"; do
  PORT=${PORT_PAIR%%:*}
  SERVICE=${PORT_PAIR##*:}

  if nc -z localhost $PORT 2>/dev/null; then
    echo "✅ Port $PORT ($SERVICE): listening" | tee -a $VPS_DEPLOYMENT_LOG
  else
    echo "❌ Port $PORT ($SERVICE): NOT listening" | tee -a $VPS_DEPLOYMENT_LOG
    PORT_ERRORS=$((PORT_ERRORS + 1))
  fi
done

if [ $PORT_ERRORS -gt 0 ]; then
  echo "" | tee -a $VPS_DEPLOYMENT_LOG
  echo "⚠️  $PORT_ERRORS port(s) not responding!" | tee -a $VPS_DEPLOYMENT_LOG
  exit 1
fi

# Phase 4: API Health Endpoint
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 4: API Health Endpoint" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

HEALTH_RESPONSE=$(curl -s http://localhost:4002/api/health 2>/dev/null || echo "FAILED")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
  echo "✅ API health endpoint: RESPONDING" | tee -a $VPS_DEPLOYMENT_LOG
  echo "Response: $HEALTH_RESPONSE" | tee -a $VPS_DEPLOYMENT_LOG
else
  echo "❌ API health endpoint: NOT responding" | tee -a $VPS_DEPLOYMENT_LOG
  exit 1
fi

# Phase 5: Database connectivity
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 5: Database Connectivity" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

API_LOG=$(docker compose -f docker-compose.prod.yml logs api --tail 5 2>&1)
if echo "$API_LOG" | grep -q "Connected to MongoDB"; then
  echo "✅ MongoDB: Connected" | tee -a $VPS_DEPLOYMENT_LOG
elif echo "$API_LOG" | grep -q "MongoDB connection failed"; then
  echo "❌ MongoDB: Connection Failed" | tee -a $VPS_DEPLOYMENT_LOG
  echo "Check: Atlas IP whitelist includes VPS IP" | tee -a $VPS_DEPLOYMENT_LOG
  echo "Check: MONGODB_URI env var is correct in apps/api/.env" | tee -a $VPS_DEPLOYMENT_LOG
  exit 1
else
  echo "⚠️  MongoDB: Status unclear (check logs)" | tee -a $VPS_DEPLOYMENT_LOG
fi

# Phase 6: Redis connectivity
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 6: Redis Connectivity" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

if docker exec comfytag-redis-prod redis-cli ping 2>/dev/null | grep -q "PONG"; then
  echo "✅ Redis: Responsive" | tee -a $VPS_DEPLOYMENT_LOG
else
  echo "❌ Redis: Not responding" | tee -a $VPS_DEPLOYMENT_LOG
  exit 1
fi

# Phase 7: Disk space
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 7: Disk Space" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

DISK_USAGE=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 85 ]; then
  echo "✅ Disk usage: ${DISK_USAGE}% (healthy)" | tee -a $VPS_DEPLOYMENT_LOG
else
  echo "⚠️  Disk usage: ${DISK_USAGE}% (running low!)" | tee -a $VPS_DEPLOYMENT_LOG
  echo "Run: docker image prune -a && docker system prune -a" | tee -a $VPS_DEPLOYMENT_LOG
fi

# Phase 8: Memory usage
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Phase 8: Memory Usage" | tee -a $VPS_DEPLOYMENT_LOG
echo "─────────────────────────────────────────────────────────" | tee -a $VPS_DEPLOYMENT_LOG

docker stats --no-stream --format "{{.Container}}: {{.MemUsage}}" | tee -a $VPS_DEPLOYMENT_LOG

# Final summary
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "════════════════════════════════════════════════════════" | tee -a $VPS_DEPLOYMENT_LOG
echo "  ✅ DEPLOYMENT VERIFIED SUCCESSFULLY" | tee -a $VPS_DEPLOYMENT_LOG
echo "════════════════════════════════════════════════════════" | tee -a $VPS_DEPLOYMENT_LOG
echo "" | tee -a $VPS_DEPLOYMENT_LOG
echo "Log saved to: $VPS_DEPLOYMENT_LOG" | tee -a $VPS_DEPLOYMENT_LOG
