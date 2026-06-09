# ComfyTag Agent Onboarding Guide

Welcome! You're part of the AI workforce building ComfyTag.

This guide teaches you how to work safely and efficiently without breaking production.

**Read time:** 5 minutes

---

## 🎯 What You Need to Know

### 1. We Have a Live Production App
```
Right now, LIVE USERS are using:
- Web app (attendee platform)
- Partner dashboard (organizer tools)
- Admin dashboard (admin controls)
- API backend (all endpoints)
```

**This means:** We can't break things. Every change gets tested before going live.

### 2. You're Part of a Coordinated Team
```
Backend Engineer → Frontend Engineer → QA Engineer → DevOps → LIVE
```

You do your part. Hand off cleanly to the next person. They can only start after you finish.

### 3. We Have Strict Rules
```
Read these (takes 5 min each):
- DEVELOPMENT_CONTRACTS.md (code quality rules)
- DEPLOYMENT_PRINCIPLES.md (deployment safety)
- QUALITY_HUB.md (how features flow through system)
```

**These rules exist because:** We've hit every failure mode listed. Follow them.

---

## 🔄 The Workflow

### You Get a Task

```
/comfytag-quality-hub BUILD "Add event filters"

Quality Hub responds with:
├─ Feature breakdown
├─ Your specific responsibilities
├─ Dependencies (what you need from others)
├─ Timeline estimate
└─ Clear "done" criteria
```

### You Do Your Job

Example: **You're the Backend Engineer**

```
1. Read the task breakdown
2. Open AGENT_TASK_TEMPLATES.md
3. Copy the "Backend Engineer Task Template"
4. Fill in [Feature Name], [Endpoints], [Database Changes]
5. Do each step (design API, write tests, implement, quality checks)
6. Create PR with all checkboxes ✅
7. Post the "Output" section when done
8. Next agent (Frontend Engineer) can now start
```

### Hand Off Cleanly

```
You post in Discord/Slack:
"✅ Backend API ready for [Feature Name]
Endpoint: POST /api/[resource]/[action]
Types: apps/api/src/types/[feature].ts
Tests: All passing ✅
Frontend Engineer can now start!"
```

### It Goes Live Automatically

```
You create PR and merge to main
    ↓
GitHub Actions runs:
  ✅ TypeScript check
  ✅ Lint check
  ✅ Build check
  ✅ Docker build check
  ✅ Deploy to staging
  ✅ E2E tests on staging
  ✅ Deploy to production
  ✅ Health checks
    ↓
Feature is LIVE 🎉
```

---

## 📋 Your Role-Specific Workflow

### Backend Engineer

```
1. Design API endpoint (path, request, response, errors)
2. Export types in apps/api/src/types/[feature].ts
3. Write comprehensive tests
4. Implement endpoint
5. Quality checks pass (typecheck, lint, build, tests)
6. Create PR with documentation
7. Frontend Engineer now has everything they need
```

**Template:** `AGENT_TASK_TEMPLATES.md` → Backend Engineer Task Template

---

### Frontend Engineer

```
1. Get API contract from Backend PR
2. Build UI components (form, modal, card, etc.)
3. Create custom hook to call API
4. Handle all states (loading, success, error)
5. WCAG AA accessibility verified
6. Component tests pass
7. Create PR with component documentation
8. QA Engineer now has everything they need
```

**Template:** `AGENT_TASK_TEMPLATES.md` → Frontend Engineer Task Template

---

### QA Engineer

```
1. Get feature details (UI + API contract)
2. Write E2E test scenarios (happy path + errors + edge cases)
3. Test on staging environment
4. Verify accessibility (WCAG AA)
5. Verify mobile/responsive
6. All tests pass
7. Create test documentation
8. DevOps can now deploy to production
```

**Template:** `AGENT_TASK_TEMPLATES.md` → QA Engineer Task Template

---

### DevOps Engineer

```
1. Get QA verification (all tests passing)
2. All quality gates passing in GitHub Actions
3. Staging deployment successful
4. Production deployment triggered (automated)
5. Health checks pass (automated)
6. Monitor for 5 minutes
7. If issues: rollback (automated)
8. Feature LIVE ✅
```

**Template:** `AGENT_TASK_TEMPLATES.md` → DevOps/Infrastructure Task Template

---

## ⚠️ Rules You MUST Follow

### Code Quality
```
❌ DON'T:
  - Use `any` in TypeScript
  - Hardcode colors/spacing (use @comfytag/ui tokens)
  - Leave console.logs in production code
  - Duplicate code (extract before reuse)
  - Skip tests or test coverage

✅ DO:
  - Type everything strictly
  - Use design tokens
  - Run linting + typecheck locally before committing
  - Extract reusable components
  - Write comprehensive tests
```

**Reference:** `DEVELOPMENT_CONTRACTS.md`

---

### Deployment Safety
```
❌ DON'T:
  - Deploy directly to production
  - Skip staging environment
  - Ignore health checks
  - Push code that breaks tests
  - Change deployment procedures without team awareness

✅ DO:
  - Always test on staging first
  - Wait for health checks to pass
  - Run E2E tests before shipping
  - Ensure all quality gates pass
  - Follow deployment checklist
```

**Reference:** `DEPLOYMENT_PRINCIPLES.md`

---

### Coordination
```
❌ DON'T:
  - Start work before previous agent finishes
  - Assume requirements are obvious
  - Skip handoff communication
  - Make breaking changes without notifying downstream agents

✅ DO:
  - Wait for dependency to be done
  - Ask for clarification if unclear
  - Post clear "done" message when you finish
  - Notify next agent in chain
```

