import Queue from "bullmq";
import { sendEmail } from "../utils/sendEmail.js";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
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
 * Process email jobs from the queue
 */
emailQueue.process(async (job) => {
  const { to, subject, template, data = {}, from, replyTo } = job.data;

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

    return {
      success: true,
      messageId: result.messageId,
      email: to,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Email send error: ${error.message}`);
  }
});

/**
 * Queue event listeners
 */
emailQueue.on("waiting", (job) => {
  console.log(`[Email Queue] Job ${job.id} waiting`);
});

emailQueue.on("active", (job) => {
  console.log(`[Email Queue] Job ${job.id} processing`);
});

emailQueue.on("completed", (job) => {
  console.log(`[Email Queue] Job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  console.error(
    `[Email Queue] Job ${job.id} failed after ${job.attemptsMade} attempts:`,
    err.message
  );
});

emailQueue.on("error", (err) => {
  console.error("[Email Queue] Queue error:", err);
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
 * @returns {Promise<Job>} Bull job instance
 */
export const enqueueEmail = async (options) => {
  const { to, subject, template, data = {}, from, replyTo, delay = 0 } = options;

  try {
    const job = await emailQueue.add(
      { to, subject, template, data, from, replyTo },
      { delay }
    );

    console.log(`[Email Queue] Email queued - Job ${job.id} (to: ${to})`);
    return job;
  } catch (error) {
    console.error(`[Email Queue] Failed to queue email:`, error);
    throw error;
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
