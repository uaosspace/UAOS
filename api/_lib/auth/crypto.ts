import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const SCRYPT_PARAMS = {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024} as const
const HASH_PREFIX = 'scrypt'

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 32, SCRYPT_PARAMS)
  return `${HASH_PREFIX}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [prefix, saltB64, hashB64] = encoded.split('$')
  if (prefix !== HASH_PREFIX || !saltB64 || !hashB64) return false
  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, salt, expected.length, SCRYPT_PARAMS)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function encryptSecret(plain: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) throw new Error('MFA_ENC_KEY must be 32 bytes hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptSecret(encoded: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) throw new Error('MFA_ENC_KEY must be 32 bytes hex')
  const [ivB64, tagB64, dataB64] = encoded.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted secret')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
