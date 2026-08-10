# ComfyTag Deployment & Operations Guide

**Last Updated:** June 6, 2026  
**Audience:** DevOps, operations, anyone managing production

---

## Quick Start

### Deploying Changes

```bash
# 1. Make your changes locally
# 2. Test Dockerfiles (if you changed them)
./scripts/test-docker-builds.sh

# 3. Commit and push
git add .
git commit -m "Your changes"
git push origin main

# 4. GitHub Actions automatically:
#    - Runs tests
#    - Validates Docker images
#    - Deploys to Hetzner VPS
#    - Verifies health

# 5. Monitor deployment in GitHub Actions tab
```

---

## Deployment Architecture

```
Developer's Machine
         ↓
    GitHub (main)
         ↓
GitHub Actions CI/CD
    (test, docker-validate, deploy)
         ↓
    Hetzner VPS (204.168.242.7)
         ↓
   Docker Compose (6 services)
         ↓
    Cloudflare (DNS + SSL)
         ↓
    Public Internet
```

---

## CI/CD Pipeline Stages

### Stage 1: Test Suite (20 minutes)
- Runs unit tests (utils, UI)
- Runs integration tests (API, middleware)
- Runs component tests (web, partner)
- **Blocks deployment if any test fails**

### Stage 2: Docker Build & Validation (10 minutes)
- Builds all 4 Docker images
- Validates docker-compose.yml syntax
- Starts containers locally
- Checks containers are "Up" (not "Restarting")
- Verifies critical files exist (server.js)
- Tests endpoints respond
- **Blocks deployment if any validation fails**

### Stage 3: SSH Deploy to VPS (5 minutes)
- SSHes into Hetzner VPS
- Pulls latest code from GitHub
- Builds Docker images on VPS
- Starts containers with `docker compose up -d`
- Runs post-deployment health check
- **Blocks if health check fails (triggers rollback)**

### Stage 4: Post-Deployment Verification (1 minute)
- Waits 10 seconds for containers to stabilize
- Checks all containers are running (no "Restarting" status)
- Logs container status
- **Alerts on failure**

---

## Viewing Deployment Status

### In GitHub

```
1. Go to https://github.com/comfytag/comfytag
2. Click "Actions" tab
3. Click the most recent workflow run
4. Expand each job to see logs:
   - test
   - docker-validate
   - deploy
```

### On VPS (SSH)

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# View container status
cd /home/deploy/comfytag
docker compose -f docker-compose.prod.yml ps

# View recent logs
docker compose -f docker-compose.prod.yml logs --tail 50

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f api
```

---

## Health Checks & Auto-Restart

### How It Works

Each Docker service has a health check configured in docker-compose.prod.yml:

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
  interval: 30s     # Check every 30 seconds
  timeout: 10s      # Fail if check takes > 10s
  retries: 3        # Restart after 3 failed checks (90s total)
  start_period: 40s # Wait 40s before first check
```

### What This Means

- If a container stops responding:
  - Health check fails 3 times (every 30s)
  - After 90 seconds of failures, Docker auto-restarts the container
  - Container is healthy again within 40s (start_period)

### Checking Health Status

```bash
# SSH into VPS
docker compose -f docker-compose.prod.yml ps

# STATUS column shows:
# - "Up 5 minutes" → Container is healthy
# - "Up 5 minutes (healthy)" → Passed health checks
# - "Up 5 minutes (unhealthy)" → Health checks failing
# - "Restarting (1) 10 seconds ago" → Crashed, Docker restarting it
```

---

## Common Issues & Solutions

### Issue 1: Container in "Restarting" Loop

**Symptom:** `docker compose ps` shows `Restarting (1) X seconds ago`

**Causes:**
- Application crashes on startup
- Missing environment variables
- Wrong Docker image configuration
- Corrupted build

**Solution:**

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs web --tail 100

# Look for error messages like:
# - "Cannot find module" → Dockerfile path issue
# - "ENOTFOUND" → Database connection issue
# - "Cannot read property" → Missing env var

# Fix and redeploy
git push origin main  # Triggers new deploy
```

### Issue 2: Endpoint Returns 502 Bad Gateway

**Symptom:** `curl https://comfytag.com` returns `HTTP 502`

**Causes:**
- Upstream container not responding
- Nginx DNS resolver has stale cache
- Container hasn't finished starting

**Solution:**

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps
# All should be "Up" (not "Restarting")

# Check if endpoints are listening
curl -f http://localhost:3000 || echo "Web not responding"
curl -f http://localhost:3001 || echo "Partner not responding"
curl -f http://localhost:3002 || echo "Admin not responding"

# Restart nginx to clear DNS cache
docker compose -f docker-compose.prod.yml restart nginx

# Wait 10 seconds and test again
sleep 10
curl -f https://comfytag.com
```

### Issue 3: Deployment Failed in GitHub Actions

**Symptom:** GitHub Actions shows red X on deploy job

**Solution:**

```bash
# 1. Check GitHub Actions logs for error message
#    Go to https://github.com/comfytag/comfytag/actions
#    Click the failed run → expand "deploy" job → scroll down

# 2. Common errors:
#    - "docker: command not found" → Docker not installed on VPS (shouldn't happen)
#    - "Cannot connect to Docker daemon" → Docker service crashed
#    - "Port 80 already in use" → Another process using port 80

# 3. Fix on VPS and check status
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
docker ps  # Check if Docker is running
docker compose -f docker-compose.prod.yml ps

# 4. Push a new commit to retry deployment
git add .
git commit -m "Retry deployment"
git push origin main
```

### Issue 4: Container Crashes After Deployment

**Symptom:** All seems fine, but then containers start crashing 5 minutes later

**Causes:**
- Memory leak in application
- Database connection issues
- High load causing OOM

**Solution:**

```bash
# Check memory usage
docker stats

