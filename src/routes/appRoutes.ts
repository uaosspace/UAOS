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

/** Статичный путь для каждого маршрута без динамических сегментов (используется для навигации/ссылок). */
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
  admin: '/admin',
  'not-found': '/',
}

/** Строит реальный путь для маршрута с динамическим сегментом (участник/новина/подія). */
export function buildRoutePath(route: AppRoute, slug?: string | null): string {
  if (route === APP_ROUTES.memberDetails && slug) return `/members/${slug}`
  if (route === APP_ROUTES.newsDetails && slug) return `/news/${slug}`
  if (route === APP_ROUTES.eventsDetails && slug) return `/events/${slug}`
  return ROUTE_PATHS[route]
}
