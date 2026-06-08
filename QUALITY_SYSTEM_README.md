# ComfyTag Quality & Deployment System

**The Complete Guide to Shipping Features Safely**

---

## 📚 Quick Navigation

**For Project Lead / User:**
1. [DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md) — Set up GitHub Secrets (10 min, one-time)
2. [PROJECT_CURRENT_STATUS.md](PROJECT_CURRENT_STATUS.md) — See what's in progress
3. [MONITORING_AND_ALERTS.md](MONITORING_AND_ALERTS.md) — What to watch after deployment

**For All AI Agents:**
1. [AGENT_ONBOARDING.md](AGENT_ONBOARDING.md) — Read this first (5 min)
2. [DEVELOPMENT_CONTRACTS.md](DEVELOPMENT_CONTRACTS.md) — Your rules (5 min)
3. [DEPLOYMENT_PRINCIPLES.md](DEPLOYMENT_PRINCIPLES.md) — Safety procedures (5 min)

**For Feature Work:**
1. [QUALITY_HUB.md](QUALITY_HUB.md) — How features flow through system (10 min)
2. [AGENT_TASK_TEMPLATES.md](AGENT_TASK_TEMPLATES.md) — Your role's task template (5 min)
3. [FIRST_FEATURE_TEST_RUN.md](FIRST_FEATURE_TEST_RUN.md) — See it in action (10 min)

---

## 🎯 The System in 30 Seconds

```
You submit a feature request
    ↓
Quality Hub breaks it down into tasks
    ↓
Backend Engineer builds API
    ↓
Frontend Engineer builds UI
    ↓
QA Engineer writes tests
    ↓
GitHub Actions automatically:
  ✅ Checks code quality
  ✅ Builds Docker images
  ✅ Deploys to staging
  ✅ Runs E2E tests
  ✅ Deploys to production
  ✅ Verifies it works
    ↓
Feature is LIVE
    ↓
Monitoring ensures it stays healthy
```

---

## ✅ What This System Ensures

### Code Quality
- ✅ No TypeScript errors
- ✅ No linting violations
- ✅ All tests passing
- ✅ No console.logs in production
- ✅ No hardcoded colors/spacing
- ✅ 100% type safety

### Deployment Safety
- ✅ Staging tested before production
- ✅ E2E tests pass before going live
- ✅ Health checks verify working
- ✅ Automatic rollback on issues
- ✅ Monitoring catches problems
- ✅ Zero unplanned downtime

### Agent Coordination
- ✅ Clear handoffs between roles
- ✅ No conflicting changes
- ✅ Dependencies respected
- ✅ Communication explicit
- ✅ One feature at a time
- ✅ No surprises

### Production Stability
- ✅ Error rate < 0.1%
- ✅ Response times < 500ms
- ✅ Zero restart loops
- ✅ Disk/memory healthy
- ✅ Database responsive
- ✅ Users happy

---

## 📖 Documentation Map

### Foundation (Read First)
| Document | Time | For |
|----------|------|-----|
| [AGENT_ONBOARDING.md](AGENT_ONBOARDING.md) | 5 min | All agents |
| [DEVELOPMENT_CONTRACTS.md](DEVELOPMENT_CONTRACTS.md) | 5 min | All agents |
| [DEPLOYMENT_PRINCIPLES.md](DEPLOYMENT_PRINCIPLES.md) | 5 min | All agents |

### Feature Work
| Document | Time | For |
|----------|------|-----|
| [QUALITY_HUB.md](QUALITY_HUB.md) | 10 min | Submitting features |
| [AGENT_TASK_TEMPLATES.md](AGENT_TASK_TEMPLATES.md) | 5 min | Agents during work |
| [FIRST_FEATURE_TEST_RUN.md](FIRST_FEATURE_TEST_RUN.md) | 10 min | Understanding flow |

### Operations
| Document | Time | For |
|----------|------|-----|
| [PROJECT_CURRENT_STATUS.md](PROJECT_CURRENT_STATUS.md) | 3 min | Project lead |
| [MONITORING_AND_ALERTS.md](MONITORING_AND_ALERTS.md) | 10 min | On-call team |
| [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md) | 10 min | Initial setup |

