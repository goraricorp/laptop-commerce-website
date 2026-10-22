import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
const state = vi.hoisted(() => ({
  transaction: vi.fn(),
  remove: vi.fn(),
  asset: null,
  reference: false,
  writes: [],
}))
vi.mock('../src/database/index.js', () => ({
  db: { transaction: state.transaction },
}))
vi.mock('../src/lib/upload/s3-client.js', () => ({
  deleteObject: state.remove,
}))
import { deleteAsset, attachAssets } from '../src/services/storage.js'
import { uploadAssets } from '../src/database/schema.js'
const id = '00000000-0000-4000-8000-000000000001'
let tx
beforeEach(() => {
  vi.clearAllMocks()
  state.writes.length = 0
  state.reference = false
  state.asset = {
    key: `public/users/${id}/${id}.png`,
    url: `http://localhost:5172/storage/object?key=${id}`,
    userId: id,
    state: 'pending',
    createdAt: new Date(),
  }
  tx = {
    select: () => {
      let table
      const q = {
        from(value) {
          table = value
          return q
        },
        where() {
          return q
        },
        for() {
          return q
        },
        orderBy() {
          return q
        },
        limit() {
          return q
        },
        then(resolve) {
          return resolve(
            table === uploadAssets
              ? state.asset
                ? [state.asset]
                : []
              : state.reference
                ? [{ url: state.asset.url }]
                : [],
          )
        },
      }
      return q
    },
    update: (table) => ({
      set: (data) => ({
        where: (condition) => {
          state.writes.push({
            table,
            data,
            condition: new PgDialect().sqlToQuery(condition),
          })
          return []
        },
      }),
    }),
    delete: (table) => ({
      where: (condition) => {
        state.writes.push({
          table,
          delete: true,
          condition: new PgDialect().sqlToQuery(condition),
        })
        return []
      },
    }),
  }
  state.transaction.mockImplementation((callback) => callback(tx))
})
describe('durable upload lifecycle', () => {
  it('deletes an unsaved owned image from the bucket and the manifest', async () => {
    expect(await deleteAsset(state.asset.key, { id })).toEqual({
      deleted: true,
    })
    expect(state.remove).toHaveBeenCalledWith(
      expect.any(String),
      state.asset.key,
    )
    expect(state.writes.at(-1)).toMatchObject({
      table: uploadAssets,
      delete: true,
    })
  })
  it('does not delete an image after the save succeeded, even if the browser sends cancel', async () => {
    state.reference = true
    expect(await deleteAsset(state.asset.key, { id })).toMatchObject({
      referenced: true,
      deleted: false,
    })
    expect(state.remove).not.toHaveBeenCalled()
    expect(state.writes[0].data.state).toBe('attached')
  })
  it('rejects deletion of another customer image', async () => {
    await expect(
      deleteAsset(state.asset.key, { id: 'another', role: 'user' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(state.remove).not.toHaveBeenCalled()
  })
  it('retains a manifest when the storage provider fails so cleanup can retry', async () => {
    state.remove.mockRejectedValueOnce(new Error('Storage unavailable'))
    await expect(deleteAsset(state.asset.key, { id })).rejects.toThrow(
      'Storage unavailable',
    )
    expect(state.writes).toHaveLength(0)
  })
  it('locks and attaches a new image within the entity transaction; rejects expired URLs', async () => {
    await attachAssets(tx, [state.asset.url])
    expect(state.writes[0].data.state).toBe('attached')
    const url = state.asset.url
    state.asset = null
    await expect(attachAssets(tx, [url])).rejects.toMatchObject({ status: 409 })
  })
})
