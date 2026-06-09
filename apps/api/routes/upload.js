import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { upload } from '../middleware/upload.js'
import { verifyToken } from '../utils/verifyToken.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const router = express.Router()

const UPLOAD_TIMEOUT_MS = 60_000
const REQUIRED_CLOUDINARY_VARS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']

function checkCloudinaryConfig(req, res, next) {
  const missing = REQUIRED_CLOUDINARY_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    return res.status(503).json({
      success: false,
      message: `Upload service not configured. Missing: ${missing.join(', ')}`,
    })
  }
  next()
}

function uploadToCloudinary(buffer, options) {
  const uploadPromise = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) {
        console.error('[Upload] Cloudinary stream error:', err.message, err.http_code)
        reject(err)
      } else {
        resolve(result)
      }
    })
    stream.on('error', (err) => {
      console.error('[Upload] Stream pipe error:', err.message)
      reject(err)
    })
    stream.end(buffer)
  })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(Object.assign(new Error('Upload timed out after 60s. Check your connection or try a smaller file.'), { status: 504 })),
      UPLOAD_TIMEOUT_MS
    )
  )

  return Promise.race([uploadPromise, timeoutPromise])
}

router.post('/', checkCloudinaryConfig, verifyToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const isVideo = req.file.mimetype.startsWith('video/')
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'comfytag/events',
      resource_type: isVideo ? 'video' : 'image',
    })

    res.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (err) {
    // Cloudinary uses http_code 401/403 for invalid credentials.
    // Never forward these as HTTP 401 — the client interprets that as session expiry.
    if (err.http_code === 401 || err.http_code === 403) {
      err.status = 503
      err.message = 'Upload service is not configured. Contact support.'
    } else if (!err.status && err.http_code) {
      err.status = err.http_code
    }
    next(err)
  }
})

export default router
