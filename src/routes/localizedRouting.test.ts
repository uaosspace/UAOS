import {describe, expect, it} from 'vitest'
import {buildHreflangAlternates, buildLocalizedPath, splitLocaleFromPathname} from './localizedRouting'

describe('splitLocaleFromPathname', () => {
  it('treats a pathname without a prefix as the default uk locale', () => {
    expect(splitLocaleFromPathname('/')).toEqual({locale: 'uk', pathWithoutLocale: '/'})
    expect(splitLocaleFromPathname('/members/john-doe')).toEqual({
      locale: 'uk',
      pathWithoutLocale: '/members/john-doe',
    })
  })

  it('strips an explicit non-default locale prefix', () => {
    expect(splitLocaleFromPathname('/en')).toEqual({locale: 'en', pathWithoutLocale: '/'})
    expect(splitLocaleFromPathname('/en/members/john-doe')).toEqual({
      locale: 'en',
      pathWithoutLocale: '/members/john-doe',
    })
    expect(splitLocaleFromPathname('/de/news')).toEqual({locale: 'de', pathWithoutLocale: '/news'})
    expect(splitLocaleFromPathname('/kk/')).toEqual({locale: 'kk', pathWithoutLocale: '/'})
  })

  it('does not treat an explicit "uk" segment as a prefix (uk has no prefix)', () => {
    // "/uk/members" is not a recognized prefix form — "uk" segment is matched as a regular route segment,
    // which falls through to not-found upstream; this function only decides locale, not routing.
    expect(splitLocaleFromPathname('/uk/members')).toEqual({
      locale: 'uk',
      pathWithoutLocale: '/uk/members',
    })
  })

  it('does not confuse an unrelated first segment with a locale prefix', () => {
    expect(splitLocaleFromPathname('/unknown-page')).toEqual({
      locale: 'uk',
      pathWithoutLocale: '/unknown-page',
    })
    expect(splitLocaleFromPathname('/events/some-event')).toEqual({
      locale: 'uk',
      pathWithoutLocale: '/events/some-event',
    })
  })
})

describe('buildLocalizedPath', () => {
  it('builds a path without a prefix for the default locale', () => {
    expect(buildLocalizedPath('uk', '/')).toBe('/')
    expect(buildLocalizedPath('uk', '/members/john-doe')).toBe('/members/john-doe')
  })

  it('builds a prefixed path for non-default locales', () => {
    expect(buildLocalizedPath('en', '/')).toBe('/en')
    expect(buildLocalizedPath('en', '/members/john-doe')).toBe('/en/members/john-doe')
    expect(buildLocalizedPath('de', '/news')).toBe('/de/news')
    expect(buildLocalizedPath('fr', '/events/some-event')).toBe('/fr/events/some-event')
  })

  it('round-trips with splitLocaleFromPathname', () => {
    for (const locale of ['uk', 'en', 'de', 'es', 'kk', 'fr'] as const) {
      const built = buildLocalizedPath(locale, '/members/john-doe')
      expect(splitLocaleFromPathname(built)).toEqual({locale, pathWithoutLocale: '/members/john-doe'})
    }
  })
})

describe('buildHreflangAlternates', () => {
  it('returns one alternate per locale plus x-default pointing to uk', () => {
    const alternates = buildHreflangAlternates('/members/john-doe', 'https://uaos.example')

    expect(alternates).toContainEqual({
      locale: 'uk',
      hrefLang: 'uk',
      href: 'https://uaos.example/members/john-doe',
    })
    expect(alternates).toContainEqual({
      locale: 'en',
      hrefLang: 'en',
      href: 'https://uaos.example/en/members/john-doe',
    })
    expect(alternates).toContainEqual({
      locale: 'de',
      hrefLang: 'de',
      href: 'https://uaos.example/de/members/john-doe',
    })
    expect(alternates.find((entry) => entry.hrefLang === 'x-default')).toEqual({
      locale: 'uk',
      hrefLang: 'x-default',
      href: 'https://uaos.example/members/john-doe',
    })
    // 6 locales + x-default
    expect(alternates).toHaveLength(7)
  })

  it('strips a trailing slash from the origin', () => {
    const alternates = buildHreflangAlternates('/', 'https://uaos.example/')
    expect(alternates.find((entry) => entry.hrefLang === 'en')?.href).toBe('https://uaos.example/en')
  })
})
