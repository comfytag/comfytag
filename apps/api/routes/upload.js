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

const UPLOAD_TIMEOUT_MS = 30_000

function uploadToCloudinary(buffer, options) {
  const uploadPromise = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result)
    )
    stream.on('error', reject)
    stream.end(buffer)
  })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(Object.assign(new Error('Upload timed out after 30s'), { status: 504 })),
      UPLOAD_TIMEOUT_MS
    )
  )

  return Promise.race([uploadPromise, timeoutPromise])
}

router.post('/', verifyToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

    const isVideo = req.file.mimetype.startsWith('video/')
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'comfytag/events',
      resource_type: isVideo ? 'video' : 'image',
    })

    res.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (err) {
    if (!err.status && err.http_code) err.status = err.http_code
    next(err)
  }
})

export default router
