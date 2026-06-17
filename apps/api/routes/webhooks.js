import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ─── Mark a user's email address with the given SES status ───────────────────
const markEmailStatus = async (email, status) => {
  try {
    const result = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { emailStatus: status } },
      { new: false }
    );
    if (result) {
      console.log(`[SES Webhook] Marked ${email} as ${status}`);
    } else {
      // Address not in our DB — log and move on (no user to suppress)
      console.warn(`[SES Webhook] No user found for ${email} — cannot mark ${status}`);
    }
  } catch (err) {
    console.error(`[SES Webhook] DB error marking ${email} as ${status}: ${err.message}`);
  }
};

/**
 * POST /api/webhooks/aws-ses
 *
 * Receives AWS SNS notifications forwarded by the SES event destination.
 * SNS sends a Content-Type of text/plain with a JSON string body, so the
 * raw text parser is applied in app.js before global body-parser.
 *
 * Handles:
 *  - SubscriptionConfirmation  → auto-confirms the SNS subscription
 *  - Notification/Bounce       → marks recipient(s) as BOUNCED in the DB
 *  - Notification/Complaint    → marks recipient(s) as COMPLAINED in the DB
 */
router.post("/aws-ses", async (req, res) => {
  // req.body is a raw string here (parsed by express.text in app.js)
  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON payload" });
  }

  const snsType = payload?.Type;

  // ─── SNS SubscriptionConfirmation ─────────────────────────────────────────
  if (snsType === "SubscriptionConfirmation") {
    const subscribeUrl = payload.SubscribeURL;
    if (!subscribeUrl) {
      return res.status(400).json({ success: false, message: "Missing SubscribeURL" });
    }
    try {
      await fetch(subscribeUrl);
      console.log("[SES Webhook] SNS subscription confirmed");
    } catch (err) {
      console.error("[SES Webhook] Failed to confirm SNS subscription:", err.message);
    }
    return res.status(200).json({ success: true, message: "Subscription confirmed" });
  }

  // ─── SNS Notification ─────────────────────────────────────────────────────
  if (snsType === "Notification") {
    let notification;
    try {
      notification = JSON.parse(payload.Message);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid notification message JSON" });
    }

    const notifType = notification?.notificationType;

    if (notifType === "Bounce") {
      const recipients = notification.bounce?.bouncedRecipients ?? [];
      await Promise.allSettled(
        recipients.map(({ emailAddress }) => markEmailStatus(emailAddress, "BOUNCED"))
      );
      return res.status(200).json({
        success: true,
        message: `Bounce processed for ${recipients.length} recipient(s)`,
      });
    }

    if (notifType === "Complaint") {
      const recipients = notification.complaint?.complainedRecipients ?? [];
      await Promise.allSettled(
        recipients.map(({ emailAddress }) => markEmailStatus(emailAddress, "COMPLAINED"))
      );
      return res.status(200).json({
        success: true,
        message: `Complaint processed for ${recipients.length} recipient(s)`,
      });
    }

    // Delivery success notifications and other types — acknowledge and ignore
    return res.status(200).json({ success: true, message: `Notification type '${notifType}' ignored` });
  }

  // Unknown SNS message type — return 200 so SNS does not retry
  return res.status(200).json({ success: true, message: `Unknown SNS type '${snsType}' ignored` });
});

export default router;
