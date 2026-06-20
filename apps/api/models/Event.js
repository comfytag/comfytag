import mongoose from 'mongoose';
const { Schema } = mongoose;

const EventSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
    },
    planner_id: {
        type: String,
        required: true,
    },
    planner: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    headline: {
        type: String,
        trim: true,
        maxlength: 150,
    },
    date: {
        type: Date,
        // default: Date.now,
    },
    ticketType: {
        type: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true, default: 0 },
                capacity: { type: Number, required: true, default: 0 },
                sold: { type: Number, default: 0 },
            }
        ],
        default: [],
    },
    venue: { type: String, lowercase: true },
    startTime: { type: String },
    endTime: { type: String },
    table: {
        type: [Object],
        default: []
    },
    ticket_end: {
        type: Date
    },
    event_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'ended', 'cancelled'],
        default: "draft",
        lowercase: true,
    },
    pick: {
        type: Boolean,
        default: false,
    },
    images: {
        type: [String],
        default: [],
    },
    address: {
        type: String,
        required: true,
        lowercase: true,
    },
    location: {
        type: String,
        lowercase: true,
        // required: true,
    },
    state: {
        type: String,
        required: true,
        lowercase: true,
    },
    sold: {
        type: Number,
        default: 0,
    },
    totalCapacity: {
        type: Number,
        default: 0,
    },
    videoUrl: {
        type: String,
        default: '',
    },
    recapPhotos: {
        type: [{ type: String }],
        default: [],
    },
    gateRules: {
        type: [{ type: String }],
        default: [],
    },
    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    slug: {
        type: String,
        index: true,
    },
    promos: {
        type: [
            {
                code: { type: String, required: true },
                discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
                discountValue: { type: Number, required: true },
                maxUses: { type: Number },
                usedCount: { type: Number, default: 0 },
                expiresAt: { type: Date },
                isActive: { type: Boolean, default: true },
                createdAt: { type: Date, default: Date.now },
            }
        ],
        default: [],
    },
},
    { timestamps: true });

EventSchema.index({ name: 'text', description: 'text', address: 'text' })

EventSchema.pre('save', function (next) {
    this.totalCapacity = this.ticketType.reduce((sum, t) => sum + (t.capacity || 0), 0);
    next();
});

export default mongoose.model("Event", EventSchema)