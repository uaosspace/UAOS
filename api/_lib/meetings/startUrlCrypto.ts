import {encryptSecret, decryptSecret} from '../auth/crypto.js'

function startUrlKey(): string {
  const key = process.env.MEETING_START_URL_ENC_KEY?.trim()
  if (key && /^[0-9a-fA-F]{64}$/.test(key)) return key
  const fallback = process.env.MFA_ENC_KEY?.trim()
  if (fallback && /^[0-9a-fA-F]{64}$/.test(fallback)) return fallback
  throw new Error('MEETING_START_URL_ENC_KEY (or MFA_ENC_KEY) must be 64 hex chars')
}

export function encryptStartUrl(plain: string): string {
  if (!plain) return ''
  return encryptSecret(plain, startUrlKey())
}

export function decryptStartUrl(encrypted: string): string {
  if (!encrypted) return ''
  return decryptSecret(encrypted, startUrlKey())
}
