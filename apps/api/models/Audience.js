import mongoose from 'mongoose';
const { Schema } = mongoose;

const AudienceSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    event_id: {
        type: String,
        require: true,
    },
    user_id: {
        type: String,
        require: true,
    },
    eventname: {
        type: String,
        require: true,
    },
    amount:{
        type: Number,
        require: true,
    },
    isFreeTicket:{
        type: Boolean,
        default: false, // true if amount is 0 (free event ticket)
    },
    numOfTicket:{
        type: Number,
        require: true,
    },
    ticketNumber: {
        type: Number,
        default: null,
    },
    reference: {
        type: String,
        uppercase: true,
        unique: true,
        sparse: true,   // allows multiple docs with no reference (free tickets pre-QR)
    },
    type: {
        type: String,
        required: true,
        lowercase: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    phone: {
        type: Number,
    },
    email: {
        type: String,
        lowercase: true,
        trim:true
    },

    // ─── Ticket Status ─────────────────────────────
    status: {
        type: String,
        enum: ['active', 'used', 'transferred', 'refunded', 'ended', 'escrow', 'cancelled'],
        default: 'active',
    },

    // ─── Referral Redemption ────────────────────────
    referralRedeemed: {
        type: Boolean,
        default: false,
    },
    referralCreditedAt: {
        type: Date,
        default: null,
    },

    // ─── Split Ticket Lineage ───────────────────────
    // Set on child documents created by a partial transfer.
    // Null on original (non-split) tickets.
    parentTicketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Audience',
        default: null,
    },

    // ─── QR Code ───────────────────────────────────
    qrCode: {
        // Server-generated QR code data URL
        type: String,
        default: null,
    },

    // ─── Face Ownership ────────────────────────────
    faceOwner: {
        // user_id of the person whose face is linked
        // to this ticket. Changes on transfer.
        type: String,
        default: null,
    },
    faceLinkedAt: {
        type: Date,
        default: null,
    },

    // ─── Ticket Transfer ───────────────────────────
    transferredTo: {
        // user_id of recipient on transfer
        type: String,
        default: null,
    },
    transferredFrom: {
        // user_id of original owner (audit trail)
        type: String,
        default: null,
    },
    transferredAt: {
        type: Date,
        default: null,
    },
    transferToken: {
        // Secure one-time token for accepting transfer
        type: String,
        default: null,
        select: false,
    },

    // ─── Check-in ──────────────────────────────────
    checkedIn: {
        type: Boolean,
        default: false,
    },
    checkedInAt: {
        type: Date,
        default: null,
    },
    checkedInMethod: {
        // How entry was granted
        type: String,
        enum: ['face', 'qr', 'manual', null],
        default: null,
    },

    // ─── TOTP ──────────────────────────────────────
    totpSecret: {
        type: String,
        select: false,
        default: null,
    },
},
    { timestamps: true });

export default mongoose.model("Audience", AudienceSchema)