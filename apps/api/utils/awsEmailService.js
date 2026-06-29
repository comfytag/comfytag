import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
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

// ─── Initialize AWS SES client ───────────────────────────────────────────────
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const SES_FROM_DEFAULT = process.env.SES_SENDER_EMAIL || "noreply@comfytag.com";

// ─── Resend primary transport ─────────────────────────────────────────────────
// Primary email provider. Uses native fetch (Node 18+) so no extra dependency
// is required. SES is used as fallback if this fails.
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
      `[awsEmailService] ERROR checking suppression for ${email}: ${error.message}`
    );
    return true;
  }
};

/**
 * Compile a Handlebars template and wrap it in the transactional layout when needed.
 * Mirrors the exact rendering logic used in the legacy Resend service.
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

/**
 * Send an email via AWS SES.
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
 * @param {string}  [options.from]   - Sender address (defaults to SES_SENDER_EMAIL)
 * @param {string}  [options.replyTo] - Optional Reply-To address
 * @param {string}  [options.text]   - Optional plain-text fallback
 * @returns {Promise<Object>} Result with { success, messageId, ... } or { success: false, ... }
 */
export const sendViaSES = async ({
  to,
  subject,
  template,
  data = {},
  from = SES_FROM_DEFAULT,
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

  // ─── Build SES message body ───────────────────────────────────────────────
  const messageBody = {};
  if (html) messageBody.Html = { Charset: "UTF-8", Data: html };
  if (text) messageBody.Text = { Charset: "UTF-8", Data: text };

  if (!html && !text) {
    return {
      success: false,
      message: "No content: provide a template or plain text",
      email: to,
      subject,
    };
  }

  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Body: messageBody,
      Subject: { Charset: "UTF-8", Data: subject },
    },
    Source: from,
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
  };

  // ─── Dispatch via Resend (primary) → SES (fallback) ──────────────────────
  try {
    return await sendViaResend({ to, subject, html, text, from });
  } catch (resendError) {
    console.warn(
      `[awsEmailService] Resend failed, falling back to AWS SES...`,
      resendError.message
    );
    try {
      const result = await sesClient.send(new SendEmailCommand(params));
      return {
        success: true,
        message: `Email sent successfully to ${to}`,
        email: to,
        subject,
        messageId: result.MessageId,
        provider: "ses",
        timestamp: new Date().toISOString(),
      };
    } catch (sesError) {
      console.error(
        `[awsEmailService] Both Resend and SES failed to ${to}: ${sesError.message}`
      );
      return {
        success: false,
        message: `Failed to send email to ${to} via both Resend and SES`,
        email: to,
        subject,
        error: sesError.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
};
