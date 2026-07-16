import express from "express";
import User from "../models/User.js";
import {validatRegister, validatePasswordReset} from "../models/User.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Token from '../models/token.js'
import { sendEmails, FROM_HELLO, FROM_PARTNER } from '../utils/sendEmail.js'
import crypto from 'crypto'
import Joi  from  "joi";
import { constants } from "buffer";
import { createError } from '../utils/error.js';
import speakeasy from 'speakeasy';
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification, notifyAdmins } from './notification.js';
import { generateReferralCode, generateFallbackCode } from '../utils/referralCode.js';
import { issueVerifyOtp } from '../utils/otp.js';


const router = express.Router()

/**
 * Enqueue welcome email series for attendees or organizers
 * Re-checks conditions before sending conditional emails
 * @param {string} userId - User ID for email context
 * @param {string} type - 'attendee' or 'organizer'
 * @param {Object} userData - User object with email, name, etc.
 */
const enqueueWelcomeSeries = async (userId, type, userData) => {
	try {
		if (!userData.notificationPreferences?.email) {
			console.log(`[Welcome Series] Email notifications disabled for ${userData.email}, skipping`);
			return;
		}

		const baseUrl = process.env.BASE_URL || 'https://comfytag.com';
		const mobileDeepLinkBase = process.env.MOBILE_DEEP_LINK_BASE || 'comfytag://';

		if (type === 'attendee') {
			// Attendee Welcome Series (3 emails)
			const templateData = {
				name: userData.name,
				email: userData.email,
				year: new Date().getFullYear(),
				unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
				preferencesUrl: `${baseUrl}/preferences`,
			};

			// Email 1: Immediate
			await enqueueEmail({
				to: userData.email,
				subject: 'Welcome to ComfyTag! 🎉',
				template: 'attendeeWelcome1.hbs',
				data: templateData,
				delay: 0,
				from: FROM_HELLO,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Email 1:`, err));

			// Email 2: +24h (conditional: email not verified)
			await enqueueEmail({
				to: userData.email,
				subject: 'Verify Your Email - Stay Connected',
				template: 'attendeeWelcome2.hbs',
				data: {
					...templateData,
					verifyUrl: `${baseUrl}/verify-email`,
				},
				delay: 24 * 60 * 60 * 1000, // 24 hours
				from: FROM_HELLO,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Email 2:`, err));

			// Email 3: +72h (conditional: face not enrolled)
			await enqueueEmail({
				to: userData.email,
				subject: 'Your Ticket Is Ready - No QR Needed! 👤',
				template: 'attendeeWelcome3.hbs',
				data: {
					...templateData,
					deepLink: `${mobileDeepLinkBase}enroll-face`,
					enrollUrl: `${baseUrl}/app/enroll-face`,
				},
				delay: 72 * 60 * 60 * 1000, // 72 hours
				from: FROM_HELLO,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Email 3:`, err));

		} else if (type === 'organizer') {
			// Organizer Welcome Series (5 emails)
			const templateData = {
				name: userData.name,
				businessName: userData.businessName || userData.name,
				email: userData.email,
				year: new Date().getFullYear(),
				unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
				preferencesUrl: `${baseUrl}/partner/preferences`,
				supportUrl: `${baseUrl}/support`,
				dashboardUrl: process.env.PARTNER_URL || `${baseUrl}/partner/overview`,
			};

			// Email 1: Immediate
			await enqueueEmail({
				to: userData.email,
				subject: 'Welcome to ComfyTag Partner! 🚀',
				template: 'organizerWelcome1.hbs',
				data: templateData,
				delay: 0,
				from: FROM_PARTNER,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Organizer Email 1:`, err));

			// Email 2: +2d (conditional: KYC not verified)
			await enqueueEmail({
				to: userData.email,
				subject: 'Complete Your Profile - Get Verified',
				template: 'organizerWelcome2.hbs',
				data: {
					...templateData,
					kycUrl: `${baseUrl}/partner/kyc`,
				},
				delay: 2 * 24 * 60 * 60 * 1000, // 2 days
				from: FROM_PARTNER,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Organizer Email 2:`, err));

			// Email 3: +4d (conditional: Bank doc not uploaded)
			await enqueueEmail({
				to: userData.email,
				subject: 'Set Up Payouts - Complete Your Banking Info',
				template: 'organizerWelcome3.hbs',
				data: {
					...templateData,
					bankUrl: `${baseUrl}/partner/settings/bank`,
				},
				delay: 4 * 24 * 60 * 60 * 1000, // 4 days
				from: FROM_PARTNER,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Organizer Email 3:`, err));

			// Email 4: +7d (conditional: no events created)
			await enqueueEmail({
				to: userData.email,
				subject: 'Create Your First Event - We\'ll Help! 📅',
				template: 'organizerWelcome4.hbs',
				data: {
					...templateData,
					eventUrl: `${baseUrl}/partner/events/create`,
					testimonialQuote: 'ComfyTag made it so easy to sell out my first show in 48 hours.',
					testimonialAuthor: 'Tunde O.',
					testimonialRole: 'Event Organizer, Lagos',
				},
				delay: 7 * 24 * 60 * 60 * 1000, // 7 days
				from: FROM_PARTNER,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Organizer Email 4:`, err));

			// Email 5: +12d (conditional: still no events created)
			await enqueueEmail({
				to: userData.email,
				subject: 'Your ComfyTag Dashboard Is Ready for Your First Event',
				template: 'organizerWelcome5.hbs',
				data: {
					...templateData,
					eventUrl: `${baseUrl}/partner/events/create`,
					tutorialUrl: `${baseUrl}/partner/help/getting-started`,
				},
				delay: 12 * 24 * 60 * 60 * 1000, // 12 days
				from: FROM_PARTNER,
			}).catch(err => console.error(`[Welcome Series] Failed to queue Organizer Email 5:`, err));
		}

		console.log(`[Welcome Series] ${type} series queued for ${userData.email}`);
	} catch (error) {
		console.error(`[Welcome Series] Error queuing welcome series:`, error);
		// Do not throw - log and continue (don't block user registration)
	}
};

export const register = async (req,res,next) =>{
	try {
		const { error } = validatRegister(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email.toLowerCase() });
		if (user)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });
		
				let username = await User.findOne({ username: req.body.username });
		if (username)
			return res
				.status(409)
				.send({ message: "Username already Exist!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		// Defensive: strip kycStatus if the payload explicitly passes null so the
		// schema default ('unverified') is applied cleanly and no ValidationError fires.
		const { kycStatus: _ks, ...safeBody } = req.body;

		// generateReferralCode is seeded from the username but includes random
		// characters specifically so it won't collide — but a random collision is
		// still possible (birthday paradox), so retry with a freshly generated
		// code rather than let a rare collision surface as a raw 500.
		for (let attempt = 1; ; attempt++) {
			try {
				user = await new User({
					name:      safeBody.name,
					username:  safeBody.username,
					email:     safeBody.email,
					password:  hashPassword,
					isPartner: safeBody.isPartner === true,
					referralCode: generateReferralCode(req.body.username, req.body.name),
				}).save();
				break;
			} catch (saveError) {
				if (saveError.code === 11000 && saveError.keyPattern?.referralCode && attempt < 5) {
					continue;
				}
				throw saveError;
			}
		}

		// Generate and persist the deterministic fallback code now that _id is known.
		// Only assign + save if the code is a non-empty string — writing null here
		// would hit the unique sparse index and cause an E11000 duplicate key error.
		const fallbackCode = generateFallbackCode(user._id);
		if (fallbackCode) {
			user.referralFallbackCode = fallbackCode;
			await user.save();
		}

		// Track referral if a ref param was supplied on the registration URL
		const refParam = req.query.ref;
		if (refParam) {
			await User.findOne({
				$or: [{ username: refParam }, { referralFallbackCode: refParam }]
			}).then(referrer => {
				if (referrer) {
					// TODO: persist referral record or increment referrer reward counter
					console.log(`[Referral] New user ${user._id} referred by ${referrer._id}`);
				}
			}).catch(err => console.error('[Referral] Lookup error:', err.message));
		}

		// Send OTP verification email
		try {
			const emailResult = await issueVerifyOtp(user);
			if (!emailResult.success) {
				console.error(`[Auth] ERROR: Verification email failed for ${user.email}: ${emailResult.error}`);
				return res.status(500).json({ message: "Failed to send verification email. Please try again." });
			}
		} catch (err) {
			console.error(`[Auth] ERROR: Exception sending verification email - ${err.message}`);
			return res.status(500).json({ message: "Failed to send verification email. Please try again." });
		}

		// Enqueue welcome series based on registration type
		if (!user.isPartner) {
			// Attendee registration - enqueue attendee welcome series
			enqueueWelcomeSeries(user._id.toString(), 'attendee', user.toObject()).catch(err =>
				console.error('[Auth] ERROR: Welcome series error (non-blocking) - ' + err.message)
			);
		} else {
			// New organizer — notify support admins
			const io = req.app?.locals?.io ?? null
			notifyAdmins({
				roles: ['support'],
				type: 'organizer_registered',
				title: 'New organizer registered',
				message: `${user.name} (${user.email}) just created an organizer account`,
				data: { userId: user._id.toString(), email: user.email, name: user.name },
				io,
			}).catch(() => {})
		}

		const { password: _pw, ...safeUser } = user.toObject()
		res
			.status(201)
			.send({
				message: "An Email sent to " + user.email + " please verify",
				data: {
					...safeUser,
					referralCode: user.referralCode,
				}
			});
	} catch (error) {
		if (error.code === 11000 && error.keyPattern?.username) {
			return next(createError(409, 'This username is already taken. Please choose another one.'))
		}
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" + error});
	}
};

	export const verifyEmail = async (req,res,next) =>{
	try {
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link or user does not exist" });
		// console.log("Why here ");

		const token = await Token.findOne({
			userId: user._id,
			type: 'verify',
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link or token expired" });
		await User.findByIdAndUpdate({ _id: user._id},
			{ $set: { "isVerify.email": true } },
			{ new: true }
		)
		await token.deleteOne();

		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
};


// Login with 2FA support
export const login = async (req,res,next) =>{
	try {
		const { email, password, otp } = req.body;

		const user = await User.findOne({ email: email.toLowerCase() }).select('+totpSecret');
		if (!user)
			return res.status(401).json({ error: 'User not found', message: "Invalid username or Password" });

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword)
			return res.status(401).json({ error: 'Invalid credentials', message: "Invalid username or Password" });

		if (!user.isVerify?.email) {
			return res.status(403).json({ message: "Your account is not verified yet. Please check your email for the verification link to complete registration." });
		}

		// Check if user has 2FA enabled (has totpSecret set)
		if (user.totpSecret) {
			if (!otp) {
				// First step of login — password valid, but OTP required
				return res.status(401).json({ error: 'TWO_FACTOR_REQUIRED', message: "Two-factor authentication required" });
			}

			// Verify OTP using speakeasy
			const verified = speakeasy.totp.verify({
				secret: user.totpSecret,
				encoding: 'base32',
				token: otp.toString(),
				window: 1
			});

			if (!verified) {
				return res.status(401).json({ error: 'Invalid OTP', message: "Invalid or expired code" });
			}
		}

		const token = user.generateAuthToken();
		const data = {
			status: true,
			user: {
				_id: user._id,
				email: user.email,
				name: user.name,
				username: user.username,
				image: user.image,
				isPartner: user.isPartner,
				isAdmin: user.isAdmin,
				isVerify: user.isVerify,
				role: user.role || 'viewer',  // Ensure role is always returned (TASK 2)
				referralCode: user.referralCode,
				createdAt: user.createdAt,
			},
			token,
			message: "logged in successfully"
		};
		res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json(data);
	} catch (error) {

		res.status(500).json({ error: 'Internal Server Error', message: "Internal Server Error: " + error.message});
	}
};

export const googleSignIn = async (req, res) => {
	try {
		const { email, isPartner: partnerIntent, name, image } = req.body
		if (!email) return res.status(400).json({ message: 'Email is required' })

		let user = await User.findOne({ email: email.toLowerCase() })

		if (!user) {
			// Create a new account from Google data — partner if the partner app
			// asked for it (isPartner intent), attendee otherwise. Google's OAuth
			// flow already proves email ownership, so this skips the OTP
			// verification step the credentials flow requires.
			const salt = await bcrypt.genSalt(parseInt(process.env.SALT ?? '12', 10))
			const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt)
			const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now()

			// generateReferralCode includes random characters but a collision is
			// still possible (birthday paradox) — retry with a fresh code rather
			// than let it surface as a raw 500, same as register().
			for (let attempt = 1; ; attempt++) {
				try {
					user = await new User({
						name: name ?? email.split('@')[0],
						username: baseUsername,
						email: email.toLowerCase(),
						password: tempPassword,
						isPartner: partnerIntent === true,
						image: image ?? null,
						referralCode: generateReferralCode(baseUsername, name),
					}).save()
					break;
				} catch (saveError) {
					if (saveError.code === 11000 && saveError.keyPattern?.referralCode && attempt < 5) {
						continue;
					}
					throw saveError;
				}
			}
			enqueueWelcomeSeries(user._id.toString(), partnerIntent ? 'organizer' : 'attendee', user.toObject()).catch(err =>
				console.error('[Auth] Google signup welcome series error:', err)
			)
		} else if (partnerIntent && !user.isPartner && !user.isAdmin) {
			// Upgrade existing attendee to partner — only when the caller explicitly
			// asked for it (partner app). A plain attendee signing into the web app
			// must never be blocked just for not being a partner.
			user = await User.findByIdAndUpdate(
				user._id,
				{ isPartner: true, 'onboarding.organizerRegisteredAt': new Date() },
				{ new: true }
			)
			enqueueWelcomeSeries(user._id.toString(), 'organizer', user.toObject()).catch(err =>
				console.error('[Auth] Google partner upgrade welcome series error:', err)
			)
		}

		// Lazily backfill referral codes in a single save
		const gcUpdates = {};
		if (!user.referralCode) gcUpdates.referralCode = generateReferralCode(user.username, user.name);
		if (!user.referralFallbackCode) gcUpdates.referralFallbackCode = generateFallbackCode(user._id);
		if (Object.keys(gcUpdates).length > 0) {
			try {
				Object.assign(user, gcUpdates);
				await user.save();
			} catch { /* non-blocking */ }
		}

		const token = user.generateAuthToken()
		res.status(200).json({
			status: true,
			user: {
				_id: user._id,
				email: user.email,
				name: user.name,
				username: user.username,
				image: user.image,
				isPartner: user.isPartner,
				isAdmin: user.isAdmin,
				isVerify: user.isVerify,
				referralCode: user.referralCode,
				createdAt: user.createdAt,
			},
			token,
			message: 'Google sign-in successful',
		})
	} catch (error) {
		res.status(500).json({ message: 'Internal Server Error: ' + error.message })
	}
};

// Verifies a 6-digit code and, on success, marks the account's email
// verified AND issues a real login session — this single endpoint now
// serves both "verify email after a failed unverified-account login" and
// "cold-start passwordless login" (request-otp -> this), since both flows
// want the identical outcome: prove inbox ownership, get signed in.
export const verifyEmailOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({ message: 'Email and verification code are required.' });
		}

		const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+totpSecret');
		// Same generic message for "no such user" and "wrong code" — this is
		// reachable from the cold-start login-OTP flow now, so it must not
		// distinguish account existence via message content.
		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired verification code.' });
		}

		const tokenDoc = await Token.findOne({ userId: user._id, type: 'verify', token: otp.toString().trim() });
		if (!tokenDoc) {
			return res.status(400).json({ message: 'Invalid or expired verification code.' });
		}
		await tokenDoc.deleteOne();

		if (!user.isVerify?.email) {
			// isVerify has no document-level default, so it can be undefined on
			// the in-memory doc for freshly-created users — mutating a
			// property on it directly would throw. Rebuild the object instead.
			user.isVerify = { photo: false, idCard: false, address: false, ...(user.isVerify ?? {}), email: true };
			user.markModified('isVerify');
			await user.save();
		}

		// Proving inbox ownership isn't the same as satisfying an explicitly
		// configured second factor — 2FA accounts still need their password
		// (+ TOTP code) to actually get a session, so email verification
		// happens here but no token is issued.
		if (user.totpSecret) {
			return res.status(200).json({
				success: true,
				emailVerified: true,
				requiresPassword: true,
				message: 'Email verified. Please sign in with your password.',
			});
		}

		const token = user.generateAuthToken();
		const data = {
			status: true,
			success: true,
			emailVerified: true,
			user: {
				_id: user._id,
				email: user.email,
				name: user.name,
				username: user.username,
				image: user.image,
				isPartner: user.isPartner,
				isAdmin: user.isAdmin,
				isVerify: user.isVerify,
				role: user.role || 'viewer',
				referralCode: user.referralCode,
				createdAt: user.createdAt,
			},
			token,
			message: 'Signed in successfully!',
		};
		res.cookie('access_token', token, { httpOnly: true }).status(200).json(data);
	} catch (error) {
		console.error(`[Auth] ERROR: verifyEmailOTP - ${error.message}`);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
};

// Request a passwordless login code from just an email address. Unlike
// sendVerifyEmail/resend-verification (which 404s on an unknown email,
// fine for an already-known-registered-account flow), this is reachable by
// anyone typing any email with zero prior context — it must never reveal
// whether the account exists.
export const requestLoginOtp = async (req, res) => {
	const GENERIC = { success: true, message: 'If an account exists for this email, a code has been sent.' };
	try {
		const email = req.body?.email?.toLowerCase().trim();
		if (!email) return res.status(400).json({ message: 'Email is required.' });

		const user = await User.findOne({ email }).select('+totpSecret');
		if (!user) return res.status(200).json(GENERIC);

		// 2FA accounts must not get email-OTP as a substitute second factor —
		// route them to password+2FA instead of sending a code that would
		// otherwise silently grant a session.
		if (user.totpSecret) {
			return res.status(200).json({ success: true, requiresPassword: true, message: 'Please sign in with your password.' });
		}

		const emailResult = await issueVerifyOtp(user);
		if (!emailResult.success) {
			console.error(`[Auth] ERROR: requestLoginOtp email failed for ${user.email}: ${emailResult.error}`);
		}
		return res.status(200).json(GENERIC);
	} catch (error) {
		console.error(`[Auth] ERROR: requestLoginOtp - ${error.message}`);
		return res.status(200).json(GENERIC);
	}
};

export const sendVerifyEmail = async (req,res,next) =>{

	try {
		// Supports both GET /verify/:email (legacy) and POST /resend-verification { email }
		const emailParam = req.params.email ?? req.body?.email
		const user = await User.findOne({ email: emailParam?.toLowerCase() });
		// The public POST path (VerifyEmailForm's "Resend code") is reachable for
		// emails that may not have an account — requestLoginOtp already treats
		// this as an anti-enumeration surface and never reveals existence, but
		// this endpoint used to 404 with "User not found", undermining that on
		// the same screen. Stay generic here too.
		if (!user) {
			return res.status(200).json({ message: 'If an account exists for this email, a code has been sent.' })
		}

		// Send OTP verification email
		try {
			const emailResult = await issueVerifyOtp(user);
			if (!emailResult.success) {
				console.error(`[Auth] ERROR: Resend verify email failed for ${user.email}: ${emailResult.error}`);
				return res.status(500).json({ message: "Failed to send verification email. Please try again." });
			}
		} catch (err) {
			console.error(`[Auth] ERROR: Exception sending resend verify email - ${err.message}`);
			return res.status(500).json({ message: "Failed to send verification email. Please try again." });
		}
		const { password: _pw, ...safeUser } = user.toObject();
		res
			.status(201)
			.send({ message: "An Email sent to " + user.email + " please verify", data: safeUser });

	} catch (error) {
			console.error(`[Auth] ERROR: Resend verify email endpoint - ${error.message}`);
			res.status(500).send({ message: "Internal Server Error" });
		}
};


export const verifyID = async (req,res,next) =>{
	try {
		const verify = req.params.kyc
		const { rejectionReason } = req.body || {}
		console.log(verify)
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "User does not exist" });

		const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

		if (verify === 'reject' || rejectionReason) {
			// KYC REJECTED
			await User.findByIdAndUpdate({ _id: req.params.id}, {
				$set: {
					kycStatus: 'rejected',
					kycRejectionReason: rejectionReason || 'Document clarity issue',
					kycRejectedAt: new Date(),
				}
			})

			// Create in-app notification
			const io = req.app.locals.io
			await createNotification({
				userId: req.params.id,
				type: 'kyc_rejected',
				title: 'KYC verification not approved',
				message: 'Please resubmit clearer documents',
				data: {
					rejectionReason: rejectionReason || 'Document clarity issue',
					reuploadLink: `${baseUrl}/partner/kyc`,
				},
				io,
			}).catch(err => console.error('[Notification] KYC rejected failed:', err.message))

			// Enqueue KYC rejected email (non-blocking)
			enqueueEmail({
				to: user.email,
				subject: "We need clearer documents — here's how",
				template: 'kycRejected.hbs',
				data: {
					organizerName: user.name,
					rejectionReason: rejectionReason || 'Your documents need to be clearer for verification',
					reuploadLink: `${baseUrl}/partner/kyc`,
					supportChatLink: `${baseUrl}/support/chat`,
					year: new Date().getFullYear(),
					unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
					preferencesUrl: `${baseUrl}/partner/preferences`,
				},
				from: 'support@comfytag.com',
				replyTo: 'support@comfytag.com',
			}).catch(err => console.error('[KYC Rejected] Queue failed:', err.message))

			res.status(200).send({ message: 'KYC rejection email sent' });
		} else {
			// KYC APPROVED
			// type.toLowerCase()
			await User.findByIdAndUpdate({ _id: req.params.id}, {
				$set: verify == "photo" ? {
					isVerify: {photo: true },
					kycStatus: 'verified' } :
				verify == "idcard" ? {
						isVerify: {idCard: true },
						kycStatus: 'verified' } :
				verify == "address" && {
						isVerify: {address: true},
						kycStatus: 'verified'},
						 new: true}

			)
			console.log(verify)

			// Create in-app notification
			const io = req.app.locals.io
			await createNotification({
				userId: req.params.id,
				type: 'kyc_approved',
				title: 'Identity verified ✓',
				message: 'You are now verified and can receive payouts',
				data: {
					verifyType: verify,
					bankSetupLink: `${baseUrl}/partner/settings/bank`,
				},
				io,
			}).catch(err => console.error('[Notification] KYC approved failed:', err.message))

			// Enqueue KYC approved email (non-blocking)
			enqueueEmail({
				to: user.email,
				subject: "Identity verified ✓ You're ready",
				template: 'kycApproved.hbs',
				data: {
					organizerName: user.name,
					bankSetupLink: `${baseUrl}/partner/settings/bank`,
					supportEmail: 'support@comfytag.com',
					year: new Date().getFullYear(),
					unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
					preferencesUrl: `${baseUrl}/partner/preferences`,
				},
				from: 'support@comfytag.com',
				replyTo: 'support@comfytag.com',
			}).catch(err => console.error('[KYC Approved] Queue failed:', err.message))

			// }))
			res.status(200).send({ message: `${verify} verified successfully` });
		}
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
};




  
















// export const login = async (req,res,next) =>{
//     try{
//        const userInfo = await User.findOne({username:req.body.username})
//        if(!userInfo) return next(createError(401, "User not found"))

//        const isPassword = await bcrypt.compare(req.body.password, userInfo.password); // true
//        if(!isPassword) return  next(createError(400, "Password is wrong"))


//        const token =jwt.sign({id:userInfo._id, isAdmin: userInfo.isAdmin}, process.env.JWT)
//        userInfo.token = token
//        const {password, isAdmin, ...OtherDetails} = userInfo._doc
//         res.cookie("access_token", token, {
//             httpOnly: true
//         }).status(200).json({...OtherDetails})
//     }catch(err){
//        next(err)
//     }
// }


// Copied from auth222.js
export const adminLogin = async (req,res,next) =>{
    try{
       const user = await User.findOne({username:req.body.username})
       if(!user) return next(createError(401, "User not found"))

       const isPassword = await bcrypt.compare(req.body.password, user.password); // true
       if(!isPassword) return  next(createError(400, "Password is wrong"))

       const token =jwt.sign({isAdmin: user.isAdmin}, process.env.JWT_SECRET)
       const {password, isAdmin, ...OtherDetails} = user._doc

       // Sanitize phone and avatar fields (defensive measure)
       const sanitizeString = (str) => {
         if (!str || typeof str !== 'string') return str;
         return str.replace(/â€"|â€™|â€˜|â€œ|â€|â„¹|â‚¦|Â·|â‰¥|â"€/g, '').trim();
       };

        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json({...OtherDetails, phone: sanitizeString(user.phone) || '', avatar: sanitizeString(user.avatar) || null, role: user.role || 'viewer'})  // Least-privilege fallback (TASK 2)
    }catch(err){
       next(err)
    }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Lazily backfill missing codes in a single save
    const updates = {};
    if (!user.referralCode) updates.referralCode = generateReferralCode(user.username, user.name);
    if (!user.referralFallbackCode) updates.referralFallbackCode = generateFallbackCode(user._id);
    if (Object.keys(updates).length > 0) {
      try {
        Object.assign(user, updates);
        await user.save();
      } catch { /* non-blocking */ }
    }

    // Surface referralCode: username if valid, else fallback code
    const hasValidUsername = user.username && !user.username.includes('@');
    const referralCode = hasValidUsername ? user.username : user.referralFallbackCode;

    // Clean corrupted UTF-8 sequences before returning (defensive measure)
    const sanitizeString = (str) => {
      if (!str || typeof str !== 'string') return str;
      return str.replace(/â€"|â€™|â€˜|â€œ|â€|â„¹|â‚¦|Â·|â‰¥|â"€/g, '').trim();
    };

    const { isAdmin, ...details } = user._doc
    res.status(200).json({ user: { ...details, phone: sanitizeString(user.phone) || '', avatar: sanitizeString(user.avatar) || null, referralCode }, token: user.generateAuthToken() })
  } catch (err) {
    next(err)
  }
}

export const registerAsOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return next(createError(404, 'User not found'))
    if (user.isPartner) {
      return res.status(200).json({
        message: 'Already an organizer',
        user,
        token: user.generateAuthToken()
      })
    }

    // Update user to organizer role
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isPartner: true,
        onboarding: {
          ...user.onboarding,
          organizerRegisteredAt: new Date(),
        }
      },
      { new: true }
    )

    // Enqueue organizer welcome series
    enqueueWelcomeSeries(updatedUser._id.toString(), 'organizer', updatedUser.toObject()).catch(err =>
      console.error('[Auth] Welcome series error (non-blocking):', err)
    );

    // Notify support admins about the new organizer
    const io = req.app?.locals?.io ?? null
    notifyAdmins({
      roles: ['support'],
      type: 'organizer_registered',
      title: 'New organizer registered',
      message: `${updatedUser.name} (${updatedUser.email}) upgraded to organizer`,
      data: { userId: updatedUser._id.toString(), email: updatedUser.email, name: updatedUser.name },
      io,
    }).catch(() => {})

    res.status(200).json({
      message: 'Organizer registration successful',
      user: updatedUser,
      token: updatedUser.generateAuthToken()
    })
  } catch (err) {
    next(err)
  }
}

// Forgot Password - Generate and send OTP
export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body
    if (!identifier) {
      return res.status(400).json({ message: 'Email or phone is required' })
    }

    // Safe literal match — never interpolate user input into RegExp (ReDoS risk)
    let user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash OTP with bcrypt
    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10)
    const hashedOtp = await bcrypt.hash(otp, salt)

    // Delete existing reset-purpose OTP token for this user if it exists —
    // scoped by type so this doesn't clobber a pending email-verification
    // or login-OTP token for the same user (they share the Token collection
    // but are independent per (userId, type)).
    await Token.deleteOne({ userId: user._id, type: 'reset' })

    // Create new reset token with OTP
    await new Token({
      userId: user._id,
      token: hashedOtp,
      type: 'reset'
    }).save()

    // Send OTP email with error handling
    try {
      const emailResult = await enqueueEmail({
        to: user.email,
        subject: 'Your ComfyTag Password Reset Code',
        template: 'otp.hbs',
        data: {
          otp,
          year: new Date().getFullYear(),
          unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
          preferencesUrl: `${baseUrl}/preferences`,
        },
      });
      if (!emailResult.success) {
        console.error(`[Auth] ERROR: Password reset OTP email failed for ${user.email}: ${emailResult.error}`);
        return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
      }
    } catch (err) {
      console.error(`[Auth] ERROR: Exception sending password reset OTP - ${err.message}`);
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    res.status(200).json({
      message: 'OTP sent to email',
      identifier: user.email
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error', error: error.message })
  }
}

// Verify OTP and return reset token
export const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body
    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Email/phone and OTP are required' })
    }

    // Safe literal match — never interpolate user input into RegExp (ReDoS risk)
    let user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find reset token for this user
    const tokenRecord = await Token.findOne({
      userId: user._id,
      type: 'reset'
    })

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid OTP' })
    }

    // Verify OTP against hashed token
    const isValidOtp = await bcrypt.compare(otp, tokenRecord.token)

    if (!isValidOtp) {
      return res.status(401).json({ message: 'Invalid OTP' })
    }

    // Generate short-lived reset JWT (5 minutes)
    const resetToken = jwt.sign(
      {
        userId: user._id.toString(),
        reset_password_allowed: true
      },
      process.env.JWT_SECRET || process.env.JWT,
      { expiresIn: '5m' }
    )

    res.status(200).json({
      message: 'OTP verified',
      resetToken
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error', error: error.message })
  }
}

// Reset Password using reset token
export const resetPassword = async (req, res, next) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { identifier, resetToken, newPassword } = req.body

    // Verify JWT reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || process.env.JWT)
    } catch (err) {
      return res.status(401).json({ message: 'Reset token invalid or expired' })
    }

    if (!decoded.reset_password_allowed) {
      return res.status(401).json({ message: 'Reset token invalid or expired' })
    }

    // Safe literal match — never interpolate user input into RegExp (ReDoS risk)
    let user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify the decoded userId matches the user being updated
    if (decoded.userId !== user._id.toString()) {
      return res.status(401).json({ message: 'Reset token does not match user' })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update user password
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    )

    // Delete the reset token
    await Token.deleteOne({
      userId: user._id,
      type: 'reset'
    })

    res.status(200).json({ message: 'Password reset successful' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error', error: error.message })
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user._id || req.user.id

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(userId).select('+password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    )

    res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error', error: error.message })
  }
}
