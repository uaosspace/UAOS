/**
 * Shared validation for admin content writes.
 * Rejects non-http(s) URLs and credentialed URLs (XSS/SSRF-ish paste hazards).
 */

export function normalizeOptionalHttpUrl(raw: unknown, fieldName: string): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return ''
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${fieldName} must be a valid http(s) URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must be a valid http(s) URL`)
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not include credentials`)
  }
  return parsed.toString()
}

export function requireNonEmptyText(raw: unknown, fieldName: string, maxLen = 500): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) throw new Error(`${fieldName} required`)
  if (value.length > maxLen) throw new Error(`${fieldName} is too long`)
  return value
}

export function clampOptionalText(raw: unknown, maxLen: number): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value.length > maxLen) throw new Error('Text field is too long')
  return value
}

/** Optional public contact email — never log the value. */
export function normalizeOptionalPublicEmail(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return ''
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error('publicEmail is invalid')
  }
  return value.toLowerCase()
}

/** Optional public phone — digits and common separators only. */
export function normalizeOptionalPublicPhone(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return ''
  if (!/^[+\d][\d\s().-]{5,31}$/.test(value)) {
    throw new Error('publicPhone is invalid')
  }
  return value
}