# Check logs for error patterns
docker compose -f docker-compose.prod.yml logs --tail 200

# Check disk space
df -h

# If out of disk:
docker image prune -a  # Remove unused images
docker system prune    # Clean up everything

# If out of memory:
# - App needs optimization
# - VPS needs to be upgraded to CX31 (8GB RAM)
```

---

## Monitoring Setup

### UptimeRobot (Continuous Monitoring)

Set up at https://uptimerobot.com/ to monitor all endpoints:

**Create monitors for:**

1. **Web App**
   - URL: `https://comfytag.com`
   - Type: HTTP(S)
   - Check interval: 5 minutes
   - Expected status: 200

2. **Partner Dashboard**
   - URL: `https://partner.comfytag.com`
   - Type: HTTP(S)
   - Check interval: 5 minutes
   - Expected status: 200 or 307 (redirect to login)

3. **Admin Dashboard**
   - URL: `https://admin.comfytag.com`
   - Type: HTTP(S)
   - Check interval: 5 minutes
   - Expected status: 200 or 307 (redirect to login)

4. **API Health**
   - URL: `https://api.comfytag.com/api/health`
   - Type: HTTP(S)
   - Check interval: 5 minutes
   - Expected status: 200

**Alerts:** Configure UptimeRobot to email you if any monitor fails for > 5 minutes

### Log Monitoring (Local)

```bash
# SSH into VPS and follow logs
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag

# Follow all logs
docker compose -f docker-compose.prod.yml logs -f

# Follow specific service
docker compose -f docker-compose.prod.yml logs -f api

# Search for errors in logs
docker compose -f docker-compose.prod.yml logs | grep -i error
```

### Container Health (Manual Checks)

Daily morning check (takes 2 minutes):

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# Check container status
docker compose -f docker-compose.prod.yml ps

# Expected output (all "Up" for several hours):
# NAME         STATUS          
# comfytag-web          Up 3 days
# comfytag-partner      Up 3 days
# comfytag-admin        Up 3 days
# comfytag-api          Up 3 days
# comfytag-nginx        Up 3 days
# comfytag-redis        Up 3 days

# Check disk space
df -h
# Should show: Filesystem 75GB, Used 40GB (50%), Available 35GB

# Check memory
docker stats --no-stream
# Should show: Total memory ~3.7GB, Used ~1.5GB (40%)
```

---

## Rollback Procedure

### Automatic Rollback (GitHub Actions)

If post-deployment verification fails, GitHub Actions automatically:
1. Logs the failure
2. Reverts to the previous working version
3. Restarts containers with previous code
4. Sends alert notification

**Note:** This is not yet fully implemented. See "Future Improvements" below.

### Manual Rollback (Emergency)

If something goes wrong and you need to roll back manually:

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag

# View git log to find last good commit
git log --oneline | head -10

# Revert to previous commit
git checkout <commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Verify it's working
sleep 10
docker compose -f docker-compose.prod.yml ps
curl -f http://localhost:3000 && echo "✓ Web is up"

# Push to GitHub to document the rollback
git push -f origin main
```

---

## Monthly Maintenance

### Security Updates

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# Update OS packages
sudo apt update && sudo apt upgrade -y

# This may restart the VPS, so do it during low-traffic hours

# After reboot, verify everything still works
docker compose -f docker-compose.prod.yml ps
curl -f https://comfytag.com && echo "✓ Website up after update"
```

### Disk Cleanup

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# Check disk usage
df -h

# If > 70% full, clean up
docker image prune -a        # Remove unused images
docker system prune -a       # Remove all unused data
docker container prune       # Remove stopped containers

# Check again
df -h
```

### Database Maintenance

MongoDB Atlas (external):
- Automated backups every 6 hours
- View on MongoDB Atlas console
- Upgrade cluster size if needed

---

## Secrets & Environment Variables

### On VPS (Never in Git)

Each service has its own `.env` file that's NOT committed to GitHub:

```
/home/deploy/comfytag/
├── apps/web/.env         ← NEVER commit
├── apps/partner/.env     ← NEVER commit
├── apps/admin/.env       ← NEVER commit
└── apps/api/.env         ← NEVER commit
```

### Setting Secrets for GitHub Actions

Secrets for the deployment workflow (used by GitHub Actions):

```
Settings → Secrets and variables → Actions → New repository secret

HETZNER_HOST = 204.168.242.7
HETZNER_USER = deploy
HETZNER_SSH_KEY = [contents of ~/.ssh/comfytag_hetzner]
```

---

## Future Improvements

- [ ] Automated rollback on failed health checks
- [ ] Slack notifications for deployment status
- [ ] Database backup monitoring
- [ ] Performance metrics dashboard
- [ ] Automatic container restarts on OOM
- [ ] Blue-green deployment for zero-downtime updates
- [ ] Separate staging environment for pre-production testing

---

## Support

### Debugging Checklist

When something breaks:

1. ✓ Check container status: `docker compose ps`
2. ✓ Check logs: `docker compose logs --tail 50`
3. ✓ Check disk space: `df -h`
4. ✓ Check memory: `docker stats`
5. ✓ Check endpoints: `curl http://localhost:3000`
6. ✓ Restart docker: `docker compose restart`
7. ✓ Check GitHub Actions logs for deployment errors
8. ✓ Revert to previous commit if all else fails

### Getting Help

- **Docker Logs:** `docker compose -f docker-compose.prod.yml logs`
- **GitHub Actions:** https://github.com/comfytag/comfytag/actions
- **Docker Docs:** https://docs.docker.com/
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

**Last Updated:** June 6, 2026 (Post-incident production guide)  
**Questions?** Check the logs first — they usually tell you what's wrong!