### CI/CD
| File | Purpose |
|------|---------|
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Automated pipeline |
| [scripts/deploy-staging.sh](scripts/deploy-staging.sh) | Deploy to staging |
| [scripts/deploy-production.sh](scripts/deploy-production.sh) | Deploy to production |
| [scripts/health-check-prod.sh](scripts/health-check-prod.sh) | Verify production |
| [scripts/rollback-production.sh](scripts/rollback-production.sh) | Emergency rollback |

---

## 🚀 Getting Started

### For Project Lead (Today - 10 minutes)

1. **Set up GitHub Secrets** (one-time)
   - Follow: [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md)
   - SSH keys for staging & production
   - GitHub environment approvals

2. **Understand the system** (optional)
   - Read: [FIRST_FEATURE_TEST_RUN.md](FIRST_FEATURE_TEST_RUN.md)
   - See real example of feature → production

### For Each AI Agent (First Time - 15 minutes)

1. **Onboarding** (5 min)
   - Read: [AGENT_ONBOARDING.md](AGENT_ONBOARDING.md)

2. **Rules you must follow** (5 min)
   - Read: [DEVELOPMENT_CONTRACTS.md](DEVELOPMENT_CONTRACTS.md) (your role section)
   - Read: [DEPLOYMENT_PRINCIPLES.md](DEPLOYMENT_PRINCIPLES.md)

3. **How features flow** (5 min)
   - Read: [QUALITY_HUB.md](QUALITY_HUB.md)
   - Read: [AGENT_TASK_TEMPLATES.md](AGENT_TASK_TEMPLATES.md) (your role section)

### For First Feature (Your Role - depends)

1. **Get task from Quality Hub**
   ```
   /comfytag-quality-hub BUILD "Feature name"
   ```

2. **Copy your task template**
   - [AGENT_TASK_TEMPLATES.md](AGENT_TASK_TEMPLATES.md)

3. **Follow each step**
   - All checkboxes must be ✅
   - When done, hand off to next agent

4. **Watch GitHub Actions deploy it**
   - Automatic → Staging → Production
   - Zero manual intervention

5. **Check it's working**
   - [MONITORING_AND_ALERTS.md](MONITORING_AND_ALERTS.md)

---

## 🔧 Key Files to Know

### Code Quality Gates (Local)
```
.husky/pre-commit               ← Runs on every commit
.lintstagedrc.mjs               ← Lint + typecheck checks
.commitlintrc.cjs               ← Semantic commit format
```

### Automated Deployment
```
.github/workflows/deploy.yml    ← 6-stage pipeline
  1. Quality Gate (tests, lint, build)
  2. Docker Build (validate images)
  3. Deploy to Staging (test environment)
  4. E2E Tests (verify on staging)
  5. Deploy to Production (LIVE)
  6. Health Checks (verify working)
```

### Deployment Scripts
```
scripts/deploy-staging.sh       ← Manual staging deploy
scripts/deploy-production.sh    ← Manual production deploy
scripts/health-check-prod.sh    ← Verify production healthy
scripts/rollback-production.sh  ← Emergency rollback
scripts/test-docker-builds.sh   ← Test Docker locally (existing)
```

### Documentation
```
QUALITY_SYSTEM_README.md        ← This file (master overview)
DEVELOPMENT_CONTRACTS.md        ← Code quality rules
DEPLOYMENT_PRINCIPLES.md        ← Deployment safety rules
QUALITY_HUB.md                  ← Feature flow system
AGENT_TASK_TEMPLATES.md         ← Task templates for each role
AGENT_ONBOARDING.md             ← 5-minute onboarding
PROJECT_CURRENT_STATUS.md       ← What's in progress
MONITORING_AND_ALERTS.md        ← What to watch after deploy
FIRST_FEATURE_TEST_RUN.md       ← Real example end-to-end
```

---

## 📊 How Each Agent Works

### Backend Engineer
```
Task: Design API endpoint
↓
Copy task template
↓
1. Design API contract (request/response types)
2. Write comprehensive tests
3. Implement endpoint
4. All tests pass ✅
5. Create PR with documentation
↓
Frontend Engineer can now start
```

### Frontend Engineer
```
Task: Build UI components
↓
Get API contract from Backend PR
↓
Copy task template
↓
1. Build components (form, modal, button, etc.)
2. Integrate with API
3. Handle all states (loading, success, error)
4. WCAG AA accessibility verified
5. All tests pass ✅
6. Create PR with documentation
↓
QA Engineer can now test
```

