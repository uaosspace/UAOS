import {useCallback, useEffect, useRef, useState} from 'react'
import {APP_ROUTES, buildRoutePath, matchRoutePath, type AppRoute, type ParsedRoute, type RouteParams} from '../routes/appRoutes'
import {splitLocaleFromPathname} from '../routes/localizedRouting'
import {DEFAULT_LOCALE, parseStoredLocale, type Locale} from '../data/locales'
import {scrollToSection} from './useSectionNavigation'

const LANG_STORAGE_KEY = 'uaos_lang'

interface NavigationOptions {
  skipScrollToTop?: boolean
  /** Якір активної секції (наприклад, для /activity#representation). */
  anchor?: string
}

interface ParsedLocalizedRoute extends ParsedRoute {
  locale: Locale
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
 * Разбирает pathname на язык (по префіксу), маршрут и динамические сегменты (slug/anchor).
 * Спочатку знімається мовний префікс (URL — джерело істини для мови), потім залишок матчиться
 * на маршрут як раніше.
 */
function matchPathname(pathname: string): ParsedLocalizedRoute {
  const {locale, pathWithoutLocale} = splitLocaleFromPathname(pathname)
  const {route, params} = matchRoutePath(pathWithoutLocale)
  return {route, params, locale}
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

function parseRouteFromLocation(): ParsedLocalizedRoute {
  return matchPathname(window.location.pathname)
}

/**
 * Мова для маршруту `/admin` не кодується в URL (адмінка лишається без мовного префіксу),
 * тож для неї єдиний доступний сигнал — останній вибір користувача з localStorage.
 */
function deriveInitialLocale(parsed: ParsedLocalizedRoute): Locale {
  if (parsed.route === APP_ROUTES.admin) {
    try {
      return parseStoredLocale(window.localStorage.getItem(LANG_STORAGE_KEY))
    } catch {
      return DEFAULT_LOCALE
    }
  }
  return parsed.locale
}

/**
 * Координирует path-навигацию сайта (pushState/popstate), slug-маршруты и состояние модалки событий.
 */
export function useAppNavigation() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(APP_ROUTES.home)
  const [routeParams, setRouteParams] = useState<RouteParams>({})
  const [currentLang, setCurrentLangState] = useState<Locale>(() =>
    deriveInitialLocale(parseRouteFromLocation()),
  )
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const memberProfileOriginRef = useRef<AppRoute>(APP_ROUTES.home)
  const wasOnMemberProfileRef = useRef(false)
  const currentLangRef = useRef(currentLang)
  currentLangRef.current = currentLang

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
    // Мовний префікс (якщо є) зберігається — розбирається до перевірки hash.
    const {locale: currentUrlLocale, pathWithoutLocale} = splitLocaleFromPathname(window.location.pathname)
    const legacyPath = matchLegacyHash(window.location.hash)
    if (legacyPath && pathWithoutLocale === '/') {
      const legacyMatch = matchRoutePath(legacyPath)
      const nextUrl = new URL(window.location.href)
      nextUrl.pathname = buildRoutePath(legacyMatch.route, currentUrlLocale, legacyMatch.params.memberSlug)
      nextUrl.hash = ''
      safeReplaceState(nextUrl.toString())
    }

    /**
     * Синхронизирует state с текущим URL при back/forward и ручной смене адреса.
     * Мова визначається виключно з URL (окрім `/admin`, де немає префіксу).
     */
    const handleLocationChange = () => {
      const nextRoute = parseRouteFromLocation()
      setCurrentRoute(nextRoute.route)
      setRouteParams(nextRoute.params)
      if (nextRoute.route !== APP_ROUTES.admin) {
        setCurrentLangState(nextRoute.locale)
      }
    }

    handleLocationChange()
    window.addEventListener('popstate', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  // Останній вибір мови зберігається лише як preference (не як джерело істини для маршрутів з контентом).
  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, currentLang)
    } catch (error) {
      console.warn('localStorage is not available to persist language preference:', error)
    }
  }, [currentLang])

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
    url.pathname = buildRoutePath(nextRoute, currentLangRef.current)
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
    url.pathname = buildRoutePath(APP_ROUTES.memberDetails, currentLangRef.current, slug)
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
    url.pathname = buildRoutePath(APP_ROUTES.newsDetails, currentLangRef.current, slug)
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
    url.pathname = buildRoutePath(APP_ROUTES.eventsDetails, currentLangRef.current, eventId)
    url.search = ''
    url.hash = ''
    safePushState(url.toString())
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [])

  /**
   * Публічна зміна мови сайту (для LanguageSwitcher у Header): переписує поточний URL
   * на еквівалентний шлях з новим префіксом через pushState, зберігаючи route/params.
   */
  const changeLanguage = useCallback(
    (nextLang: Locale) => {
      if (nextLang === currentLangRef.current) return
      setCurrentLangState(nextLang)

      const slug = routeParams.memberSlug ?? routeParams.newsSlug ?? routeParams.eventSlug ?? null
      const url = new URL(window.location.href)
      url.pathname = buildRoutePath(currentRoute, nextLang, slug)
      safePushState(url.toString())
    },
    [currentRoute, routeParams],
  )

  /**
   * Пряма зміна мови без переписування URL — лише для `/admin`, де мовний префікс не
   * використовується і мова інтерфейсу є суто локальним переключенням.
   */
  const setAdminLang = useCallback((nextLang: Locale) => {
    setCurrentLangState(nextLang)
  }, [])

  return {
    currentRoute,
    routeParams,
    currentLang,
    changeLanguage,
    setAdminLang,
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
