import Token from '../models/token.js';
import { enqueueEmail } from '../jobs/emailQueue.js';

const OTP_COPY = {
	verify: {
		subject: 'Your ComfyTag Verification Code',
		heading: 'Verify Your Email',
		intro: 'Use the one-time code below to verify your ComfyTag account. Do not share this code with anyone.',
		codeLabel: 'Your Verification Code',
		securityNotice: "If you didn't create a ComfyTag account, you can safely ignore this email.",
	},
	login: {
		subject: 'Your ComfyTag Sign-In Code',
		heading: 'Sign In to ComfyTag',
		intro: 'Use the one-time code below to sign in to your ComfyTag account. Do not share this code with anyone.',
		codeLabel: 'Your Sign-In Code',
		securityNotice: "If you didn't request this code, you can safely ignore this email. Your account is not at risk and no changes have been made.",
	},
};

/**
 * Mints a 6-digit verify-type OTP for `user`, atomically upserting it in
 * place of any existing verify-type token for this user (no separate
 * find-then-delete-then-create race), and emails it via the shared otp.hbs
 * template. `purpose` only controls the email copy ('verify' | 'login') —
 * the underlying token/TTL behavior is identical either way. Returns the
 * enqueueEmail result so callers can branch on delivery failure.
 */
export async function issueVerifyOtp(user, purpose = 'verify') {
	const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
	await Token.findOneAndUpdate(
		{ userId: user._id, type: 'verify' },
		{ token: otpCode, createdAt: new Date() },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);
	const copy = OTP_COPY[purpose] || OTP_COPY.verify;
	const baseUrl = process.env.BASE_URL || 'https://comfytag.com';
	return enqueueEmail({
		to: user.email,
		subject: copy.subject,
		template: 'otp.hbs',
		data: {
			otp: otpCode,
			year: new Date().getFullYear(),
			heading: copy.heading,
			intro: copy.intro,
			codeLabel: copy.codeLabel,
			securityNotice: copy.securityNotice,
			expiryText: '1 hour',
			unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
			preferencesUrl: `${baseUrl}/preferences`,
		},
	});
}
