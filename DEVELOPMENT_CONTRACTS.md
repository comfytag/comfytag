# ComfyTag Development Contracts

**Last Updated:** June 8, 2026  
**Status:** ACTIVE (All agents must follow)  
**Version:** 1.0

---

## 🎯 Purpose

This document defines **non-negotiable contracts** that every AI agent, developer, and code change must follow. Violations block PRs from merging.

---

## 🛑 Universal Rules (No Exceptions)

### Code Quality
- ✅ **TypeScript strict mode** — `"strict": true` in all tsconfigs, no `any` types
- ✅ **No hardcoded values** — All colors, spacing, fonts come from `@comfytag/ui/tokens`
- ✅ **No console.logs in production** — Debug code blocked by pre-commit hooks
- ✅ **DRY components** — Extract reusable UI before using it twice
- ✅ **Import safety** — No circular dependencies, no broken imports
- ✅ **Accessibility** — WCAG AA minimum (contrast ratios 4.5:1, focus rings visible, alt text required)

### Dockerfile & Deployment
- ✅ **ALL Dockerfile changes tested locally** — Run `./scripts/test-docker-builds.sh` before committing
- ✅ **Standalone paths correct** — Next.js apps use `node apps/[name]/.next/standalone/apps/[name]/server.js`
- ✅ **No hardcoded environment variables** — Use `.env` files or secrets manager
- ✅ **Health checks defined** — Every service has a liveness/readiness check
- ✅ **No breaking changes without migration** — Schema changes must include migration scripts

### Git & Code Review
- ✅ **Semantic commit messages** — `fix:`, `feat:`, `refactor:`, `docs:`, `test:`
- ✅ **One feature per PR** — No mixing unrelated changes
- ✅ **PR title under 70 characters** — Descriptive, no abbreviations
- ✅ **Related files grouped** — If changing API, also update types + tests

---

## 👥 Agent-Specific Contracts

### Backend Engineer (@comfytag-backend-engineer)

**Owns:**
- Express.js routes and controllers
- MongoDB schemas and migrations
- API contracts (request/response types)
- Authentication & authorization logic
- Error handling and validation

**Must Do:**
- [ ] Define request/response types in TypeScript (use Zod/Joi for validation)
- [ ] Create database migration scripts (`db/migrations/00X-*.js`)
- [ ] Document API endpoints in PR description (path, method, example request/response)
- [ ] Handle errors gracefully (no stack traces to client)
- [ ] Test with `pnpm test:api` before opening PR
- [ ] Notify Frontend Engineer if API contract changes

**Must NOT:**
- ✅ Break existing API contracts without updating consumers
- ✅ Change database schema without migration
- ✅ Hardcode API keys or secrets
- ✅ Add `console.log()` in production code
- ✅ Skip type definitions for routes

**Blocks Own PR If:**
- API changes lack request/response types
- No migration script for schema changes
- Error handling is missing
- Tests don't pass: `pnpm test:api`

---

### Frontend Engineer (@comfytag-frontend-engineer)

**Owns:**
- Next.js pages and components (web app)
- Component architecture and state management
- CSS tokens integration (colors, spacing, typography)
- Form handling and validation
- Loading states, error boundaries, accessibility

**Must Do:**
- [ ] Extract components before reuse (no inline reusable components)
- [ ] Use `@comfytag/ui` tokens for ALL styling (never hardcode colors/spacing)
- [ ] Define component props as interfaces (full TypeScript typing)
- [ ] Test with `pnpm typecheck && pnpm build` before opening PR
- [ ] Verify accessibility: focus rings visible, contrast ratios 4.5:1 minimum
- [ ] Notify Backend Engineer if new API endpoints needed

**Must NOT:**
- ✅ Hardcode colors, fonts, or spacing values
- ✅ Use `any` types in TypeScript
- ✅ Add console.logs to production components
- ✅ Create prop-drilling chains (use context or custom hooks)
- ✅ Duplicate existing components

**Blocks Own PR If:**
- Component not extracted before page use
- Hardcoded colors/spacing detected
- TypeScript errors exist
- Build fails: `pnpm build --filter=web`
- Accessibility standards violated

---

### Mobile Developer (@comfytag-mobile-frontend)

