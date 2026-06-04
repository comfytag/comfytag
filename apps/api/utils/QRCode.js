import QRCode from 'qrcode';

export async function QR(data) {
    return QRCode.toDataURL(typeof data === 'string' ? data : JSON.stringify(data));
}
