import {useCallback, useEffect, useRef, useState} from 'react'
import {APP_ROUTES, buildRoutePath, type AppRoute, type RouteParams} from '../routes/appRoutes'
import {scrollToSection} from './useSectionNavigation'

interface NavigationOptions {
  skipScrollToTop?: boolean
  /** Якір активної секції (наприклад, для /activity#representation). */
  anchor?: string
}

interface ParsedRoute {
  route: AppRoute
  params: RouteParams
}

/**
 * Безопасно обновляет history state, не ломаясь в ограниченных окружениях.
 */
function safePushState(url: string) {
  try {
    window.history.pushState(null, '', url)
  } catch (error) {
    console.warn('History pushState is not supported or restricted:', error)
  }
}

function safeReplaceState(url: string) {
  try {
    window.history.replaceState(null, '', url)
  } catch (error) {
    console.warn('History replaceState is not supported or restricted:', error)
  }
}

/**
 * Разбирает pathname на маршрут и динамические сегменты (slug/anchor).
 */
function matchPathname(pathname: string): ParsedRoute {
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

/**
 * Преобразует legacy hash-ссылки (#/members/:slug, #/privacy) в новый path-маршрут для обратной совместимости.
 */
function matchLegacyHash(hash: string): string | null {
  if (hash.startsWith('#/members/')) {
    const slug = hash.replace('#/members/', '')
    return slug ? `/members/${slug}` : null
  }
  if (hash === '#/privacy') return '/privacy'
  return null
}

function parseRouteFromLocation(): ParsedRoute {
  return matchPathname(window.location.pathname)
}

/**
 * Координирует path-навигацию сайта (pushState/popstate), slug-маршруты и состояние модалки событий.
 */
export function useAppNavigation() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(APP_ROUTES.home)
  const [routeParams, setRouteParams] = useState<RouteParams>({})
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const memberProfileOriginRef = useRef<AppRoute>(APP_ROUTES.home)
  const wasOnMemberProfileRef = useRef(false)

  // Возврат к #participants після виходу з профілю учасника, якщо прийшли з home-каруселі.
  useEffect(() => {
    if (currentRoute === APP_ROUTES.memberDetails) {
      wasOnMemberProfileRef.current = true
      return
    }

    if (currentRoute === APP_ROUTES.home && wasOnMemberProfileRef.current) {
      wasOnMemberProfileRef.current = false
      window.setTimeout(() => {
        const el =
          window.document.getElementById('participants') ||
          window.document.getElementById('members')
        if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'})
      }, 150)
      return
    }

    wasOnMemberProfileRef.current = false
  }, [currentRoute])

  useEffect(() => {
    const url = new URL(window.location.href)
    const eventIdParam = url.searchParams.get('event')
    const eventsOpenParam = url.searchParams.get('events')

    if (eventIdParam) {
      setEventsModalOpen(true)
      setSelectedEventId(eventIdParam)
    } else if (eventsOpenParam === 'open') {
      setEventsModalOpen(true)
      setSelectedEventId(null)
    }

    // Legacy hash-ссылки (#/members/:slug, #/privacy) редиректим на новый path без лишней записи в history.
    const legacyPath = matchLegacyHash(window.location.hash)
    if (legacyPath && window.location.pathname === '/') {
      const nextUrl = new URL(window.location.href)
      nextUrl.pathname = legacyPath
      nextUrl.hash = ''
      safeReplaceState(nextUrl.toString())
    }

    /**
     * Синхронизирует state с текущим URL при back/forward и ручной смене адреса.
     */
    const handleLocationChange = () => {
      const nextRoute = parseRouteFromLocation()
      setCurrentRoute(nextRoute.route)
      setRouteParams(nextRoute.params)
    }

    handleLocationChange()
    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  /**
   * Открывает модалку событий и отражает её состояние в query string.
   */
  const openEventsCalendar = useCallback((eventId?: string) => {
    setEventsModalOpen(true)

    const url = new URL(window.location.href)
    if (eventId) {
      setSelectedEventId(eventId)
      url.searchParams.set('event', eventId)
      url.searchParams.delete('events')
    } else {
      setSelectedEventId(null)
      url.searchParams.set('events', 'open')
      url.searchParams.delete('event')
    }

    safePushState(url.toString())
  }, [])

  /**
   * Закрывает модалку событий и очищает связанные query-параметры.
   */
  const closeEventsCalendar = useCallback(() => {
    setEventsModalOpen(false)
    setSelectedEventId(null)

    const url = new URL(window.location.href)
    url.searchParams.delete('event')
    url.searchParams.delete('events')
    safePushState(url.toString())
  }, [])

  /**
   * Переключает верхнеуровневые страницы сайта по новому path-маршруту.
   */
  const handleNavigation = useCallback((route: AppRoute | 'admin', options?: NavigationOptions) => {
    const nextRoute: AppRoute = route === 'admin' ? APP_ROUTES.admin : route

    setCurrentRoute(nextRoute)
    setRouteParams(options?.anchor ? {activityAnchor: options.anchor} : {})

    const url = new URL(window.location.href)
    url.pathname = buildRoutePath(nextRoute)
    url.search = ''
    url.hash = options?.anchor ? `#${options.anchor}` : ''
    safePushState(url.toString())

    if (options?.anchor) {
      // Після зміни route даємо сторінці змонтуватися, потім скролимо до якоря.
      window.setTimeout(() => scrollToSection(options.anchor!), 120)
    } else if (!options?.skipScrollToTop) {
      window.scrollTo({top: 0, behavior: 'smooth'})
    }
  }, [])

  /**
   * Открывает публичный профиль участника и фиксирует slug в path URL.
   */
  const handleSelectMember = useCallback((slug: string, originRoute: AppRoute = APP_ROUTES.home) => {
    memberProfileOriginRef.current = originRoute
    setRouteParams({memberSlug: slug})
    setCurrentRoute(APP_ROUTES.memberDetails)

    const url = new URL(window.location.href)
    url.pathname = buildRoutePath(APP_ROUTES.memberDetails, slug)
    url.search = ''
    url.hash = ''
    safePushState(url.toString())
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [])

  /**
   * Возвращает пользователя туда, откуда он открыл профіль учасника (home-карусель або каталог).
   */
  const handleBackFromMember = useCallback(() => {
    handleNavigation(memberProfileOriginRef.current, {skipScrollToTop: memberProfileOriginRef.current !== APP_ROUTES.home})
  }, [handleNavigation])

  /**
   * Открывает деталі новини та фіксує slug у path URL.
   */
  const handleSelectNews = useCallback((slug: string) => {
    setRouteParams({newsSlug: slug})
    setCurrentRoute(APP_ROUTES.newsDetails)

    const url = new URL(window.location.href)
    url.pathname = buildRoutePath(APP_ROUTES.newsDetails, slug)
    url.search = ''
    url.hash = ''
    safePushState(url.toString())
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [])

  /**
   * Открывает деталі події та фіксує id у path URL.
   */
  const handleSelectEvent = useCallback((eventId: string) => {
    setRouteParams({eventSlug: eventId})
    setCurrentRoute(APP_ROUTES.eventsDetails)

    const url = new URL(window.location.href)
    url.pathname = buildRoutePath(APP_ROUTES.eventsDetails, eventId)
    url.search = ''
    url.hash = ''
    safePushState(url.toString())
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [])

  return {
    currentRoute,
    routeParams,
    eventsModalOpen,
    selectedEventId,
    setSelectedEventId,
    openEventsCalendar,
    closeEventsCalendar,
    handleNavigation,
    handleSelectMember,
    handleBackFromMember,
    handleSelectNews,
    handleSelectEvent,
  }
}