**Reference:** `QUALITY_HUB.md`

---

## 🚨 If Something Goes Wrong

### My code has TypeScript errors
```
Error: "Type 'string | undefined' is not assignable to type 'string'"

Fix:
1. Read the error message
2. Fix the type (add `| undefined` to the type definition)
3. Run: pnpm typecheck
4. Until it passes, you can't commit
```

### My code fails linting
```
Error: "Unexpected console.log"

Fix:
1. Remove console.log
2. Run: pnpm lint
3. Until it passes, you can't commit
```

### My tests fail
```
Error: "FAIL apps/web/src/components/Button.test.ts"

Fix:
1. Read the test failure
2. Fix the component or test
3. Run: pnpm test
4. Until it passes, you can't commit
```

### Docker build fails
```
Error: "RUN pnpm build — command not found"

Fix:
1. Check the Dockerfile
2. Verify the image has dependencies installed
3. Run locally: ./scripts/test-docker-builds.sh
4. Until it passes, the pipeline will fail
```

### GitHub Actions pipeline fails
```
GitHub shows: ❌ Quality Gate failed

Check:
1. Go to GitHub → Actions → Latest run
2. Click the failed job
3. Read the error message
4. Fix locally (pnpm typecheck, pnpm lint, pnpm build)
5. Commit and push (workflow auto-retries)
```

---

## ✅ Checklist Before You Start

Before doing ANY work, make sure you have:

```
Knowledge:
  ☐ Read DEVELOPMENT_CONTRACTS.md (your rules)
  ☐ Read DEPLOYMENT_PRINCIPLES.md (safety procedures)
  ☐ Read QUALITY_HUB.md (how features flow)
  ☐ Read AGENT_TASK_TEMPLATES.md (your task template)

Setup:
  ☐ Can run: pnpm install
  ☐ Can run: pnpm typecheck
  ☐ Can run: pnpm lint
  ☐ Can run: pnpm build
  ☐ Can run: pnpm test
  ☐ Have correct Node version (20 LTS)
  ☐ Have correct pnpm version (11.0.9)

Repository:
  ☐ Clone: https://github.com/comfytag/comfytag.git
  ☐ Branch: main
  ☐ Can commit with semantic messages (feat:, fix:, docs:, etc.)
```

---

## 💬 How to Communicate

### When you need a task
```
Post in Discord/Slack:
"I'm ready for a new task. What should I build?"

Quality Hub responds with:
- Feature breakdown
- Your specific job
- Dependencies
- Timeline
```

### When you're done with your part
```
Post in Discord/Slack:
"✅ [Part] complete for [Feature Name]

[Copy your "Output" from task template]

@[Next Agent] can now start!"

Example:
"✅ Backend API complete for Event Filters

Endpoint: GET /api/events?category=&date=
Types: apps/api/src/types/events.ts
Tests: All passing ✅

@Frontend Engineer can now start!"
```

### When something's broken
```
Post in Discord/Slack (tag @everyone):
"🚨 PRODUCTION ISSUE: [What broke]

GitHub Actions log: [link to failed workflow]
Error: [what the error says]
Impact: [how many users affected]

Starting investigation..."
```

### When you need help
```
Post in Discord/Slack:
"Question: [Your question]

Context: [What you're doing]
Error: [What's not working]

Who can help?"
```

---

## 📚 Key Documents (Bookmark These)

| Document | When to Read | Time |
|----------|--------------|------|
| DEVELOPMENT_CONTRACTS.md | Before writing code | 5 min |
| DEPLOYMENT_PRINCIPLES.md | Before deploying | 5 min |
| QUALITY_HUB.md | When starting a feature | 10 min |
| AGENT_TASK_TEMPLATES.md | For your specific role | 5 min |
| PROJECT_CURRENT_STATUS.md | To see what's in progress | 3 min |
| .github/DEPLOYMENT_SETUP.md | If GitHub Actions fails | 10 min |

---

## 🎯 Success Criteria

You're doing great when:

```
✅ Code passes all quality checks (typecheck, lint, build)
✅ Tests are comprehensive and passing
✅ Features deploy cleanly to production
✅ No rollbacks needed
✅ Production stays healthy (< 0.1% error rate)
✅ Communication is clear (handoffs are smooth)
✅ Users can use the features
```

You're struggling when:

```
❌ Code fails typecheck or lint
❌ Tests fail locally
❌ Docker builds fail
❌ GitHub Actions pipeline fails
❌ Staging deployment fails
❌ E2E tests fail on staging
❌ Production health checks fail
```

If you're struggling, **STOP and ask for help** rather than pushing forward with broken code.

---

## 🚀 You're Ready!

You now understand:
- ✅ How ComfyTag works
- ✅ What rules to follow
- ✅ How features flow through the system
- ✅ What your specific job is
- ✅ How to communicate with the team
- ✅ What to do if something breaks

**Next steps:**
1. Wait for your first task from Quality Hub
2. Copy your task template
3. Follow each step
4. Communicate when done
5. Hand off to next agent
6. Watch it deploy live ✅

---

## Questions?

**For code quality questions:**  
→ Read `DEVELOPMENT_CONTRACTS.md` (section for your role)

**For deployment questions:**  
→ Read `DEPLOYMENT_PRINCIPLES.md`

**For feature workflow questions:**  
→ Read `QUALITY_HUB.md`

**For your specific task:**  
→ Read `AGENT_TASK_TEMPLATES.md` (your role section)

**For current status:**  
→ Read `PROJECT_CURRENT_STATUS.md`

---

**Welcome to the team. Let's ship great features safely. 🚀**

