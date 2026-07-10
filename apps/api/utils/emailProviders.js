import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "emailTemplates");

// ─── Register all Handlebars partials at startup ─────────────────────────────
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");
fs.readdirSync(PARTIALS_DIR).forEach((file) => {
  const name = path.basename(file, ".hbs");
  const content = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf-8");
  Handlebars.registerPartial(name, content);
});

// ─── Load and cache Handlebars layouts on first use ──────────────────────────
const LAYOUTS_DIR = path.join(TEMPLATES_DIR, "layouts");
const layoutCache = {};

const getLayout = (layoutName) => {
  if (!layoutCache[layoutName]) {
    const raw = fs.readFileSync(path.join(LAYOUTS_DIR, layoutName), "utf-8");
    layoutCache[layoutName] = Handlebars.compile(raw);
  }
  return layoutCache[layoutName];
};

// ─── Load and compile a named .hbs template ──────────────────────────────────
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    return Handlebars.compile(templateContent);
  } catch (error) {
    throw new Error(`Failed to load template '${templateName}': ${error.message}`);
  }
};

// ─── ZeptoMail primary transport (Nodemailer SMTP) ────────────────────────────
const zeptoMailTransport = nodemailer.createTransport({
  host: process.env.ZEPTOMAIL_SMTP_HOST || "smtp.zeptomail.com",
  port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT || "587", 10),
  auth: {
    user: process.env.ZEPTOMAIL_SMTP_USER,
    pass: process.env.ZEPTOMAIL_SMTP_TOKEN,
  },
});

const sendViaZeptoMail = async ({ to, subject, html, text, from }) => {
  if (!process.env.ZEPTOMAIL_SMTP_USER || !process.env.ZEPTOMAIL_SMTP_TOKEN) {
    throw new Error("ZEPTOMAIL_SMTP_USER/ZEPTOMAIL_SMTP_TOKEN is not configured — ZeptoMail unavailable");
  }

  const info = await zeptoMailTransport.sendMail({
    from,
    to,
    subject,
    ...(html && { html }),
    ...(text && { text }),
  });

  return {
    success: true,
    message: `Email sent via ZeptoMail to ${to}`,
    email: to,
    subject,
    messageId: info.messageId,
    provider: "zeptomail",
    timestamp: new Date().toISOString(),
  };
};

// ─── Resend fallback transport ─────────────────────────────────────────────────
// Uses native fetch (Node 18+) so no extra dependency is required. Used as
// fallback if ZeptoMail fails.
const sendViaResend = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured — Resend fallback unavailable");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      ...(html && { html }),
      ...(text && { text }),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Resend API returned HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    success: true,
    message: `Email sent via Resend to ${to}`,
    email: to,
    subject,
    messageId: result.id,
    provider: "resend",
    timestamp: new Date().toISOString(),
  };
};

// ─── Suppression check: skip addresses that previously bounced or complained ─
const checkEmailSuppressed = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select("emailStatus");
    if (!user) return false;
    return user.emailStatus === "BOUNCED" || user.emailStatus === "COMPLAINED";
  } catch (error) {
    // Fail-safe: treat DB errors as suppressed so we don't send to unknown status
    console.error(
      `[emailProviders] ERROR checking suppression for ${email}: ${error.message}`
    );
    return true;
  }
};

/**
 * Compile a Handlebars template and wrap it in the transactional layout when needed.
 *
 * @param {string} templateName - Filename relative to emailTemplates/ (e.g. "otp.hbs")
 * @param {Object} data         - Template context data
 * @param {string} subject      - Email subject (injected into layout)
 * @returns {string} Final HTML string ready to send
 */
const renderTemplate = (templateName, data, subject) => {
  const compiledTemplate = loadTemplate(templateName);
  const bodyHtml = compiledTemplate(data);

  // Standalone templates ship their own <!DOCTYPE> shell; fragment templates get
  // wrapped in the transactional layout so they have a header/footer in all clients.
  const isStandalone = bodyHtml.trimStart().startsWith("<!DOCTYPE");
  if (isStandalone) return bodyHtml;

  const layoutName = data._layout || "transactional.hbs";
  return getLayout(layoutName)({
    subject,
    body: bodyHtml,
    year: data.year || new Date().getFullYear(),
    unsubscribeUrl: data.unsubscribeUrl || "",
    preferencesUrl: data.preferencesUrl || "",
  });
};

const EMAIL_FROM_DEFAULT = process.env.EMAIL_SENDER_DEFAULT || "noreply@comfytag.com";

/**
 * Send an email via ZeptoMail (primary), falling back to Resend on failure.
 *
 * This is the low-level transport function. Callers (sendEmail.js) are responsible
 * for checking user notification preferences BEFORE calling here. This function
 * only gates on hard delivery failures (BOUNCED / COMPLAINED).
 *
 * @param {Object}  options
 * @param {string}  options.to       - Recipient email address
 * @param {string}  options.subject  - Email subject line
 * @param {string}  [options.template] - .hbs filename relative to emailTemplates/
 * @param {Object}  [options.data={}]  - Handlebars context data
 * @param {string}  [options.from]   - Sender address (defaults to EMAIL_SENDER_DEFAULT)
 * @param {string}  [options.replyTo] - Optional Reply-To address
 * @param {string}  [options.text]   - Optional plain-text fallback
 * @returns {Promise<Object>} Result with { success, messageId, ... } or { success: false, ... }
 */
export const sendViaEmailProvider = async ({
  to,
  subject,
  template,
  data = {},
  from = EMAIL_FROM_DEFAULT,
  replyTo = null,
  text = null,
}) => {
  // ─── Gate: skip known bad addresses ──────────────────────────────────────
  const suppressed = await checkEmailSuppressed(to);
  if (suppressed) {
    return {
      success: false,
      skipped: true,
      message: `Email suppressed for ${to} (BOUNCED or COMPLAINED)`,
      email: to,
      subject,
    };
  }

  // ─── Render Handlebars template ───────────────────────────────────────────
  let html = null;
  if (template) {
    try {
      html = renderTemplate(template, data, subject);
    } catch (error) {
      return {
        success: false,
        message: `Template render failed for '${template}': ${error.message}`,
        email: to,
        subject,
        error: error.message,
      };
    }
  }

  if (!html && !text) {
    return {
      success: false,
      message: "No content: provide a template or plain text",
      email: to,
      subject,
    };
  }

  // ─── Dispatch via ZeptoMail (primary) → Resend (fallback) ────────────────
  try {
    return await sendViaZeptoMail({ to, subject, html, text, from });
  } catch (zeptoError) {
    console.warn(
      `[emailProviders] ZeptoMail failed, falling back to Resend...`,
      zeptoError.message
    );
    try {
      return await sendViaResend({ to, subject, html, text, from });
    } catch (resendError) {
      console.error(
        `[emailProviders] Both ZeptoMail and Resend failed to ${to}: ${resendError.message}`
      );
      return {
        success: false,
        message: `Failed to send email to ${to} via both ZeptoMail and Resend`,
        email: to,
        subject,
        error: resendError.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
};
