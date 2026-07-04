import jwt from 'jsonwebtoken'
import { createError } from '../utils/error.js';

export const verifyToken = (req,res,next) =>{
    const cookie = req.cookies.access_token
    const bearerRaw = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7).trim()
        : null
    const bearer = bearerRaw && bearerRaw !== 'undefined' && bearerRaw !== 'null' ? bearerRaw : null
    const token = cookie || bearer
    if(!token){
         return next(createError(401,"You are not authenticated!"))
        }

    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if(err) return next(createError(403,"Token not valid!"));
        req.user = user;
        next()
    })
}


// For public routes that personalize their response when the caller happens
// to be logged in (e.g. "liked"/"following" flags) — decodes the token if
// present but never rejects the request when it's missing or invalid.
export const optionalAuth = (req, res, next) => {
    const cookie = req.cookies.access_token
    const bearerRaw = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7).trim()
        : null
    const bearer = bearerRaw && bearerRaw !== 'undefined' && bearerRaw !== 'null' ? bearerRaw : null
    const token = cookie || bearer
    if (!token) return next()

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) req.user = user
        next()
    })
}

export const verifyUser = (req,res, next) =>{
    verifyToken(req,res, (err) =>{
        if(err) return next(err);
        const userId = (req.user._id ?? req.user.id ?? '').toString()
        const paramUserId = req.params.id ?? req.params.userId ?? req.params.uid
        if(userId === paramUserId || req.user.isAdmin){
            next()
        } else{
            return next(createError(403,"You are not authorized!"));
        }
    })
}

export const verifyAdmin = (req,res, next) =>{
    verifyToken(req,res, (err) =>{
        if(err) return next(err);
        if(req.user.isAdmin){
            next()
        } else{
            return next(createError(403,"You are not an admin!"));
        }
    })
}

// Requires the caller to be a registered partner OR admin.
// Use on all /partner/*, /bank/*, and /withdraw/* routes.
export const verifyPartner = (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user.isPartner || req.user.isAdmin) {
            next();
        } else {
            return next(createError(403, "Partner access required!"));
        }
    });
}