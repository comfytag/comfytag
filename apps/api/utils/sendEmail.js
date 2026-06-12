import { Resend } from "resend";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "emailTemplates");

// ─── Register all Handlebars partials at startup ────────────────────────
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");
fs.readdirSync(PARTIALS_DIR).forEach((file) => {
  const name = path.basename(file, ".hbs");
  const content = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf-8");
  Handlebars.registerPartial(name, content);
});

// ─── Load and cache Handlebars layouts on first use ─────────────────────────
const LAYOUTS_DIR = path.join(TEMPLATES_DIR, "layouts");
const layoutCache = {};

const getLayout = (layoutName) => {
  if (!layoutCache[layoutName]) {
    const raw = fs.readFileSync(path.join(LAYOUTS_DIR, layoutName), "utf-8");
    layoutCache[layoutName] = Handlebars.compile(raw);
  }
  return layoutCache[layoutName];
};

// ─── Email sender addresses (configurable via env, with defaults) ────────────
const RESEND_FROM_DEFAULT = process.env.RESEND_FROM_DEFAULT || "noreply@comfytag.com";
const RESEND_FROM_TICKETS = process.env.RESEND_FROM_TICKETS || "tickets@comfytag.com";

// ─── Initialize Resend HTTP API Client ────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Load and compile a Handlebars template from the emailTemplates directory
 * @param {string} templateName - Template filename (e.g., "attendeeWelcome1.hbs")
 * @returns {Function} Compiled Handlebars template function
 */
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    return Handlebars.compile(templateContent);
  } catch (error) {
    throw new Error(`Failed to load template '${templateName}': ${error.message}`);
  }
};

/**
 * Check user's email notification preference
 * @param {string} email - Recipient email address
 * @returns {Promise<boolean>} True if user has email notifications enabled
 */
const checkNotificationPreference = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // If user not found, default to allowing send (new user case)
      return true;
    }
    // Check if email notifications are enabled
    return user.notificationPreferences?.email !== false;
  } catch (error) {
    // CRITICAL: Fail-safe on database errors — default to NOT sending
    // If DB is down, we should not flood users with emails
    console.error(
      `[SendEmail] ERROR checking notification preference for ${email}: ${error.message}`
    );
    // Default to NOT sending if there's a database error (fail-safe)
    return false;
  }
};

/**
 * Main email sender function with Handlebars templating and notification preference gating
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.template - Template filename relative to emailTemplates/ (e.g., "attendeeWelcome1.hbs")
 * @param {Object} [options.data={}] - Data object to inject into template
 * @param {string} [options.from="noreply@comfytag.com"] - Sender email address (with optional override)
 * @param {string} [options.replyTo=null] - Reply-to email address (optional)
 * @param {string} [options.text=null] - Plain text fallback (optional, if not using template)
 * @returns {Promise<Object>} Result object with success status and details
 */
export const sendEmail = async ({
  to,
  subject,
  template,
  data = {},
  from = RESEND_FROM_DEFAULT,
  replyTo = null,
  text = null,
}) => {
  try {
    // Validate required fields
    if (!to || !subject) {
      throw new Error("Missing required fields: 'to' and 'subject' are required");
    }

    // ─── Gate: Check notification preference ────────────────────────
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

    // ─── Load and render template ────────────────────────
    let html = null;
    if (template) {
      const compiledTemplate = loadTemplate(template);
      const bodyHtml = compiledTemplate(data);

      // Standalone templates (ticketConfirmation, otp, reminder, etc.) include their
      // own full HTML shell. Fragment templates (welcome series, transfer, KYC, etc.)
      // are bare HTML body content — wrap them in the transactional layout so they
      // get a proper <!DOCTYPE>, viewport meta, and branded header/footer in all clients.
      const isStandalone = bodyHtml.trimStart().startsWith("<!DOCTYPE");
      if (isStandalone) {
        html = bodyHtml;
      } else {
        const layoutName = data._layout || "transactional.hbs";
        html = getLayout(layoutName)({
          subject,
          body: bodyHtml,
          year: data.year || new Date().getFullYear(),
          unsubscribeUrl: data.unsubscribeUrl || "",
          preferencesUrl: data.preferencesUrl || "",
        });
      }
    }

    // ─── Build mail options ────────────────────────
    const mailOptions = {
      from,
      to,
      subject,
    };

    // Add HTML if template rendered
    if (html) {
      mailOptions.html = html;
    }

    // Add plain text if provided or as fallback
    if (text) {
      mailOptions.text = text;
    }

    // Add reply-to if specified
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    // ─── Send via Resend HTTP API ────────────────────────
    const result = await resend.emails.send(mailOptions);

    if (result.error) {
      throw new Error(result.error.message || "Resend API error");
    }

    return {
      success: true,
      message: `Email sent successfully to ${to}`,
      email: to,
      subject,
      messageId: result.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[SendEmail] ERROR sending to ${to}: ${error.message}`
    );

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
 * Legacy wrapper for backwards compatibility
 * Sends a simple email with provided HTML/text content
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @returns {Promise<Object>} Result object
 */
export const sendEmails = async (email, subject, text, html) => {
  return sendEmail({
    to: email,
    subject,
    text,
    data: { text, html }, // Legacy compatibility
    from: RESEND_FROM_DEFAULT,
  });
};

/**
 * Legacy wrapper — sends a ticket confirmation email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @returns {Promise<Object>} Result object
 */
export const sendTicket = async (email, subject, text, html) => {
  return sendEmail({
    to: email,
    subject,
    text,
    template: "ticketConfirmation.hbs",
    data: { text, html },
    from: RESEND_FROM_TICKETS,
  });
};

/**
 * Convenience function: Send OTP / password-reset email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @param {string} [templateName="otp.hbs"] - Template to use
 * @returns {Promise<Object>} Result object
 */
export const sendOTP = async (
  email,
  otp,
  templateName = "otp.hbs"
) => {
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
    from: RESEND_FROM_DEFAULT,
  });
};

/**
 * Convenience function: Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} [templateName="attendeeWelcome1.hbs"] - Template to use
 * @returns {Promise<Object>} Result object
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
    from: RESEND_FROM_DEFAULT,
  });
};
