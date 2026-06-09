# ComfyTag Deployment Principles

**Last Updated:** June 8, 2026  
**Status:** ACTIVE  
**Owner:** DevOps / Infrastructure Team

---

## Core Philosophy

> **Stability > Speed**  
> A 10-minute deploy that never breaks production is better than a 2-minute deploy that causes 502s.

---

## The Pipeline (Required for ALL Deployments)

### **Stage 1: Local Development (Developer Machine)**
```
✅ pnpm typecheck     (catch TypeScript errors early)
✅ pnpm lint          (enforce code style)
✅ pnpm test:ci       (run all unit/integration tests)
✅ pnpm build         (ensure monorepo builds)
✅ ./scripts/test-docker-builds.sh  (test Docker locally)
```

**Blocks:** If any step fails, commit is blocked by pre-commit hook.

---

### **Stage 2: GitHub Actions - Quality Gate**
```
Trigger: Push to main branch

❶ TypeScript & Linting
   - pnpm typecheck
   - pnpm lint
   - pnpm test:ci
   
❷ Docker Build Verification
   - Build comfytag-api image
   - Build comfytag-web image
   - Build comfytag-partner image
   - Build comfytag-admin image
   - Verify images start without errors
   
❸ Staging Deployment
   - Push images to staging registry
   - Deploy to staging environment
   - Run database migrations (if any)
   - Health checks: 5 successful requests
   
❹ E2E Tests on Staging
   - pnpm playwright test --config=playwright.staging.ts
   - Key scenarios: Login, browse, checkout, partner dashboard, admin panel
   
❺ Production Deployment
   - Only if ❶-❹ ALL pass
   - Push images to production registry
   - Use blue-green or rolling deployment
   - Keep previous version for rollback
   
❻ Production Health Checks
   - 10+ successful requests to health endpoint
   - Monitor error rate for 5 minutes
   - If error rate > 1% → Rollback automatically
```

**Result:** Zero manual intervention. If anything fails → Team is notified, deployment halts.

---

## Safety Mechanisms

### **1. Pre-Merge Quality Gates**

Every PR must pass:
```
Requirements:
  ☐ All tests pass (pnpm test:ci)
  ☐ Build succeeds (pnpm build)
  ☐ TypeScript strict (pnpm typecheck)
  ☐ No lint errors (pnpm lint)
  ☐ Code review approved
  ☐ No console.logs or debug code
  ☐ Dockerfiles tested locally

If ANY fail → PR cannot be merged
```

### **2. Docker Image Validation**

Before deploying ANY Docker image:
```
Run: ./scripts/test-docker-builds.sh

Checks:
  ✅ Images build without errors
  ✅ Images start without crashing
  ✅ Port mappings correct
  ✅ Environment variables accessible
  ✅ Health checks respond
  ✅ No restart loops detected
  
If ANY fail → Deployment blocked
```

### **3. Staging Environment Testing**

Every deployment goes to staging FIRST:
```
Staging Deployment:
  1. Deploy Docker images
  2. Run E2E tests (same as production)
  3. Manual smoke test (click around)
  4. Monitor logs for 2 minutes
  
If issues found → Fix and redeploy to staging
Only after staging passes → Deploy to production
```

### **4. Production Monitoring**

Post-deployment monitoring (5 minutes):
```
Alerts (Auto-Rollback if triggered):
  ❌ Error rate > 1%
  ❌ Response time p95 > 1 second
  ❌ CPU usage > 80%
  ❌ Memory usage > 80%
  ❌ Database connections exhausted
  
Manual Rollback if:
  ❌ User-facing feature broken
  ❌ Data integrity issue
  ❌ Security vulnerability exposed
```

### **5. Rollback Procedures**

If production is broken:
```
IMMEDIATE ACTION (< 5 minutes):
  1. Revert to previous working Docker image
  2. Verify health checks pass
  3. Notify team in Slack
  4. Post-mortem 24 hours later

Keep 2 Previous Versions:
  - Current: 2026-06-08-12-00-00
  - Previous: 2026-06-07-15-30-00
  - Previous-2: 2026-06-07-10-15-00
  
Rolling back = Change image tag + redeploy
```

---

## What Causes Deployments to FAIL

### ❌ Build Failures
- **TypeScript errors** → `pnpm typecheck` fails
- **Lint errors** → `pnpm lint` fails
- **Test failures** → `pnpm test:ci` fails
- **Docker build fails** → Image won't build

**Prevention:** Run checks locally before committing

---

### ❌ Dockerfile Issues
- **Wrong CMD path** → Server doesn't start
- **Missing environment variables** → App crashes
- **Health check misconfigured** → Service marked unhealthy
- **Port not exposed** → Nginx can't connect

**Prevention:** Run `./scripts/test-docker-builds.sh` before merging

---

### ❌ API Contract Breaks
- **Backend changes API path** → Frontend can't find endpoint
- **Response schema changes** → Frontend parsing fails
- **Authentication removed** → Users can't log in

**Prevention:** Backend & Frontend must coordinate, tests catch breaks

---

### ❌ Database Issues
- **Migration fails** → Deploy rolls back
- **Schema incompatible with code** → Queries fail
- **Data loss in migration** → Catastrophic

**Prevention:** Test migrations on staging first, always have backup

---

### ❌ Secrets/Configuration
- **Hardcoded API keys** → Security vulnerability
- **Wrong environment variables** → Wrong API URLs, databases
- **Missing secrets in production** → Services can't authenticate

**Prevention:** Use secure secrets manager, never hardcode