**Owns:**
- React Native screens and flows
- Mobile-specific state management
- Offline-first architecture (local caching)
- Push notifications and deep linking
- iOS/Android specific logic

**Must Do:**
- [ ] Reuse same API contracts as web (call same Backend endpoints)
- [ ] Use `@comfytag/ui` tokens for consistent theming
- [ ] Implement offline support (cache API responses)
- [ ] Test with `pnpm typecheck && cd apps/mobile && pnpm ios` before opening PR
- [ ] Handle network errors gracefully (show offline indicator)
- [ ] Coordinate with Frontend Engineer on shared components

**Must NOT:**
- ✅ Create separate API endpoints for mobile (reuse web APIs)
- ✅ Store sensitive tokens in AsyncStore (use secure storage)
- ✅ Hardcode colors or spacing (use tokens)
- ✅ Forget offline support (always cache critical data)
- ✅ Break frame rate (keep 60 FPS on animations)

**Blocks Own PR If:**
- API contract doesn't match web version
- TypeScript errors exist
- Hardcoded colors detected
- No offline support for critical flows
- Frame rate benchmark fails (< 60 FPS)

---

### QA Engineer (@comfytag-qa-engineer)

**Owns:**
- Test strategy and test suite design
- Unit, integration, and E2E test coverage
- Edge case identification and validation
- Staging environment verification
- Production health checks

**Must Do:**
- [ ] Identify edge cases for every feature (not just happy path)
- [ ] Write tests BEFORE feature code (if possible)
- [ ] Design E2E test scenarios (user behaviors, not implementation details)
- [ ] Validate Dockerfile changes: `./scripts/test-docker-builds.sh`
- [ ] Run full test suite before approving PR: `pnpm test:ci`
- [ ] Test on staging environment before production deploy

**Must NOT:**
- ✅ Test implementation details (mock internal state)
- ✅ Over-rely on E2E tests for unit-testable logic
- ✅ Create flaky tests (sleep, timeouts, random waits)
- ✅ Skip accessibility testing
- ✅ Deploy to production without staging validation

**Blocks Deployment If:**
- Any test fails
- Dockerfile doesn't build successfully
- Staging E2E tests fail
- Health checks fail on staging
- Edge cases are uncovered

---

### Infrastructure/DevOps Engineer (@comfytag-devops-infra)

**Owns:**
- Docker and Kubernetes configuration
- CI/CD pipeline management
- Secrets management and environment variables
- Monitoring, logging, and alerting
- Deployment procedures and rollbacks

**Must Do:**
- [ ] Test all Dockerfile changes locally: `./scripts/test-docker-builds.sh`
- [ ] Document deployment process in runbook
- [ ] Set up health checks for all services
- [ ] Configure monitoring alerts (error rates, latency, CPU/memory)
- [ ] Create rollback procedures for each deployment
- [ ] Verify staging deployment succeeds before production

**Must NOT:**
- ✅ Deploy to production without staging validation
- ✅ Hardcode secrets in code or images
- ✅ Skip health checks or monitoring
- ✅ Remove old deployments immediately (keep 2 previous versions for rollback)
- ✅ Change deployment procedures without team awareness

**Blocks Deployment If:**
- Dockerfile build fails
- Health checks fail on staging
- Monitoring is not configured
- Rollback plan is not documented

---

## 🚀 Deployment Checklist (Sacred, No Exceptions)

Before deploying to production, **ALL** of these must pass:

```
PRE-MERGE CHECKS:
  ☐ pnpm typecheck (TypeScript errors = 0)
  ☐ pnpm lint (linting errors = 0)
  ☐ pnpm build (all apps build successfully)
  ☐ ./scripts/test-docker-builds.sh (Docker images build)
  ☐ pnpm test:ci (all unit/integration tests pass)
  ☐ Code review approved by 1 agent
  ☐ No console.logs or debug code
  ☐ No hardcoded colors, spacing, or keys
  ☐ Accessibility standards met (WCAG AA)

STAGING DEPLOYMENT:
  ☐ Docker images deployed to staging
  ☐ pnpm playwright test (E2E tests pass on staging)
  ☐ Manual health checks pass (5+ successful requests)
  ☐ Logs show no errors or warnings
  ☐ Response times acceptable (< 500ms)
  ☐ All features work as expected

PRODUCTION DEPLOYMENT:
  ☐ Rollback plan documented
  ☐ Team notified of deployment
  ☐ Images deployed to production
  ☐ Health checks pass (10+ requests)
  ☐ Monitoring alerts configured
  ☐ Logs monitored for 5 minutes

PRODUCTION VALIDATION (Post-Deploy):
  ☐ Error rate normal (< 0.1%)
  ☐ Response times normal (< 500ms p95)
  ☐ No critical alerts triggered
  ☐ Users can complete core flows
  ☐ If any issue: ROLLBACK IMMEDIATELY
```

