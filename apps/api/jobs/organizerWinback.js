import cron from 'node-cron';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { enqueueEmail } from './emailQueue.js';

export const startOrganizerWinbackCron = () => {
  cron.schedule('0 11 * * *', async () => {
    try {
      console.log('[Organizer Winback Cron] Starting...');
      const now = new Date();
      const sixtydaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const seventyFiveDaysAgo = new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Day 60 email
      const events60 = await Event.find({ createdAt: { $gte: ninetyDaysAgo, $lt: sixtydaysAgo }, status: { $in: ['published', 'ended'] } });
      const org60Ids = new Set(events60.map(e => e.planner_id?.toString()));
      for (const orgId of org60Ids) {
        const org = await User.findById(orgId);
        if (org && !org.suppressed_inactive && !org.organizerWinback1Sent) {
          await enqueueEmail({ to: org.email, subject: 'Your last event was a hit — ready for the next one?', template: 'organizerWinback1.hbs', data: { organizerName: org.name.split(' ')[0], createLink: process.env.PARTNER_URL + '/events/create', year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
          await User.updateOne({ _id: orgId }, { organizerWinback1Sent: true });
        }
      }

      // Day 75 email
      const events75 = await Event.find({ createdAt: { $lt: seventyFiveDaysAgo }, status: { $in: ['published', 'ended'] } });
      const org75Ids = new Set(events75.map(e => e.planner_id?.toString()));
      for (const orgId of org75Ids) {
        const org = await User.findById(orgId);
        if (org && !org.suppressed_inactive && !org.organizerWinback2Sent) {
          await enqueueEmail({ to: org.email, subject: '3 event formats trending in Nigeria right now', template: 'organizerWinback2.hbs', data: { organizerName: org.name.split(' ')[0], createLink: process.env.PARTNER_URL + '/events/create', year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
          await User.updateOne({ _id: orgId }, { organizerWinback2Sent: true });
        }
      }

      // Day 90 email (sunset)
      const events90 = await Event.find({ createdAt: { $lt: ninetyDaysAgo }, status: { $in: ['published', 'ended'] } });
      const org90Ids = new Set(events90.map(e => e.planner_id?.toString()));
      for (const orgId of org90Ids) {
        const org = await User.findById(orgId);
        if (org && !org.suppressed_inactive && !org.organizerWinback3Sent) {
          const clicks = org.organizerWinback1Clicked || org.organizerWinback2Clicked;
          if (clicks) {
            await User.updateOne({ _id: orgId }, { emailEngaged: true, organizerWinback3Sent: true });
          } else {
            await enqueueEmail({ to: org.email, subject: 'One last message — stay or opt out', template: 'organizerWinback3.hbs', data: { organizerName: org.name.split(' ')[0], preferencesLink: process.env.PARTNER_URL + '/settings/notifications', year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
            await User.updateOne({ _id: orgId }, { suppressed_inactive: true, emailSuppressed: { reason: 'organizer-winback-no-response', date: new Date() }, organizerWinback3Sent: true });
          }
        }
      }

      console.log('[Organizer Winback Cron] Done');
    } catch (error) {
      console.error('[Organizer Winback Cron] Error:', error.message);
    }
  });

  console.log('[Organizer Winback Cron] Initialized - runs daily at 11:00 AM WAT');
};