### QA Engineer
```
Task: Write E2E tests
↓
Get feature details from Frontend PR
↓
Copy task template
↓
1. Write test scenarios (happy path + errors + edges)
2. Test on staging environment
3. Verify accessibility, mobile, performance
4. All tests pass on staging ✅
5. Create test documentation
↓
DevOps auto-deploys to production
```

### DevOps Engineer
```
Task: Deploy to production
↓
All quality gates passing ✅
Staging verified ✅
↓
GitHub Actions auto-deploys:
  1. Quality Gate ✅
  2. Docker Build ✅
  3. Deploy to Staging ✅
  4. E2E Tests ✅
  5. Deploy to Production ✅
  6. Health Checks ✅
↓
Feature LIVE ✅
Monitor for issues
```

---

## 🎯 Success Metrics

### Code Quality
- ✅ TypeScript: Zero errors (strict mode)
- ✅ Linting: Zero violations
- ✅ Build: Succeeds on first try
- ✅ Tests: 100% passing, > 70% coverage

### Deployment
- ✅ Staging: Deploys, E2E tests pass
- ✅ Production: Deploys, health checks pass
- ✅ Rollback: Never needed (zero issues)

### Operations
- ✅ Error rate: < 0.1%
- ✅ Response time: < 500ms p95
- ✅ Uptime: > 99.9%
- ✅ Monitoring: Active, no surprises

### Team
- ✅ Handoffs: Clear, explicit communication
- ✅ Coordination: Zero conflicts
- ✅ Timeline: On schedule
- ✅ Users: Happy (feature works perfectly)

---

## ⚠️ Critical: Do This First

**Before the next push to main:**

```
1. Set up GitHub Secrets (10 min)
   → Follow: .github/DEPLOYMENT_SETUP.md
   
2. Create GitHub Environments (5 min)
   → staging: for testing
   → production: with required reviewer approval
   
3. Enable Branch Protection (5 min)
   → Require status checks before merge
   → Require reviewer approval
   
4. Train Agents (15 min)
   → Each reads AGENT_ONBOARDING.md
   → Each reads their role section of DEVELOPMENT_CONTRACTS.md
   → Each reads QUALITY_HUB.md
```

**Total time: ~40 minutes, one-time setup**

---

## 🚨 If Something Goes Wrong

### Build fails locally
→ Check: `pnpm typecheck`, `pnpm lint`, `pnpm build`

### Tests fail locally
→ Check: `pnpm test`

### Docker build fails
→ Check: `./scripts/test-docker-builds.sh`

### GitHub Actions fails
→ Go to: GitHub Actions tab → Click failed job → Read error

### Production is broken
→ SSH into server and run: `./scripts/health-check-prod.sh`
→ If really broken: `./scripts/rollback-production.sh`

### Don't know what to do
→ Read: The error message (it's usually clear)
→ Then: [MONITORING_AND_ALERTS.md](MONITORING_AND_ALERTS.md)

---

## 📞 Support

**Questions about code quality?**
→ [DEVELOPMENT_CONTRACTS.md](DEVELOPMENT_CONTRACTS.md)

**Questions about deployment?**
→ [DEPLOYMENT_PRINCIPLES.md](DEPLOYMENT_PRINCIPLES.md)

**Questions about how features flow?**
→ [QUALITY_HUB.md](QUALITY_HUB.md)

**Questions about your specific job?**
→ [AGENT_TASK_TEMPLATES.md](AGENT_TASK_TEMPLATES.md)

**Questions about what to monitor?**
→ [MONITORING_AND_ALERTS.md](MONITORING_AND_ALERTS.md)

**Want to see it all in action?**
→ [FIRST_FEATURE_TEST_RUN.md](FIRST_FEATURE_TEST_RUN.md)

---

## 🎉 You're Ready

You now have:
- ✅ Local quality gates (Husky pre-commit hooks)
- ✅ Automated CI/CD pipeline (6-stage GitHub Actions)
- ✅ Coordination system (Quality Hub)
- ✅ Clear team roles (task templates)
- ✅ Safety procedures (deployment principles)
- ✅ Monitoring setup (health checks + alerts)

**This system ensures:**
- 🎯 Zero broken deployments
- 🎯 Clear communication between agents
- 🎯 Automatic safety gates
- 🎯 Quick feedback loops
- 🎯 Happy users

---

**Let's ship great features safely! 🚀**

Questions? Read the docs above. Everything you need is here.

