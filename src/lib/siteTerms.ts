/**
 * Єдине джерело істини для метаданих Умов використання / участі.
 *
 * Версія показується на /terms і фіксується в `consents.policy_version`
 * для purpose_code `membership_terms`. Змінюйте разом із публікацією
 * затвердженого тексту — інакше журнал згод посилатиметься на інший документ.
 *
 * Поточний текст на сторінці — шаблон, який потребує юридичного / організаційного
 * схвалення UAOS перед використанням як офіційних умов.
 */
export const SITE_TERMS_VERSION = '2026-08-05-draft'

/** Дата чернетки для показу користувачу; має відповідати SITE_TERMS_VERSION. */
export const SITE_TERMS_UPDATED: Record<'uk' | 'en', string> = {
  uk: '5 серпня 2026 року (чернетка)',
  en: '5 August 2026 (draft)',
}

/** Код призначення в таблиці consents для другого підтвердження форми вступу. */
export const MEMBERSHIP_TERMS_PURPOSE = 'membership_terms' as const
