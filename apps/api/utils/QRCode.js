import QRCode from 'qrcode';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'comfytag/qrcodes', resource_type: 'image', format: 'png' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

export async function QR(data) {
  try {
    const buffer = await QRCode.toBuffer(
      typeof data === 'string' ? data : JSON.stringify(data),
      { width: 400, margin: 2, color: { dark: '#1C1917', light: '#FFFFFF' } }
    );
    return await uploadBuffer(buffer);
  } catch (err) {
    console.error('[QR] Cloudinary upload failed, falling back to base64:', err.message);
    return QRCode.toDataURL(typeof data === 'string' ? data : JSON.stringify(data));
  }
}
