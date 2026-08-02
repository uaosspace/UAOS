import {useState} from 'react'
import {
  clearCookieConsent,
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '../lib/cookieConsent'

/**
 * Управляет состоянием cookie consent и синхронизирует его с localStorage.
 */
export function useCookieConsent() {
  const [cookieConsent, setCookieConsentState] = useState<CookieConsentValue>(() => getCookieConsent())

  /**
   * Сохраняет полное согласие и разрешает опциональную аналитику.
   */
  const acceptCookies = () => {
    setCookieConsent('accepted')
    setCookieConsentState('accepted')
  }

  /**
   * Сохраняет отказ от опциональных cookie, оставляя только необходимые.
   */
  const keepNecessaryCookiesOnly = () => {
    setCookieConsent('necessary')
    setCookieConsentState('necessary')
  }

  /**
   * Сбрасывает решение пользователя, чтобы баннер можно было показать снова.
   */
  const resetCookieConsent = () => {
    clearCookieConsent()
    setCookieConsentState(null)
  }

  return {
    cookieConsent,
    acceptCookies,
    keepNecessaryCookiesOnly,
    resetCookieConsent,
  }
}
