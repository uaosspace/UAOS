import type {Locale} from './locales'
import {LOCALES} from './locales'

/** Dial codes for countries matching site UI languages. */
export type PhoneCountryCode = {
  locale: Locale
  iso: string
  dial: string
}

export const PHONE_COUNTRY_CODES: readonly PhoneCountryCode[] = [
  {locale: 'uk', iso: 'UA', dial: '+380'},
  {locale: 'en', iso: 'GB', dial: '+44'},
  {locale: 'de', iso: 'DE', dial: '+49'},
  {locale: 'es', iso: 'ES', dial: '+34'},
  {locale: 'kk', iso: 'KZ', dial: '+7'},
  {locale: 'fr', iso: 'FR', dial: '+33'},
] as const

const DIAL_BY_LOCALE: Record<Locale, string> = {
  uk: '+380',
  en: '+44',
  de: '+49',
  es: '+34',
  kk: '+7',
  fr: '+33',
}

export function defaultPhoneDialForLocale(locale: Locale): string {
  return DIAL_BY_LOCALE[locale] ?? DIAL_BY_LOCALE.uk
}

export function isKnownPhoneDial(dial: string): boolean {
  return PHONE_COUNTRY_CODES.some((item) => item.dial === dial)
}

/** National part → digits only; strip leading 0 often used in local notation. */
export function normalizeNationalPhone(national: string): string {
  let digits = national.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

/** Compose E.164-ish phone for storage / notify. */
export function composeJoinPhone(dial: string, national: string): string {
  const code = dial.trim()
  const digits = normalizeNationalPhone(national)
  if (!code || !digits) return ''
  return `${code}${digits}`
}

export function phoneCountryCodesCoverLocales(): boolean {
  return LOCALES.every((locale) => PHONE_COUNTRY_CODES.some((item) => item.locale === locale))
}
