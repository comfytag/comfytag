# First Feature Test Run

Complete walkthrough of one feature going from task → production.

**Read time:** 10 minutes

---

## 🎯 Scenario

We're building: **Event Filters** (users can filter events by category, date, price)

**Timeline:**
- Monday 9am: Task submitted to Quality Hub
- Monday 10am: Backend Engineer starts
- Monday 2pm: Backend PR merged
- Monday 3pm: Frontend Engineer starts
- Tuesday 9am: Frontend PR merged
- Tuesday 10am: QA Engineer starts
- Tuesday 12pm: QA PR merged
- Tuesday 1pm: GitHub Actions auto-deploys to staging
- Tuesday 2pm: E2E tests pass on staging
- Tuesday 3pm: GitHub Actions auto-deploys to production
- Tuesday 4pm: ✅ FEATURE LIVE

---

## 📋 Step 1: Submit Task to Quality Hub

**Monday 9:00 AM**

```
/comfytag-quality-hub BUILD "Event filters feature"
```

Quality Hub responds:

```markdown
## Feature: Event Filters

### What Users See
- Filter dropdown on events page
- Options: Category, Date Range, Price Range
- Results update in real-time

### Acceptance Criteria
- [ ] Users can filter by category (Music, Tech, Sports, etc.)
- [ ] Users can filter by date (Today, This Week, This Month)
- [ ] Users can filter by price ($0-50, $50-100, $100+)
- [ ] Filters can be combined (category AND date AND price)
- [ ] Filters are remembered in URL (shareable)
- [ ] Clear button resets all filters

### Dependencies & Sequence
1. Backend Engineer: Design API endpoint (GET /api/events?category=&date=&price=)
2. Frontend Engineer: Build FilterBar component + integrate API
3. QA Engineer: Write E2E tests (happy path, filter combinations, URL state)
4. DevOps: Deploy (auto-handled by GitHub Actions)

### Risks
- URL becomes too long with multiple filters
- Database query slow with 3 filter conditions
- Race condition if user clicks filters rapidly

### Timeline Estimate
- Backend: 4 hours
- Frontend: 3 hours
- QA: 2 hours
- Total: 9 hours (~1 day)

### Ready to Start
Backend Engineer: Copy AGENT_TASK_TEMPLATES.md → Backend Engineer Task Template
```

---

## 💻 Step 2: Backend Engineer Builds API

**Monday 10:00 AM**

Backend Engineer:
1. Copies `AGENT_TASK_TEMPLATES.md` → Backend Engineer Task Template
2. Fills in [Feature Name] = "Event Filters"
3. Starts work:

```
// apps/api/src/routes/events.ts
GET /api/events?category=&date=&price=

Request:
{
  category?: "Music" | "Tech" | "Sports" | "Arts"
  date?: "today" | "week" | "month"
  price?: "0-50" | "50-100" | "100+"
}

Response (200):
{
  success: true,
  events: [
    { id, name, date, price, category, ... }
  ],
  total: 42
}

Errors:
- 400: Invalid filter value
- 500: Database error
```

**Monday 2:00 PM**

Backend Engineer posts:

```
✅ Backend API complete for Event Filters

Endpoint: GET /api/events?category=&date=&price=
Request types: apps/api/src/types/events.ts
Response types: apps/api/src/types/events.ts
Tests: All passing ✅
  - Happy path: category=Music → returns music events
  - Invalid filter: category=Invalid → 400 error
  - Combined filters: category=Music&date=week → returns filtered results

Database: Added index on (category, date, price) for fast queries

@Frontend Engineer can now start!
```

Backend Engineer creates PR:
- Title: `feat(api): Add event filters endpoint`
- All checkboxes ✅ in task template
- Merges to main

**GitHub Actions Auto-Runs:**
```
✅ TypeScript check
✅ Lint check
✅ Build check
✅ API tests pass
✅ Docker build check
✓ Staging deployment (backend only)
✓ Health checks pass
```

---

## 🎨 Step 3: Frontend Engineer Builds UI

**Monday 3:00 PM**

Frontend Engineer:
1. Copies `AGENT_TASK_TEMPLATES.md` → Frontend Engineer Task Template
2. Gets API contract from Backend PR
3. Starts work:

