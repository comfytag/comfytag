import Users from '../models/User.js'
import { createError } from '../utils/error.js'
import { verifyToken } from '../utils/verifyToken.js'
import Token from '../models/token.js'
import { sendEmails }  from '../utils/sendEmail.js'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import Joi  from  "joi";
import jwt from 'jsonwebtoken'
import { generateFallbackCode } from '../utils/referralCode.js'


// ONBOARDING

export const onboardUser = async (req, res, next) => {
    
    try {
        const onboardUser = await Users.findByIdAndUpdate(
            req.params.id,
            { $set: {onboarding: req.body} },
            { new: true }
        )
         
        res.status(200).json(onboardUser)
    } catch (err) {
        next(err)
    }
}

// // Login
// export const login = async (req,res,next) =>{
// 	try {
// 		const { error } = validate(req.body);
// 		if (error)
// 			return res.status(400).send({ message: error.details[0].message });

// 		const user = await Users.findOne({ username: req.body.username });
// 		if (!user)
// 			return res.status(401).send({ message: "Invalid username or Password" });

// 		const validPassword = bcrypt.compare(
//             req.body.password,
//             user.password
//         );
// 		if (!validPassword)
// 			return res.status(401).send({ message: "Invalid username or Password" });

// 		if (!user.emailVerified) {
// 			let token = await Token.findOne({ userId: user._id });
// 			if (!token) {
// 				token = await new Token({
// 					userId: user._id,
// 					token: crypto.randomBytes(32).toString("hex"),
// 				}).save();
// 				const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
// 				await sendEmails(user.email, "Verify Email", url);
// 			}

// 			return res
// 				.status(400)
// 				.send({ message: "An Email sent to " + user.email + " please verify " + sendEmails(email, subject, text)})
//                 .console.log(sendEmails(user.email, "Verify Email", url))
// 		}

// 		const token = user.generateAuthToken();
//         const data = {status: true, user, token, message: "logged in successfully" }
// 		res.cookie("access_token", token, {
//             httpOnly: true
//         }).status(200).json(data);
        
// 		// user.token = user.generateAuthToken();
// 		// res.status(200).send({user, message: "logged in successfully" });
// 	} catch (error) {
        
// 		res.status(500).send({ message: "Internal Server Error Here" + error});
// 	}
// };

// const validate = (data) => {
// 	const schema = Joi.object({
// 		username: Joi.string().required().label("username"),
// 		password: Joi.string().required().label("Password"),
// 	});
// 	return schema.validate(data);
// };

// export const login = async (req,res,next) =>{
//     try{
//        const userInfo = await Users.findOne({username:req.body.username})
//        if(!userInfo) return next(createError(401, "User not found"))

//        const isPassword = await bcrypt.compare(req.body.password, userInfo.password); // true
//        if(!isPassword) return  next(createError(400, "Password is wrong"))
        

//        const token = jwt.sign({id:userInfo._id, isAdmin: userInfo.isAdmin}, process.env.JWT)
//        userInfo.token = token
//        const {password, isAdmin, ...OtherDetails} = userInfo._doc
//         res.cookie("access_token", token, {
//             httpOnly: true
//         }).status(200).json({...OtherDetails})
//     }catch(err){
//        next(err)
//     }
// }

// UPDATE



export const updateUser = async (req,res,next) =>{
    try{
        // Whitelist allowed fields — prevent privilege escalation
        const allowedFields = [
            'username', 'name', 'email', 'phone', 'businessName', 'address', 'image', 'avatar', 'bgImg',
            'notificationPreferences', 'privacySettings',
        ];
        const updateData = {};
        allowedFields.forEach(field => {
            if (field in req.body) {
                updateData[field] = req.body[field];
            }
        });

        if ('username' in updateData) {
            const uname = (updateData.username ?? '').trim();
            if (uname === '') {
                return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
            }
            if (uname.includes('@')) {
                return res.status(400).json({ success: false, message: 'Usernames cannot be email addresses.' });
            }
            updateData.username = uname;
        }

        const updatedUser = await Users.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password')
        res.status(200).json(updatedUser)
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.username) {
            return next(createError(409, 'This username is already taken. Please choose another one.'))
        }
        next(err)
    }
}

