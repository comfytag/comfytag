import { sendViaSES } from "./awsEmailService.js";
import User from "../models/User.js";

// ─── Sender addresses pulled from SES env vars ───────────────────────────────
const FROM_DEFAULT = process.env.SES_SENDER_EMAIL || "noreply@comfytag.com";
const FROM_TICKETS = process.env.SES_SENDER_EMAIL || "tickets@comfytag.com";

// ─── User notification preference gate ───────────────────────────────────────
const checkNotificationPreference = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Unknown address — allow send (new user / first email case)
      return true;
    }
    return user.notificationPreferences?.email !== false;
  } catch (error) {
    // Fail-safe: do not flood users when DB is unavailable
    console.error(
      `[SendEmail] ERROR checking notification preference for ${email}: ${error.message}`
    );
    return false;
  }
};

/**
 * Main email sender.
 *
 * Checks user notification preferences, then delegates template rendering,
 * bounce/complaint suppression, and actual dispatch to awsEmailService (SES).
 *
 * @param {Object}  options
 * @param {string}  options.to        - Recipient email address
 * @param {string}  options.subject   - Email subject line
 * @param {string}  [options.template] - Template filename (e.g. "otp.hbs")
 * @param {Object}  [options.data={}] - Handlebars context data
 * @param {string}  [options.from]    - Sender address override
 * @param {string}  [options.replyTo] - Reply-to address (optional)
 * @param {string}  [options.text]    - Plain-text fallback (optional)
 * @returns {Promise<Object>} Result with { success, messageId, ... } or { success: false, ... }
 */
export const sendEmail = async ({
  to,
  subject,
  template,
  data = {},
  from = FROM_DEFAULT,
  replyTo = null,
  text = null,
}) => {
  try {
    if (!to || !subject) {
      throw new Error("Missing required fields: 'to' and 'subject' are required");
    }

    // ─── Gate 1: user notification preference ────────────────────────────────
    const shouldSend = await checkNotificationPreference(to);
    if (!shouldSend) {
      return {
        success: false,
        skipped: true,
        message: `Email notification disabled for ${to}`,
        email: to,
        subject,
      };
    }

    // ─── Delegate: template render + bounce/complaint check + SES dispatch ───
    return await sendViaSES({ to, subject, template, data, from, replyTo, text });
  } catch (error) {
    console.error(`[SendEmail] ERROR sending to ${to}: ${error.message}`);
    return {
      success: false,
      message: `Failed to send email to ${to}`,
      email: to,
      subject,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Legacy wrapper — sends a simple email with provided HTML/text content.
 */
export const sendEmails = async (email, subject, text, html) => {
  return sendEmail({
    to: email,
    subject,
    text,
    data: { text, html },
    from: FROM_DEFAULT,
  });
};

/**
 * Legacy wrapper — sends a ticket confirmation email.
 */
export const sendTicket = async (email, subject, text, html) => {
  return sendEmail({
    to: email,
    subject,
    text,
    template: "ticketConfirmation.hbs",
    data: { text, html },
    from: FROM_TICKETS,
  });
};

/**
 * Send an OTP / password-reset email.
 */
export const sendOTP = async (email, otp, templateName = "otp.hbs") => {
  const baseUrl = process.env.BASE_URL || "https://comfytag.com";
  return sendEmail({
    to: email,
    subject: "Your ComfyTag One-Time Password",
    template: templateName,
    data: {
      otp,
      year: new Date().getFullYear(),
      unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
      preferencesUrl: `${baseUrl}/preferences`,
    },
    from: FROM_DEFAULT,
  });
};

/**
 * Send a welcome email.
 */
export const sendWelcome = async (
  email,
  name,
  templateName = "attendeeWelcome1.hbs"
) => {
  const baseUrl = process.env.BASE_URL || "https://comfytag.com";
  return sendEmail({
    to: email,
    subject: "Welcome to ComfyTag",
    template: templateName,
    data: {
      name,
      year: new Date().getFullYear(),
      unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
      preferencesUrl: `${baseUrl}/preferences`,
    },
    from: FROM_DEFAULT,
  });
};
