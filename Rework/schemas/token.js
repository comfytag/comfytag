import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "User",
	},
	token: { type: String, required: true },
	type: { type: String, enum: ['verify', 'reset'], default: 'verify' },
	createdAt: { type: Date, default: Date.now, expires: 3600 },
});

// One outstanding token per (user, purpose) — not one per user total. A bare
// unique index on userId alone meant a pending email-verification code and a
// pending password-reset code for the same user would silently clobber each
// other (whichever endpoint ran last would delete the other's token).
tokenSchema.index({ userId: 1, type: 1 }, { unique: true });

export default mongoose.model("token", tokenSchema)