// UPDATE
export const userVerification = async (req,res,next) =>{
    try{
        const verifyUser = await Users.findByIdAndUpdate(
            req.params.id,
           { $set: {
            verify: req.body.verify
           }},
           {new: true}
        )
        res.status(200).json(verifyUser)
    }catch(err){
        next(err)
    }
}
// UPDATE
export const isUserVerified = async (req,res,next) =>{
    try{
        const verifyUser = await Users.findByIdAndUpdate(
            req.params.id,
           { $set: {
            isVerify:  req.body.isVerify
           }},
           {new: true}
        )
        res.status(200).json(verifyUser)
    }catch(err){
        next(err)
    }
}
// DELETE
export const deleteUser = async (req,res,next) =>{
    try{
        await Users.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Users has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getUser = async (req,res,next) =>{
    try{
        // Try username lookup first so public profile URLs work with handles
        let user = await Users.findOne({ username: req.params.id })

        // Fall back to ObjectId lookup for direct _id links and legacy DB entries
        if (!user) {
            try {
                user = await Users.findById(req.params.id)
            } catch {
                // req.params.id was not a valid ObjectId — fall through to 404
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' })
        }

        // Lazily generate and persist referralFallbackCode for existing users
        let fallbackCode = user.referralFallbackCode;
        if (!fallbackCode) {
            fallbackCode = generateFallbackCode(user._id);
            try {
                user.referralFallbackCode = fallbackCode;
                await user.save();
            } catch {
                // Non-blocking: collision on sparse unique index won't break the request
            }
        }

        // Surface referralCode: prefer username when it is not an email address
        const hasValidUsername = user.username && !user.username.includes('@');
        const referralCode = hasValidUsername ? user.username : fallbackCode;

        const { password, isAdmin, ...OtherDetails } = user._doc;
        res.status(200).json({ ...OtherDetails, referralCode });
    }catch(err){
        next(err)
    }
}

// GET /users/:id/stats - Get organizer statistics
export const getUserStats = async (req, res, next) => {
    try {
        const userId = req.params.id

        // Import models here to avoid circular dependencies
        const Follow = (await import('../models/Follow.js')).default
        const Event = (await import('../models/Event.js')).default

        // Count followers
        const followerCount = await Follow.countDocuments({ followingId: userId })

        // Count upcoming events
        const upcomingEventCount = await Event.countDocuments({
            organizer_id: userId,
            date: { $gt: new Date() },
            status: 'published'
        })

        res.status(200).json({
            followers: followerCount,
            upcomingEvents: upcomingEventCount
        })
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const getAllUsers = async (req,res,next) =>{

    try{
        const getUsers = await Users.find().select('-password')
        res.status(200).json(getUsers)
    }catch(err){
        next(err)
    }
}

// PUT /users/:id/kyc
// Organizer uploads KYC documents
export const uploadKYC = async (req, res, next) => {
    try {
        // Handle both JSON body and multipart form data
        const { docType } = req.body
        const file = req.file

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            })
        }

        if (!docType) {
            return res.status(400).json({
                success: false,
                message: 'Document type (docType) is required'
            })
        }

        // Map document type to verify field
        const docMap = {
            photo: 'verify.photo',
            idCard: 'verify.idCard.front',
            address: 'verify.address'
        }

        const updateField = docMap[docType]
        if (!updateField) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document type'
            })
        }

        const updatedUser = await Users.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    [updateField]: file.filename || file.path,
                }
            },
            { new: true }
        )

        res.status(200).json({
            message: 'KYC documents uploaded',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                verify: updatedUser.verify,
            }
        })
    } catch (err) {
        next(err)
    }
}

// GET ADMIN
// export const getAdmin = async (req,res,next) =>{
//     try{
//         const getAdmin = await Users.find(
//             req.params.isAdmin
//             )
//             // const {password, isAdmin, ...OtherDetails} = getUser._doc
//             res.status(200).json(getAdmin)
//         // res.status(200).json(getUser)
//     }catch(err){
//         next(err)
//     }
// }