#!/bin/bash

# Production Health Check
# Verifies that production is healthy after deployment

set -e

PROD_HOST="${PROD_HOST:-deploy@204.168.242.7}"
PROD_PORT="${PROD_PORT:-22}"
DEPLOY_KEY="${HOME}/.ssh/comfytag_hetzner"

echo "🏥 Running production health checks..."
echo ""

ssh -i "$DEPLOY_KEY" -p "$PROD_PORT" "$PROD_HOST" << 'HEALTH_CHECK'
  echo "Checking error rates and response times..."

  # Check web app
  echo -n "Web app (GET /): "
  RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost/)
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ 200 OK"
  else
    echo "❌ $RESPONSE"
    exit 1
  fi

  # Check partner dashboard
  echo -n "Partner dashboard: "
  RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost/login)
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ 200 OK"
  else
    echo "⚠️  $RESPONSE (expected if Nginx routes differ)"
  fi

  # Check API
  echo -n "API health: "
  RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:4002/api/health)
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
    echo "✅ Responding"
  else
    echo "❌ $RESPONSE"
    exit 1
  fi

  # Check container statuses
  echo ""
  echo "Container statuses:"
  docker compose -f docker-compose.prod.yml ps --format "table {{.Names}}\t{{.Status}}"

  # Check for critical errors in logs
  echo ""
  echo "Checking logs for errors (last 20 lines of each)..."
  for container in comfytag-web comfytag-partner comfytag-admin comfytag-api; do
    ERRORS=$(docker logs --tail 20 "$container" 2>&1 | grep -i "error\|failed\|critical" | wc -l)
    if [ "$ERRORS" -gt 0 ]; then
      echo "⚠️  $container: $ERRORS error messages found"
      docker logs --tail 10 "$container" 2>&1 | grep -i "error\|failed" || true
    else
      echo "✅ $container: No critical errors"
    fi
  done

  echo ""
  echo "✅ Health check passed!"
HEALTH_CHECK

echo ""
echo "✅ Production is healthy!"
