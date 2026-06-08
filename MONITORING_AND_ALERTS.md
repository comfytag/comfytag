# ComfyTag Monitoring & Alerting

How to monitor production health and respond to issues.

---

## 🏥 What We Monitor

### Application Metrics

**Error Rate**
```
Target: < 0.1%
Warning: 0.1% - 0.5%
Critical: > 0.5%

What it means:
- < 0.1%: Healthy (some errors expected)
- 0.1-0.5%: Investigate (something unusual)
- > 0.5%: Production issue (possible outage)
```

**Response Time (p95)**
```
Target: < 500ms
Warning: 500ms - 1 second
Critical: > 1 second

What it means:
- < 500ms: Fast (good UX)
- 500ms-1s: Slow but acceptable (might be database)
- > 1s: Users experiencing slowness
```

**Uptime**
```
Target: 99.9%
Warning: 99% - 99.9%
Critical: < 99%

What it means:
- 99.9%: Excellent (< 8 hours downtime/month)
- 99%: Good (< 7 hours downtime/month)
- < 99%: Potential issues
```

---

### Infrastructure Metrics

**CPU Usage**
```
Target: < 70%
Warning: 70% - 80%
Critical: > 80%

Action:
- < 70%: Normal
- 70-80%: Monitor (might be spike)
- > 80%: Consider scaling up
```

**Memory Usage**
```
Target: < 70%
Warning: 70% - 80%
Critical: > 80%

Action:
- < 70%: Normal
- 70-80%: Check for memory leaks
- > 80%: Might crash soon
```

**Disk Usage**
```
Target: < 80%
Warning: 80% - 90%
Critical: > 90%

Action:
- < 80%: Normal
- 80-90%: Clean up old logs/backups
- > 90%: Risk of out-of-disk errors
```

**Database Connections**
```
Target: < 70% of pool
Warning: 70% - 85%
Critical: > 85%

Action:
- < 70%: Normal
- 70-85%: Monitor (possible connection leak)
- > 85%: New queries will fail
```

---

## 📊 Key Error Patterns

Watch for these specific errors:

### Database Errors
```
Error: "ECONNREFUSED" or "ENOTFOUND"
Meaning: Can't connect to database
Action: Check MongoDB is running, network connectivity

Error: "EMAXLISTENERS"
Meaning: Too many database connections
Action: Check for connection leaks in application code
```

### API Errors
```
Error: "Cannot find module..."
Meaning: Missing package or module
Action: Check deployment (dependencies installed?)

Error: "Address already in use"
Meaning: Port is taken (duplicate process?)
Action: Check what's running on that port
```

### Out-of-Memory
```
Error: "JavaScript heap out of memory"
Meaning: App is using too much memory
Action: Check for memory leaks, restart containers

Error: "No space left on device"
Meaning: Disk is full
Action: Clean up logs, Docker images, old data
```

---

## 🔔 Alerting Rules

### Automatic Alerts (GitHub Actions)

GitHub Actions automatically stops deployment if:
```
❌ TypeScript compilation fails
❌ Tests fail
❌ Docker build fails
❌ Staging deployment fails
❌ Staging E2E tests fail
❌ Production health checks fail
```

**Response:** Checks the logs, runs `/scripts/health-check-prod.sh`, considers rollback.

---

### Manual Monitoring (Your Job)

After deployment, watch for 5 minutes:

```
1. Error Rate
   ├─ Where to check: Server logs, APM (if installed)
   ├─ Expected: < 0.1% errors
   └─ Alert: If > 0.5%, investigate immediately

2. Response Time
   ├─ Where to check: Server logs, browser DevTools
   ├─ Expected: < 500ms p95
   └─ Alert: If > 1s, something is slow

3. Container Health
   ├─ Where to check: docker ps, Docker logs
   ├─ Expected: All containers "Up" (green)
   └─ Alert: If any container "Restarting", find out why

4. No Critical Errors
   ├─ Where to check: docker logs comfytag-[app]
   ├─ Expected: No "ERROR" or "CRITICAL" messages
   └─ Alert: If found, investigate immediately
```

---

## 🚨 Incident Response

### If Error Rate > 0.5%

```
Step 1: Verify the issue
├─ SSH into production: ssh deploy@204.168.242.7
├─ Check all containers: docker compose ps
└─ Check logs: docker logs comfytag-web | grep ERROR

Step 2: Find the root cause
├─ Recent code changes? (git log --oneline | head -5)
├─ Database connection lost? (curl http://api/health)
├─ Memory exhausted? (docker stats)
└─ Disk full? (ssh and run: df -h)

Step 3: Decide on action
├─ Can fix in < 5 minutes? → Fix and redeploy
└─ Can't fix quickly? → ROLLBACK immediately
    ├─ Run: ./scripts/rollback-production.sh
    ├─ Verify: ./scripts/health-check-prod.sh
    └─ Notify team

Step 4: Post-mortem
├─ Create GitHub issue documenting what happened
├─ Schedule team discussion 24 hours later
└─ Implement fix to prevent recurrence
```

