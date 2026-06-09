# ComfyTag — Deployment Best Practices

**Last Updated:** June 7, 2026  
**Purpose:** Prevent production crashes when deploying new code

---

## 🚨 The Problem You Were Having

Every time you pushed a new update, the production app crashed. This happened because:

1. **No pre-deployment validation** — code changes weren't tested before going live
2. **No health checks** — crashed containers weren't properly detected
3. **No post-deployment verification** — deployment failures went undetected
4. **Missing health endpoint** — health checks couldn't verify API was responding

---

## ✅ The Solution: 3-Step Deployment Process

### **Step 1: Pre-Deployment Testing (Before you push)**

**Run this LOCALLY before pushing to main:**

```bash
./scripts/pre-deploy-test.sh
```

**What this checks:**
- ✅ TypeScript types compile (`pnpm typecheck`)
- ✅ All apps build successfully (web, partner, admin, api)
- ✅ Docker images build without errors
- ✅ Docker Compose config is valid
- ✅ All critical files exist (Dockerfiles, nginx.conf, etc.)

**If anything fails:** Fix it locally before pushing. Do NOT push broken code.

**Example workflow:**
```bash
# Make your changes in the code
nano apps/api/routes/transfer.js

# Run pre-deployment tests
./scripts/pre-deploy-test.sh

# If tests pass, commit and push
git add .
git commit -m "Feature: Add transfer feature X"
git push origin main

# If tests fail, fix the issues and try again
# Do NOT push until ./scripts/pre-deploy-test.sh passes
```

---

### **Step 2: Automatic Deployment (GitHub Actions)**

When you push to `main`, GitHub Actions automatically:

1. ✅ Pulls code on VPS
2. ✅ Rebuilds Docker images (`docker compose build`)
3. ✅ Starts new containers (`docker compose up -d`)
4. ✅ Prunes old images to save disk space

This happens **without you doing anything** — just push and it deploys.

**Monitor deployment:**
- Go to GitHub → your repo → Actions tab
- Click on the latest workflow run
- Watch the "Deploy to Production" job
- It should complete in 5-15 minutes (depending on build size)

---

### **Step 3: Post-Deployment Verification (After push)**

**After deployment completes (5-15 min), SSH to VPS and verify:**

```bash
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag
./scripts/post-deploy-test.sh
```

**What this checks:**
- ✅ Latest code is deployed (git commit)
- ✅ All 6 containers are running (no crashes)
- ✅ All ports responding (nginx, web, partner, admin, api, redis)
- ✅ API health endpoint works
- ✅ MongoDB is connected
- ✅ Redis is responding
- ✅ Disk space is healthy
- ✅ Memory usage is normal

**If verification fails:**
The script will tell you exactly what's broken and how to fix it.

**Expected output:**
```
════════════════════════════════════════════════════════
  ✅ DEPLOYMENT VERIFIED SUCCESSFULLY
════════════════════════════════════════════════════════
```

---

## 📋 Complete Deployment Checklist

Use this checklist EVERY time you deploy:

### Before Pushing

- [ ] Run `./scripts/pre-deploy-test.sh` locally
- [ ] All tests pass (green checkmarks)
- [ ] No errors in build output
- [ ] Code compiles without TypeScript errors

### After Pushing

- [ ] Wait 5-15 minutes for GitHub Actions to deploy
- [ ] Check GitHub Actions workflow status (should be ✅)
- [ ] SSH to VPS and run `./scripts/post-deploy-test.sh`
- [ ] Verify script output shows all checks passed
- [ ] Test in browser: https://comfytag.com works
- [ ] Test: https://partner.comfytag.com works
- [ ] Test: https://admin.comfytag.com works
- [ ] Test: https://api.comfytag.com/api/health returns JSON

### If Deployment Fails

