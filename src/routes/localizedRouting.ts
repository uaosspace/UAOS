import {DEFAULT_LOCALE, LOCALES, isLocale, type Locale} from '../data/locales'

/**
 * Схема URL: локаль за замовчуванням (`uk`) без префіксу, решта локалей — з префіксом `/xx/...`.
 * Це стандартна SEO-безпечна схема (default locale без префіксу), джерело істини для мови — URL.
 */

/** Нормалізує шлях так, щоб він завжди починався з `/` і не мав кінцевого `/`, крім кореня. */
function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1)
  }
  return withLeadingSlash
}

/**
 * Знімає мовний префікс з pathname, якщо перший сегмент — код НЕ дефолтної локалі.
 * URL без префіксу завжди трактується як дефолтна локаль (`uk`) — без auto-detect.
 */
export function splitLocaleFromPathname(pathname: string): {
  locale: Locale
  pathWithoutLocale: string
} {
  const segments = pathname.split('/').filter(Boolean)
  const [head, ...rest] = segments

  if (head && isLocale(head) && head !== DEFAULT_LOCALE) {
    const restPath = rest.length > 0 ? `/${rest.join('/')}` : '/'
    return {locale: head, pathWithoutLocale: restPath}
  }

  return {locale: DEFAULT_LOCALE, pathWithoutLocale: normalizePath(pathname || '/')}
}

/** Будує шлях з мовним префіксом (для дефолтної локалі префікс не додається). */
export function buildLocalizedPath(locale: Locale, path: string): string {
  const normalized = normalizePath(path || '/')
  if (locale === DEFAULT_LOCALE) return normalized
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}

export interface HreflangAlternate {
  locale: Locale
  hrefLang: string
  href: string
}

/**
 * Будує hreflang alternates для одного й того ж маршруту (без урахування per-locale slug SEO) +
 * `x-default`, що вказує на uk-версію. `origin` — абсолютний origin (напр. `window.location.origin`).
 */
export function buildHreflangAlternates(pathWithoutLocale: string, origin: string): HreflangAlternate[] {
  const trimmedOrigin = origin.replace(/\/$/, '')
  const alternates = LOCALES.map((locale) => ({
    locale,
    hrefLang: locale,
    href: `${trimmedOrigin}${buildLocalizedPath(locale, pathWithoutLocale)}`,
  }))

  return [
    ...alternates,
    {
      locale: DEFAULT_LOCALE,
      hrefLang: 'x-default',
      href: `${trimmedOrigin}${buildLocalizedPath(DEFAULT_LOCALE, pathWithoutLocale)}`,
    },
  ]
}
