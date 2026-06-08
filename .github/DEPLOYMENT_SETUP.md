# GitHub Deployment Setup Guide

This document explains how to set up GitHub Secrets and Environments for the automated deployment pipeline.

---

## Prerequisites

You need:
1. SSH keys for staging and production servers
2. GitHub repository with GitHub Actions enabled
3. Staging and production server details

---

## Step 1: Create GitHub Environments

GitHub Environments provide environment-specific secrets and protection rules.

### Create Staging Environment
1. Go to: **Settings → Environments → New environment**
2. Name: `staging`
3. Add deployment branch rules (optional):
   - Allow deployments from: `main` branch only
4. Save

### Create Production Environment
1. Go to: **Settings → Environments → New environment**
2. Name: `production`
3. **Add required reviewers:**
   - Check: "Required reviewers"
   - Select: 1-2 people who must approve production deployments
4. **Add deployment branch rules:**
   - Allow deployments from: `main` branch only
5. Save

---

## Step 2: Add GitHub Secrets

Secrets are sensitive values (SSH keys, hosts) that the pipeline uses.

### Repository Secrets (Shared)

Go to: **Settings → Secrets and variables → Actions**

Add these secrets (used by both staging and production):

```
SLACK_WEBHOOK_URL
  Value: Your Slack webhook URL (for deployment notifications)
  Optional: Only needed if you want Slack alerts
```

### Staging Environment Secrets

Go to: **Settings → Environments → staging → Add secret**

Add these secrets for staging deployment:

```
STAGING_HOST
  Value: staging.comfytag.com
  Description: Staging server hostname

STAGING_USER
  Value: deploy
  Description: SSH username on staging server

STAGING_SSH_KEY
  Value: [Content of ~/.ssh/comfytag_staging]
  Description: SSH private key for staging deployment
  (Run: cat ~/.ssh/comfytag_staging | pbcopy  on Mac, or WSL on Windows)
```

### Production Environment Secrets

Go to: **Settings → Environments → production → Add secret**

Add these secrets for production deployment:

```
PRODUCTION_HOST
  Value: 204.168.242.7
  Description: Production server hostname/IP

PRODUCTION_USER
  Value: deploy
  Description: SSH username on production server

PRODUCTION_SSH_KEY
  Value: [Content of ~/.ssh/comfytag_hetzner]
  Description: SSH private key for production deployment
  (Run: cat ~/.ssh/comfytag_hetzner | pbcopy  on Mac, or WSL on Windows)
```

---

## Step 3: Add Branch Protection Rule

Ensure code goes through the pipeline before merging to main.

Go to: **Settings → Branches → Branch protection rules → Add rule**

```
Branch name pattern: main

Enable:
  ☑ Require a pull request before merging
  ☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging

Under "Status checks that are required":
  ☑ quality-gate
  ☑ docker-build
  ☑ deploy-staging
  ☑ staging-e2e
```

This prevents code from merging to main unless all checks pass.

---

## Step 4: Configure SSH Keys on Servers

Make sure both servers have the public keys in `.ssh/authorized_keys`:

### On Staging Server
```bash
ssh deploy@staging.comfytag.com

# Add your public key
echo "$(cat ~/.ssh/comfytag_staging.pub)" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### On Production Server
```bash
ssh deploy@204.168.242.7

# Add your public key
echo "$(cat ~/.ssh/comfytag_hetzner.pub)" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## Step 5: Test the Pipeline

Push a small change to main and watch the GitHub Actions workflow:

1. Go to: **Actions → Deploy Pipeline**
2. Watch each stage:
   - 🔍 Quality Gate (TypeScript, Lint, Build)
   - 🐳 Docker Build & Validation
   - 🚀 Deploy to Staging
   - 🧪 E2E Tests on Staging
   - 🚀 Deploy to Production
   - 🏥 Production Health Check

All stages must pass before production deployment is triggered.

---

## Deployment Workflow

### For Developers

