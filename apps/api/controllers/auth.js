import express from "express";
import User from "../models/User.js";
import {validatRegister} from "../models/User.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Token from '../models/token.js'
import {sendEmails}  from '../utils/sendEmail.js'
import crypto from 'crypto'
import Joi  from  "joi";
import { constants } from "buffer";
import { createError } from '../utils/error.js';
import speakeasy from 'speakeasy';


const router = express.Router()

export const register = async (req,res,next) =>{
	try {
		const { error } = validatRegister(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
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

		user = await new User({
			name:      req.body.name,
			username:  req.body.username,
			email:     req.body.email,
			password:  hashPassword,
			isPartner: req.body.isPartner === true,
		}).save();

		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex")
		}).save();
		// const url = `${process.env.BASE_URL}partner/auth/${user._id}/verify/${token.token}`;
		const url =`Please click on the click below to verify your email \n
		${process.env.BASE_URL}partner/auth/${user._id}/verify/${token.token}`
		console.log(url)
		await sendEmails(user.email, "Verify Email", url);

		res
			.status(201)
			.send({ message: "An Email sent to " + user.email + " please verify", data: user });
	} catch (error) {
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
			token: req.params.token,
		});
		if (!token) return res.status(400).send({ message: "Invalid link or token expired" });
		await User.findByIdAndUpdate({ _id: user._id},
			{ $set: {
				isVerify: {email : true }
			   }},
			   {new: true}
		)
		await token.remove();

		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
};


// Login with 2FA support
export const login = async (req,res,next) =>{
	try {
		const { email, password, otp } = req.body;

		const user = await User.findOne({ email }).select('+totpSecret');
		if (!user)
			return res.status(401).json({ error: 'User not found', message: "Invalid username or Password" });

		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword)
			return res.status(401).json({ error: 'Invalid credentials', message: "Invalid username or Password" });

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
				image: user.image,
				isPartner: user.isPartner,
				isAdmin: user.isAdmin,
				isVerify: user.isVerify,
				role: user.role || 'viewer'  // Ensure role is always returned (TASK 2)
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

export const sendVerifyEmail = async (req,res,next) =>{

	try {
		const user = await User.findOne({ email: req.params.email });
		const userid = user._id

		// check if token exist and remove
		const checkToken = await Token.findOne({ userId: userid });
		if(checkToken){
			await checkToken.remove();
		}
		// Always create a new verification token
		const token = await new Token({
			userId: userid,
			token: crypto.randomBytes(32).toString("hex")
		}).save();
		// const url = `${process.env.BASE_URL}partner/auth/${user._id}/verify/${token.token}`;
		const url =`Please click on the click below to verify your email \n
		${process.env.BASE_URL}partner/auth/${token.userId}/verify/${token.token}`
		await sendEmails(user.email, "Verify Email", url);
		console.log(url)
		res
			.status(201)
			.send({ message: "An Email sent to " + user.email + " please verify", data: user });

	} catch (error) {
			console.log(error);
			res.status(500).send({ message: "Internal Server Error" + error});
		}
};


export const verifyID = async (req,res,next) =>{
	try {
		const verify = req.params.kyc
		console.log(verify)
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "User does not exist" });

			// type.toLowerCase()
			await User.findByIdAndUpdate({ _id: req.params.id},
				{
				$set: verify == "photo" ? {
					isVerify: {photo: true }} :
				verify == "idcard" ? {			
						isVerify: {idCard: true }} :
				verify == "address" && {
						isVerify: {address: true}},
						 new: true}
				
			)
		console.log(verify)

		// }))
		res.status(200).send({ message: `${verify} verified successfully` });
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

       const token =jwt.sign({isAdmin: user.isAdmin}, process.env.JWT)
       const {password, isAdmin, ...OtherDetails} = user._doc
        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json({...OtherDetails, role: user.role || 'viewer'})  // Least-privilege fallback (TASK 2)
    }catch(err){
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
        user
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

    res.status(200).json({
      message: 'Organizer registration successful',
      user: updatedUser
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

    // Find user by email (case-insensitive) or phone
    let user = await User.findOne({
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
        { phone: identifier }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash OTP with bcrypt
    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10)
    const hashedOtp = await bcrypt.hash(otp, salt)

    // Delete existing OTP token for this user if it exists
    await Token.deleteOne({ userId: user._id })

    // Create new reset token with OTP
    await new Token({
      userId: user._id,
      token: hashedOtp,
      type: 'reset'
    }).save()

    // Send OTP email
    const emailContent = `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 1 hour.`
    await sendEmails(user.email, 'Password Reset OTP', emailContent)

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

    // Find user by identifier
    let user = await User.findOne({
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
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
    const { identifier, resetToken, newPassword } = req.body
    if (!identifier || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Identifier, reset token, and new password are required' })
    }

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

    // Find user by identifier
    let user = await User.findOne({
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
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
