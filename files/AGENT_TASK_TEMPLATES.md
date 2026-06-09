# Agent Task Templates

These templates ensure all agents follow the same process and stay coordinated.

Copy and paste these for each type of task.

---

## 📋 Backend Engineer Task Template

```markdown
# Backend Task: [Feature Name]

## Input (From Quality Hub)
- Feature: [Feature name and description]
- Acceptance Criteria: [List of requirements]
- API Contract: [What endpoints are needed?]
- Database Changes: [Any schema updates?]
- Timeline: [How long should this take?]

## Your Job

Build the backend API for this feature following DEVELOPMENT_CONTRACTS.md:

### Step 1: Design API Contract
- [ ] Define endpoint(s) (path, method, request/response)
- [ ] Export TypeScript types in `apps/api/src/types/[feature].ts`
- [ ] Document error cases (400, 401, 403, 500)
- [ ] Example request/response in PR description

### Step 2: Write Comprehensive Tests
- [ ] Happy path test (expected behavior)
- [ ] Error tests (each error case)
- [ ] Edge case tests (boundary values, concurrency)
- [ ] All tests pass: `pnpm test:api`

### Step 3: Implement Endpoint
- [ ] Create route file: `apps/api/src/routes/[feature].ts`
- [ ] Implement controller logic
- [ ] Use Zod/Joi for request validation
- [ ] Handle errors gracefully (no stack traces to client)
- [ ] Add comments only for non-obvious logic

### Step 4: Database (if needed)
- [ ] Create Mongoose schema (if new collection)
- [ ] Create migration script: `db/migrations/00X-[description].js`
- [ ] Test migration locally
- [ ] Document any index changes

### Step 5: Quality Checks
- [ ] `pnpm typecheck` passes (no `any` types)
- [ ] `pnpm lint` passes
- [ ] `pnpm test:api` passes (all tests green)
- [ ] No console.logs in production code
- [ ] No hardcoded secrets or URLs

### Step 6: Create PR
- [ ] Title: `feat(api): [Feature name]`
- [ ] Description includes:
  - [ ] Endpoint path, method, request/response examples
  - [ ] Error cases documented
  - [ ] Migration steps (if DB changed)
  - [ ] Tests added

## Output (For Frontend Engineer)

When PR is merged, post this in Discord/Slack:

```
✅ Backend API ready for [Feature Name]

Endpoint: POST /api/[resource]/[action]
Request: { field1: string, field2: number }
Response: { success: boolean, data: {...} }
Error cases: 400 (invalid input), 401 (auth), 403 (permission), 500 (server error)

Types: apps/api/src/types/[feature].ts
Tests: All passing ✅

Frontend Engineer can now start building UI!
```

## Validation Checklist

Before creating PR, ensure:
- [ ] All types are fully typed (no `any`)
- [ ] All errors are handled
- [ ] All tests pass
- [ ] Code follows DEVELOPMENT_CONTRACTS.md
- [ ] Ready for Frontend Engineer to consume
```

---

## 🎨 Frontend Engineer Task Template

```markdown
# Frontend Task: [Feature Name]

## Input (From Backend Engineer)
- API Contract: [Endpoint path, request/response types]
- UI Mockups: [Design specs, if available]
- Acceptance Criteria: [User requirements]
- States to Handle: [Loading, success, error, edge cases]

## Your Job

Build the UI component(s) for this feature following DEVELOPMENT_CONTRACTS.md:

### Step 1: Understand API Contract
- [ ] Read API types from `apps/api/src/types/[feature].ts`
- [ ] Understand request/response schema
- [ ] Know error cases (400, 401, 403, 500)
- [ ] Create custom hook to call API: `src/hooks/use[Feature].ts`

### Step 2: Design Components
- [ ] What pages/components needed? (modal, form, card, etc.)
- [ ] All states: loading (spinner), success (confirmation), error (message)
- [ ] Form validation (required fields, format checks)
- [ ] Loading states (skeleton, spinner)

### Step 3: Build Components
- [ ] Extract reusable components: `src/components/[feature]/[Component].tsx`
- [ ] **Extract before reuse** — If you use a component twice, extract it first
- [ ] Use @comfytag/ui tokens (Button, Input, Badge, Modal from tokens, NOT hardcoded colors)
- [ ] Type all props as interfaces (no `any`)
- [ ] Handle all states (loading, success, error, edge cases)

### Step 4: Accessibility
- [ ] WCAG AA minimum (contrast ratios 4.5:1 minimum)
- [ ] All form fields have `<label>` (not placeholder only)
- [ ] Focus rings visible on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader friendly (use semantic HTML)

### Step 5: Write Tests
- [ ] Component renders correctly
- [ ] Form validation works (submit valid/invalid data)
- [ ] API calls work (mock the API)
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] All tests pass: `pnpm test`

### Step 6: Quality Checks
- [ ] `pnpm typecheck` passes (no `any` types)
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build --filter=web` passes
- [ ] No hardcoded colors/spacing (use @comfytag/ui tokens)
- [ ] No console.logs

