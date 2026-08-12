/**
 * Shared validation for admin content writes.
 * Rejects non-http(s) URLs and credentialed URLs (XSS/SSRF-ish paste hazards).
 */
import {DEFAULT_LOCALE, LOCALES, type Locale} from '../../src/data/locales.js'
import {isRecord} from '../../src/lib/contentGuards.js'

/** Localized field payload as stored in the `*_i18n` JSONB columns. */
export type LocalizedInput = Partial<Record<Locale, string>>

/**
 * Normalizes a LocalizedText payload for JSONB storage: keeps only supported locales, trims,
 * drops empty locales (absent key means "not translated yet") and enforces `maxLen` per locale.
 * A bare string is accepted as the default locale — older admin payloads sent `shortName` that way.
 */
export function normalizeLocalizedText(
  raw: unknown,
  fieldName: string,
  maxLen: number,
  options: {required?: boolean} = {},
): LocalizedInput {
  const source: Record<string, unknown> =
    typeof raw === 'string' ? {[DEFAULT_LOCALE]: raw} : isRecord(raw) ? raw : {}

  const result: LocalizedInput = {}
  for (const locale of LOCALES) {
    const value = source[locale]
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) continue
    if (text.length > maxLen) throw new Error(`${fieldName}.${locale} is too long`)
    result[locale] = text
  }

  if (options.required && !result[DEFAULT_LOCALE]) {
    throw new Error(`${fieldName}.${DEFAULT_LOCALE} required`)
  }
  return result
}

export const PARTICIPATION_MODES = ['offline', 'zoom', 'online_link', 'phone', 'other'] as const
export type ParticipationMode = (typeof PARTICIPATION_MODES)[number]

export function normalizeParticipationMode(raw: unknown): ParticipationMode {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if ((PARTICIPATION_MODES as readonly string[]).includes(value)) {
    return value as ParticipationMode
  }
  return 'offline'
}

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

/**
 * Logo/cover fields: absolute http(s) or same-origin site path (`/members/...`).
 * Rejects protocol-relative (`//…`) and path traversal (`..`).
 */
export function normalizeOptionalMediaUrl(raw: unknown, fieldName: string): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return ''
  if (value.startsWith('/') && !value.startsWith('//')) {
    if (value.includes('\\') || /(^|\/)\.\.(\/|$)/.test(value)) {
      throw new Error(`${fieldName} must be a valid media URL`)
    }
    if (value.length > 2048) {
      throw new Error(`${fieldName} is too long`)
    }
    return value
  }
  return normalizeOptionalHttpUrl(value, fieldName)
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
