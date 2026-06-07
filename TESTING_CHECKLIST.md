# ComfyTag — Testing Checklist

**Purpose:** Verify all features work correctly after deploying changes  
**Duration:** ~15-20 minutes per test run  
**When to run:** After every deployment and before releasing features

---

## 🎯 Quick Test (5 minutes)

**Only if you're in a hurry — does basic smoke tests**

```bash
# Test all endpoints respond
curl -s https://comfytag.com -o /dev/null -w "Web: HTTP %{http_code}\n"
curl -s https://partner.comfytag.com -o /dev/null -w "Partner: HTTP %{http_code}\n"
curl -s https://admin.comfytag.com -o /dev/null -w "Admin: HTTP %{http_code}\n"
curl -s https://api.comfytag.com/api/health -o /dev/null -w "API: HTTP %{http_code}\n"
```

All should return **HTTP 200**.

---

## ✅ Full Testing Suite

### Phase 1: Infrastructure & Deployment (2 min)

**On VPS:**
```bash
ssh -i ~/.ssh/comfytag_hetzner deploy@204.168.242.7
cd /home/deploy/comfytag
./scripts/post-deploy-test.sh
```

**Expected:**
- ✅ All 6 containers running
- ✅ All ports responding
- ✅ API health endpoint works
- ✅ MongoDB connected
- ✅ Redis responsive

---

### Phase 2: Attendee Web App (5 min)

**Test in browser: https://comfytag.com**

#### 2.1 — Home Page & Navigation
- [ ] Page loads without errors
- [ ] Navigation menu visible (Events, My Tickets, etc.)
- [ ] "Browse Events" button visible
- [ ] Attendee profile icon visible in top-right

#### 2.2 — Event Discovery
- [ ] Events list loads
- [ ] Event cards display correctly (title, date, price, category)
- [ ] Search works (type "concert", results filter)
- [ ] Filter by category works
- [ ] Pagination or scroll loading works

#### 2.3 — Authentication
- [ ] Sign up works:
  - Enter email, password
  - Verify email (check inbox/spam)
  - Create profile
  - Land on home page
- [ ] Log in works:
  - Use test account
  - Land on dashboard
- [ ] Log out works:
  - Click logout
  - Redirect to home page

#### 2.4 — Event Details
- [ ] Click event → details page loads
- [ ] Event info displays (title, date, location, price, description)
- [ ] Host info visible (organizer name, avatar)
- [ ] "Buy Ticket" button visible
- [ ] Event images load without 404 errors

#### 2.5 — Ticket Purchase (Critical)
- [ ] Click "Buy Ticket"
- [ ] Checkout page loads
- [ ] Paystack payment modal opens (test mode)
- [ ] **Pay with test card:** 4111 1111 1111 1111 | Any future date | Any CVV
- [ ] Payment succeeds
- [ ] Redirect to "My Tickets" page
- [ ] Purchased ticket visible with barcode/QR

#### 2.6 — My Tickets Page
- [ ] All purchased tickets visible
- [ ] Can click ticket to view details
- [ ] Barcode/QR code displays correctly
- [ ] Share ticket option works (if implemented)

#### 2.7 — Search & Recommendations
- [ ] Search bar works
- [ ] Trending/featured events display
- [ ] Related events show on event details page

**Common issues to watch for:**
- 404 on images → Cloudinary integration broken
- Checkout not opening → Paystack keys misconfigured
- "Cannot read property 'token'" → Auth token issue

---

### Phase 3: Partner Dashboard (5 min)

**Test in browser: https://partner.comfytag.com**

#### 3.1 — Login & Dashboard
- [ ] Page loads without errors
- [ ] Login form visible (email, password)
- [ ] Log in with organizer account
- [ ] Dashboard loads (Overview tab)
- [ ] Key metrics visible: Revenue, Events, Attendees

#### 3.2 — Overview Tab (Critical)
- [ ] Revenue chart loads
- [ ] Total events count displays
- [ ] Recent attendees list displays
- [ ] No "401 Unauthorized" errors
- [ ] No "Cannot read property" errors

