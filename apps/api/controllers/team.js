import Event from '../models/Event.js';
import User from '../models/User.js';
import CoOrganizer from '../models/CoOrganizer.js';
import { createError } from '../utils/error.js';

// Resolve caller's string ID from the JWT payload regardless of field name.
const callerId = (req) => (req.user._id ?? req.user.id ?? '').toString();

// Confirm the caller owns the event (or is admin). Returns the event doc.
async function assertOwnership(req, next) {
    const event = await Event.findById(req.params.id);
    if (!event) { next(createError(404, 'Event not found')); return null; }
    if (event.planner_id.toString() !== callerId(req) && !req.user.isAdmin) {
        next(createError(403, 'You can only manage the team for your own events'));
        return null;
    }
    return event;
}

// GET /events/:id/team
export const listTeam = async (req, res, next) => {
    try {
        const event = await assertOwnership(req, next);
        if (!event) return;

        const team = await CoOrganizer.find({
            event_id: req.params.id,
            status: { $ne: 'removed' },
        })
            .populate('user_id', 'name email logo')
            .lean();

        res.status(200).json({ success: true, data: team });
    } catch (err) {
        next(err);
    }
};

// POST /events/:id/team
// Body: { email: string, permissions?: string[] }
export const addTeamMember = async (req, res, next) => {
    try {
        const { email, permissions } = req.body;
        if (!email || typeof email !== 'string') {
            return next(createError(400, 'email is required'));
        }

        const event = await assertOwnership(req, next);
        if (!event) return;

        const inviterId = callerId(req);
        const normalizedEmail = email.toLowerCase().trim();

        // Prevent the owner from inviting themselves
        const inviter = await User.findById(inviterId).select('email').lean();
        if (inviter?.email === normalizedEmail) {
            return next(createError(400, 'You cannot invite yourself as a co-organizer'));
        }

        // Resolve the invited user if they already have an account
        const invitedUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();

        // Re-activate a previously removed invite rather than creating a duplicate
        const existing = await CoOrganizer.findOne({ event_id: req.params.id, email: normalizedEmail });
        if (existing) {
            if (existing.status === 'active' || existing.status === 'pending') {
                return next(createError(409, 'This person is already on the team or has a pending invite'));
            }
            existing.status = invitedUser ? 'active' : 'pending';
            existing.invitedBy = inviterId;
            existing.permissions = permissions ?? ['checkin'];
            if (invitedUser) existing.user_id = invitedUser._id;
            await existing.save();
            return res.status(200).json({ success: true, data: existing, message: 'Invite re-sent' });
        }

        const member = new CoOrganizer({
            event_id: req.params.id,
            user_id: invitedUser?._id ?? null,
            email: normalizedEmail,
            permissions: permissions ?? ['checkin'],
            status: invitedUser ? 'active' : 'pending',
            invitedBy: inviterId,
        });

        await member.save();
        res.status(201).json({ success: true, data: member });
    } catch (err) {
        if (err.code === 11000) {
            return next(createError(409, 'This person is already on the team'));
        }
        next(err);
    }
};

// DELETE /events/:id/team/:userId
// :userId is the MongoDB User._id of the co-organizer being removed.
export const removeTeamMember = async (req, res, next) => {
    try {
        const event = await assertOwnership(req, next);
        if (!event) return;

        const member = await CoOrganizer.findOne({
            event_id: req.params.id,
            user_id: req.params.userId,
        });
        if (!member) return next(createError(404, 'Team member not found'));
        if (member.status === 'removed') return next(createError(409, 'Team member already removed'));

        member.status = 'removed';
        await member.save();

        res.status(200).json({ success: true, message: 'Team member removed' });
    } catch (err) {
        next(err);
    }
};
