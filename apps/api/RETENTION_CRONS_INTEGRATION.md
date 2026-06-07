# Retention Crons Integration Guide

## Overview

Three retention cron jobs have been created:
1. `faceEnrollmentNudge.js` — Daily 9:00 AM WAT
2. `attendeeWinback.js` — Daily 10:00 AM WAT
3. `organizerWinback.js` — Daily 11:00 AM WAT

All crons use BullMQ + Redis to queue emails via `enqueueEmail()`.

---

## Integration Steps

### 1. Update `apps/api/app.js`

Add imports at the top of the file (after existing imports):

```javascript
import { startFaceEnrollmentNudgeCron } from './jobs/faceEnrollmentNudge.js';
import { startAttendeeWinbackCron } from './jobs/attendeeWinback.js';
import { startOrganizerWinbackCron } from './jobs/organizerWinback.js';
```

### 2. Initialize Crons on Server Start

Update the `connect()` promise to initialize crons:

**Current code (line ~294):**
```javascript
connect()
  .then(() => {
    app.listen(process.env.PORT || PORT, () => {
      console.log(`Listening to port ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection failed — server not started:", err.message)
    process.exit(1)
  })
```

**Updated code:**
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

---

## Environment Variables

Ensure these are set in `.env`:

```bash
# Email service
WEB_URL=https://comfytag.com
PARTNER_URL=https://partner.comfytag.com

# Redis (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGO=mongodb://...

# API Port
PORT=4002
```

---

## User Model Schema Extensions

The crons expect the following fields on the User model. These should be added to `apps/api/models/User.js`:

```javascript
// Face Enrollment Nudge tracking
faceEnrollmentNudge2Sent: {
  type: Boolean,
  default: false,
},

// Attendee Winback tracking
attendeeWinback1Sent: {
  type: Boolean,
  default: false,
},
attendeeWinback1Clicked: {
  type: Boolean,
  default: false,
},
attendeeWinback2Sent: {
  type: Boolean,
  default: false,
},
attendeeWinback2Clicked: {
  type: Boolean,
  default: false,
},
attendeeWinback3Sent: {
  type: Boolean,
  default: false,
},

// Organizer Winback tracking
organizerWinback1Sent: {
  type: Boolean,
  default: false,
},
organizerWinback1Clicked: {
  type: Boolean,
  default: false,
},
organizerWinback2Sent: {
  type: Boolean,
  default: false,
},
organizerWinback2Clicked: {
  type: Boolean,
  default: false,
},
organizerWinback3Sent: {
  type: Boolean,
  default: false,
},

// Suppression & engagement
suppressed_inactive: {
  type: Boolean,
  default: false,
},
emailSuppressed: {
  type: {
    reason: {
      type: String,
      enum: ['win-back-no-response', 'organizer-winback-no-response', 'user-requested'],
    },
    date: Date,
  },
  default: null,
},
emailEngaged: {
  type: Boolean,
  default: false,
},
```

---

## Click Tracking Integration

The crons depend on click tracking. When a user clicks an email link or opens it, you need to set the corresponding flag:

**Example: Email Open Webhook Handler**

```javascript
// POST /api/email-events/opened
// Body: { emailId, userId, template }

app.post('/api/email-events/opened', async (req, res) => {
  const { userId, template } = req.body;

  try {
    const clickMap = {
      'attendeeWinback1.hbs': 'attendeeWinback1Clicked',
      'attendeeWinback2.hbs': 'attendeeWinback2Clicked',
      'organizerWinback1.hbs': 'organizerWinback1Clicked',
      'organizerWinback2.hbs': 'organizerWinback2Clicked',
    };

    const field = clickMap[template];

    if (field) {
      await User.updateOne(
        { _id: userId },
        { [field]: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Click tracking error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Testing the Crons

### Manual Trigger (Development)

To test without waiting for the scheduled time:

```javascript
// In an API endpoint or admin panel:
import { startFaceEnrollmentNudgeCron } from './jobs/faceEnrollmentNudge.js';

app.post('/admin/cron/test/face-nudge', async (req, res) => {
  try {
    console.log('[TEST] Running face nudge cron manually...');
    // Manually run the cron logic (refactor if needed)
    res.json({ success: true, message: 'Face nudge cron triggered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Check Queue Status

```javascript
import { getQueueStatus } from './jobs/emailQueue.js';

app.get('/admin/email-queue/status', async (req, res) => {
  try {
    const status = await getQueueStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Monitoring

### Log Output

Each cron logs to console:
- `[Face Nudge Cron] Starting run...` — Start of daily run
- `[Face Nudge Cron] Found X users for Day-7 email` — Count of eligible users
- `[Face Nudge Cron] Completed successfully` — End of successful run
- `[Face Nudge Cron] Fatal error: ...` — Any failures

### BullMQ Events

All emails are logged in the BullMQ email queue. Check queue status:

```bash
# View pending emails
redis-cli LRANGE bull:email:waiting 0 -1

# View completed emails
redis-cli LRANGE bull:email:completed 0 -1

# View failed emails
redis-cli LRANGE bull:email:failed 0 -1
```

---

## Suppression Logic

**When is a user suppressed?**

1. After Email 3 (day 120 or day 90) is sent AND
2. The user has NOT clicked on Email 1 or Email 2

**What happens when suppressed?**

- `suppressed_inactive = true`
- `emailSuppressed.reason` = `"win-back-no-response"` (attendee) or `"organizer-winback-no-response"` (organizer)
- `emailSuppressed.date` = timestamp
- No more win-back emails are sent

**How to unsuppress?**

```javascript
await User.updateOne(
  { _id: userId },
  { suppressed_inactive: false }
);
```

---

## Files Created

- `apps/api/jobs/faceEnrollmentNudge.js` — Face enrollment cron (9 AM WAT)
- `apps/api/jobs/attendeeWinback.js` — Attendee win-back cron (10 AM WAT)
- `apps/api/jobs/organizerWinback.js` — Organizer win-back cron (11 AM WAT)
- `apps/api/utils/emailTemplates/faceEnrollmentNudge1.hbs` — Day 7 face email
- `apps/api/utils/emailTemplates/faceEnrollmentNudge2.hbs` — Day 14 face email
- `apps/api/utils/emailTemplates/attendeeWinback1.hbs` — Day 90 attendee email
- `apps/api/utils/emailTemplates/attendeeWinback2.hbs` — Day 105 attendee email
- `apps/api/utils/emailTemplates/attendeeWinback3.hbs` — Day 120 attendee sunset email
- `apps/api/utils/emailTemplates/organizerWinback1.hbs` — Day 60 organizer email
- `apps/api/utils/emailTemplates/organizerWinback2.hbs` — Day 75 organizer email
- `apps/api/utils/emailTemplates/organizerWinback3.hbs` — Day 90 organizer sunset email

---

## Next Steps

1. ✅ Review cron jobs and email templates
2. Update `User.js` schema with new fields
3. Update `app.js` with cron imports and initialization
4. Add click tracking webhook endpoints
5. Test with Redis running locally
6. Deploy to staging → production
