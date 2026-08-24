import QRCode from 'qrcode';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// A slow-but-eventually-successful Cloudinary upload shouldn't hold up ticket
// issuance — past this, QR() falls back to an inline base64 QR (still a fully
// valid, scannable ticket) rather than waiting indefinitely.
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 8000;

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'comfytag/qrcodes', resource_type: 'image', format: 'png' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function QR(data) {
  try {
    const buffer = await QRCode.toBuffer(
      typeof data === 'string' ? data : JSON.stringify(data),
      { width: 400, margin: 2, color: { dark: '#1C1917', light: '#FFFFFF' } }
    );
    return await withTimeout(uploadBuffer(buffer), CLOUDINARY_UPLOAD_TIMEOUT_MS, 'Cloudinary upload');
  } catch (err) {
    console.error('[QR] Cloudinary upload failed, falling back to base64:', err.message);
    return QRCode.toDataURL(typeof data === 'string' ? data : JSON.stringify(data));
  }
}

// Resolves a QR code's actual image bytes from its stored URL, for emailing
// as a real attachment (not just a remotely-hosted <img> that some clients
// block by default and that never loads without a live connection — a real
// problem for a code someone needs to scan at a venue with poor signal).
// Handles both the normal Cloudinary URL and the base64 data-URI fallback.
export async function fetchQrImageBuffer(qrCodeUrl) {
  if (!qrCodeUrl) return null
  try {
    if (qrCodeUrl.startsWith('data:')) {
      const base64 = qrCodeUrl.split(',')[1]
      return base64 ? Buffer.from(base64, 'base64') : null
    }
    const response = await fetch(qrCodeUrl)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch (err) {
    console.error('[QR] Failed to fetch QR image for email attachment:', err.message)
    return null
  }
}
