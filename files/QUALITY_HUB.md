# ComfyTag Quality Hub Skill

**Purpose:** Master coordinator for all feature development, ensuring agents work in sync without breaking production.

---

## How to Use

### For Project Managers / Users

```
/comfytag-quality-hub BUILD "Event search feature"

or

/comfytag-quality-hub BREAKDOWN "Implement face verification on mobile"

or

/comfytag-quality-hub REVIEW "This PR code"
```

### For AI Agents

```
/comfytag-quality-hub VALIDATE Backend changes against DEVELOPMENT_CONTRACTS.md

/comfytag-quality-hub ROUTE-NEXT After backend PR merged, frontend should start now
```

---

## The Quality Hub Process

### **PHASE 1: Intake & Breakdown**

**Input:** High-level feature request
- "Add ticket transfer feature"
- "Optimize API response time"
- "Fix login 401 errors"

**Quality Hub Output:**

```markdown
## Feature: Ticket Transfer

### Acceptance Criteria
- [ ] Users can initiate transfer
- [ ] Recipient receives notification
- [ ] Organizer sees transfer request
- [ ] Transfer is reversible within 24 hours

### Dependencies & Sequence
1. Backend Engineer: Design API contract (POST /tickets/transfer/request)
2. Frontend Engineer: Build UI components (TransferButton, TransferModal)
3. QA Engineer: Write test cases (happy path, edge cases, errors)
4. DevOps: Deploy with monitoring (no issues observed)

### Risks
- Database locking during concurrent transfers
- Notification delivery delays
- Race condition if both users click transfer simultaneously

### Estimated Timeline
- Backend: 4 hours (API + tests + migrations)
- Frontend: 3 hours (UI + form validation)
- QA: 2 hours (test design + execution)
- Total: 9 hours, ~1 day

### Principles Checklist
- [ ] Does this violate DEVELOPMENT_CONTRACTS.md?
- [ ] Is the API contract fully typed?
- [ ] Are tests comprehensive?
- [ ] Are edge cases handled?

### Who's Doing What
1. Backend Engineer: Owns API design
2. Frontend Engineer: Owns UI implementation
3. QA Engineer: Owns test strategy
4. All: Follow DEVELOPMENT_CONTRACTS.md
```

---

### **PHASE 2: Backend Design**

**Quality Hub Role:** Route to Backend Engineer

**Backend Engineer Output:**

```markdown
## API Contract

### Endpoint: POST /tickets/transfer/request

**Request:**
```json
{
  "ticketId": "string (UUID)",
  "recipientEmail": "string (email)",
  "expiresInDays": "number (1-30, default 7)"
}
```

**Response (200):**
```json
{
  "success": true,
  "transfer": {
    "id": "string",
    "ticketId": "string",
    "fromUserId": "string",
    "toEmail": "string",
    "status": "pending",
    "expiresAt": "ISO8601",
    "createdAt": "ISO8601"
  }
}
```

**Errors:**
- 400: Invalid email or ticket not found
- 401: Not authenticated
- 403: Not ticket owner
- 429: Too many requests

**Tests Pass:** ✅ pnpm test:api
**Code Review:** ✅ Approved by QA
**Ready for Frontend:** ✅ YES

**Next Step:** Frontend Engineer can now start building UI
```

**Quality Hub Validation:**
- ✅ Request/response types fully defined?
- ✅ Error cases handled?
- ✅ Tests comprehensive?
- ✅ Migrations included (if DB schema changed)?
- ✅ All tests pass locally?
- ✅ Ready for handoff to Frontend?

---

### **PHASE 3: Frontend Implementation**

**Quality Hub Role:** Unblock Frontend Engineer (after Backend merged)

**Frontend Engineer Output:**

```markdown
## UI Component: TransferTicket

**Components Created:**
- TransferButton.tsx (reusable, in /components)
- TransferModal.tsx (dialog box)
- TransferForm.tsx (form with validation)
- useTicketTransfer.ts (custom hook calling API)

**States Handled:**
- Loading: Shows spinner
- Success: Shows confirmation + receipt
- Error: Shows error message + retry
- Expired: Transfer window closed

**Accessibility:** ✅ WCAG AA (contrast, focus rings, labels)
**Design Tokens:** ✅ Uses @comfytag/ui (no hardcoded colors)
**Tests:** ✅ Component tests pass
**Ready for QA:** ✅ YES

**Next Step:** QA Engineer can now test thoroughly
```

