# Real-Time Notifications Testing Guide

## Quick Manual Testing (5-10 minutes)

### Prerequisites
- All apps running: `pnpm dev` (starts web, partner, admin, api on ports 3000, 3001, 3002, 4002)
- Redis running for BullMQ: `docker-compose up -d redis`
- Logged-in accounts on both web and partner apps
- Two browser windows side-by-side (partner + web)

### Test 1: Instant Notification on Ticket Purchase

**Steps:**
1. Open Partner App in Browser 1 → `/overview`
2. Open Web App in Browser 2 → `/`
3. Open DevTools Network tab in both browsers (F12)
4. Filter by "WS" to see WebSocket messages
5. In Partner App, look for notification bell icon in navbar
6. In Web App, browse events and click "Buy Ticket"
7. Complete the checkout
8. **Expected:** Badge appears/increments immediately in Web App (no page refresh)
9. In Partner App, you should also see the notification badge (if you're the organizer)

**Verify:**
- ✅ Badge updates instantly (within 1-2 seconds)
- ✅ No page refresh needed
- ✅ Both tabs show same count
- ✅ WebSocket messages visible in DevTools

---

### Test 2: Real-Time Badge Sync Across Tabs

**Steps:**
1. Open Web App in two separate browser tabs
2. In Tab 1, go to `/notifications`
3. In Tab 2, stay on `/`
4. In Tab 1, click "Mark all as read"
5. Watch Tab 2's badge in real-time

**Expected:**
- ✅ Tab 2 badge decrements immediately (Socket.io event received)
- ✅ No page refresh needed in Tab 2
- ✅ Both tabs stay synchronized

**What You'll See in DevTools:**
- Tab 1 sends: `PUT /notifications/read-all` (REST API)
- Tab 2 receives: WebSocket `notification:readAll` event
- Badge in Tab 2 updates instantly

---

### Test 3: KYC Notification (Admin Approval)

**Prerequisites:**
- Admin account with access to `/admin/users`
- Organizer account that needs KYC verification

**Steps:**
1. Open Partner App (as organizer) → `/settings`
2. Open another tab with Admin Dashboard → `/admin/users`
3. Find the organizer user, click "Approve KYC"
4. Watch Partner App for notification badge update

**Expected:**
- ✅ Badge appears in Partner App navbar
- ✅ Updates within 1-2 seconds (real-time)
- ✅ Click notification to see "KYC Approved" message

---

### Test 4: Network Disconnect & Reconnect

**Steps:**
1. Open Web App
2. Open DevTools Network tab
3. Click the network throttling dropdown (usually shows "No throttling")
4. Select "Offline" to simulate network disconnection
5. Keep app open for 3 seconds
6. Select "Online" to restore network
7. Try to perform an action (e.g., navigate to a page)

**Expected:**
- ✅ Socket.io reconnects automatically (check DevTools WS tab)
- ✅ App continues to work after reconnection
- ✅ New notifications still arrive after reconnection
- ✅ Console shows: "[Socket.io] Disconnected: reason" then "[Socket.io] Connected"

---

### Test 5: Event Reminder Notification (Scheduled)

**Setup:**
- Create an event with date/time 10 minutes from now (for quick testing)
- Purchase a ticket for that event

**Expected Behavior:**
- 48h reminder email queued (would send 48h before event)
- 4h reminder email queued (would send 4h before event)
- When the job runs, notification is created in database
- If user is online, they see it in real-time; if offline, they see it on next app load

**To Verify Job Runs:**
```bash
# Check BullMQ dashboard
curl http://localhost:3000/api/queue-status

# Or check logs for:
# [Email Queue] Job {jobId} processing
# [Email Queue] Job {jobId} completed
# [Job Processor] Notification created: event_reminder
```

---

### Test 6: Transfer Ticket & Real-Time Notification

**Steps:**
1. Login as Attendee A in Browser 1
2. Have Attendee B logged in somewhere (or create test account)
3. Go to `/tickets` and find a ticket
4. Click "Transfer" → Enter Attendee B's email → "Send"
5. Login as Attendee B in Browser 2
6. Watch for notification badge to appear

**Expected:**
- ✅ Attendee B gets real-time notification: "transfer_received"
- ✅ Badge appears instantly
- ✅ Message: "{Name} sent you a ticket"
- ✅ Attendee A gets notification when Attendee B accepts

---

### Test 7: Face Enrollment Confirmation

**Steps:**
1. Go to `/app/enroll-face` (mobile or web)
2. Complete face enrollment (or use mock if not on mobile)
3. Should see success message

**Expected:**
- ✅ Real-time notification: "Your face is ready ✓"
- ✅ Badge updates immediately
- ✅ Message: "Skip the queue at events — your face is your ticket now"

---

## DevTools Debugging

### WebSocket Messages

Open DevTools → Network → Filter by "WS" → Click on the socket.io connection

**Outgoing Messages (Client → Server):**
```json
{
  "type": 2,
  "nsp": "/",
  "data": ["notification:read", {"notificationId": "123"}]
}
```

**Incoming Messages (Server → Client):**
```json
{
  "type": 4,
  "nsp": "/",
  "data": ["notification:received", {
    "_id": "123",
    "type": "ticket_confirmed",
    "title": "Ticket confirmed ✓",
    "message": "Your ticket is ready",
    "read": false,
    "createdAt": "2026-06-07T12:00:00Z"
  }]
}
```

### Console Logs

Enable all console messages:
```javascript
// In DevTools Console:
localStorage.setItem('debug', 'socket.io-client:socket');
// Reload page to see Socket.io connection logs
```

**Expected logs:**
```
[Socket.io] Connected: abc123def456
[Socket.io] Server confirmed connection: {...}
[Socket.io] New notification received: Ticket confirmed ✓
[Socket.io] Unread count updated: 5
[Socket.io] Notification marked as read: xyz789
```

---

## E2E Testing (Playwright)

Run the full test suite:
```bash
pnpm test tests/e2e/07-realtime-notifications.spec.ts
```

**What It Tests:**
- Socket.io connection on app load
- Notification badge appears
- Real-time badge updates
- Mark as read updates badge
- Persistence across navigation
- Socket.io reconnection
- Multiple tabs stay in sync
- REST API fallback
- Cross-app sync (partner + web)

---

## Troubleshooting

### Badge Not Updating

**Check:**
1. Is Socket.io connected? (DevTools Network → WS)
2. Are you logged in? (Check session cookie)
3. Does notification exist in database?
   ```bash
   db.notifications.find({user_id: "your_user_id"}).limit(1)
   ```
4. Check browser console for errors

**Fix:**
- Reload page (may reconnect Socket.io)
- Check API server is running: `curl http://localhost:4002/api/health`
- Check Redis is running: `docker-compose ps`

---

### Socket.io Not Connecting

**Check:**
1. Is the API running on port 4002?
2. Are CORS origins configured correctly?
3. Is `NEXT_PUBLIC_API_URL` set in `.env`?

**Fix:**
```bash
# Restart API
cd apps/api && pnpm dev

# Or check logs for:
# [Socket.io] Server initialized
# ✓ Socket.io server running alongside Express
```

---

### Event Reminders Not Firing

**Check:**
1. Is Redis running? `docker-compose ps redis`
2. Are BullMQ jobs enqueued?
   ```bash
   # Check logs for:
   # [Email Queue] Job {id} waiting
   # [Email Queue] Job {id} processing
   ```
3. Is event date in the future?
4. Check job queue status: `curl http://localhost:4002/api/queue-status`

**Fix:**
- Restart API: `pnpm dev`
- Check Redis connection in emailQueue.js
- Verify MongoDB has the notification created

---

## Performance Notes

**Expected Performance:**
- Socket.io connection: < 1 second
- Notification delivery: < 200ms (same datacenter)
- Badge update: < 500ms (including React render)
- Reconnection after disconnect: < 5 seconds

**Under Load (100+ concurrent users):**
- Socket.io handles well with proper Redis adapter
- Consider using Redis adapter for multi-server setup
- Monitor CPU/memory: BullMQ uses ~50MB for 1000s of jobs

---

## Production Checklist

- [ ] Socket.io server is production-hardened (secure handshake, etc.)
- [ ] Redis is running and connected
- [ ] Notification preferences are respected (email opt-out)
- [ ] Error boundaries are in place (Socket.io failure doesn't break UI)
- [ ] Monitoring is set up (Socket.io connection count, emission success rate)
- [ ] Load testing passed (100+ concurrent connections)
- [ ] SSL/TLS certificates configured
- [ ] CORS origins are whitelisted

---

## References

- Socket.io Docs: https://socket.io/docs/v4/
- BullMQ Docs: https://docs.bullmq.io/
- Real-Time Notifications Architecture: `docs/REALTIME_NOTIFICATIONS_SOCKET_IO.md`
