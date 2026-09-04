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

  echo "Restoring the previous deployment (tagged :rollback by the deploy pipeline before this release replaced it)..."
  MISSING_ROLLBACK_TAG=0
  for app in api web partner admin; do
    if docker image inspect comfytag-$app:rollback >/dev/null 2>&1; then
      docker tag comfytag-$app:rollback comfytag-$app:latest
    else
      echo "  ⚠️  No comfytag-$app:rollback tag found — cannot auto-restore this image."
      MISSING_ROLLBACK_TAG=1
    fi
  done

  if [ "$MISSING_ROLLBACK_TAG" = "1" ]; then
    echo ""
    echo "⚠️  One or more images had no :rollback tag (first deploy since this rollback"
    echo "tagging was added, or the tag was pruned). Choose manually from:"
    docker image ls --filter "reference=comfytag*" --format "{{.Repository}}:{{.Tag}} (created {{.CreatedAt}})"
    echo "  docker tag <image:version> <image:latest>"
  fi

  echo "Recording the previously-deployed commit this rollback restores to (if known)..."
  cat DEPLOYED_COMMIT.txt.rollback 2>/dev/null || echo "  (not recorded — check the deploy workflow's run history for the previous run's commit SHA)"

  echo "Starting containers on the restored images..."
  docker compose -f docker-compose.prod.yml up -d --no-build

  echo ""
  echo "Verify with: ./scripts/health-check-prod.sh"

ROLLBACK

echo ""
echo "🚨 Rollback initiated. Please follow the manual steps above."
echo "After restoring images, verify with: ./scripts/health-check-prod.sh"
