# ComfyTag Docker & Monorepo Setup Guide

**Last Updated:** June 6, 2026  
**Audience:** Developers, DevOps, anyone deploying ComfyTag

---

## Overview

ComfyTag uses Docker for production deployments with a monorepo structure (pnpm workspaces). This guide explains how Docker is configured and common gotchas to avoid.

## Architecture

```
ComfyTag (Monorepo Root)
├── apps/
│   ├── web/              → Next.js attendee app (port 3000)
│   ├── partner/          → Next.js organizer dashboard (port 3001)
│   ├── admin/            → Next.js admin dashboard (port 3002)
│   ├── api/              → Express.js API (port 4002)
│   └── mobile/           → React Native mobile app (not containerized)
├── packages/
│   ├── types/            → Shared TypeScript interfaces
│   ├── ui/               → Design system components
│   └── utils/            → Shared utility functions
└── docker-compose.prod.yml → Production deployment config
```

**Key Point:** Each Next.js app is built WITH the entire monorepo structure intact. The `.next/standalone` output preserves the `apps/web/`, `apps/partner/`, `apps/admin/` directory structure.

---

## Next.js Standalone Mode (Critical)

### What It Is

Next.js 16+ supports `output: 'standalone'` mode, which creates a minimal, self-contained production build:
- Includes the Next.js runtime (`server.js`)
- Includes all dependencies
- No `node_modules` needed at runtime (everything is bundled)
- Smaller Docker images
- Faster startup times

### Configuration Required

**In each Next.js app's `next.config.ts`:**

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // ← REQUIRED for production Docker
  // ... other config
};

export default nextConfig;
```

**Files to verify:**
- `apps/web/next.config.ts` — must have `output: 'standalone'`
- `apps/partner/next.config.ts` — must have `output: 'standalone'`
- `apps/admin/next.config.ts` — must have `output: 'standalone'`

### Build Output Structure

When you build a Next.js app with `output: 'standalone'`:

```
apps/web/.next/standalone/
├── apps/
│   └── web/
│       ├── server.js          ← ⚠️ KEY FILE (in apps/web/ subdirectory!)
│       ├── .next/
│       │   ├── server/
│       │   ├── static/
│       │   └── ...
│       └── package.json
├── node_modules/               ← Bundled dependencies
└── ...
```

**The Critical Detail:** The standalone output INCLUDES the `apps/web/` structure. The `server.js` file is at `.next/standalone/apps/web/server.js`, NOT at `.next/standalone/server.js`.

---

## Dockerfile Setup (Monorepo Pattern)

### Multi-Stage Build

Each Next.js Dockerfile follows this pattern:

```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

# Stage 2: Build the app
FROM node:22-alpine AS builder
COPY --from=deps /app ./
COPY apps/web ./apps/web
RUN pnpm --filter @comfytag/web build

# Stage 3: Runtime
FROM node:22-alpine AS runner
WORKDIR /app
# Copy the ENTIRE standalone output (preserves monorepo structure)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set working directory to where server.js is
WORKDIR /app/apps/web
CMD ["node", "server.js"]
```

### Why WORKDIR Is Critical

```dockerfile
# ❌ WRONG: server.js is in /app/apps/web/, not /app/
WORKDIR /app
CMD ["node", "server.js"]
# Error: "Cannot find module '/app/server.js'"

# ✅ CORRECT: Set WORKDIR to where server.js actually is
WORKDIR /app/apps/web
CMD ["node", "server.js"]
# Works! Node can find /app/apps/web/server.js
```

---

## Health Checks

Docker can automatically restart unhealthy containers. Each service in `docker-compose.prod.yml` has:

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
  interval: 30s        # Check every 30 seconds
  timeout: 10s         # Fail if check takes > 10s
  retries: 3           # Restart after 3 failed checks (90s total)
  start_period: 40s    # Wait 40s before first check (let app start)
```

If a container fails health checks, Docker will automatically restart it. This prevents stuck/hung containers from staying dead.

---

## Testing Dockerfiles Locally

### Before Every Docker Change

After modifying ANY Dockerfile, `next.config.ts`, or docker-compose.prod.yml:

```bash
./scripts/test-docker-builds.sh
```

