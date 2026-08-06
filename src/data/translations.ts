import type {Locale} from './locales'
import {LOCALES} from './locales'
import {adminTranslations} from './translations/admin'
import {eventsTranslations} from './translations/events'
import {industrialTranslations} from './translations/industrial'
import {membershipTranslations} from './translations/membership'
import {pagesTranslations} from './translations/pages'
import {uiCoreTranslations} from './translations/uiCore'

/**
 * Словарь, обязательно содержащий uk и en; остальные локали добавляются по мере перевода.
 * Неполная локаль в таком словаре — ошибка типов, а не молчаливый пропуск ключа.
 */
type LocaleDictionary<T> = {uk: T; en: T} & Partial<Record<Locale, T>>

/** EN — единственный допустимый fallback: он полон для всех ключей. */
function pick<T>(dictionary: LocaleDictionary<T>, locale: Locale): T {
  return dictionary[locale] ?? dictionary.en
}

function buildLocale(locale: Locale) {
  return {
    ...pick(uiCoreTranslations, locale),
    ...pick(membershipTranslations, locale),
    ...pick(adminTranslations, locale),
    ...pick(eventsTranslations, locale),
    ...pick(pagesTranslations, locale),
    ...pick(industrialTranslations, locale),
  }
}

export const TRANSLATIONS: Record<Locale, ReturnType<typeof buildLocale>> = {
  uk: buildLocale('uk'),
  en: buildLocale('en'),
  de: buildLocale('de'),
  es: buildLocale('es'),
  kk: buildLocale('kk'),
  fr: buildLocale('fr'),
}

export type TranslationKey = keyof (typeof TRANSLATIONS)['uk']

export function t(locale: Locale, key: TranslationKey): string {
  return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key
}

export {LOCALES}
