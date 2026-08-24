import mongoose from 'mongoose';
const { Schema } = mongoose;

const CoOrganizerSchema = new Schema({
    event_id: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    permissions: {
        type: [String],
        enum: ['checkin', 'analytics', 'edit', 'manage_tickets'],
        default: ['checkin'],
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'removed'],
        default: 'pending',
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// One invite per email per event
CoOrganizerSchema.index({ event_id: 1, email: 1 }, { unique: true });

export default mongoose.model('CoOrganizer', CoOrganizerSchema);