**Common issues:**
- 401 errors → Token guard issue or missing token
- "Cannot read property 'data'" → API response format wrong
- Charts show "N/A" → Analytics query broken

#### 3.3 — Events Tab
- [ ] List of organizer's events displays
- [ ] Click event → event details page
- [ ] "Create Event" button visible
- [ ] Click create → event creation form loads

#### 3.4 — Create Event (Optional)
- [ ] Form loads with all fields
- [ ] Upload event banner (image upload works)
- [ ] Set title, date, price, capacity
- [ ] Create button submits
- [ ] Redirect to event details

#### 3.5 — Attendee Check-In (Critical)
- [ ] Click event → event details
- [ ] "Check-In" section visible
- [ ] Camera feed loads (if camera available)
- [ ] "Scan Camera" button works
- [ ] Can scan/recognize attendee faces (mock mode if no SDK)

**Common issues:**
- Camera not accessible → Browser permission issue or mock mode
- "Camera is not defined" → face SDK adapter broken
- Check-in modal doesn't open → UI component broken

#### 3.6 — Withdraw & Bank Settings
- [ ] Bank accounts section loads
- [ ] Add bank account form works
- [ ] Withdraw section shows available balance
- [ ] Withdrawal requests list displays

#### 3.7 — Settings & Profile
- [ ] Profile section loads
- [ ] Can edit profile info
- [ ] Can change password
- [ ] Settings save correctly

---

### Phase 4: Admin Dashboard (3 min)

**Test in browser: https://admin.comfytag.com**

#### 4.1 — Login & Dashboard
- [ ] Page loads without errors
- [ ] Admin login with admin credentials
- [ ] Dashboard loads (Overview tab)
- [ ] Platform metrics visible (total users, revenue, events)

#### 4.2 — Admin Features
- [ ] Users tab: user list loads
- [ ] KYC tab: pending KYC requests visible
- [ ] Payouts tab: payout history visible
- [ ] Analytics tab: charts load
- [ ] No 401 or permission errors

**Common issues:**
- Same as partner dashboard (token/auth related)
- Missing data → Database connectivity or query broken

---

### Phase 5: API Endpoints (3 min)

**Test via curl or Postman**

#### 5.1 — Health Check
```bash
curl -s https://api.comfytag.com/api/health | jq .
# Expected: {"status":"ok","timestamp":"2026-06-07T..."}
```

#### 5.2 — Public Endpoints (No Auth)
```bash
# Get events
curl -s https://api.comfytag.com/events | jq . | head -50

# Get categories
curl -s https://api.comfytag.com/categories | jq . | head -50
```

**Expected:** Returns JSON array of events/categories without 401 error

#### 5.3 — Authentication Endpoints
```bash
# Register new user
curl -X POST https://api.comfytag.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' | jq .

# Login
curl -X POST https://api.comfytag.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' | jq .
```

**Expected:** Returns token or success message

#### 5.4 — Protected Endpoints (Requires Auth)
```bash
# Get user profile (requires valid token)
curl -s https://api.comfytag.com/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

---

### Phase 6: Camera & Face Recognition (2 min)

**Only if you have access to camera**

#### 6.1 — Face Enrollment
- [ ] Partner dashboard → Check-In tab
- [ ] "Enable Face Recognition" option visible
- [ ] Camera modal opens
- [ ] Can see camera feed
- [ ] Face detection works (rectangle around face)
- [ ] Enrollment succeeds

#### 6.2 — Face Verification
- [ ] Show face to camera
- [ ] Face verification completes
- [ ] Attendee is checked in
- [ ] Check-in recorded in system

**Note:** If face SDK license not arrived, this will be in mock/test mode.

---

### Phase 7: Email & Notifications (1 min)

#### 7.1 — Email Sending
- [ ] Sign up with new email
- [ ] Check inbox for verification email
- [ ] Click verification link
- [ ] Account activated

#### 7.2 — Notifications
- [ ] Push notification icon visible (if implemented)
- [ ] SMS notifications for critical events (optional)

---

### Phase 8: Performance & Monitoring (2 min)

#### 8.1 — Load Times
```bash
# Measure home page load time (should be < 3 seconds)
time curl -s https://comfytag.com > /dev/null

