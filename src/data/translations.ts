import type {Locale} from './locales'
import {LOCALES} from './locales'
import {industrialTranslations} from './translations/industrial'
import {membershipTranslations} from './translations/membership'
import {operationsTranslations} from './translations/operations'
import {uiCoreTranslations} from './translations/uiCore'

const legacyUk = {
  ...uiCoreTranslations.uk,
  ...membershipTranslations.uk,
  ...operationsTranslations.uk,
}

const legacyEn = {
  ...uiCoreTranslations.en,
  ...membershipTranslations.en,
  ...operationsTranslations.en,
}

/**
 * Повні словники: uk/en — legacy + industrial;
 * de/es/kk/fr — industrial + EN fallback для старих ключів (privacy/admin тощо).
 */
export const TRANSLATIONS = {
  uk: {
    ...legacyUk,
    ...industrialTranslations.uk,
  },
  en: {
    ...legacyEn,
    ...industrialTranslations.en,
  },
  de: {
    ...legacyEn,
    ...industrialTranslations.de,
  },
  es: {
    ...legacyEn,
    ...industrialTranslations.es,
  },
  kk: {
    ...legacyEn,
    ...industrialTranslations.kk,
  },
  fr: {
    ...legacyEn,
    ...industrialTranslations.fr,
  },
} as const satisfies Record<Locale, Record<string, string>>

export type TranslationKey = keyof (typeof TRANSLATIONS)['uk']

export function t(locale: Locale, key: TranslationKey): string {
  return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key
}

export {LOCALES}