```tsx
// apps/web/src/components/filters/EventFiltersBar.tsx
<EventFiltersBar
  onFilter={(filters) => {
    // Call API with filters
    // Update URL params
    // Display results
  }}
/>

States:
- Loading: Shows skeleton
- Success: Shows filtered events
- Error: Shows error message + retry
- Empty: Shows "No events found"
```

**Tuesday 9:00 AM**

Frontend Engineer posts:

```
✅ Frontend UI complete for Event Filters

Components:
  - EventFiltersBar.tsx (main filter UI)
  - CategorySelect.tsx (dropdown)
  - DateRangeSelect.tsx (date picker)
  - PriceRangeSelect.tsx (price selector)
  - useEventFilters.ts (custom hook)

Features:
  - Filters combined: category AND date AND price
  - URL state: filters in URL params (shareable)
  - Clear button: resets all filters
  - Real-time updates: filters trigger API call

Accessibility: ✅ WCAG AA (labels, contrast, keyboard nav)
Tests: ✅ All component tests pass
Design tokens: ✅ No hardcoded colors

@QA Engineer can now start!
```

Frontend Engineer creates PR:
- Title: `feat(web): Add event filters UI`
- All checkboxes ✅ in task template
- Merges to main

**GitHub Actions Auto-Runs:**
```
✅ TypeScript check
✅ Lint check
✅ Build check
✅ Web component tests pass
✅ Docker build check
✓ Staging deployment
✓ Health checks pass
```

---

## 🧪 Step 4: QA Engineer Tests Feature

**Tuesday 10:00 AM**

QA Engineer:
1. Copies `AGENT_TASK_TEMPLATES.md` → QA Engineer Task Template
2. Receives feature details from Frontend PR
3. Writes comprehensive tests:

```typescript
// tests/e2e/event-filters.spec.ts

test("User can filter events by category", async () => {
  // Visit events page
  // Click Category dropdown
  // Select "Music"
  // Verify: only music events shown
  // Verify: URL contains ?category=Music
})

test("User can filter by multiple criteria", async () => {
  // Filter by category=Music AND date=week
  // Verify: shows music events this week only
})

test("Clear button resets all filters", async () => {
  // Set multiple filters
  // Click Clear button
  // Verify: all filters cleared, all events shown again
})

test("Filters are shareable via URL", async () => {
  // Set filters: category=Tech, date=month
  // Copy URL: events.com/events?category=Tech&date=month
  // Open in new browser
  // Verify: same filters applied automatically
})

test("Error handling: invalid filter value", async () => {
  // Manually set: ?category=InvalidValue
  // Verify: error message shown OR defaults to no filter
})

// + 5 more edge case tests...
```

**Tuesday 12:00 PM (Noon)**

QA Engineer posts:

```
✅ Event Filters fully tested

Test coverage:
  - Happy path (filter by each criterion): ✅
  - Combined filters (multiple criteria): ✅
  - URL state (filters in URL): ✅
  - Clear filters button: ✅
  - Edge cases (empty results, invalid filters): ✅
  - Accessibility (keyboard nav, screen reader): ✅
  - Mobile responsive: ✅

Staging verification: ✅
  - Deployed to staging environment
  - All E2E tests PASSED on staging
  - Manual smoke test: feature works perfectly
  - Performance: filter updates < 500ms
  - No errors in logs

Ready for production! 🚀
```

QA Engineer creates PR:
- Title: `test: Add E2E tests for event filters`
- All checkboxes ✅ in task template
- Merges to main

**GitHub Actions Auto-Runs:**
```
✅ TypeScript check
✅ Lint check
✅ Build check
✅ All tests pass (unit + integration + E2E)
✅ Docker build check
✓ Staging deployment
✓ E2E tests on staging: ALL PASS ✅
```

---

## 🚀 Step 5: Automatic Deployment to Production

**Tuesday 1:00 PM**

GitHub Actions automatically starts (no manual action needed):

