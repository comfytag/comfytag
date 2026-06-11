import { Queue, Worker } from "bullmq";
import { sendEmail } from "../utils/sendEmail.js";
import { getGlobalIoInstance, emitNotification, emitUnreadCountUpdate } from "../socket/index.js";
import Notification from "../models/Notification.js";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

/**
 * Test Redis connectivity at startup
 * Fails fast with clear error if Redis unreachable
 */
export const testRedisConnection = async () => {
  try {
    const testQueue = new Queue("test-connection", { connection: redisConnection });
   // ✅ Safely resolve the client promise before pinging
    const redisClient = await testQueue.client;
    await redisClient.ping();
    await testQueue.close();
    console.log(`[Email Queue] ✅ Redis connection verified (${redisConnection.host}:${redisConnection.port})`);
    return true;;
  } catch (error) {
    console.error(
      `[Email Queue] ❌ ERROR: Cannot reach Redis at ${redisConnection.host}:${redisConnection.port} - ${error.message}`
    );
    throw new Error(`Email queue initialization failed: Redis unreachable`);
  }
};

/**
 * Initialize BullMQ email queue
 * Job format: { to, subject, template, data, from, replyTo, delay }
 */
export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

/**
 * Process email jobs from the queue (BullMQ v5+ Worker pattern)
 * v2 PRODUCTION READY: Email worker now fully enabled
 */
export const emailWorker = new Worker("email", async (job) => {
  const { to, subject, template, data = {}, from, replyTo, userId, notificationType } = job.data;

  try {
    const result = await sendEmail({
      to,
      subject,
      template,
      data,
      from,
      replyTo,
    });

    if (!result.success && !result.skipped) {
      throw new Error(result.error || "Email send failed");
    }

    // Create real-time notification for event reminders and recaps
    if (userId && notificationType && (notificationType === 'event_reminder' || notificationType === 'event_recap')) {
      try {
        const io = getGlobalIoInstance();

        // Create notification in database
        const notification = await Notification.create({
          user_id: userId,
          type: notificationType,
          title: notificationType === 'event_reminder' ? 'Event Reminder' : 'Event Recap',
          message: data.firstName
            ? (notificationType === 'event_reminder'
              ? `${data.eventName} is coming up!`
              : `Thanks for attending ${data.eventName}!`)
            : 'Event update',
          data: {
            eventName: data.eventName,
            eventId: data.eventId,
          },
        });

        // Emit real-time notification if user is online
        if (io) {
          emitNotification(io, userId, {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: notification.read,
            createdAt: notification.createdAt,
          });

          // Update unread count
          const unreadCount = await Notification.countDocuments({
            user_id: userId,
            read: false,
          });
          emitUnreadCountUpdate(io, userId, unreadCount);
        }
      } catch (notifErr) {
        console.error('[Job Processor] Failed to create notification:', notifErr.message);
        // Don't fail the job if notification fails — email was sent successfully
      }
    }

    return {
      success: true,
      messageId: result.messageId,
      email: to,
      timestamp: new Date().toISOString(),
      notificationCreated: userId && notificationType ? true : false,
    };
  } catch (error) {
    throw new Error(`Email send error: ${error.message}`);
  }
}, { connection: redisConnection });

/**
 * Worker event listeners
 */
emailWorker.on("waiting", (job) => {
  console.log(`[Email Queue] Job ${job.id} waiting`);
});

emailWorker.on("active", (job) => {
  console.log(`[Email Queue] Job ${job.id} processing`);
});

emailWorker.on("completed", (job) => {
  console.log(`[Email Queue] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(
    `[Email Queue] ERROR: Job ${job.id} failed after ${job.attemptsMade} attempts - ${err.message}`
  );
});

emailWorker.on("error", (err) => {
  console.error(`[Email Queue] ERROR: Worker error - ${err.message}`);
});

/**
 * Enqueue a single email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template filename
 * @param {Object} options.data - Template data
 * @param {string} options.from - Sender address (optional, defaults to noreply@comfytag.com)
 * @param {string} options.replyTo - Reply-to address (optional)
 * @param {number} options.delay - Delay in milliseconds (optional)
 * @returns {Promise<Object>} Result object with success flag and job details
 */
export const enqueueEmail = async (options) => {
  const { to, subject, template, data = {}, from, replyTo, delay = 0, userId, notificationType } = options;

  try {
    const job = await emailQueue.add(
      'send-email',
      { to, subject, template, data, from, replyTo, userId, notificationType },
      { delay }
    );

    console.log(`[Email Queue] Email queued - Job ${job.id} (to: ${to})`);
    return {
      success: true,
      jobId: job.id,
      email: to,
      subject,
    };
  } catch (error) {
    console.error(`[Email Queue] ERROR: Failed to queue email for ${to} - ${error.message}`);
    return {
      success: false,
      email: to,
      subject,
      error: error.message,
    };
  }
};

/**
 * Enqueue multiple emails
 * @param {Array} recipients - Array of recipient emails
 * @param {Object} options - Email options
 * @returns {Promise<Array>} Array of Bull job instances
 */
export const enqueueBulkEmails = async (recipients, options) => {
  const jobs = await Promise.all(
    recipients.map((to) =>
      enqueueEmail({
        to,
        subject: options.subject,
        template: options.template,
        data: options.data,
        from: options.from,
        replyTo: options.replyTo,
        delay: options.delay,
      })
    )
  );

  console.log(`[Email Queue] Bulk queue complete - ${jobs.length} emails queued`);
  return jobs;
};

/**
 * Get queue status
 * @returns {Promise<Object>} Queue status object
 */
export const getQueueStatus = async () => {
  try {
    const counts = await emailQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed"
    );

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      isPaused: emailQueue.isPaused(),
    };
  } catch (error) {
    console.error("[Email Queue] Error getting status:", error);
    throw error;
  }
};

/**
 * Pause the queue
 */
export const pauseQueue = async () => {
  try {
    await emailQueue.pause();
    console.log("[Email Queue] Queue paused");
  } catch (error) {
    console.error("[Email Queue] Error pausing queue:", error);
    throw error;
  }
};

/**
 * Resume the queue
 */
export const resumeQueue = async () => {
  try {
    await emailQueue.resume();
    console.log("[Email Queue] Queue resumed");
  } catch (error) {
    console.error("[Email Queue] Error resuming queue:", error);
    throw error;
  }
};

/**
 * Close the queue connection
 */
export const closeQueue = async () => {
  try {
    await emailQueue.close();
    console.log("[Email Queue] Queue closed");
  } catch (error) {
    console.error("[Email Queue] Error closing queue:", error);
    throw error;
  }
};

export default emailQueue;
