import {isRecord, readString, readStringOr} from '../../src/lib/contentGuards'

export interface NormalizedJoinApplication {
  companyName: string
  website: string
  activityField: string
  edrpou: string
  contactPerson: string
  email: string
  phone: string
  message: string
  consentGiven: boolean
  honeypot: string
  consentTimestamp: string
}

/**
 * Нормализует входное тело заявки и приводит строковые поля к безопасной форме.
 */
export function normalizeJoinApplication(body: unknown): NormalizedJoinApplication {
  const source = isRecord(body) ? body : {}
  const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

  return {
    companyName: normalizeWhitespace(readStringOr(source.companyName, '')),
    website: readStringOr(source.website, ''),
    activityField: normalizeWhitespace(readStringOr(source.activityField, '')),
    edrpou: readStringOr(source.edrpou, '').replace(/\D/g, '').slice(0, 8),
    contactPerson: normalizeWhitespace(readStringOr(source.contactPerson, '')),
    email: normalizeWhitespace(readStringOr(source.email, '')),
    phone: normalizeWhitespace(readStringOr(source.phone, '')),
    message: readStringOr(source.message, ''),
    consentGiven: source.privacyConsent === true || source.consent === true,
    honeypot: normalizeWhitespace(readStringOr(source.hp, '')),
    consentTimestamp: new Date().toISOString(),
  }
}

/**
 * Проверяет нормализованную заявку и возвращает текст ошибки при нарушении правил.
 */
export function validateJoinApplication(payload: NormalizedJoinApplication): string | null {
  if (payload.honeypot) return 'Spam detected'

  if (!payload.companyName || !payload.activityField || !payload.contactPerson || !payload.email || !payload.phone) {
    return 'Missing required fields'
  }

  if (!payload.consentGiven) {
    return 'Privacy consent is required'
  }

  if (payload.companyName.length > 120) return 'Company name is too long'
  if (payload.contactPerson.length > 120) return 'Contact person is too long'
  if (payload.activityField.length > 200) return 'Activity field is too long'
  if (payload.email.length > 254) return 'Email is too long'
  if (payload.phone.length > 30) return 'Phone is too long'
  if (payload.message.length > 2000) return 'Message is too long'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Invalid email'
  }

  if (payload.phone.replace(/[^\d]/g, '').length < 9) {
    return 'Invalid phone'
  }

  if (payload.website) {
    try {
      const url = new URL(payload.website)
      if (!/^https?:$/i.test(url.protocol)) {
        return 'Invalid website URL'
      }
    } catch {
      return 'Invalid website URL'
    }
  }

  return null
}

/**
 * Ограничивает длину строки и сохраняет ожидаемую форму URL для записи.
 */
export function normalizeJoinWebsite(urlValue: string): string {
  if (!urlValue) return ''
  const url = new URL(urlValue)
  return url.toString().slice(0, 200)
}

/**
 * Читает env-конфигурацию интеграций для записи заявки.
 */
export function readJoinDestinationEnv() {
  return {
    projectId: process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
    dataset: process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
    token: process.env.SANITY_API_WRITE_TOKEN,
    formspree: readString(process.env.FORMSPREE_JOIN_ENDPOINT),
  }
}
