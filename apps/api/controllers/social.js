import EventLike from '../models/EventLike.js'
import Comment from '../models/Comment.js'
import Follow from '../models/Follow.js'
import Event from '../models/Event.js'
import User from '../models/User.js'
import { createError } from '../utils/error.js'

// ─── Like Controllers ────────────────────────────────────────────────────────

// POST /events/:id/like (auth)
// Toggle like on an event — creates or deletes an EventLike doc
export const toggleLike = async (req, res, next) => {
  try {
    const existing = await EventLike.findOne({
      user_id: req.user.id,
      event_id: req.params.id,
    })

    if (existing) {
      await EventLike.findByIdAndDelete(existing._id)
    } else {
      await EventLike.create({
        user_id: req.user.id,
        event_id: req.params.id,
      })
    }

    const likeCount = await EventLike.countDocuments({ event_id: req.params.id })

    res.status(200).json({
      liked: !existing,
      likeCount,
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/:id/like/status (public — optional auth)
// Returns current like count and whether the requesting user has liked it
export const getLikeStatus = async (req, res, next) => {
  try {
    const likeCount = await EventLike.countDocuments({ event_id: req.params.id })

    let liked = false
    if (req.user) {
      const existing = await EventLike.findOne({
        user_id: req.user.id,
        event_id: req.params.id,
      })
      liked = !!existing
    }

    res.status(200).json({ liked, likeCount })
  } catch (err) {
    next(err)
  }
}

// GET /events/saved (auth)
// Returns all events the authenticated user has liked/saved
export const getSavedEvents = async (req, res, next) => {
  try {
    const likes = await EventLike.find({ user_id: req.user.id })
    const eventIds = likes.map(l => l.event_id)
    const events = await Event.find({ _id: { $in: eventIds } })

    res.status(200).json(events)
  } catch (err) {
    next(err)
  }
}

// ─── Comment Controllers ─────────────────────────────────────────────────────

// POST /events/:id/comments (auth)
// Create a new comment on an event
export const postComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
      event_id: req.params.id,
      user_id: req.user.id,
      text: req.body.text,
    })

    const user = await User.findById(req.user.id).select('name image')

    res.status(201).json({
      ...comment.toObject(),
      userName: user?.name || '',
      userAvatar: user?.image || '',
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/:id/comments (public)
// Paginated comment list — pinned first, then newest
export const getComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      Comment.find({ event_id: req.params.id, isDeleted: false })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Comment.countDocuments({ event_id: req.params.id, isDeleted: false }),
    ])

    // Attach user info to each comment
    const userIds = [...new Set(comments.map(c => c.user_id))]
    const users = await User.find({ _id: { $in: userIds } }).select('name image')
    const userMap = {}
    users.forEach(u => {
      userMap[u._id.toString()] = u
    })

    const enriched = comments.map(c => {
      const user = userMap[c.user_id] || {}
      return {
        ...c.toObject(),
        userName: user.name || '',
        userAvatar: user.image || '',
      }
    })

    res.status(200).json({
      comments: enriched,
      total,
      page,
      hasMore: skip + comments.length < total,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /comments/:id (auth)
// Soft-delete a comment — owner, admin, or partner only
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return next(createError(404, 'Comment not found'))

    const isOwner = comment.user_id === req.user.id
    const isAdmin = req.user.isAdmin
    const isPartner = req.user.isPartner

    if (!isOwner && !isAdmin && !isPartner) {
      return next(createError(403, 'You are not authorized to delete this comment'))
    }

    comment.isDeleted = true
    await comment.save()

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}

// POST /comments/:id/pin (auth, organizer only)
// Pin a comment — only the event organizer can pin
export const pinComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return next(createError(404, 'Comment not found'))

    const event = await Event.findById(comment.event_id)
    if (!event) return next(createError(404, 'Event not found'))

    if (event.planner_id.toString() !== req.user.id) {
      return next(createError(403, 'Only the event organizer can pin comments'))
    }

    // Unpin all existing pinned comments for this event first
    await Comment.updateMany(
      { event_id: comment.event_id, isPinned: true },
      { isPinned: false }
    )

    comment.isPinned = true
    await comment.save()

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}

// POST /comments/:id/report (auth)
// Increment the report count on a comment
export const reportComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true }
    )
    if (!comment) return next(createError(404, 'Comment not found'))

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}

// ─── Follow Controllers ───────────────────────────────────────────────────────

// POST /organizers/:id/follow (auth)
// Toggle follow on an organizer
export const toggleFollow = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return next(createError(400, 'Cannot follow yourself'))
    }

    const existing = await Follow.findOne({
      follower_id: req.user.id,
      organizer_id: req.params.id,
    })

    if (existing) {
      await Follow.findByIdAndDelete(existing._id)
    } else {
      await Follow.create({
        follower_id: req.user.id,
        organizer_id: req.params.id,
      })
    }

    const followerCount = await Follow.countDocuments({ organizer_id: req.params.id })

    res.status(200).json({
      following: !existing,
      followerCount,
    })
  } catch (err) {
    next(err)
  }
}

// GET /organizers/:id/follow/status (public)
// Returns follower count and whether the requesting user follows this organizer
export const getFollowStatus = async (req, res, next) => {
  try {
    const followerCount = await Follow.countDocuments({ organizer_id: req.params.id })

    let following = false
    if (req.user) {
      const existing = await Follow.findOne({
        follower_id: req.user.id,
        organizer_id: req.params.id,
      })
      following = !!existing
    }

    res.status(200).json({ following, followerCount })
  } catch (err) {
    next(err)
  }
}

// GET /organizers/:id/stats (public)
// Returns aggregate stats for an organizer
export const getOrganizerStats = async (req, res, next) => {
  try {
    const organizerId = req.params.id

    const [followerCount, eventCount, soldResult] = await Promise.all([
      Follow.countDocuments({ organizer_id: organizerId }),
      Event.countDocuments({ planner_id: organizerId }),
      Event.aggregate([
        { $match: { planner_id: organizerId } },
        { $group: { _id: null, total: { $sum: '$sold' } } },
      ]),
    ])

    const totalTicketsSold = soldResult.length > 0 ? soldResult[0].total : 0

    res.status(200).json({ followerCount, eventCount, totalTicketsSold })
  } catch (err) {
    next(err)
  }
}
