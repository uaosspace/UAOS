/**
 * Minimal TOTP (RFC 6238) using node:crypto — no extra dependency.
 */
import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes))
}

export function buildOtpAuthUrl(input: {
  secret: string
  email: string
  issuer?: string
}): string {
  const issuer = encodeURIComponent(input.issuer || 'UAOS Admin')
  const label = encodeURIComponent(`UAOS:${input.email}`)
  return `otpauth://totp/${label}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}

export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const normalized = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  const counter = Math.floor(Date.now() / 1000 / 30)
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateHotp(secret, counter + offset)
    const a = Buffer.from(expected)
    const b = Buffer.from(normalized)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }
  return false
}

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  let tmp = counter
  for (let i = 7; i >= 0; i -= 1) {
    buf[i] = tmp & 0xff
    tmp = Math.floor(tmp / 256)
  }
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}
