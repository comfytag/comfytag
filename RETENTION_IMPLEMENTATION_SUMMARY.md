# Phase 4 Retention Crons Implementation — COMPLETE

**Date:** June 7, 2026  
**Component:** Email retention flows with daily cron jobs + suppression tagging  
**Status:** ✅ Ready for integration

---

## DELIVERABLES

### 3 Cron Job Files (apps/api/jobs/)

| File | Schedule | Purpose | Features |
|------|----------|---------|----------|
| `faceEnrollmentNudge.js` | Daily 9:00 AM WAT | Send face enrollment reminders on days 7 & 14 | Re-check conditions at send time, prevent double-send |
| `attendeeWinback.js` | Daily 10:00 AM WAT | Win-back emails for inactive attendees (days 90, 105, 120) | Click tracking, sunset suppression logic |
| `organizerWinback.js` | Daily 11:00 AM WAT | Win-back emails for inactive organizers (days 60, 75, 90) | Click tracking, sunset suppression logic |

**Key Features (All Three):**
- Non-blocking error handling (try-catch per email)
- Batched user/organizer processing
- State re-verification at send time (user conditions may change)
- Suppression tagging: `suppressed_inactive = true` after sunset email with no clicks
- Engagement detection: If user clicks before Email 3, no suppression

---

### 8 Email Templates (apps/api/utils/emailTemplates/)

**Face Enrollment Nudge Series:**
1. `faceEnrollmentNudge1.hbs` — Day 7: "Most ComfyTag users skip the queue"
2. `faceEnrollmentNudge2.hbs` — Day 14: "Still haven't set up your face? Here's why it's worth it"

**Attendee Win-Back Series:**
3. `attendeeWinback1.hbs` — Day 90: "It's been a while — here's what's trending in {{state}}"
4. `attendeeWinback2.hbs` — Day 105: "{{firstName}}, your favorite artists are performing soon"
5. `attendeeWinback3.hbs` — Day 120: "Last message — we'll listen if you want us to stop" (sunset + suppression)

**Organizer Win-Back Series:**
6. `organizerWinback1.hbs` — Day 60: "Your last event was a hit — ready for the next one?"
7. `organizerWinback2.hbs` — Day 75: "3 event formats trending in Nigeria right now"
8. `organizerWinback3.hbs` — Day 90: "One last message — stay or opt out" (sunset + suppression)

**Template Format:**
- Handlebars (.hbs) with HTML layout
- Uses `ctaButton` partial for consistent CTAs
- Supports `{{firstName}}`, `{{state}}`, `{{browseLink}}`, `{{enrollLink}}`, `{{createLink}}`, `{{preferencesLink}}`
- Plain text + conversational tone (per spec)
- WCAG AA accessible styling

---

## INTEGRATION GUIDE

### 1. Update User Model (`apps/api/models/User.js`)

Add tracking fields for all three flows:

```javascript
// Face Enrollment Nudge
faceEnrollmentNudge2Sent: { type: Boolean, default: false },

// Attendee Winback
attendeeWinback1Sent: { type: Boolean, default: false },
attendeeWinback1Clicked: { type: Boolean, default: false },
attendeeWinback2Sent: { type: Boolean, default: false },
attendeeWinback2Clicked: { type: Boolean, default: false },
attendeeWinback3Sent: { type: Boolean, default: false },

// Organizer Winback
organizerWinback1Sent: { type: Boolean, default: false },
organizerWinback1Clicked: { type: Boolean, default: false },
organizerWinback2Sent: { type: Boolean, default: false },
organizerWinback2Clicked: { type: Boolean, default: false },
organizerWinback3Sent: { type: Boolean, default: false },

// Suppression & Engagement
suppressed_inactive: { type: Boolean, default: false },
emailSuppressed: {
  type: {
    reason: { type: String, enum: ['win-back-no-response', 'organizer-winback-no-response', 'user-requested'] },
    date: Date,
  },
  default: null,
},
emailEngaged: { type: Boolean, default: false },
```

### 2. Update API Server (`apps/api/app.js`)

**Add imports (after existing imports):**
```javascript
import { startFaceEnrollmentNudgeCron } from './jobs/faceEnrollmentNudge.js';
import { startAttendeeWinbackCron } from './jobs/attendeeWinback.js';
import { startOrganizerWinbackCron } from './jobs/organizerWinback.js';
```

**Initialize crons on server start (around line 294):**
```javascript
connect()
  .then(() => {
    app.listen(process.env.PORT || PORT, () => {
      console.log(`Listening to port ${process.env.PORT}`)
    })

    // ✅ Initialize retention cron jobs
    startFaceEnrollmentNudgeCron();
    startAttendeeWinbackCron();
    startOrganizerWinbackCron();

    console.log('✓ Retention cron jobs initialized');
  })
  .catch((err) => {
    console.error("MongoDB connection failed — server not started:", err.message)
    process.exit(1)
  })
```

### 3. Environment Variables (.env)