This script:
1. ✓ Builds all Docker images
2. ✓ Validates docker-compose.yml syntax
3. ✓ Starts all containers
4. ✓ Checks containers are "Up" (not "Restarting")
5. ✓ Verifies critical files exist in images (server.js)
6. ✓ Tests all endpoints respond
7. ✓ Cleans up after test

**Do NOT push to GitHub if this script fails.**

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '/app/server.js'` | Wrong WORKDIR | Set `WORKDIR /app/apps/web` before `CMD` |
| `Container keeps restarting` | App crashes on startup | Check container logs: `docker compose logs web` |
| `502 Bad Gateway` | Upstream not responding | Verify health check passes: `docker compose ps` |
| `Module not found: '@comfytag/ui'` | Dependencies not installed | Check `pnpm install` in builder stage |
| `Port 3000 already in use` | Another container running | `docker compose down` then try again |

---

## Deployment Workflow

### Step 1: Local Testing (Developer)

```bash
# After any Docker/config changes:
./scripts/test-docker-builds.sh

# If it passes:
git add .
git commit -m "Update Dockerfiles"
git push origin main
```

### Step 2: CI/CD Validation (GitHub Actions)

The `.github/workflows/deploy.yml` workflow:
1. Builds all Docker images
2. Validates docker-compose.yml
3. Starts containers
4. Tests endpoints respond
5. **Blocks deployment if any check fails**

If CI/CD fails, you'll see the error in GitHub Actions logs. Fix it locally and push again.

### Step 3: Production Deployment (GitHub Actions)

If CI/CD passes, GitHub Actions automatically:
1. SSHes into Hetzner VPS
2. Pulls latest code
3. Rebuilds Docker images
4. Restarts containers
5. Verifies deployment health

If deployment fails, GitHub Actions will show the error and the rollback process begins.

---

## Monorepo Docker Gotchas

### 1. Standalone Output Preserves Monorepo Structure
- ❌ Don't expect `/app/server.js`
- ✅ It's at `/app/apps/web/server.js`
- ✅ Set `WORKDIR /app/apps/web` before running

### 2. All Shared Packages Must Be Copied
- Dependencies on `@comfytag/ui`, `@comfytag/utils`, `@comfytag/types`
- These must be copied in the builder stage:
  ```dockerfile
  COPY packages/ ./packages/
  ```

### 3. pnpm Workspace Configuration
- All apps use the same `pnpm-lock.yaml`
- If you add dependencies, commit the updated lock file
- Docker builds fail if lock file is outdated

### 4. Environment Variables
- Each app has its own `.env` file on the VPS
- Referenced in docker-compose.prod.yml: `env_file: - apps/web/.env`
- Never commit `.env` files to GitHub

---

## Debugging

### Check Container Logs

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# View logs
docker compose -f docker-compose.prod.yml logs web --tail 50

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f api
```

### Check Container Status

```bash
# List all containers and their status
docker compose -f docker-compose.prod.yml ps

# Expected output:
# STATUS column should show "Up X minutes" (not "Restarting")
```

### Run Commands Inside Container

```bash
# Check if server.js exists
docker run --rm comfytag-web ls -la /app/apps/web/server.js

# Test Node.js
docker run --rm comfytag-web node -v

# Run shell in container (for debugging)
docker exec -it comfytag-web sh
```

---

## Summary

| Aspect | Rule |
|--------|------|
| **Next.js Config** | Must have `output: 'standalone'` |
| **Dockerfile WORKDIR** | Must be `/app/apps/{app}` before `CMD` |
| **Health Checks** | Added to docker-compose.prod.yml to auto-restart unhealthy containers |
| **Testing** | Run `./scripts/test-docker-builds.sh` before pushing Dockerfile changes |
| **Shared Packages** | Must be copied in builder stage |
| **Environment Variables** | Managed separately on VPS (not in Git) |

---

## Resources

- **Dockerfile Testing:** `./scripts/test-docker-builds.sh`
- **CI/CD Workflow:** `.github/workflows/deploy.yml`
- **Production Config:** `docker-compose.prod.yml`
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** See "Common Errors & Fixes" table above

---

**Last Updated:** June 6, 2026 (Post-incident documentation)  
**If you break something:** Run `./scripts/test-docker-builds.sh` — it will help diagnose the issue!
