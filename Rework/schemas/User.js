import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'
import Joi  from  "joi";
import passwordComplexity  from "joi-password-complexity";
const { Schema } = mongoose;

const UserSchema = new Schema({
    token: { type: String, },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, required: true, },
        email: { type: String, required: true, lowercase: true },
        // emailVerified: { type: Boolean, default: false },
        businessName: { 
            type: String,
            lowercase: true,
         },
        phone: { type: String },
        password: { type: String, required: true, },
        events: { type: [String], },
        isAdmin: { type: Boolean, default: false },
        role: {
            type: String,
            enum: ['super_admin', 'finance', 'kyc_reviewer', 'support', 'moderator', 'viewer'],
            default: 'viewer',
        },
        suspended: { type: Boolean, default: false },
        isPartner: { type: Boolean, default: false },
        image: { type: String, },
        avatar: { type: String, },
        bgImg: { type: String, },
        address: { type: String, lowercase: true },
        verify: {
            type: {
                photo: { type: String, }, // selfie
                idType: { type: String, enum: ['nin', 'passport', 'voters_card'] },
                idDocument: { type: String, },
            }
        },
        isVerify: {
            type: {
                email: { type: Boolean, default: false },
            }
        },
        onboarding: {
            type: {
                experience: { type: String, lowercase: true, },
                team: {type : String, lowercase: true, },
                event_per_year: { type: String },
                event_turnout: { type: String},
                interest: {type : [String]},
                completed: { type: Boolean, default: false },
            }
        },
        premium: { type: Boolean, default: false },

        // ─── KYC Tracking ─────────────────────────────
        kycStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified',
        },
        kycRejectionReason: { type: String, default: null },
        kycRejectedAt: { type: Date, default: null },

        // ─── Face Recognition ──────────────────────────
        faceEnrolled: {
            type: Boolean,
            default: false,
        },
        faceTemplate: {
            // Encrypted face template stored as base64 string
            // Processed on-device by KBY-AI SDK
            // Never stored as raw biometric data
            type: String,
            default: null,
            select: false, // Never returned in API queries by default
        },
        faceEnrolledAt: {
            type: Date,
            default: null,
        },
        faceEnrollmentDevice: {
            // Records which device performed enrollment
            // for audit purposes
            type: String,
            default: null,
            select: false,
        },

        // ─── Two-Factor Authentication (2FA) ────────────
        totpSecret: {
            // Base32-encoded secret for TOTP (Time-based OTP)
            // Generated when user enables 2FA
            // Used with speakeasy for OTP verification
            type: String,
            default: null,
            select: false,
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        // ─── Email Deliverability (AWS SES bounce/complaint suppression) ───
        emailStatus: {
            type: String,
            enum: ['active', 'BOUNCED', 'COMPLAINED'],
            default: 'active',
        },

        notificationPreferences: {
            type: {
                email: { type: Boolean, default: true },
                sms:   { type: Boolean, default: true },
            },
            default: () => ({ email: true, sms: true }),
        },
        privacySettings: {
            type: {
                publicProfile: { type: Boolean, default: true },
                showInSearch:  { type: Boolean, default: true },
            },
            default: () => ({ publicProfile: true, showInSearch: true }),
        },
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
            default: null,
        },
        referralFallbackCode: {
            // Stable 8-digit numeric code derived from _id.
            // Used for referral tracking when user has no valid username.
            // No default — leaving the field absent (undefined) so the sparse
            // index ignores new documents until the code is generated post-save.
            type: String,
            unique: true,
            sparse: true,
        },
    // },
    // password: { type: String, required: true, }
// }
},
{timestamps: true }
);


UserSchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
		{
			id: this._id.toString(),
			_id: this._id.toString(),
			email: this.email,
			isPartner: !!this.isPartner,
			isAdmin: !!this.isAdmin,
			role: this.role || 'viewer',
		},
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
	return token;
};

// UserSchema.methods.generateAuthToken = function () {
// 	const tokens = jwt.sign({ _id: this._id }, process.env.JWT, {
// 		expiresIn: "10h",
// 	});
// 	return UserSchema.token = tokens ;
// };

export default mongoose.model("User", UserSchema)

//  const User = mongoose.model("user", UserSchema);

export const validatRegister = (data) => {
	const schema = Joi.object({
		username: Joi.string().required().label("Username"),
		name: Joi.string().required().label("Name"),
		// phone: Joi.string().required().label("Phone"),
		email: Joi.string().email().required().label("Email"),
		password: passwordComplexity().required().label("Password"),
		confirm_password: Joi.string().required().label("Confirm password"),
		isPartner: Joi.boolean().optional(),
	});
	return schema.validate(data);
};

export const validatePasswordReset = (data) => {
	const schema = Joi.object({
		identifier: Joi.string().required().label("Email or phone"),
		resetToken: Joi.string().required().label("Reset token"),
		newPassword: passwordComplexity().required().label("New password"),
	});
	return schema.validate(data);
};

// module.exports = { User, validate };
// export default { User, validate };
