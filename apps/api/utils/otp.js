import Token from '../models/token.js';
import { enqueueEmail } from '../jobs/emailQueue.js';

/**
 * Mints a 6-digit verify-type OTP for `user`, atomically upserting it in
 * place of any existing verify-type token for this user (no separate
 * find-then-delete-then-create race), and emails it via the shared otp.hbs
 * template. Returns the enqueueEmail result so callers can branch on
 * delivery failure.
 */
export async function issueVerifyOtp(user) {
	const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
	await Token.findOneAndUpdate(
		{ userId: user._id, type: 'verify' },
		{ token: otpCode, createdAt: new Date() },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);
	return enqueueEmail({
		to: user.email,
		subject: 'Your ComfyTag Verification Code',
		template: 'otp.hbs',
		data: {
			otp: otpCode,
			year: new Date().getFullYear(),
		},
	});
}