**Quality Hub Validation:**
- ✅ Uses correct API contract?
- ✅ All states handled (loading, success, error)?
- ✅ Accessibility standards met?
- ✅ No hardcoded colors/spacing?
- ✅ Component tests pass?
- ✅ Ready for QA?

---

### **PHASE 4: QA Testing**

**Quality Hub Role:** Ensure comprehensive coverage

**QA Engineer Output:**

```markdown
## Test Coverage: Ticket Transfer

**Test Cases Written:**
1. Happy Path: User transfers ticket → Recipient gets email
2. Invalid Email: Non-existent email → Error message
3. Expired Transfer: After 7 days → Cannot accept
4. Multiple Transfers: Rapid successive requests → Handled gracefully
5. Concurrent Transfers: Two users transfer same ticket → One fails with error
6. Permission Check: Non-owner tries to transfer → 403 error
7. Mobile Responsiveness: Form works on small screens
8. Accessibility: All form fields properly labeled

**E2E Tests:** ✅ All pass on staging
**Manual Testing:** ✅ Verified on web + mobile
**Edge Cases:** ✅ Covered
**Performance:** ✅ Transfer < 1 second
**Security:** ✅ No data leakage, permissions enforced
**Ready for Production:** ✅ YES
```

**Quality Hub Validation:**
- ✅ All edge cases covered?
- ✅ E2E tests passing on staging?
- ✅ Manual verification done?
- ✅ Performance acceptable?
- ✅ Security reviewed?
- ✅ Ready for production?

---

### **PHASE 5: Merge & Deploy**

**Quality Hub Role:** Orchestrate final checks

**Pre-Merge Checklist:**
```
✅ All PRs approved (code review)
✅ All tests passing (unit + integration + E2E)
✅ Staging deployment successful
✅ No TypeScript errors
✅ No linting errors
✅ Dockerfiles tested locally
✅ No hardcoded secrets or credentials
✅ DEVELOPMENT_CONTRACTS.md validated
✅ Rollback plan documented
```

**Merge to main:**
```
git merge feature/ticket-transfer
git push origin main
```

**GitHub Actions Auto-Runs:**
```
1. Quality Gate ✅
2. Docker Build ✅
3. Deploy to Staging ✅
4. E2E Tests on Staging ✅
5. Deploy to Production ✅
6. Health Checks ✅
7. LIVE ✅
```

**Post-Deployment:**
- ✅ Monitor production for errors
- ✅ Verify feature works for users
- ✅ Check performance metrics
- ✅ Create retrospective if issues found

---

## Principles Enforcement

Quality Hub **BLOCKS** any task that violates:

### Code Quality Violations
```
❌ BLOCKED: Console.logs in production code
❌ BLOCKED: Hardcoded colors/spacing in components
❌ BLOCKED: TypeScript errors or `any` types
❌ BLOCKED: Missing tests or test coverage < 70%
❌ BLOCKED: Circular dependencies
❌ BLOCKED: Breaking changes without migration
```

### Dockerfile Violations
```
❌ BLOCKED: Wrong standalone paths
❌ BLOCKED: Missing health checks
❌ BLOCKED: Hardcoded secrets
❌ BLOCKED: Image doesn't build locally
```

### API Violations
```
❌ BLOCKED: Response not fully typed
❌ BLOCKED: No error handling defined
❌ BLOCKED: Breaking changes without consumer updates
❌ BLOCKED: Security vulnerability (SQL injection, XSS, etc)
```

### Deployment Violations
```
❌ BLOCKED: Deploying without staging validation
❌ BLOCKED: Deploying without health checks
❌ BLOCKED: Missing rollback plan
❌ BLOCKED: Tests not passing in CI/CD
```

---

## Communication Between Agents

### Backend → Frontend
```
Backend Engineer says:
"API contract finalized and merged to main. 
Path: POST /api/tickets/{id}/transfer
Request/Response types: apps/api/src/types/transfers.ts

Frontend Engineer can now start building TransferModal.
(Reference the types for form validation.)"

Quality Hub validates:
✅ Types exported correctly?
✅ Docs complete?
✅ Ready for handoff?
```

### Frontend → QA
```
Frontend Engineer says:
"TransferModal component merged to main.
Tests in: apps/web/src/components/TransferModal.test.ts

QA Engineer can now write E2E tests.
User flow: Click Transfer → Enter email → Click Send → Success message"

Quality Hub validates:
✅ All states testable?
✅ Clear user flow?
✅ Ready for QA?
```