1. **Check the error message** from the verification script
2. **SSH to VPS** and read container logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs api --tail 50
   docker compose -f docker-compose.prod.yml logs web --tail 50
   ```
3. **Common issues:**
   - Missing env var → Add to `.env` file on VPS
   - Port already in use → Restart container: `docker restart comfytag-api`
   - Build out of memory → Rebuild one app at a time
   - Code syntax error → Check the logs, fix locally, push again

---

## 🔄 When You Make Changes

**Type of change** | **Testing required** | **Deployment impact**
---|---|---
Fix a bug | Run pre-deploy test | Low (safe to deploy)
Add a new route | Add test + run pre-deploy | Medium (verify endpoint works)
Change database schema | Test locally with seed data | High (may need migration)
Update env vars | Check .env on VPS | High (app won't start if missing)
Change Docker config | Rebuild and test locally | High (all containers restart)
Update dependencies | Run typecheck + build | Medium (may break imports)

---

## 🛡️ Safety Rules

**Never do these:**

- ❌ Push code that doesn't pass `./scripts/pre-deploy-test.sh`
- ❌ Push code with TypeScript errors
- ❌ Push code that doesn't build locally
- ❌ Modify `docker-compose.prod.yml` without testing
- ❌ Commit `.env` files (should be in `.gitignore`)
- ❌ Push without verifying in browser after deployment

**Always do these:**

- ✅ Run pre-deploy test BEFORE pushing
- ✅ Wait for GitHub Actions to complete AFTER pushing
- ✅ Run post-deploy verification on VPS
- ✅ Test in browser to confirm changes work
- ✅ Check container logs if anything is wrong

---

## 📊 Deployment Timeline

```
You make code changes
    ↓
    [LOCAL] Run ./scripts/pre-deploy-test.sh
    ↓
    [Pass? NO → Fix issues, try again]
    ↓
    [Pass? YES → Continue]
    ↓
git add . && git commit -m "..." && git push origin main
    ↓
    [GitHub] GitHub Actions workflow starts
    ↓
    [GitHub] Tests run, Docker images build (5-15 min)
    ↓
    [VPS] New containers start
    ↓
    [You] Wait a few seconds, then run post-deploy test
    ↓
    [VPS] ./scripts/post-deploy-test.sh runs checks
    ↓
    [Verify] All checks pass? YES → Deployment successful!
    ↓
    [Browser] Test https://comfytag.com to confirm
```

---

## 🔍 Debugging a Failed Deployment

### Scenario: Deployment pushed but site is down

**Step 1: SSH to VPS**
```bash
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag
```

**Step 2: Check container status**
```bash
docker compose -f docker-compose.prod.yml ps
# Look for containers with "Exited" or "Restarting" status
```

**Step 3: Read the logs**
```bash
# If API is crashed:
docker compose -f docker-compose.prod.yml logs api --tail 100

# If web is crashed:
docker compose -f docker-compose.prod.yml logs web --tail 100

# All logs:
docker compose -f docker-compose.prod.yml logs --tail 50
```

**Step 4: Identify the issue**

Common errors and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '/app/server.js'` | Dockerfile build failed | Check Next.js standalone mode is enabled in next.config.ts |
| `connect ECONNREFUSED 127.0.0.1:27017` | MongoDB not running | Check MongoDB Atlas connection string in .env |
| `Error: listen EADDRINUSE` | Port already in use | Restart the app: `docker restart comfytag-api` |
| `NEXT_PUBLIC_API_URL is not set` | Missing env var | Add to .env file on VPS |
| `Module not found: 'react-query'` | Dependencies not installed | Check Dockerfile, rebuild images |

---

## 📞 When to Ask for Help

**Ask for help if:**
- Pre-deploy test fails and you don't understand why
- Post-deploy verification fails with unclear error
- Site is down and logs don't show the problem
- Docker build runs out of memory repeatedly
- Need to add/change environment variables

**Before asking, provide:**
1. The error message (copy the exact text from logs)
2. What change you made (new code, dependency, config)
3. Output from `docker compose ps` and `docker compose logs`

---

## 🎓 Key Takeaways

1. **Pre-deploy locally** — Catch 90% of issues before they go live
2. **Health checks work** — Unhealthy containers are detected and can be restarted
3. **Verification is fast** — Takes < 2 min to confirm deployment worked
4. **Logs tell the story** — Always check `docker logs` when something breaks
5. **Consistency prevents crashes** — Follow the same process every time

---

## Questions?

This document will grow as we encounter new issues. Keep it updated and refer to it whenever deploying.

**Next steps:**
1. Save this file and bookmark it
2. Add it to team onboarding docs
3. Reference it before every deployment
4. Update it when you discover new gotchas
