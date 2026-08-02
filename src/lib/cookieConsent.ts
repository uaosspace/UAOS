/**
 * Cookie / analytics consent (GDPR).
 * Necessary site prefs (lang/theme) are separate and not gated by this.
 */

export type CookieConsentValue = 'accepted' | 'necessary' | null

export const COOKIE_CONSENT_KEY = 'uaos_cookie_consent'

export function getCookieConsent(): CookieConsentValue {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (raw === 'accepted' || raw === 'necessary') return raw
  } catch {
    // private mode / blocked storage
  }
  return null
}

export function setCookieConsent(value: 'accepted' | 'necessary'): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
  } catch {
    // ignore
  }
}

export function clearCookieConsent(): void {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
  } catch {
    // ignore
  }
}

export function analyticsAllowed(consent: CookieConsentValue = getCookieConsent()): boolean {
  return consent === 'accepted'
}