### QA → DevOps
```
QA Engineer says:
"Feature fully tested on staging. All checks passed.
E2E tests: tests/e2e/ticket-transfer.spec.ts

DevOps can deploy to production.
Monitoring: Watch for new error types in logs."

Quality Hub validates:
✅ All quality gates passed?
✅ Staging verified?
✅ Ready for production?
```

---

## Task Templates

### Backend Engineer Task

```
/comfytag-backend-engineer BUILD

Feature: Ticket Transfer
Task: Design and build API endpoint

Input:
- Acceptance criteria (from breakdown)
- Required request/response schema

Output:
- POST /api/tickets/{id}/transfer endpoint
- Full request/response types (TypeScript)
- Comprehensive tests (happy path + errors)
- Database migrations (if needed)

Validation:
- [ ] Types fully typed (no `any`)
- [ ] Errors handled (4xx, 5xx)
- [ ] Tests pass locally
- [ ] Ready for Frontend Engineer
```

### Frontend Engineer Task

```
/comfytag-frontend-engineer BUILD

Feature: Ticket Transfer
Task: Build UI components

Input:
- API contract (from Backend PR)
- Acceptance criteria
- Design mockups (if available)

Output:
- TransferButton, TransferModal, TransferForm components
- Custom hook: useTicketTransfer()
- Form validation
- All states: loading, success, error, expired

Validation:
- [ ] Uses correct API contract
- [ ] All states handled
- [ ] WCAG AA accessible
- [ ] No hardcoded colors
- [ ] Tests pass locally
- [ ] Ready for QA
```

### QA Engineer Task

```
/comfytag-qa-engineer TEST

Feature: Ticket Transfer
Task: Write and execute tests

Input:
- Backend API contract
- Frontend components
- Acceptance criteria

Output:
- E2E test scenarios (user journeys)
- Edge case coverage
- Manual testing checklist
- Performance benchmarks

Validation:
- [ ] All paths tested (happy + error)
- [ ] Edge cases covered
- [ ] E2E tests pass on staging
- [ ] Performance < 1 second
- [ ] Security verified
- [ ] Ready for production
```

### DevOps Task

```
/comfytag-devops-infra DEPLOY

Feature: Ticket Transfer
Task: Deploy to production safely

Input:
- All quality gates passing
- Staging tests passing
- Feature ready for production

Output:
- Production deployment
- Health checks passing
- Monitoring configured
- Rollback plan executed (if needed)

Validation:
- [ ] All CI/CD checks passed
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Health checks passed
- [ ] Error rate normal
- [ ] Feature live for users
```

---

## Incident Response

If something breaks during deployment:

### Automatic Actions
```
1. Production health check fails
2. GitHub Actions stops pipeline
3. Creates GitHub Issue with error details
4. Posts Slack alert
5. Awaits manual intervention
```

### Manual Rollback
```
ssh deploy@204.168.242.7
./scripts/rollback-production.sh
# Follow prompts to restore previous version
```

### Post-Incident
```
1. Rollback successful?
2. Create post-mortem issue
3. Schedule team discussion 24 hours later
4. Document root cause
5. Implement fix to prevent recurrence
```

---

## Success Metrics

A feature is successfully deployed when:

- ✅ All code quality checks pass
- ✅ All tests pass (unit, integration, E2E)
- ✅ Staging deployment succeeds
- ✅ Staging E2E tests pass
- ✅ Production deployment succeeds
- ✅ Production health checks pass
- ✅ Error rate stays < 0.1%
- ✅ Response times stay < 500ms p95
- ✅ Users can use the feature
- ✅ No rollback needed

---

## FAQ

**Q: Can we skip staging and go straight to production?**  
A: No. Staging catches ~80% of issues before they hit production.

**Q: What if a backend change breaks the frontend?**  
A: The Quality Hub ensures Frontend Engineer is notified before starting, so they know the API contract. If it changes, tests will fail and block deployment.

**Q: What if an agent makes a mistake?**  
A: The DEVELOPMENT_CONTRACTS.md rules are enforced by Husky pre-commit hooks and GitHub Actions CI/CD. Bad code can't be committed or deployed.

**Q: How long does a full deployment take?**  
A: ~10 minutes (build + test + staging + production + health checks). Worth it for zero production issues.

**Q: Can we deploy on Friday?**  
A: Yes, if someone is on-call the whole weekend. Otherwise, deploy Monday-Thursday to minimize risk.

---

## Remember

**Stability > Speed**

A 10-minute deployment that never breaks production is better than a 2-minute deployment that causes 502s.

Every safety gate exists because we've hit that failure mode before.

Trust the process. 🚀