---

### If Response Times > 1 Second

```
Step 1: Find which endpoint is slow
├─ Check server logs
├─ Check database slow query log
├─ Use browser DevTools to measure requests

Step 2: Find the cause
├─ Is database query slow? (check indexes)
├─ Is rendering slow? (check components)
├─ Is API call to external service slow? (timeout?)

Step 3: Options
├─ Can optimize quickly? (add index, simplify query)
├─ Need database restart? (might reset cache)
└─ Need code change? (might require redeployment)

Step 4: If blocking users
├─ Is it blocking checkout? → HIGH priority → Fix ASAP
├─ Is it blocking login? → HIGH priority → Fix ASAP
├─ Is it blocking search? → MEDIUM priority → Fix today
└─ Is it blocking profile view? → LOW priority → Fix this week
```

---

### If Containers Are Restarting

```
Meaning: Container crashes, then restarts, then crashes again (restart loop)

Step 1: Check the logs
├─ docker logs --tail 50 comfytag-[app]
└─ Look for error messages

Step 2: Common causes
├─ Out of memory? (check docker stats)
├─ Out of disk? (ssh and run df -h)
├─ Missing environment variable? (check .env)
├─ Database connection issue? (test connection)
└─ Port already in use? (check netstat)

Step 3: Fix locally first
├─ Set correct environment variable
├─ Restart container manually
├─ Monitor logs while it starts
└─ Verify container stays up (no restart loop)

Step 4: If container still crashes
├─ Roll back to previous version
├─ Investigate why the change broke it
└─ Create GitHub issue documenting the issue
```

---

## 📋 Post-Deployment Checklist

Right after deploying to production:

```
Immediate (First 1 minute):
  ☐ GitHub Actions passed (all stages green)
  ☐ Health checks passed (docker ps shows all "Up")
  ☐ No new errors in recent logs (docker logs)

Short-term (First 5 minutes):
  ☐ Error rate < 0.1%
  ☐ Response time p95 < 500ms
  ☐ No container restarts
  ☐ No critical errors in logs
  ☐ Feature accessible to users

Medium-term (Next 30 minutes):
  ☐ Error rate stays low (< 0.1%)
  ☐ Response times normal (< 500ms p95)
  ☐ Resource usage normal (CPU < 70%, memory < 70%)
  ☐ Database connections healthy
  ☐ No user complaints or issues

Long-term (Next 24 hours):
  ☐ No increase in error rate
  ☐ Feature working as expected
  ☐ No memory leaks
  ☐ No performance degradation
  ☐ Ready to move on to next feature
```

---

## 🔧 Commands to Know

### SSH into Production
```bash
ssh deploy@204.168.242.7
```

### Check Container Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### View Container Logs
```bash
docker logs --tail 50 comfytag-web      # Last 50 lines
docker logs --tail 20 comfytag-api      # Follow logs in real-time
docker logs --tail 50 comfytag-web | grep ERROR
```

### Check System Resources
```bash
docker stats                             # CPU, memory, disk
df -h                                    # Disk usage
free -h                                  # Memory usage
top                                      # System processes
```

### Health Check
```bash
./scripts/health-check-prod.sh
```

### Rollback
```bash
./scripts/rollback-production.sh
```

---

## 📊 Where to Check Metrics

### If you have monitoring tools set up:
- Datadog, New Relic, Prometheus, etc. → Dashboard shows metrics

### If you don't have monitoring tools:
- **Logs:** `docker logs comfytag-[app]`
- **System:** `docker stats`, `df -h`, `free -h`
- **Health:** `./scripts/health-check-prod.sh`
- **Connectivity:** `curl http://localhost:3000` (from production)

---

## 🚨 When to Escalate

**Escalate immediately if:**
```
❌ Users reporting outage (can't log in, can't access features)
❌ Error rate > 1%
❌ Response times > 2 seconds
❌ Any container in restart loop
❌ Database not responding
❌ Disk full or running out of memory
❌ Security issue discovered (data leak, XSS, SQL injection)
```

**Escalate within 1 hour if:**
```
❌ Performance degradation (slow but working)
❌ Some features broken (not all)
❌ Error rate 0.1% - 0.5%
❌ Response times 500ms - 1 second
```

**Escalate within 1 day if:**
```
❌ Minor bug found (cosmetic issue)
❌ Small performance optimization needed
❌ Non-critical feature not working perfectly
```

---

## 💭 Remember

**Monitoring is early warning, not rescue.**

The goal is to catch issues BEFORE they impact users.

If something gets to "users reporting outage," we've already failed.

Watch the metrics. Act fast. Keep users happy. 🚀

