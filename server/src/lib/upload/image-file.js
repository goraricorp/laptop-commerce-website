import { Buffer } from 'node:buffer'
const mimeByExt = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}
export function imageExtension(file) {
  const bytes = file.buffer
  const ext = file.originalname.split('.').pop().toLowerCase()
  const actual = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? 'image/jpeg'
      : bytes.toString('ascii', 0, 4) === 'RIFF' &&
          bytes.toString('ascii', 8, 12) === 'WEBP'
        ? 'image/webp'
        : null
  if (!actual || actual !== file.mimetype || mimeByExt[ext] !== actual)
    throw Object.assign(
      new Error(
        'Chỉ nhận ảnh PNG, JPG, JPEG, WEBP có nội dung khớp định dạng.',
      ),
      { status: 400 },
    )
  return ext
}
