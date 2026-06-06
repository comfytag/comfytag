# ComfyTag Monitoring & Alerting Setup

**Last Updated:** June 6, 2026  
**Audience:** DevOps, operations  
**Goal:** Catch production issues within 5 minutes

---

## Overview

ComfyTag monitoring has three layers:

1. **Health Checks** (Docker) — Auto-restart unhealthy containers
2. **HTTP Monitoring** (UptimeRobot) — Alert if endpoints go down
3. **Log Monitoring** (Manual) — Check logs daily for errors

---

## Layer 1: Docker Health Checks (Built-in)

### Already Configured

Each service in `docker-compose.prod.yml` has health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
  interval: 30s        # Check every 30 seconds
  timeout: 10s         # Fail if check takes > 10s
  retries: 3           # Restart after 3 failed checks (90s)
  start_period: 40s    # Wait 40s before first check
```

### What It Does

- Every 30 seconds, Docker tests if the container is responding
- If 3 checks fail (90 seconds), Docker automatically restarts the container
- Container is back up within 40-60 seconds
- **Result:** Automatic recovery from hung/crashed processes

### Checking Health Status

```bash
# SSH into VPS
docker compose -f docker-compose.prod.yml ps

# Look at STATUS column:
# "Up 5 minutes (healthy)" = passing health checks
# "Up 5 minutes (unhealthy)" = health checks failing
# "Restarting (1)" = Docker restarted it
```

---

## Layer 2: UptimeRobot HTTP Monitoring

UptimeRobot monitors if your endpoints are responding and alerts you within 5 minutes if they go down.

### Setup Instructions

#### 1. Create UptimeRobot Account

```
1. Go to https://uptimerobot.com
2. Click "Sign Up"
3. Use your email (pixelgumstudio@gmail.com)
4. Verify email address
5. Log in to dashboard
```

#### 2. Create Monitors

**Monitor 1: Web App**

```
Name: ComfyTag Web App
URL: https://comfytag.com
Monitor Type: HTTP(s)
Check Interval: 5 minutes
Timeout: 30 seconds
Expected HTTP Status Code: 200
```

**Monitor 2: Partner Dashboard**

```
Name: ComfyTag Partner Dashboard
URL: https://partner.comfytag.com
Monitor Type: HTTP(s)
Check Interval: 5 minutes
Timeout: 30 seconds
Expected HTTP Status Code: 200, 301, 302, 307 (accepts redirects to login)
```

**Monitor 3: Admin Dashboard**

```
Name: ComfyTag Admin Dashboard
URL: https://admin.comfytag.com
Monitor Type: HTTP(s)
Check Interval: 5 minutes
Timeout: 30 seconds
Expected HTTP Status Code: 200, 301, 302, 307 (accepts redirects to login)
```

**Monitor 4: API Health**

```
Name: ComfyTag API Health
URL: https://api.comfytag.com/api/health
Monitor Type: HTTP(s)
Check Interval: 5 minutes
Timeout: 30 seconds
Expected HTTP Status Code: 200
```

#### 3. Set Up Alerts

For each monitor:

```
1. Click the monitor name
2. Go to "Alerts"
3. Add Alert Contact:
   - Type: Email
   - Email: pixelgumstudio@gmail.com
   - Alert When: Monitor goes down
   - Alert Type: Notify when monitor is down
   - Timezone: Your timezone
```

#### 4. Enable Notification Preferences

```
UptimeRobot Dashboard → My Settings → Notifications
✓ Slack (optional)
✓ Discord (optional)
✓ Email (required)
```

### UptimeRobot Dashboard

```
https://uptimerobot.com/dashboard

Shows:
- Status of all 4 monitors (green = up, red = down)
- Uptime percentage for the last 30 days
- Response times
- Downtime history
```

---

## Layer 3: Log Monitoring (Manual)

### Daily Health Check (5 minutes)

Run this every morning to spot issues early:

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag

# 1. Check container status
echo "=== CONTAINER STATUS ==="
docker compose -f docker-compose.prod.yml ps

# Expected: All containers "Up" for several hours/days

# 2. Check for errors in logs
echo ""
echo "=== CHECKING FOR ERRORS ==="
docker compose -f docker-compose.prod.yml logs --tail 500 | grep -i "error\|fail\|cannot" | head -20

# 3. Check disk usage
echo ""
echo "=== DISK USAGE ==="
df -h | grep -E "Filesystem|/$"

# Expected: Used % < 80%

# 4. Check memory
echo ""
echo "=== MEMORY USAGE ==="
docker stats --no-stream | head -1

# Expected: Total used < 3GB (out of 4GB)
```

### Automated Log Alerts (Optional - Advanced)

If you want automated alerts for specific error patterns, set up a cron job:

```bash
# SSH into VPS
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# Create alert script
cat > /home/deploy/check-errors.sh << 'EOF'
#!/bin/bash
# Check for critical errors in the last hour

cd /home/deploy/comfytag

# Look for errors
ERRORS=$(docker compose -f docker-compose.prod.yml logs --since 1h | grep -i "error\|panic\|fatal" | wc -l)

if [ "$ERRORS" -gt 10 ]; then
    # Send alert email (requires mail command)
    echo "Alert: Found $ERRORS errors in last hour" | \
    mail -s "ComfyTag Error Alert" pixelgumstudio@gmail.com
fi
EOF

# Make it executable
chmod +x /home/deploy/check-errors.sh

# Add to crontab to run every hour
crontab -e
# Add this line:
# 0 * * * * /home/deploy/check-errors.sh
```