---

### ❌ Performance Degradation
- **Memory leak** → Eventually OOM and crash
- **N+1 queries** → Database overwhelmed
- **Large payload** → Slow response times
- **Unoptimized images** → Slow load

**Prevention:** Monitor metrics, load test before deploy

---

## Deployment Checklist (Copy & Paste for Every Deploy)

```
PRE-MERGE:
  ☐ Feature code complete
  ☐ pnpm typecheck passes
  ☐ pnpm lint passes
  ☐ pnpm test:ci passes
  ☐ pnpm build passes
  ☐ ./scripts/test-docker-builds.sh passes
  ☐ Code reviewed and approved
  ☐ PR description documents changes
  ☐ Database migrations tested (if any)

STAGING DEPLOY:
  ☐ Merge PR to main
  ☐ GitHub Actions workflow starts
  ☐ All CI checks pass
  ☐ Docker images build successfully
  ☐ Staging deployment succeeds
  ☐ E2E tests pass on staging
  ☐ Health checks pass (5+ requests)
  ☐ Manual smoke test completed
  ☐ Logs show no errors

PRODUCTION DEPLOY:
  ☐ Staging validation complete
  ☐ Team notified in Slack
  ☐ Rollback plan reviewed
  ☐ Previous version backed up
  ☐ Images pushed to production registry
  ☐ Blue-green swap or rolling deploy executed
  ☐ Health checks pass (10+ requests)
  ☐ Error rate normal (< 0.1%)
  ☐ Response times normal (< 500ms p95)
  ☐ Logs monitored for 5 minutes
  ☐ No alerts triggered

POST-DEPLOY:
  ☐ Users can complete key flows (login, search, checkout)
  ☐ Admin dashboard accessible
  ☐ Partner dashboard working
  ☐ API health endpoint responsive
  ☐ No spike in errors
  ☐ Performance metrics stable
  ☐ Deployment marked as successful
```

---

## Rollback Decision Tree

```
Is production broken?
├─ YES: Responsive service down (502, 500 errors)
│   └─ ROLLBACK IMMEDIATELY
│        └─ Run: ./scripts/rollback-production.sh
│        └─ Verify: Health checks pass
│        └─ Notify: Team + stakeholders
│        └─ Post-mortem: 24 hours later
│
├─ YES: Feature not working, but app is up
│   └─ INVESTIGATE (5 minute window)
│        ├─ Is it a feature flag? (disable it)
│        ├─ Is it an API issue? (check logs)
│        ├─ Is it a config issue? (fix in prod)
│        └─ If unfixable in < 5 minutes → ROLLBACK
│
└─ NO: Slight issue, but users can work around it
    └─ MONITOR but don't rollback
         └─ Create incident ticket
         └─ Plan hotfix in next deploy
```

---

## Incident Response

### **Level 1: Minor Issue (Users can work around)**
- Error rate 0.5-1%
- One non-critical feature broken
- Response times slightly elevated

**Action:**
- Log incident ticket
- Plan hotfix for next release
- Monitor, don't rollback

---

### **Level 2: Significant Issue (Partial outage)**
- Error rate 1-5%
- Core feature intermittently broken
- Some users can't complete key flows

**Action:**
- Page on-call engineer
- Attempt hotfix in production
- If hotfix fails in 5 min → Rollback
- Post-mortem within 24 hours

---

### **Level 3: Critical Issue (Outage)**
- Error rate > 5%
- Core services down (login broken, database unavailable)
- Most users affected

**Action:**
- ROLLBACK IMMEDIATELY (no debug window)
- Notify stakeholders
- Stand up incident bridge
- Post-mortem same day

---

## Monitoring Metrics (For On-Call)

Monitor these in real-time during and after deployment:

```
Application Metrics:
  - Error rate (target: < 0.1%)
  - Response time p95 (target: < 500ms)
  - Request volume (should be normal)
  - API health endpoint (200 OK)

Infrastructure Metrics:
  - CPU usage (target: < 70%)
  - Memory usage (target: < 70%)
  - Disk usage (target: < 80%)
  - Database connection pool (target: < 80% utilized)

Business Metrics:
  - Checkout completion rate (should be normal)
  - Login success rate (should be normal)
  - Search results returned (should be normal)
  - Partner dashboard loads (should be normal)

Alerts Should Trigger If:
  ❌ Error rate > 1%
  ❌ Response time p95 > 1 second
  ❌ API health endpoint fails
  ❌ Database connections > 80%
```

---

## FAQ

**Q: Can we skip staging and go straight to production?**  
A: No. Staging catches 80% of issues before they hit production.

**Q: What if a feature is urgent?**  
A: It still goes through the pipeline. Quality > Speed.

**Q: Can we deploy on Friday?**  
A: Only if you're on-call the whole weekend.

**Q: What if tests are flaky?**  
A: Fix the tests, don't skip them. Flaky tests are worse than no tests.

**Q: What if the previous version has a bug?**  
A: Fix it and redeploy. Don't rollback to a broken version.

**Q: How long does a full deploy take?**  
A: ~10 minutes (build + test + staging + health checks + production).

---

## Success Criteria

A deployment is successful when:
- ✅ All automated checks pass
- ✅ Staging E2E tests pass
- ✅ Production health checks pass
- ✅ Error rate remains < 0.1%
- ✅ Response times remain < 500ms p95
- ✅ No critical alerts triggered
- ✅ Users can complete key flows
- ✅ No rollback needed

---

**Remember:** Better to deploy slowly and safely than quickly and break things.