### Step 7: Create PR
- [ ] Title: `feat(web): Add [Feature Name] UI`
- [ ] Description includes:
  - [ ] Component files created
  - [ ] User flows implemented
  - [ ] Accessibility verified
  - [ ] Tests added
  - [ ] Design tokens used (no hardcoded colors)

## Output (For QA Engineer)

When PR is merged, post this:

```
✅ Frontend UI complete for [Feature Name]

Components:
  - [Component].tsx (main UI)
  - use[Feature].ts (API hook)

User flow:
  1. User clicks [action]
  2. Form appears with validation
  3. User fills form and submits
  4. API call made
  5. Success/error message shown

States handled:
  - Loading (spinner)
  - Success (confirmation)
  - Error (message with retry)

Accessibility: ✅ WCAG AA compliant
Tests: ✅ All passing

QA Engineer can now write end-to-end tests!
```

## Validation Checklist

Before creating PR, ensure:
- [ ] API contract understood correctly
- [ ] All states handled (loading, success, error)
- [ ] No hardcoded colors/spacing
- [ ] All props fully typed
- [ ] WCAG AA accessibility met
- [ ] All tests passing
- [ ] Code follows DEVELOPMENT_CONTRACTS.md
- [ ] Ready for QA Engineer
```

---

## 🧪 QA Engineer Task Template

```markdown
# QA Task: [Feature Name]

## Input (From Frontend Engineer)
- Feature: [Feature description and user flows]
- Components: [UI files to test]
- API Contract: [Endpoints and error cases]
- Acceptance Criteria: [What success looks like]

## Your Job

Write comprehensive tests for this feature:

### Step 1: Happy Path Test
- [ ] User completes the main flow successfully
- [ ] All data saves correctly
- [ ] Success confirmation displays
- [ ] Test passes: `pnpm playwright test`

### Step 2: Error Case Tests
- [ ] API returns 400 (invalid input) → Error message shows
- [ ] API returns 401 (unauthorized) → Redirect to login
- [ ] API returns 403 (forbidden) → "You don't have permission" message
- [ ] API returns 500 (server error) → "Something went wrong" message
- [ ] Network fails → "Network error" message with retry button

### Step 3: Edge Case Tests
- [ ] Empty/null values handled
- [ ] Very long input strings handled
- [ ] Special characters in input handled
- [ ] Rapid duplicate submissions handled (no double-submit)
- [ ] User navigates away mid-form → State preserved or cleared appropriately

### Step 4: State Tests
- [ ] Loading state displays spinner/skeleton
- [ ] Error state shows error message + retry button
- [ ] Success state shows confirmation message
- [ ] Form validation prevents invalid submission

### Step 5: Accessibility Tests
- [ ] All form fields labeled (not just placeholder)
- [ ] Contrast ratios 4.5:1 minimum (use Lighthouse audit)
- [ ] Keyboard navigation works (Tab through form, Enter to submit)
- [ ] Focus visible on all interactive elements
- [ ] Screen reader can read labels (use axe accessibility tool)

### Step 6: Mobile/Responsive Tests
- [ ] Component looks good on mobile (< 480px)
- [ ] Component looks good on tablet (480px - 1024px)
- [ ] Component looks good on desktop (> 1024px)
- [ ] Touch targets are 44px+ (for mobile)

### Step 7: Performance Tests
- [ ] Form submission < 1 second
- [ ] No console errors
- [ ] No memory leaks (check DevTools)

### Step 8: Write Test Code
- [ ] Create: `tests/e2e/[feature].spec.ts`
- [ ] All scenarios from steps 1-7 as Playwright tests
- [ ] All tests pass: `pnpm playwright test`

### Step 9: Manual Verification
- [ ] Test on staging environment
- [ ] Test on multiple browsers (Chrome, Firefox, Safari if possible)
- [ ] Test on mobile device (or mobile emulation)
- [ ] Verify with actual API (not just mocks)

### Step 10: Create Test Report
- [ ] Test file: `tests/e2e/[feature].spec.ts`
- [ ] Coverage: Happy path ✅ Error cases ✅ Edge cases ✅
- [ ] Accessibility: ✅ WCAG AA compliant
- [ ] Performance: ✅ All fast
- [ ] Manual testing: ✅ Verified on staging

## Output (For DevOps/Deployment)

When all tests pass:

```
✅ [Feature Name] fully tested and ready for production

Test coverage:
  - Happy path: ✅
  - Error cases: ✅ (400, 401, 403, 500, network)
  - Edge cases: ✅ (empty values, long input, special chars, duplicates)
  - Accessibility: ✅ WCAG AA
  - Mobile/Responsive: ✅
  - Performance: ✅ < 1 second

Staging verification: ✅ All systems go

Ready for production deployment!
```