---

## Understanding Alerts

### UptimeRobot Alert: "Monitor Down"

**Means:** Endpoint returned non-200 status or timed out

**Check List:**
1. ✓ Is the service running? `docker compose ps`
2. ✓ Is it healthy? Look for "(healthy)" in status
3. ✓ Check logs: `docker compose logs --tail 50`
4. ✓ Restart if needed: `docker compose restart`

### Manual Alert: High Disk Usage (> 80%)

**Means:** Running out of disk space

**Solution:**
```bash
docker image prune -a       # Remove unused images
docker system prune -a      # Remove all unused data
docker container prune      # Remove stopped containers
df -h                       # Check again
```

### Manual Alert: High Memory Usage (> 3GB)

**Means:** Memory leak or high load

**Solution:**
```bash
# Check which service is using most memory
docker stats

# If API is leaking memory:
docker compose restart api

# If still high after restart, contact dev team
# (Application needs optimization)
```

### Manual Alert: Container Restart Loop

**Means:** Application is crashing

**Solution:**
```bash
# Check logs for startup error
docker compose logs <service> --tail 100

# Common errors:
# - "Cannot find module" = Docker setup error
# - "ECONNREFUSED" = Database not running
# - "ENOTFOUND" = DNS resolution failed

# If Docker error: git checkout previous version
# If DB error: check MongoDB connection
# Contact dev team if unclear
```

---

## Response Procedures

### When UptimeRobot Alerts (Service Down)

**Timeline:**
- **T+0m:** You receive email from UptimeRobot
- **T+5m:** You should be investigating
- **T+10m:** Service should be back up or incident report started

**Steps:**

```bash
# 1. SSH into VPS immediately
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

# 2. Check status
docker compose -f docker-compose.prod.yml ps

# 3. Check logs
docker compose -f docker-compose.prod.yml logs --tail 100

# 4a. If container restarting: wait 2 minutes, check again
sleep 120
docker compose -f docker-compose.prod.yml ps

# 4b. If container crashed: check logs for error
# Most common: "Cannot find module" = Docker issue
# Solution: Rollback to previous version
git log --oneline | head -5
git checkout <previous-hash>
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Test endpoints
curl -f http://localhost:3000 && echo "✓ Web up"
curl -f http://localhost:3001 && echo "✓ Partner up"
curl -f http://localhost:3002 && echo "✓ Admin up"

# 6. If still failing, contact dev team
```

---

## Monitoring Checklist

### Daily (Takes 5 minutes)

- [ ] Check UptimeRobot dashboard — all green?
- [ ] SSH into VPS and check `docker compose ps` — all "Up"?
- [ ] Quick log check: `docker logs --tail 100 | grep error`

### Weekly (Takes 15 minutes)

- [ ] Review uptime percentage in UptimeRobot
- [ ] Check disk usage: `df -h`
- [ ] Check memory: `docker stats`
- [ ] Look for recurring error patterns in logs

### Monthly (Takes 1 hour)

- [ ] Run full system audit (see Deployment Guide)
- [ ] Update dependencies if needed
- [ ] Prune old Docker images: `docker image prune -a`
- [ ] Check and optimize slow database queries

---

## Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| **Uptime %** | > 99.5% | 99-99.5% | < 99% |
| **Response Time** | 200-500ms | 500-1000ms | > 1000ms |
| **Disk Usage** | 50-70% | 70-85% | > 85% |
| **Memory Usage** | 30-50% | 50-70% | > 70% |
| **Error Count** | 0-5/day | 5-20/day | > 20/day |
| **Restart Count** | 0/week | 1-2/week | > 2/week |

---

## Tools & Resources

| Tool | Purpose | Link |
|------|---------|------|
| **UptimeRobot** | HTTP endpoint monitoring | https://uptimerobot.com |
| **Cloudflare** | DNS, SSL, DDoS protection | https://dash.cloudflare.com |
| **Hetzner** | VPS hosting | https://console.hetzner.cloud |
| **MongoDB Atlas** | Database monitoring | https://cloud.mongodb.com |
| **GitHub Actions** | CI/CD logs | https://github.com/comfytag/comfytag/actions |

---

## Incident Runbook (Quick Reference)

### Incident: Service Down

```
Step 1: SSH into VPS
  ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7

Step 2: Check containers
  docker compose -f docker-compose.prod.yml ps
  → If "Restarting": wait 2 min
  → If "Up (unhealthy)": check health check

Step 3: Check logs
  docker compose -f docker-compose.prod.yml logs --tail 100

Step 4: Diagnose error
  - "Cannot find module" → Dockerfile issue
  - "ECONNREFUSED" → Database issue
  - "ENOTFOUND" → Network issue

Step 5: Fix
  - If recent deploy: rollback
  - If db issue: check MongoDB connection
  - If docker issue: check Dockerfile

Step 6: Verify
  curl http://localhost:3000

Step 7: Document
  Notify team of what happened & how you fixed it
```

---

## Contact Escalation

- **Level 1:** UptimeRobot alerts → Check logs, restart if safe
- **Level 2:** Can't fix in 5 minutes → Rollback to previous version
- **Level 3:** Still broken → Contact dev team (requires code fix)

---

**Last Updated:** June 6, 2026  
**Next Review:** Monthly or after major changes
