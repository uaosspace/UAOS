export const LOCALES = ['uk', 'en', 'de', 'es', 'kk', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'uk'

export const LOCALE_META: Record<
  Locale,
  {code: string; label: string; htmlLang: string; nativeName: string}
> = {
  uk: {code: 'uk', label: 'UA', htmlLang: 'uk', nativeName: 'Українська'},
  en: {code: 'en', label: 'EN', htmlLang: 'en', nativeName: 'English'},
  de: {code: 'de', label: 'DE', htmlLang: 'de', nativeName: 'Deutsch'},
  es: {code: 'es', label: 'ES', htmlLang: 'es', nativeName: 'Español'},
  kk: {code: 'kk', label: 'KK', htmlLang: 'kk', nativeName: 'Қазақша'},
  fr: {code: 'fr', label: 'FR', htmlLang: 'fr', nativeName: 'Français'},
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}

export function parseStoredLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function nextLocale(current: Locale): Locale {
  const index = LOCALES.indexOf(current)
  return LOCALES[(index + 1) % LOCALES.length]
}

/**
 * CMS-поля зберігаються для всіх локалей, але обов'язкова лише `uk`.
 * Порядок fallback: запрошена локаль → en → uk, щоб неперекладене поле не давало пустий текст.
 */
export function resolveLocalized(
  text: {uk: string; en: string} & Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  if (locale === 'uk') return text.uk
  return text[locale] || text.en || text.uk
}