```bash
# 1. Make changes
git checkout -b feature/my-feature
# ... edit code ...

# 2. Push to feature branch
git push origin feature/my-feature

# 3. Create PR (optional — not required to deploy, but recommended)
gh pr create --title "feat: My feature"

# 4. Merge to main (or just push directly)
git checkout main
git merge feature/my-feature
git push origin main

# 5. GitHub Actions automatically:
#    ✅ Runs tests & linting
#    ✅ Builds Docker images
#    ✅ Deploys to staging
#    ✅ Runs E2E tests on staging
#    ✅ Asks for approval (production environment)
#    ✅ Deploys to production
#    ✅ Runs health checks
```

### For Production Deployments

When the pipeline reaches the production environment:

1. GitHub shows: **Review deployments**
2. Select: **Approve and deploy**
3. Enter a comment (optional): "Deployed by CI/CD pipeline"
4. Production deployment starts
5. Health checks run automatically
6. If health checks fail → **Automatic rollback**

---

## Monitoring Deployments

### View Workflow Runs
1. Go to: **Actions → Deploy Pipeline**
2. Click the latest run
3. Watch each job's progress in real-time

### Access Logs
Each job has logs. Click on a failed job to see what went wrong:

```
Example: Docker Build fails
  → Click "Docker Build & Validation" job
  → See error messages
  → Fix the Dockerfile issue
  → Push a new commit (workflow re-runs automatically)
```

### Slack Notifications (Optional)

If you configure `SLACK_WEBHOOK_URL`, you'll get:
- ✅ Success notifications when production deploys
- ❌ Failure notifications with links to logs

---

## Rollback Procedures

### Automatic Rollback
If production health checks fail, the workflow:
1. Stops here (doesn't continue)
2. Creates a GitHub Issue with error details
3. Notifies via Slack (if configured)

### Manual Rollback
```bash
# SSH into production
ssh deploy@204.168.242.7

# Run rollback script
./scripts/rollback-production.sh

# Follow the manual steps shown
```

---

## Troubleshooting

### "Deployment failed at Quality Gate"
- Check: `pnpm typecheck` passes locally
- Check: `pnpm lint` passes locally
- Check: `pnpm build` passes locally
- Fix locally, then push again

### "Docker Build fails"
- Check: `./scripts/test-docker-builds.sh` passes locally
- Check: Dockerfile has correct standalone paths
- Check: All required packages are installed
- Run locally, fix, then push again

### "Staging deployment hangs"
- SSH into staging and check logs: `docker logs comfytag-web`
- Possible causes:
  - Memory exhausted (check `docker stats`)
  - Disk full (check `df -h`)
  - Network issues
- Fix, then retry deployment

### "Production health checks fail"
- Run: `./scripts/health-check-prod.sh` (manual)
- Check container logs: `docker logs comfytag-web`
- Rollback if needed: `./scripts/rollback-production.sh`

---

## Emergency Contacts

If something breaks in production:

1. **Check the logs:** GitHub Actions → Deploy Pipeline workflow
2. **Check the server:** SSH and run health checks
3. **Rollback if needed:** Use `./scripts/rollback-production.sh`
4. **Create an issue:** Document what broke and why
5. **Post-mortem:** Discuss with team 24 hours later

---

## File Reference

Key files in this deployment system:

```
.github/
  workflows/
    deploy.yml                    ← The full pipeline (6 stages)

scripts/
  deploy-staging.sh              ← Deploy to staging
  deploy-production.sh           ← Deploy to production
  health-check-prod.sh           ← Verify production is healthy
  rollback-production.sh         ← Rollback if something breaks
  test-docker-builds.sh          ← Local Docker validation (existing)

DEVELOPMENT_CONTRACTS.md         ← Code quality rules
DEPLOYMENT_PRINCIPLES.md         ← Deployment process rules
```

---

## Questions?

Refer to:
- `DEVELOPMENT_CONTRACTS.md` — Code quality requirements
- `DEPLOYMENT_PRINCIPLES.md` — Deployment safety procedures
- GitHub Actions logs — Actual error messages and fixes

