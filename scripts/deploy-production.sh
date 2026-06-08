#!/bin/bash

# Deploy to Production Environment
# This script deploys Docker images to the production VPS

set -e  # Exit on any error

echo "🚀 Deploying to PRODUCTION environment..."
echo "⚠️  This will update the live application!"
echo ""

PROD_HOST="${PROD_HOST:-deploy@204.168.242.7}"
PROD_PORT="${PROD_PORT:-22}"
DEPLOY_KEY="${HOME}/.ssh/comfytag_hetzner"

# Check if deploy key exists
if [ ! -f "$DEPLOY_KEY" ]; then
  echo "❌ Deploy key not found: $DEPLOY_KEY"
  echo "   Please set up SSH key for production deployment."
  exit 1
fi

echo "📦 Deploying Docker images to production..."
ssh -i "$DEPLOY_KEY" -p "$PROD_PORT" "$PROD_HOST" << 'REMOTE_DEPLOY'
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
  for i in {1..10}; do
    if curl -f http://localhost 2>/dev/null && \
       curl -f http://localhost:4002/api/health 2>/dev/null; then
      echo "✅ All services healthy"
      break
    fi
    if [ $i -eq 10 ]; then
      echo "❌ Services not healthy after 10 attempts"
      exit 1
    fi
    echo "Attempt $i/10: Waiting for services..."
    sleep 3
  done

  echo "✅ Production deployment successful!"
REMOTE_DEPLOY

echo ""
echo "✅ Production deployed successfully!"
echo "   Live at: http://204.168.242.7"