# Measure API response time (should be < 500ms)
time curl -s https://api.comfytag.com/events > /dev/null
```

#### 8.2 — Server Resources (on VPS)
```bash
ssh deploy@YOUR_VPS_IP
docker stats --no-stream
# Check: Memory < 2GB, CPU not stuck

df -h
# Check: Disk not full
```

#### 8.3 — Browser Console
- [ ] Open DevTools (F12) → Console tab
- [ ] Refresh page
- [ ] No red errors visible
- [ ] No "Failed to fetch" messages

---

## 📋 Test Cases by Feature

### Feature: Ticket Purchase
**Path:** Attendee → Browse Event → Click Event → Buy Ticket → Pay → Confirm

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Browse events | Events list loads | ✓ |
| 2 | Click event | Event details page | ✓ |
| 3 | Click "Buy Ticket" | Checkout page | ✓ |
| 4 | Enter payment (test) | Paystack form | ✓ |
| 5 | Pay with card | Transaction succeeds | ✓ |
| 6 | Redirect | My Tickets page | ✓ |
| 7 | View ticket | QR/Barcode visible | ✓ |

### Feature: Event Check-In
**Path:** Partner → Event → Check-In → Scan Face → Confirm

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Navigate to event | Event details page | ✓ |
| 2 | Click Check-In | Check-in modal | ✓ |
| 3 | Enable camera | Camera feed | ✓ |
| 4 | Face in frame | Face detected | ✓ |
| 5 | Verification | Success message | ✓ |
| 6 | Check list | Attendee marked present | ✓ |

### Feature: Partner Analytics
**Path:** Partner → Overview → View Revenue → View Attendees

| Step | Action | Expected | Status |
|---|---|---|---|
| 1 | Load dashboard | Overview tab | ✓ |
| 2 | See metrics | Numbers display | ✓ |
| 3 | View chart | Revenue chart | ✓ |
| 4 | Events tab | Event list | ✓ |
| 5 | Click event | Event stats | ✓ |

---

## 🐛 Debugging Failed Tests

### If Web App Won't Load

1. Check browser console: `F12` → Console
2. Look for red errors (usually API-related)
3. Check VPS: `docker logs comfytag-web`
4. Check nginx: `docker logs comfytag-nginx`

### If Partner Dashboard Shows 401 Errors

1. Log out completely
2. Clear browser cookies: `Cmd/Ctrl + Shift + Delete`
3. Log back in
4. If still 401: Check VPS logs: `docker logs comfytag-api | grep -i "401\|token"`

### If Camera Doesn't Work

1. Check browser: Allow camera permission when prompted
2. Check VPS: `docker logs comfytag-partner | grep -i "camera\|face"`
3. If development: Should be in mock mode (doesn't require real camera)

### If API Returns "Cannot connect to MongoDB"

1. Check `.env` file on VPS: `MONGO` or `MONGODB_URI` correct
2. Check MongoDB Atlas: IP whitelist includes VPS IP
3. Restart API: `docker restart comfytag-api`

---

## ✅ Sign-Off

**When all phases pass:**

```
✅ Phase 1: Infrastructure & Deployment — PASS
✅ Phase 2: Attendee Web App — PASS
✅ Phase 3: Partner Dashboard — PASS
✅ Phase 4: Admin Dashboard — PASS
✅ Phase 5: API Endpoints — PASS
✅ Phase 6: Camera & Face Recognition — PASS
✅ Phase 7: Email & Notifications — PASS
✅ Phase 8: Performance & Monitoring — PASS

🎉 DEPLOYMENT VERIFIED — ALL SYSTEMS OPERATIONAL
```

**Safe to:**
- ✅ Announce release
- ✅ Tell users to upgrade
- ✅ Monitor production for issues
- ✅ Plan next sprint

---

## 🔗 Quick Reference

- Pre-deployment: `./scripts/pre-deploy-test.sh`
- Post-deployment: `./scripts/post-deploy-test.sh`
- API health: `curl https://api.comfytag.com/api/health`
- Container logs: `docker logs comfytag-api`
- All logs: `docker compose logs --tail 50`
