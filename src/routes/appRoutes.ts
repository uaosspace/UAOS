import {DEFAULT_LOCALE, type Locale} from '../data/locales'
import {buildLocalizedPath} from './localizedRouting'

export const APP_ROUTES = {
  home: 'home',
  about: 'about',
  membersCatalog: 'members-catalog',
  memberDetails: 'member-details',
  activity: 'activity',
  newsList: 'news-list',
  newsDetails: 'news-details',
  eventsList: 'events-list',
  eventsDetails: 'events-details',
  knowledge: 'knowledge',
  join: 'join',
  contacts: 'contacts',
  privacy: 'privacy',
  terms: 'terms',
  admin: 'admin',
  notFound: 'not-found',
} as const

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

/** Динамические сегменты, извлекаемые из pathname текущего маршрута. */
export interface RouteParams {
  memberSlug?: string
  newsSlug?: string
  eventSlug?: string
  knowledgeSlug?: string
  activityAnchor?: string
}

export interface ParsedRoute {
  route: AppRoute
  params: RouteParams
}

/** Статичный путь для каждого маршрута без динамических сегментов, без учёта языкового префикса. */
export const ROUTE_PATHS: Record<AppRoute, string> = {
  home: '/',
  about: '/about',
  'members-catalog': '/members',
  'member-details': '/members',
  activity: '/activity',
  'news-list': '/news',
  'news-details': '/news',
  'events-list': '/events',
  'events-details': '/events',
  knowledge: '/knowledge',
  join: '/join',
  contacts: '/contacts',
  privacy: '/privacy',
  terms: '/terms',
  admin: '/admin',
  'not-found': '/',
}

/** Путь маршрута без языкового префикса (используется для hreflang и внутренних вычислений). */
export function buildRawRoutePath(route: AppRoute, slug?: string | null): string {
  if (route === APP_ROUTES.memberDetails && slug) return `/members/${slug}`
  if (route === APP_ROUTES.newsDetails && slug) return `/news/${slug}`
  if (route === APP_ROUTES.eventsDetails && slug) return `/events/${slug}`
  return ROUTE_PATHS[route]
}

/**
 * Строит реальный путь для маршрута с учётом текущей локали (дефолтная `uk` — без префіксу)
 * и опционального динамического сегмента (участник/новина/подія).
 */
export function buildRoutePath(route: AppRoute, locale: Locale = DEFAULT_LOCALE, slug?: string | null): string {
  return buildLocalizedPath(locale, buildRawRoutePath(route, slug))
}

/**
 * Розбирає шлях (вже без мовного префіксу) на маршрут і динамічні сегменти (slug/anchor).
 * Не займається мовним префіксом — це відповідальність `localizedRouting.ts`.
 */
export function matchRoutePath(pathname: string): ParsedRoute {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return {route: APP_ROUTES.home, params: {}}

  const [head, second] = segments

  if (segments.length === 1) {
    if (head === 'about') return {route: APP_ROUTES.about, params: {}}
    if (head === 'activity') return {route: APP_ROUTES.activity, params: {}}
    if (head === 'knowledge') return {route: APP_ROUTES.knowledge, params: {}}
    if (head === 'join') return {route: APP_ROUTES.join, params: {}}
    if (head === 'contacts') return {route: APP_ROUTES.contacts, params: {}}
    if (head === 'privacy') return {route: APP_ROUTES.privacy, params: {}}
    if (head === 'terms') return {route: APP_ROUTES.terms, params: {}}
    if (head === 'admin') return {route: APP_ROUTES.admin, params: {}}
    if (head === 'members') return {route: APP_ROUTES.membersCatalog, params: {}}
    if (head === 'news') return {route: APP_ROUTES.newsList, params: {}}
    if (head === 'events') return {route: APP_ROUTES.eventsList, params: {}}
  }

  if (segments.length === 2 && second) {
    if (head === 'admin') return {route: APP_ROUTES.admin, params: {}}
    if (head === 'members') return {route: APP_ROUTES.memberDetails, params: {memberSlug: second}}
    if (head === 'news') return {route: APP_ROUTES.newsDetails, params: {newsSlug: second}}
    if (head === 'events') return {route: APP_ROUTES.eventsDetails, params: {eventSlug: second}}
  }

  if (head === 'admin') return {route: APP_ROUTES.admin, params: {}}

  return {route: APP_ROUTES.notFound, params: {}}
}
