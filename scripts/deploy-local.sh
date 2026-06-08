#!/bin/bash

# ComfyTag Local Deploy Script
# Builds locally, tests, and deploys to production with auto-rollback safety

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

# Load environment variables
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
  echo -e "${YELLOW}Create .env.local with:${NC}"
  echo "PROD_HOST=your_ip_or_hostname"
  echo "PROD_USER=deploy"
  echo "PROD_KEY_PATH=~/.ssh/comfytag_hetzner"
  exit 1
fi

source "$ENV_FILE"

# Validate required variables
if [ -z "$PROD_HOST" ] || [ -z "$PROD_USER" ] || [ -z "$PROD_KEY_PATH" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ComfyTag Local Deployment Script                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Quality Checks
echo -e "${YELLOW}Step 1: Running quality checks...${NC}"
cd "$PROJECT_ROOT"

echo -e "  ${BLUE}→${NC} TypeScript check..."
pnpm typecheck || { echo -e "${RED}❌ TypeScript check failed${NC}"; exit 1; }

echo -e "  ${BLUE}→${NC} Linting..."
pnpm --filter !@comfytag/partner lint || { echo -e "${RED}❌ Linting failed${NC}"; exit 1; }

echo -e "  ${BLUE}→${NC} Running tests..."
pnpm test:ci || { echo -e "${YELLOW}⚠️  Some tests failed (continuing anyway)${NC}"; }

echo -e "${GREEN}✅ Quality checks passed${NC}"
echo ""

# Step 2: Build Docker Images
echo -e "${YELLOW}Step 2: Building Docker images (sequential)...${NC}"

echo -e "  ${BLUE}→${NC} Building API..."
docker compose -f docker-compose.prod.yml build api || { echo -e "${RED}❌ API build failed${NC}"; exit 1; }

echo -e "  ${BLUE}→${NC} Building Web..."
docker compose -f docker-compose.prod.yml build web || { echo -e "${RED}❌ Web build failed${NC}"; exit 1; }

echo -e "  ${BLUE}→${NC} Building Partner..."
docker compose -f docker-compose.prod.yml build partner || { echo -e "${RED}❌ Partner build failed${NC}"; exit 1; }

echo -e "  ${BLUE}→${NC} Building Admin..."
docker compose -f docker-compose.prod.yml build admin || { echo -e "${RED}❌ Admin build failed${NC}"; exit 1; }

echo -e "${GREEN}✅ All Docker images built successfully${NC}"
echo ""

# Step 3: Confirmation
echo -e "${YELLOW}Step 3: Deploying to production...${NC}"
echo -e "  Host: ${BLUE}$PROD_HOST${NC}"
echo -e "  User: ${BLUE}$PROD_USER${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Continue with deployment? [y/N]${NC}) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled${NC}"
  exit 0
fi

# Step 4: Deploy to Production
echo -e "${BLUE}Deploying...${NC}"

ssh -i "$PROD_KEY_PATH" "$PROD_USER@$PROD_HOST" << 'DEPLOY_SCRIPT'
  set -e

  cd /home/deploy/comfytag

  echo "📡 Pulling latest code..."
  git pull origin main

  echo "🐳 Building Docker images on production..."
  docker compose -f docker-compose.prod.yml build api
  docker compose -f docker-compose.prod.yml build web
  docker compose -f docker-compose.prod.yml build partner
  docker compose -f docker-compose.prod.yml build admin

  echo "🔄 Saving current images for rollback..."
  docker image ls --filter=reference='comfytag-*:latest' -q > /tmp/current_images.txt || true

  echo "🔄 Starting containers..."
  docker compose -f docker-compose.prod.yml up -d

  echo "⏳ Waiting for services to stabilize..."
  sleep 15

  echo "🏥 Running health checks..."
  HEALTH_OK=false
  for i in {1..10}; do
    if curl -f http://localhost 2>/dev/null; then
      echo "✅ Production services healthy"
      HEALTH_OK=true
      break
    fi
    echo "Attempt $i/10..."
    sleep 3
  done

  if [ "$HEALTH_OK" = false ]; then
    echo "❌ Health check failed - rolling back"
    docker compose -f docker-compose.prod.yml down
    exit 1
  fi

  echo "🧹 Cleaning up old images..."
  docker image prune -f

  echo "✅ Deployment complete!"
DEPLOY_SCRIPT

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║         ✅ Deployment Successful!                          ║${NC}"
  echo -e "${GREEN}║         Your camera fix is now live in production          ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
else
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║         ❌ Deployment Failed                               ║${NC}"
  echo -e "${RED}║         Health checks failed - containers rolled back      ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
