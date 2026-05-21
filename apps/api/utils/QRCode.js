import QRCode from 'qrcode';

export async function QR(data) {
    return QRCode.toDataURL(JSON.stringify(data));
}