Ensure these are set:
```bash
WEB_URL=https://comfytag.com
PARTNER_URL=https://partner.comfytag.com
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Click Tracking Webhooks (Optional but Recommended)

Add these endpoints to track email opens/clicks:

```javascript
// POST /api/email-events/opened
app.post('/api/email-events/opened', async (req, res) => {
  const { userId, template } = req.body;
  const clickMap = {
    'attendeeWinback1.hbs': 'attendeeWinback1Clicked',
    'attendeeWinback2.hbs': 'attendeeWinback2Clicked',
    'organizerWinback1.hbs': 'organizerWinback1Clicked',
    'organizerWinback2.hbs': 'organizerWinback2Clicked',
  };
  const field = clickMap[template];
  if (field) {
    await User.updateOne({ _id: userId }, { [field]: true });
  }
  res.json({ success: true });
});
```

---

## HOW IT WORKS

### Face Enrollment Nudge Flow
```
Day 0: User signs up
  ↓
Day 7: ✉️ Email 1 sent (if faceEnrolled === false)
  ↓
Day 14: ✉️ Email 2 sent (if faceEnrolled === false AND not sent yet)
  ↓
[End of flow]
```

### Attendee Win-Back Flow
```
Day 0: User makes ticket purchase
  ↓
Day 90: ✉️ Email 1 sent (if lastPurchase > 90 days AND not suppressed)
  ↓
Day 105: ✉️ Email 2 sent (if lastPurchase > 105 days AND not suppressed)
  ↓
Day 120: [Engagement check]
  ├─ If clicked Email 1 or 2 → Tag emailEngaged = true (no suppression)
  └─ If no clicks → ✉️ Email 3 (sunset) sent → Tag suppressed_inactive = true
  ↓
[No more win-back emails sent]
```

### Organizer Win-Back Flow
```
Day 0: Organizer publishes event
  ↓
Day 60: ✉️ Email 1 sent (if lastEvent > 60 days AND not suppressed)
  ↓
Day 75: ✉️ Email 2 sent (if lastEvent > 75 days AND not suppressed)
  ↓
Day 90: [Engagement check]
  ├─ If clicked Email 1 or 2 → Tag emailEngaged = true (no suppression)
  └─ If no clicks → ✉️ Email 3 (sunset) sent → Tag suppressed_inactive = true
  ↓
[No more win-back emails sent]
```

---

## SUPPRESSION TAGGING

When Email 3 (sunset email) is queued with no prior engagement:

```javascript
User.updateOne(
  { _id: userId },
  {
    suppressed_inactive: true,
    emailSuppressed: {
      reason: 'win-back-no-response',
      date: new Date(),
    },
    attendeeWinback3Sent: true,
  }
)
```

**Consequences:**
- `suppressed_inactive = true` blocks all future win-back emails
- `emailSuppressed` object documents suppression reason + date
- User can manually unsuppress via admin panel or API

---

## MONITORING & TESTING

### Cron Logging
Each cron logs to console:
```
[Face Nudge Cron] Starting run...
[Face Nudge Cron] Found 142 users for Day-7 email
[Face Nudge Cron] Found 89 users for Day-14 email
[Face Nudge Cron] Completed successfully
```

### BullMQ Queue Status
```javascript
import { getQueueStatus } from './jobs/emailQueue.js';
const status = await getQueueStatus();
// { waiting: 200, active: 5, completed: 1000, failed: 0, isPaused: false }
```

### Manual Cron Trigger (Dev)
Refactor cron logic into separate functions for manual testing:
```javascript
// Trigger face nudge cron
POST /admin/cron/face-nudge
```

---

## CRITICAL NOTES

1. **Date Calculations:** All crons use 24-hour UTC boundaries (start of day at 00:00, end at 23:59:59)
2. **Duplicate Prevention:** Each email email flags a `*Sent` field to prevent double-sends on re-runs
3. **Re-checking Logic:** Before sending, crons re-verify user conditions (status may have changed)
4. **Non-blocking Errors:** Each email send is wrapped in try-catch; one failure doesn't halt the cron
5. **Timezone:** All crons use WAT (UTC+1). Adjust cron times if deploying to different timezone.

---

## FILES CREATED

**Cron Jobs (3 files):**
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\jobs\faceEnrollmentNudge.js`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\jobs\attendeeWinback.js`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\jobs\organizerWinback.js`

**Email Templates (8 files):**
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\faceEnrollmentNudge1.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\faceEnrollmentNudge2.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\attendeeWinback1.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\attendeeWinback2.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\attendeeWinback3.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\organizerWinback1.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\organizerWinback2.hbs`
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\utils\emailTemplates\organizerWinback3.hbs`

**Integration Guide:**
- `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\apps\api\RETENTION_CRONS_INTEGRATION.md`

---

## NEXT STEPS (POST-DELIVERY)

1. Update `User.js` with new schema fields
2. Wire cron imports + initialization into `app.js`
3. Add click tracking webhook endpoints
4. Test locally with Redis running
5. Verify cron logs appear on schedule
6. Stage to production
7. Monitor BullMQ queue for failures
8. (Optional) Build admin panel for suppression management

---

**Implementation by:** Claude Code — Node.js Backend Engineer  
**Ready for:** Code review, schema updates, app.js integration  