```
Stage 1: Quality Gate ✅
├─ TypeScript: PASS
├─ Linting: PASS
├─ Build: PASS
└─ Tests: PASS (194 tests)

Stage 2: Docker Build ✅
├─ comfytag-api: Built
├─ comfytag-web: Built (includes filters)
├─ comfytag-partner: Built
└─ comfytag-admin: Built

Stage 3: Deploy to Staging ✅
├─ Code pulled from GitHub
├─ Docker images built
├─ Containers started
└─ Health checks: PASS

Stage 4: E2E Tests on Staging ✅
├─ Event Filters (happy path): PASS
├─ Event Filters (combined filters): PASS
├─ Event Filters (URL state): PASS
├─ + 10 more tests: ALL PASS
└─ Performance: All < 500ms

Stage 5: Deploy to Production ✅
├─ Docker images pushed
├─ Containers started on production VPS
├─ Services stabilizing...
└─ Health checks: PASS

Stage 6: Production Health Check ✅
├─ Error rate: 0.05% (✅ < 0.1%)
├─ Response time p95: 350ms (✅ < 500ms)
├─ All containers: UP (✅ no restarts)
└─ Feature accessible: YES (✅ users can filter)

✅ DEPLOYMENT SUCCESSFUL
```

---

## ✅ Step 6: Feature Live + Monitoring

**Tuesday 2:00 PM**

Feature is now LIVE for all users!

```
Event Filters now available:
✓ Production users can filter events by category, date, price
✓ Filters shareable via URL
✓ Real-time filtering works perfectly
✓ Mobile responsive
✓ Accessible (keyboard + screen reader)
```

**Tuesday 2:00 PM - 2:30 PM: Active Monitoring**

On-call team watches:
```
Metric          | Target      | Status
─────────────────────────────────────────
Error rate      | < 0.1%      | ✅ 0.03%
Response time   | < 500ms     | ✅ 420ms p95
CPU             | < 70%       | ✅ 45%
Memory          | < 70%       | ✅ 52%
Container status| All Up      | ✅ All Up
New errors      | None        | ✅ None

Everything healthy ✅
```

**Tuesday 3:00 PM: Post-Deployment Summary**

```
🎉 EVENT FILTERS FEATURE DEPLOYED

Timeline:
- Monday 10am: Backend Engineer starts
- Monday 2pm: Backend merged ✅
- Monday 3pm: Frontend Engineer starts
- Tuesday 9am: Frontend merged ✅
- Tuesday 10am: QA Engineer starts
- Tuesday 12pm: QA merged ✅
- Tuesday 1pm: GitHub Actions auto-deployed
- Tuesday 2pm: ✅ LIVE IN PRODUCTION

Result:
- 0 production issues
- 0 rollbacks needed
- Feature shipped perfectly
- All users happy 🎉

Next feature ready to start! 🚀
```

---

## 📊 What This Shows

### The Quality System Works
```
✅ Code quality enforced (no bugs made it to production)
✅ Staging caught issues before production (would have)
✅ Automated deployment is safe and fast
✅ No manual interventions needed
✅ Feature shipped with confidence
```

### Agents Stayed Coordinated
```
✅ Backend did their job, handed off to Frontend
✅ Frontend used correct API contract
✅ QA tested thoroughly
✅ DevOps monitored after deployment
✅ Zero communication failures
```

### Production Stayed Healthy
```
✅ Error rate stayed low (< 0.1%)
✅ Response times normal (< 500ms)
✅ No containers crashed or restarted
✅ No database issues
✅ Users experienced zero disruption
```

---

## 🎯 Key Takeaways

1. **Each role has a clear job** — Backend → Frontend → QA → DevOps
2. **Handoffs are explicit** — Clear message when done
3. **No manual deployment** — GitHub Actions handles it
4. **Safety is automatic** — Can't deploy broken code
5. **Monitoring is continuous** — Issues caught immediately
6. **Feature reaches users safely** — Quality never compromised

---

## Next Steps

Now that you've seen it work:

1. **Set up GitHub Secrets** (`.github/DEPLOYMENT_SETUP.md`)
2. **Train agents** (each reads `AGENT_ONBOARDING.md`)
3. **Start first real feature**
4. **Watch it deploy live** ✅

---

**Ready to ship great features safely? Let's go! 🚀**