## Validation Checklist

Before marking feature as done, ensure:
- [ ] All happy path tests pass
- [ ] All error case tests pass
- [ ] All edge case tests pass
- [ ] Accessibility standards met (WCAG AA)
- [ ] Mobile/responsive tested
- [ ] Performance acceptable
- [ ] Manual testing on staging complete
- [ ] No issues found
- [ ] Ready for production
```

---

## 🚀 DevOps/Infrastructure Task Template

```markdown
# DevOps Task: Deploy [Feature Name] to Production

## Input (From QA Engineer)
- Feature: [Feature name and description]
- Quality Status: [All tests passing, staging verified, ready for prod]
- Monitoring Plan: [What to watch for]
- Rollback Plan: [How to undo if needed]

## Your Job

Deploy feature safely to production:

### Pre-Deployment Checklist
- [ ] All GitHub Actions checks passing
- [ ] Staging deployment successful
- [ ] Staging E2E tests passing
- [ ] All health checks passing
- [ ] Error rate < 0.1%
- [ ] Response times < 500ms p95
- [ ] Rollback plan documented

### Deployment Steps
- [ ] Push approval (or wait for GitHub Actions)
- [ ] Docker images built successfully
- [ ] Production deployment triggered
- [ ] Containers starting...
- [ ] Health checks running...

### Post-Deployment Validation
- [ ] All containers healthy (no restarts)
- [ ] Error rate normal (< 0.1%)
- [ ] Response times normal (< 500ms p95)
- [ ] No new error patterns in logs
- [ ] Feature accessible to users
- [ ] All critical flows work (login, search, checkout, etc.)

### Monitoring (5 minutes)
- [ ] Watch error rate (should stay < 0.1%)
- [ ] Watch response times (should stay < 500ms p95)
- [ ] Watch resource usage (CPU, memory, disk)
- [ ] Watch for any critical errors in logs

### Rollback Decision
```
Is production healthy?
├─ YES: ✅ Feature live! Monitor for 1 hour
└─ NO: 🚨 ROLLBACK immediately
   1. Run: ./scripts/rollback-production.sh
   2. Verify health checks pass
   3. Notify team
   4. Schedule post-mortem
```

### Success Criteria
- [ ] Deployment completed without errors
- [ ] All health checks passing
- [ ] Error rate < 0.1%
- [ ] Response times < 500ms p95
- [ ] Users can access feature
- [ ] No rollback needed
- [ ] Feature live in production ✅

## Post-Deployment
- [ ] Monitor for 1 hour (watch dashboards, logs, errors)
- [ ] Verify users can use feature
- [ ] Check for any unexpected behavior
- [ ] If all good: ✅ Mark deployment as successful
- [ ] If issues: 🚨 Rollback and investigate

## Validation Checklist

Before marking deployment complete:
- [ ] All quality gates passed
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Error rate normal
- [ ] Feature accessible to users
- [ ] No rollback needed
- [ ] Monitoring configured
- [ ] Team notified
```

---

## How Agents Use These

### Backend Engineer gets task:
```
Copy this template:
  👉 Backend Engineer Task Template

Fill in [Feature Name], [Description]

Do all the steps

Create PR with all checkboxes checked

Post output for Frontend Engineer
```

### Frontend Engineer gets task:
```
Copy this template:
  👉 Frontend Engineer Task Template

Get API Contract from Backend PR

Fill in [Feature Name], [Component Names]

Do all the steps

Create PR with all checkboxes checked

Post output for QA Engineer
```

### QA Engineer gets task:
```
Copy this template:
  👉 QA Engineer Task Template

Get Feature details from Frontend PR

Fill in [Feature Name], [Test Scenarios]

Write all tests

Run on staging environment

Create test report

Post output for DevOps
```

### DevOps gets task:
```
Copy this template:
  👉 DevOps/Infrastructure Task Template

Get status from QA Engineer

Follow deployment checklist

Deploy to production

Monitor for 5 minutes

Verify success or rollback
```

---

## Tips for Success

1. **Copy the template** for your role
2. **Fill in the blanks** with actual feature details
3. **Check each checkbox** as you complete it
4. **Don't skip steps** — each exists for a reason
5. **Communicate output** — post the "Output" section when done
6. **Follow DEVELOPMENT_CONTRACTS.md** — it's your guardrails
7. **Ask for clarification** if something is unclear

---

## Remember

**Each role has a specific job.** Do your job well, and the whole team succeeds.

If something feels wrong or violates DEVELOPMENT_CONTRACTS.md, **STOP and ask** instead of proceeding.

Quality > Speed. Always.

