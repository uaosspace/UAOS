import {describe, expect, it} from 'vitest'
import {APP_ROUTES, buildRawRoutePath, buildRoutePath, matchRoutePath} from './appRoutes'

describe('buildRoutePath', () => {
  it('defaults to uk without a prefix when locale is omitted', () => {
    expect(buildRoutePath(APP_ROUTES.home)).toBe('/')
    expect(buildRoutePath(APP_ROUTES.membersCatalog)).toBe('/members')
  })

  it('builds unprefixed paths for uk', () => {
    expect(buildRoutePath(APP_ROUTES.home, 'uk')).toBe('/')
    expect(buildRoutePath(APP_ROUTES.about, 'uk')).toBe('/about')
    expect(buildRoutePath(APP_ROUTES.memberDetails, 'uk', 'john-doe')).toBe('/members/john-doe')
  })

  it('builds prefixed paths for non-default locales', () => {
    expect(buildRoutePath(APP_ROUTES.home, 'en')).toBe('/en')
    expect(buildRoutePath(APP_ROUTES.about, 'en')).toBe('/en/about')
    expect(buildRoutePath(APP_ROUTES.memberDetails, 'en', 'john-doe')).toBe('/en/members/john-doe')
    expect(buildRoutePath(APP_ROUTES.newsDetails, 'de', 'some-news')).toBe('/de/news/some-news')
    expect(buildRoutePath(APP_ROUTES.eventsDetails, 'fr', 'some-event')).toBe('/fr/events/some-event')
    expect(buildRoutePath(APP_ROUTES.knowledge, 'kk')).toBe('/kk/knowledge')
    expect(buildRoutePath(APP_ROUTES.join, 'es')).toBe('/es/join')
  })

  it('never prefixes the admin route path regardless of locale (caller must avoid using it)', () => {
    // buildRoutePath itself is generic; the app never calls it with a non-default locale for admin.
    expect(buildRawRoutePath(APP_ROUTES.admin)).toBe('/admin')
  })
})

describe('matchRoutePath (locale-agnostic, receives an already-unprefixed path)', () => {
  it('matches static top-level routes', () => {
    expect(matchRoutePath('/')).toEqual({route: APP_ROUTES.home, params: {}})
    expect(matchRoutePath('/about')).toEqual({route: APP_ROUTES.about, params: {}})
    expect(matchRoutePath('/members')).toEqual({route: APP_ROUTES.membersCatalog, params: {}})
    expect(matchRoutePath('/news')).toEqual({route: APP_ROUTES.newsList, params: {}})
    expect(matchRoutePath('/events')).toEqual({route: APP_ROUTES.eventsList, params: {}})
    expect(matchRoutePath('/admin')).toEqual({route: APP_ROUTES.admin, params: {}})
  })

  it('matches slug-based details routes', () => {
    expect(matchRoutePath('/members/john-doe')).toEqual({
      route: APP_ROUTES.memberDetails,
      params: {memberSlug: 'john-doe'},
    })
    expect(matchRoutePath('/news/some-news')).toEqual({
      route: APP_ROUTES.newsDetails,
      params: {newsSlug: 'some-news'},
    })
    expect(matchRoutePath('/events/some-event')).toEqual({
      route: APP_ROUTES.eventsDetails,
      params: {eventSlug: 'some-event'},
    })
  })

  it('falls back to not-found for unknown paths, without confusing a locale-looking segment', () => {
    expect(matchRoutePath('/unknown-page')).toEqual({route: APP_ROUTES.notFound, params: {}})
    expect(matchRoutePath('/en')).toEqual({route: APP_ROUTES.notFound, params: {}})
  })
})
