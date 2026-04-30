import QRCode from 'qrcode'

export async function generateQrPng(payload) {
  return QRCode.toBuffer(payload, {
    type: 'png',
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

export async function generateQrDataUrl(payload) {
  return QRCode.toDataURL(payload, { width: 320, margin: 1 })
}
