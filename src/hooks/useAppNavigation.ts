import {useCallback, useEffect, useRef, useState} from 'react'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface NavigationOptions {
  skipScrollToTop?: boolean
}

/**
 * Безопасно обновляет history state, не ломаясь в ограниченных окружениях.
 */
function safePushState(data: unknown, unused: string, url?: string | null) {
  try {
    window.history.pushState(data, unused, url)
  } catch (error) {
    console.warn('History pushState is not supported or restricted:', error)
  }
}

/**
 * Читает текущий route и member slug из hash URL.
 */
function parseRouteFromLocation(): {route: AppRoute; memberSlug: string | null} {
  const hash = window.location.hash

  if (hash.startsWith('#/members/')) {
    return {
      route: APP_ROUTES.memberDetails,
      memberSlug: hash.replace('#/members/', ''),
    }
  }

  if (hash === '#/privacy') {
    return {
      route: APP_ROUTES.privacy,
      memberSlug: null,
    }
  }

  return {
    route: APP_ROUTES.home,
    memberSlug: null,
  }
}

/**
 * Координирует hash/query-навигацию сайта и состояние модалки событий.
 */
export function useAppNavigation() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(APP_ROUTES.home)
  const [activeMemberSlug, setActiveMemberSlug] = useState<string | null>(null)
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const wasOnMemberProfileRef = useRef(false)

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

    /**
     * Синхронизирует state с текущим URL при back/forward и ручной смене hash.
     */
    const handleLocationChange = () => {
      const nextRoute = parseRouteFromLocation()
      setCurrentRoute(nextRoute.route)
      setActiveMemberSlug(nextRoute.memberSlug)
    }

    handleLocationChange()
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
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

    safePushState(null, '', url.toString())
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
    safePushState(null, '', url.toString())
  }, [])

  /**
   * Переключает верхнеуровневые страницы сайта без полноценного роутера.
   */
  const handleNavigation = useCallback((route: AppRoute | 'admin', options?: NavigationOptions) => {
    if (route === 'admin') {
      route = APP_ROUTES.home
    }

    setCurrentRoute(route)

    if (route === APP_ROUTES.home) {
      setActiveMemberSlug(null)
      const url = new URL(window.location.href)
      url.search = ''
      url.hash = ''
      safePushState(null, '', url.toString())
      if (!options?.skipScrollToTop) {
        window.scrollTo({top: 0, behavior: 'smooth'})
      }
      return
    }

    if (route === APP_ROUTES.privacy) {
      const url = new URL(window.location.href)
      url.hash = '#/privacy'
      safePushState(null, '', url.toString())
      window.scrollTo({top: 0, behavior: 'smooth'})
    }
  }, [])

  /**
   * Открывает публичный профиль участника и фиксирует slug в hash URL.
   */
  const handleSelectMember = useCallback((slug: string) => {
    setActiveMemberSlug(slug)
    setCurrentRoute(APP_ROUTES.memberDetails)

    const url = new URL(window.location.href)
    url.hash = `#/members/${slug}`
    safePushState(null, '', url.toString())
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [])

  return {
    currentRoute,
    activeMemberSlug,
    eventsModalOpen,
    selectedEventId,
    setSelectedEventId,
    openEventsCalendar,
    closeEventsCalendar,
    handleNavigation,
    handleSelectMember,
  }
}
