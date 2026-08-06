/**
 * Єдине джерело істини для метаданих Політики конфіденційності.
 *
 * Те саме значення показується на сторінці /privacy і фіксується в `consents.policy_version`,
 * тому воно змінюється разом із публікацією нового тексту політики — інакше база зафіксує
 * згоду з версією повідомлення, якої користувач не бачив.
 */
export const PRIVACY_POLICY_VERSION = '2026-08-05'

/** Дата публікації для показу користувачу; має відповідати PRIVACY_POLICY_VERSION. */
export const PRIVACY_POLICY_UPDATED: Record<PrivacyNoticeLanguage, string> = {
  uk: '5 серпня 2026 року',
  en: '5 August 2026',
}

/** Текст політики та юридичні рядки форми існують лише в uk/en. */
export const PRIVACY_NOTICE_LANGUAGES = ['uk', 'en'] as const

export type PrivacyNoticeLanguage = (typeof PRIVACY_NOTICE_LANGUAGES)[number]

export function isPrivacyNoticeLanguage(value: unknown): value is PrivacyNoticeLanguage {
  return typeof value === 'string' && (PRIVACY_NOTICE_LANGUAGES as readonly string[]).includes(value)
}

/**
 * Мова повідомлення, яке фактично бачить користувач.
 * Локалі de/es/kk/fr отримують EN-текст політики та EN legacy-переклади форми,
 * тому в журналі згод для них коректна саме 'en', а не код інтерфейсу.
 */
export function resolveNoticeLanguage(locale: string): PrivacyNoticeLanguage {
  return locale === 'uk' ? 'uk' : 'en'
}
