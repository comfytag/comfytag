import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'
import Joi  from  "joi";
import passwordComplexity  from "joi-password-complexity";
// import uniqueValidator from 'mongoose-unique-validator'
const { Schema } = mongoose;

const UserSchema = new Schema({
    token: { type: String, },
    // user:{
    username: { type: String, required: true,}, // unique: true },
        name: { type: String, required: true, },
        email: { type: String, required: true, lowercase: true },
        // emailVerified: { type: Boolean, default: false },
        businessName: { 
            type: String,
            lowercase: true,
         },
        phone: { type: Number },
        password: { type: String, required: true, },
        events: { type: [String], },
        isAdmin: { type: Boolean, default: false },
        role: { type: String, enum: ['super_admin', 'finance', 'moderator', 'viewer'], default: 'viewer' },
        isPartner: { type: Boolean, default: false },
        image: { type: String, },
        bgImg: { type: String, },
        address: { type: String, lowercase: true },
        verify: {
            type: {
                photo: { type: String, },
                // idCard: { type: String, },
                idCard: {
                front: { type: String },
                back: { type: String } 
                },
                address: { type: String, }
            }
        },
        isVerify: {
            type: {
                email: { type: Boolean, default: false },
                photo: { type: Boolean, default: false },
                idCard: { type: Boolean, default: false },
                address: { type: Boolean, default: false }
            }
        },
        onboarding: {
            type: {
                experience: { type: String, lowercase: true, },
                team: {type : String, lowercase: true, },
                event_per_year: { type: String },
                event_turnout: { type: String},
                interest: {type : [String]}
            }
        },
        premium: { type: Boolean, default: false },

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
			isPartner: !!this.isPartner,
			isAdmin: !!this.isAdmin,
		},
		process.env.JWT,
		{ expiresIn: "10h" }
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
	});
	return schema.validate(data);
};

// module.exports = { User, validate };
// export default { User, validate };
