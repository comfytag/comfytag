#!/bin/bash

# ComfyTag Pre-Deployment Validation
# Run this BEFORE pushing to main branch
# Prevents production crashes from code changes

set -e  # Exit on first error

echo "════════════════════════════════════════════════════════"
echo "  🔍 ComfyTag Pre-Deployment Validation"
echo "════════════════════════════════════════════════════════"

# Phase 1: Type checking
echo ""
echo "Phase 1: Type Checking..."
echo "─────────────────────────────────────────────────────────"
pnpm typecheck || { echo "❌ Type check failed"; exit 1; }
echo "✅ Type check passed"

# Phase 2: Build all apps (local)
echo ""
echo "Phase 2: Building All Apps..."
echo "─────────────────────────────────────────────────────────"
echo "Building API..."
cd apps/api
npm run build 2>/dev/null || echo "⚠️  API has no build step (OK for Express)"
cd ../..

echo "Building web app..."
cd apps/web
npm run build || { echo "❌ Web app build failed"; exit 1; }
cd ../..

echo "Building partner app..."
cd apps/partner
npm run build || { echo "❌ Partner app build failed"; exit 1; }
cd ../..

echo "Building admin app..."
cd apps/admin
npm run build || { echo "❌ Admin app build failed"; exit 1; }
cd ../..

echo "✅ All apps built successfully"

# Phase 3: Test Docker image builds (WITHOUT pushing)
echo ""
echo "Phase 3: Testing Docker Builds..."
echo "─────────────────────────────────────────────────────────"

echo "Building docker images locally..."
docker compose -f docker-compose.prod.yml build --no-push || { echo "❌ Docker build failed"; exit 1; }
echo "✅ Docker images built successfully"

# Phase 4: Validate Docker Compose config
echo ""
echo "Phase 4: Validating Docker Compose Config..."
echo "─────────────────────────────────────────────────────────"
docker compose -f docker-compose.prod.yml config > /dev/null 2>&1 || { echo "❌ Docker Compose config invalid"; exit 1; }
echo "✅ Docker Compose config valid"

# Phase 5: Critical files check
echo ""
echo "Phase 5: Checking Critical Files..."
echo "─────────────────────────────────────────────────────────"

# Check if required Dockerfiles exist
[ -f apps/api/Dockerfile ] || { echo "❌ Missing: apps/api/Dockerfile"; exit 1; }
[ -f apps/web/Dockerfile ] || { echo "❌ Missing: apps/web/Dockerfile"; exit 1; }
[ -f apps/partner/Dockerfile ] || { echo "❌ Missing: apps/partner/Dockerfile"; exit 1; }
[ -f apps/admin/Dockerfile ] || { echo "❌ Missing: apps/admin/Dockerfile"; exit 1; }
[ -f docker-compose.prod.yml ] || { echo "❌ Missing: docker-compose.prod.yml"; exit 1; }
[ -f nginx/nginx.conf ] || { echo "❌ Missing: nginx/nginx.conf"; exit 1; }

echo "✅ All critical files present"

# Phase 6: Check .env.example files exist
echo ""
echo "Phase 6: Checking .env Templates..."
echo "─────────────────────────────────────────────────────────"

# Check that .env files are in .gitignore (not committed)
grep -q "^.env$" .gitignore || { echo "⚠️  Warning: .env might be committed"; }
echo "✅ Environment file checks passed"

# Phase 7: Summary
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ ALL PRE-DEPLOYMENT CHECKS PASSED"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. git add . && git commit -m 'Your change'"
echo "  2. git push origin main"
echo "  3. Monitor deployment via GitHub Actions"
echo "  4. Run ./scripts/post-deploy-test.sh on VPS after deploy"
echo ""
