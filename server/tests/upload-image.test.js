import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { imageExtension } from '../src/lib/upload/image-file.js'
describe('image upload format validation', () => {
  const cases = [
    ['png', 'image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['jpg', 'image/jpeg', [255, 216, 255, 224]],
    ['jpeg', 'image/jpeg', [255, 216, 255, 224]],
    ['webp', 'image/webp', [...Buffer.from('RIFF0000WEBP')]],
  ]
  it('preserves exactly png, jpg, jpeg and webp extensions after checking the bytes', () => {
    for (const [ext, mimetype, bytes] of cases)
      expect(
        imageExtension({
          originalname: `test.${ext}`,
          mimetype,
          buffer: Buffer.from(bytes),
        }),
      ).toBe(ext)
  })
  it('rejects disguised files and unsupported extensions', () => {
    for (const [originalname, mimetype, buffer] of [
      ['script.png', 'image/png', Buffer.from('<script>')],
      ['script.svg', 'image/svg+xml', Buffer.from('<svg>')],
      ['wrong.jpg', 'image/jpeg', Buffer.from(cases[0][2])],
      ['wrong.exe', 'image/png', Buffer.from(cases[0][2])],
    ])
      expect(() => imageExtension({ originalname, mimetype, buffer })).toThrow()
  })
})
