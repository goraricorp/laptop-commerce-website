const authProviders = Object.freeze({
  apple: 'apple',
  email: 'email',
  facebook: 'facebook',
  google: 'google',
  microsoft: 'microsoft',
  phone: 'phone',
})

export function formatDate(date, format) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('YY', String(year).slice(-2))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function stringifyQuery(object) {
  return Object.entries(object)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function mapProvider(provider) {
  if (!provider) return null

  const value = provider.toLowerCase()
  if (value.includes('google')) return authProviders.google
  if (value.includes('facebook')) return authProviders.facebook
  if (value.includes('microsoft') || value === 'azure') return authProviders.microsoft
  if (value.includes('apple')) return authProviders.apple
  if (value === 'email') return authProviders.email
  if (value === 'phone') return authProviders.phone
  return null
}

export function normalizeEmail(email) {
  return email.toLowerCase().trim()
}

function camelToSnakeCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function normalizeMetadataValue(value) {
  if (value === undefined || value === null) return null
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value?.constructor?.name === 'Decimal') return value.toString()
  return value
}

export function buildUserMetadataFromDB(dbUser) {
  const reservedFields = new Set([
    'id',
    'supabaseUserId',
    'email',
    'emailNormalized',
    'emailVerifiedAt',
    'phone',
    'phoneCode',
    'phoneNumber',
    'createdAt',
    'updatedAt',
    'publicMetadata',
    'privateMetadata',
    'externalAccounts',
    'role',
    'locked',
    'lockoutExpiresInSeconds',
    'deleteSelfEnabled',
  ])
  const metadata = {}

  for (const [key, value] of Object.entries(dbUser)) {
    if (reservedFields.has(key) || value === null || value === undefined) continue

    if (key === 'fullName') {
      metadata.name = value
      continue
    }

    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) continue
    metadata[camelToSnakeCase(key)] = normalizeMetadataValue(value)
  }

  return metadata
}

export function buildUserMetadataFromDBFull(dbUser) {
  const reservedKeys = new Set([
    'id',
    'supabaseUserId',
    'role',
    'publicMetadata',
    'privateMetadata',
    'externalAccounts',
  ])
  const reservedSnakeKeys = new Set([
    'id',
    'supabase_user_id',
    'role',
    'public_metadata',
    'private_metadata',
    'external_accounts',
  ])
  const metadata = {}

  for (const [key, value] of Object.entries(dbUser)) {
    if (reservedKeys.has(key)) continue

    const snakeKey = camelToSnakeCase(key)
    if (!reservedSnakeKeys.has(snakeKey)) metadata[snakeKey] = normalizeMetadataValue(value)
  }

  const fullNameRaw = dbUser.fullName
    ?? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ')
  const fullName = fullNameRaw && String(fullNameRaw).trim().length > 0 ? fullNameRaw : null

  metadata.first_name = dbUser.firstName ?? null
  metadata.last_name = dbUser.lastName ?? null
  metadata.full_name = fullName
  metadata.name = fullName

  return metadata
}

export function buildAppMetadataFromDB({ user, organization, restaurant, supplier }) {
  return {
    sub: user?.id ?? null,
    role: user?.role ?? null,
    organization_id: organization?.id ?? null,
    restaurant_id: restaurant?.id ?? null,
    supplier_id: supplier?.id ?? null,
  }
}