---

## 🔄 Handoff Protocol

### Backend → Frontend
Backend Engineer creates PR:
- API path, method, request body, response body defined
- Types exported from `apps/api/src/types/`
- Response examples in PR description
- Tests pass: `pnpm test:api`

Frontend Engineer picks it up:
- Implements UI that calls the API
- Uses exact request/response types
- Tests with `pnpm typecheck && pnpm build --filter=web`

### Frontend → Mobile (if applicable)
Frontend Engineer merges:
- Mobile Developer sees merged PR
- Reuses same API endpoints
- Uses same `@comfytag/ui` tokens
- Tests with `pnpm typecheck && pnpm ios`

### Code → QA
Any agent merges feature code:
- QA Engineer reviews PR
- Adds test cases to test suite
- Validates on staging environment
- Approves for production deploy

### QA → DevOps
QA Engineer approves:
- DevOps Engineer checks all deployment checklist items
- Stages on staging environment (automated)
- Runs E2E tests (automated)
- Deploys to production (automated via GitHub Actions)

---

## 📋 PR Template (All PRs Use This)

```markdown
## Description
[Brief summary of what changed and why]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation
- [ ] Infrastructure

## API Changes (if applicable)
```
POST /api/events/search
Request: { category: string, date: string }
Response: { events: Event[], total: number }
```

## Files Changed
- `apps/api/src/routes/events.ts`
- `apps/web/src/components/EventSearch.tsx`

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Tested on staging environment

## Accessibility & Design Tokens
- [ ] No hardcoded colors (using @comfytag/ui tokens)
- [ ] No hardcoded spacing (using token values)
- [ ] Focus rings visible on interactive elements
- [ ] Contrast ratio 4.5:1 minimum

## Deployment
- [ ] Docker image tested locally (if backend)
- [ ] No breaking changes without migration
- [ ] Rollback plan documented (if infrastructure change)

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] No console.logs in production code
- [ ] TypeScript strict mode compliant
- [ ] Tests pass: `pnpm test:ci`
- [ ] Build passes: `pnpm build`
```

---

## 🚨 What Blocks a Deployment

**Immediate STOP if any of these are true:**

1. **Build Fails** — `pnpm build` or Docker build returns error
2. **TypeScript Errors** — `pnpm typecheck` finds errors
3. **Tests Fail** — Any `pnpm test` fails
4. **Dockerfile Doesn't Build** — `./scripts/test-docker-builds.sh` fails
5. **E2E Tests Fail on Staging** — `pnpm playwright test` fails
6. **Health Checks Fail** — Liveness/readiness checks fail
7. **Console Logs Detected** — Pre-commit hook blocks
8. **Hardcoded Values Found** — Colors, keys, URLs hardcoded
9. **Accessibility Violations** — WCAG AA standards not met
10. **No Rollback Plan** — Infrastructure change without documented rollback

**Action:** Notify team in Slack, pause deployment, fix issue, restart process.

---

## 🔍 Monitoring & Alerts

Post-deployment, monitor for 5 minutes:

- Error rate > 1% → Rollback
- Response time p95 > 1 second → Investigate
- CPU/Memory usage > 80% → Scale up or optimize
- Database connection pool exhausted → Rollback
- Any critical error in logs → Investigate immediately

---

## 📞 Questions?

If an agent is unsure whether something violates these contracts, they should **ask in a PR comment** or create an issue. Never assume.

---

**Version History:**
- v1.0 (June 8, 2026): Initial contracts established

