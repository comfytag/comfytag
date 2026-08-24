import NewsletterSubscriber from '../models/NewsletterSubscriber.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /newsletter/subscribe — public, no auth (anonymous homepage capture)
export const subscribeToNewsletter = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' })
    }

    // Idempotent — resubscribing, or subscribing again after a future
    // unsubscribe, just upserts rather than erroring on the unique index.
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { $set: { active: true }, $setOnInsert: { source: req.body.source || 'homepage' } },
      { upsert: true, setDefaultsOnInsert: true }
    )

    res.status(200).json({ success: true, message: 'Subscribed.' })
  } catch (err) {
    next(err)
  }
}
