#!/bin/bash

# Production Rollback
# Reverts to the previous Docker images if something breaks

set -e

PROD_HOST="${PROD_HOST:-deploy@204.168.242.7}"
PROD_PORT="${PROD_PORT:-22}"
DEPLOY_KEY="${HOME}/.ssh/comfytag_hetzner"

echo "🚨 INITIATING PRODUCTION ROLLBACK"
echo "⚠️  This will revert to the previous deployment!"
echo ""

read -p "Are you sure? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled."
  exit 0
fi

echo ""
echo "Rolling back production..."

ssh -i "$DEPLOY_KEY" -p "$PROD_PORT" "$PROD_HOST" << 'ROLLBACK'
  cd /home/deploy/comfytag

  echo "Stopping current containers..."
  docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

  echo "Checking available images..."
  docker image ls | grep comfytag

  echo ""
  echo "⚠️  Manual action required!"
  echo "The current Docker images have been stopped."
  echo "Please choose which images to restore:"
  echo ""
  docker image ls --filter "reference=comfytag*:latest" --format "{{.Repository}} (created {{.CreatedAt}})"
  echo ""
  echo "To restore a specific image:"
  echo "  docker tag <image:version> <image:latest>"
  echo "  docker compose -f docker-compose.prod.yml up -d"
  echo ""

ROLLBACK

echo ""
echo "🚨 Rollback initiated. Please follow the manual steps above."
echo "After restoring images, verify with: ./scripts/health-check-prod.sh"
