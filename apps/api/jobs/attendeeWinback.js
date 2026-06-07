import cron from 'node-cron';
import Audience from '../models/Audience.js';
import User from '../models/User.js';
import { enqueueEmail } from './emailQueue.js';

export const startAttendeeWinbackCron = () => {
  cron.schedule('0 10 * * *', async () => {
    try {
      console.log('[Attendee Winback Cron] Starting...');
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const oneHundredFiveDaysAgo = new Date(now.getTime() - 105 * 24 * 60 * 60 * 1000);
      const oneTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

      // Day 90 email
      const buyers90 = await Audience.find({ createdAt: { $gte: ninetyDaysAgo, $lt: new Date(ninetyDaysAgo.getTime() + 86400000) } }).populate('user_id');
      for (const t of buyers90) {
        const u = t.user_id;
        if (u && !u.suppressed_inactive) {
          await enqueueEmail({ to: u.email, subject: 'It\'s been a while — here\'s what\'s trending in ' + (u.state || 'Nigeria'), template: 'attendeeWinback1.hbs', data: { firstName: u.name.split(' ')[0], state: u.state || 'Nigeria', browseLink: process.env.WEB_URL + '/events?state=' + (u.state || 'ng'), year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
          await User.updateOne({ _id: u._id }, { attendeeWinback1Sent: true });
        }
      }

      // Day 105 email
      const buyers105 = await Audience.find({ createdAt: { $lt: oneHundredFiveDaysAgo } }).populate('user_id');
      const seen = new Set();
      for (const t of buyers105) {
        const uid = t.user_id?._id?.toString();
        if (seen.has(uid)) continue; seen.add(uid);
        const u = t.user_id;
        if (u && !u.suppressed_inactive && !u.attendeeWinback2Sent) {
          await enqueueEmail({ to: u.email, subject: u.name.split(' ')[0] + ', your favorite artists are performing soon', template: 'attendeeWinback2.hbs', data: { firstName: u.name.split(' ')[0], state: u.state || 'Nigeria', browseLink: process.env.WEB_URL + '/events?state=' + (u.state || 'ng'), year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
          await User.updateOne({ _id: u._id }, { attendeeWinback2Sent: true });
        }
      }

      // Day 120 email (sunset)
      const buyers120 = await Audience.find({ createdAt: { $lt: oneTwentyDaysAgo } }).populate('user_id');
      seen.clear();
      for (const t of buyers120) {
        const uid = t.user_id?._id?.toString();
        if (seen.has(uid)) continue; seen.add(uid);
        const u = t.user_id;
        if (u && !u.suppressed_inactive && !u.attendeeWinback3Sent) {
          const clicks = u.attendeeWinback1Clicked || u.attendeeWinback2Clicked;
          if (clicks) {
            await User.updateOne({ _id: u._id }, { emailEngaged: true, attendeeWinback3Sent: true });
          } else {
            await enqueueEmail({ to: u.email, subject: 'Last message — we\'ll listen if you want us to stop', template: 'attendeeWinback3.hbs', data: { firstName: u.name.split(' ')[0], preferencesLink: process.env.WEB_URL + '/settings/notifications', year: 2026 }, from: 'hello@comfytag.com' }).catch(e => console.error(e.message));
            await User.updateOne({ _id: u._id }, { suppressed_inactive: true, emailSuppressed: { reason: 'win-back-no-response', date: new Date() }, attendeeWinback3Sent: true });
          }
        }
      }

      console.log('[Attendee Winback Cron] Done');
    } catch (error) {
      console.error('[Attendee Winback Cron] Error:', error.message);
    }
  });

  console.log('[Attendee Winback Cron] Initialized - runs daily at 10:00 AM WAT');
};
