import {describe, expect, it} from 'vitest'
import {APP_ROUTES, matchRoutePath} from '../routes/appRoutes'
import {splitLocaleFromPathname} from '../routes/localizedRouting'

/**
 * Композиція `splitLocaleFromPathname` + `matchRoutePath` відтворює точну поведінку
 * приватної `matchPathname` з `useAppNavigation.ts` (URL → { route, params, locale }).
 * Тестується тут як контракт розбору pathname без потреби рендерити React-хук (немає jsdom).
 */
function resolveRoute(pathname: string) {
  const {locale, pathWithoutLocale} = splitLocaleFromPathname(pathname)
  const {route, params} = matchRoutePath(pathWithoutLocale)
  return {route, params, locale}
}

describe('URL → route + locale resolution', () => {
  it('resolves an unprefixed URL to uk', () => {
    expect(resolveRoute('/')).toEqual({route: APP_ROUTES.home, params: {}, locale: 'uk'})
    expect(resolveRoute('/members/john-doe')).toEqual({
      route: APP_ROUTES.memberDetails,
      params: {memberSlug: 'john-doe'},
      locale: 'uk',
    })
  })

  it('resolves an explicitly prefixed URL to the matching locale', () => {
    expect(resolveRoute('/en/members/john-doe')).toEqual({
      route: APP_ROUTES.memberDetails,
      params: {memberSlug: 'john-doe'},
      locale: 'en',
    })
    expect(resolveRoute('/de/news')).toEqual({route: APP_ROUTES.newsList, params: {}, locale: 'de'})
    expect(resolveRoute('/fr')).toEqual({route: APP_ROUTES.home, params: {}, locale: 'fr'})
    expect(resolveRoute('/kk/events/some-event')).toEqual({
      route: APP_ROUTES.eventsDetails,
      params: {eventSlug: 'some-event'},
      locale: 'kk',
    })
    expect(resolveRoute('/es/join')).toEqual({route: APP_ROUTES.join, params: {}, locale: 'es'})
  })

  it('does not let an unknown first segment be mistaken for a locale (regular 404 routing applies)', () => {
    expect(resolveRoute('/unknown-page')).toEqual({route: APP_ROUTES.notFound, params: {}, locale: 'uk'})
    // "xx" is not a recognized locale code, so it is matched as a route segment (falls through to 404),
    // not stripped as a language prefix.
    expect(resolveRoute('/xx/members')).toEqual({route: APP_ROUTES.notFound, params: {}, locale: 'uk'})
  })

  it('keeps admin reachable without a locale prefix', () => {
    expect(resolveRoute('/admin')).toEqual({route: APP_ROUTES.admin, params: {}, locale: 'uk'})
    expect(resolveRoute('/en/admin')).toEqual({route: APP_ROUTES.admin, params: {}, locale: 'en'})
  })

  it('keeps cabinet reachable without a locale prefix', () => {
    expect(resolveRoute('/cabinet')).toEqual({route: APP_ROUTES.cabinet, params: {}, locale: 'uk'})
    expect(resolveRoute('/en/cabinet')).toEqual({route: APP_ROUTES.cabinet, params: {}, locale: 'en'})
  })
})
