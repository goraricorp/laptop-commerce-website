import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
const timestamp = z.iso.datetime({ offset: true })
const payloadSchema = z
  .object({
    v: z.literal(1),
    at: timestamp,
    id: z.uuid(),
    asOf: timestamp,
    scope: z.string(),
    filter: z.string(),
  })
  .strict()
export const orderListInput = z
  .object({
    q: z.string().trim().max(255).default(''),
    status: z
      .enum([
        'all',
        'pending',
        'confirmed',
        'processing',
        'completed',
        'cancelled',
        'returned',
      ])
      .default('all'),
    group: z
      .enum(['all', 'processing', 'awaitingDelivery', 'completed', 'cancelled'])
      .default('all'),
    sort: z.enum(['newest', 'oldest']).default('newest'),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().max(4096).optional(),
    asOf: timestamp.optional(),
  })
  .strict()
export function orderCursorCodec(secret) {
  const mac = (value) =>
    createHmac('sha256', secret)
      .update('order-list:v1:' + value)
      .digest()
  return {
    filter: (value) =>
      createHash('sha256').update(JSON.stringify(value)).digest('hex'),
    encode: (payload) => {
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
      return encoded + '.' + mac(encoded).toString('base64url')
    },
    decode: (value) => {
      try {
        const [encoded, signature, ...extra] = value.split('.')
        const given = Buffer.from(signature, 'base64url'),
          expected = mac(encoded)
        if (
          extra.length ||
          given.length !== expected.length ||
          !timingSafeEqual(given, expected)
        )
          throw new Error('Invalid signature')
        return payloadSchema.parse(
          JSON.parse(Buffer.from(encoded, 'base64url').toString()),
        )
      } catch {
        throw Object.assign(
          new Error('Cursor không hợp lệ; hãy làm mới danh sách.'),
          { status: 400 },
        )
      }
    },
  }
}
