#!/bin/bash

# Deploy to Staging Environment
# This script deploys Docker images to the staging VPS

set -e  # Exit on any error

echo "🚀 Deploying to STAGING environment..."
echo ""

STAGING_HOST="${STAGING_HOST:-deploy@staging.comfytag.com}"
STAGING_PORT="${STAGING_PORT:-22}"
DEPLOY_KEY="${HOME}/.ssh/comfytag_staging"

# Check if deploy key exists
if [ ! -f "$DEPLOY_KEY" ]; then
  echo "❌ Deploy key not found: $DEPLOY_KEY"
  echo "   Please set up SSH key for staging deployment."
  exit 1
fi

echo "📦 Deploying Docker images to staging..."
ssh -i "$DEPLOY_KEY" -p "$STAGING_PORT" "$STAGING_HOST" << 'REMOTE_DEPLOY'
  cd /home/deploy/comfytag

  echo "Pulling latest code..."
  git pull origin main

  echo "Stopping existing containers..."
  docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

  echo "Building Docker images (this may take 5-10 minutes)..."
  docker compose -f docker-compose.prod.yml build --no-cache api web partner admin

  echo "Starting containers..."
  docker compose -f docker-compose.prod.yml up -d

  echo "Waiting for services to be ready..."
  sleep 10

  echo "Checking health..."
  for service in web partner admin api; do
    if [ "$service" = "api" ]; then
      curl -f http://localhost:4002/api/health || (echo "❌ API health check failed"; exit 1)
    else
      curl -f http://localhost:3000 2>/dev/null || (echo "❌ $service health check failed"; exit 1)
    fi
    echo "✅ $service is healthy"
  done

  echo "✅ Staging deployment successful!"
REMOTE_DEPLOY

echo ""
echo "✅ Staging environment deployed and healthy!"
echo "   Access staging at: https://staging.comfytag.com"
