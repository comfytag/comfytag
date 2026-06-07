import cron from 'node-cron';
import User from '../models/User.js';
import { enqueueEmail } from './emailQueue.js';

export const startFaceEnrollmentNudgeCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[Face Nudge Cron] Starting run...');
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const day7Users = await User.find({
        createdAt: { $gte: sevenDaysAgo, $lt: new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000) },
        faceEnrolled: false,
        suppressed_inactive: { $ne: true },
      });

      for (const user of day7Users) {
        if (user.faceEnrolled === false) {
          await enqueueEmail({
            to: user.email,
            subject: 'Most ComfyTag users skip the queue. Here\'s how.',
            template: 'faceEnrollmentNudge1.hbs',
            data: { firstName: user.name.split(' ')[0], enrollLink: `${process.env.WEB_URL}/app/enroll-face`, year: new Date().getFullYear() },
            from: 'hello@comfytag.com',
          }).catch(e => console.error('[Face Nudge] Email 1 failed:', e.message));
        }
      }

      const day14Users = await User.find({
        createdAt: { $lt: fourteenDaysAgo },
        faceEnrolled: false,
        suppressed_inactive: { $ne: true },
        faceEnrollmentNudge2Sent: { $ne: true },
      });

      for (const user of day14Users) {
        if (user.faceEnrolled === false) {
          await enqueueEmail({
            to: user.email,
            subject: 'Still haven\'t set up your face? Here\'s why it\'s worth it.',
            template: 'faceEnrollmentNudge2.hbs',
            data: { firstName: user.name.split(' ')[0], enrollLink: `${process.env.WEB_URL}/app/enroll-face`, year: new Date().getFullYear() },
            from: 'hello@comfytag.com',
          }).catch(e => console.error('[Face Nudge] Email 2 failed:', e.message));
          await User.updateOne({ _id: user._id }, { faceEnrollmentNudge2Sent: true });
        }
      }

      console.log('[Face Nudge Cron] Completed - Day-7: ' + day7Users.length + ', Day-14: ' + day14Users.length);
    } catch (error) {
      console.error('[Face Nudge Cron] Fatal error:', error.message);
    }
  });

  console.log('[Face Nudge Cron] Initialized - runs daily at 9:00 AM WAT');
};
