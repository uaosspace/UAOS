import {useCallback, useEffect, useMemo, useState, type ReactNode} from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import SvgDefs from './components/SvgDefs'
import CookieBanner from './components/CookieBanner'
import AnalyticsGate from './components/AnalyticsGate'
import {useAppNavigation} from './hooks/useAppNavigation'
import {useCookieConsent} from './hooks/useCookieConsent'
import {useMembersResource} from './hooks/content/useMembersResource'
import {useNewsResource} from './hooks/content/useNewsResource'
import {useEventsResource} from './hooks/content/useEventsResource'
import {useDocumentsResource} from './hooks/content/useDocumentsResource'
import {LOCALE_META} from './data/locales'
import {buildHreflangAlternates} from './routes/localizedRouting'
import {buildRawRoutePath} from './routes/appRoutes'
import {TRANSLATIONS} from './data/translations'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ActivityPage from './pages/ActivityPage'
import MembersCatalogPage from './pages/MembersCatalogPage'
import MemberDetailsPage from './pages/MemberDetailsPage'
import NewsListPage from './pages/NewsListPage'
import NewsDetailPage from './pages/NewsDetailPage'
import EventsListPage from './pages/EventsListPage'
import EventsDetailPage from './pages/EventsDetailPage'
import KnowledgePage from './pages/KnowledgePage'
import JoinPage from './pages/JoinPage'
import ContactsPage from './pages/ContactsPage'
import PrivacyRoutePage from './pages/PrivacyRoutePage'
import TermsRoutePage from './pages/TermsRoutePage'
import NotFoundPage from './pages/NotFoundPage'
import AdminApp from './pages/admin/AdminApp'
import PageTransition from './components/PageTransition'
import {APP_ROUTES} from './routes/appRoutes'

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('uaos_theme')
    if (saved === 'light' || saved === 'dark') return saved
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return systemPrefersDark ? 'dark' : 'light'
  })

  const {
    currentRoute,
    routeParams,
    currentLang,
    changeLanguage,
    setAdminLang,
    handleNavigation,
    handleSelectMember,
    handleBackFromMember,
    handleSelectNews,
    handleSelectEvent,
  } = useAppNavigation()

  const membersNeeded =
    currentRoute === APP_ROUTES.home ||
    currentRoute === APP_ROUTES.memberDetails ||
    currentRoute === APP_ROUTES.membersCatalog
  const {data: members} = useMembersResource(membersNeeded)

  const newsNeeded =
    currentRoute === APP_ROUTES.home ||
    currentRoute === APP_ROUTES.newsList ||
    currentRoute === APP_ROUTES.newsDetails
  const {data: news} = useNewsResource(newsNeeded)

  const eventsNeeded =
    currentRoute === APP_ROUTES.home ||
    currentRoute === APP_ROUTES.eventsList ||
    currentRoute === APP_ROUTES.eventsDetails ||
    currentRoute === APP_ROUTES.newsList
  const {data: events} = useEventsResource(eventsNeeded)

  const documentsNeeded = currentRoute === APP_ROUTES.knowledge
  const {data: documents} = useDocumentsResource(documentsNeeded)

  const {
    cookieConsent,
    acceptCookies,
    keepNecessaryCookiesOnly,
  } = useCookieConsent()

  const t = TRANSLATIONS[currentLang]

  useEffect(() => {
    window.document.documentElement.lang = LOCALE_META[currentLang].htmlLang
  }, [currentLang])

  // hreflang alternate links для поточного маршруту (SEO: URL — джерело істини для мови).
  // Не рендериться для /admin — це закритий SPA-режим без публічної мовної схеми.
  useEffect(() => {
    const existing = window.document.head.querySelectorAll('link[data-managed="hreflang"]')
    existing.forEach((el) => el.remove())

    if (currentRoute === APP_ROUTES.admin) return

    const slug = routeParams.memberSlug ?? routeParams.newsSlug ?? routeParams.eventSlug ?? null
    const rawPath = buildRawRoutePath(currentRoute, slug)
    const alternates = buildHreflangAlternates(rawPath, window.location.origin)

    alternates.forEach(({hrefLang, href}) => {
      const link = window.document.createElement('link')
      link.setAttribute('rel', 'alternate')
      link.setAttribute('hreflang', hrefLang)
      link.setAttribute('href', href)
      link.setAttribute('data-managed', 'hreflang')
      window.document.head.appendChild(link)
    })

    return () => {
      window.document.head
        .querySelectorAll('link[data-managed="hreflang"]')
        .forEach((el) => el.remove())
    }
  }, [currentRoute, routeParams])

  useEffect(() => {
    const root = window.document.documentElement
    root.dataset.theme = currentTheme
    if (currentTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('uaos_theme', currentTheme)

    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      themeMeta.setAttribute('content', currentTheme === 'dark' ? '#061523' : '#dff4ff')
    }
  }, [currentTheme])

  const activeMember = useMemo(
    () => members.find((member) => member.slug === routeParams.memberSlug) ?? null,
    [routeParams.memberSlug, members],
  )
  const activeNews = useMemo(
    () => news.find((item) => item.slug === routeParams.newsSlug) ?? null,
    [routeParams.newsSlug, news],
  )
  const activeEvent = useMemo(
    () => events.find((event) => event.id === routeParams.eventSlug) ?? null,
    [routeParams.eventSlug, events],
  )

  const openNews = useCallback(
    (slug: string) => {
      const item = news.find((entry) => entry.slug === slug)
      if (item?.externalUrl) {
        window.open(item.externalUrl, '_blank', 'noopener,noreferrer')
        return
      }
      handleSelectNews(slug)
    },
    [news, handleSelectNews],
  )

  const pageTransitionKey = useMemo(
    () =>
      [
        currentRoute,
        routeParams.memberSlug,
        routeParams.newsSlug,
        routeParams.eventSlug,
        routeParams.activityAnchor,
      ]
        .filter(Boolean)
        .join(':'),
    [currentRoute, routeParams],
  )

  let mainContent: ReactNode

  if (currentRoute === APP_ROUTES.home) {
    mainContent = (
      <HomePage
        currentLang={currentLang}
        members={members}
        news={news}
        events={events}
        onNavigate={handleNavigation}
        onSelectMember={handleSelectMember}
        onSelectNews={openNews}
        onSelectEvent={handleSelectEvent}
      />
    )
  } else if (currentRoute === APP_ROUTES.about) {
    mainContent = <AboutPage currentLang={currentLang} />
  } else if (currentRoute === APP_ROUTES.activity) {
    mainContent = <ActivityPage currentLang={currentLang} anchor={routeParams.activityAnchor} />
  } else if (currentRoute === APP_ROUTES.membersCatalog) {
    mainContent = (
      <MembersCatalogPage
        currentLang={currentLang}
        members={members}
        onSelectMember={(slug) => handleSelectMember(slug, APP_ROUTES.membersCatalog)}
      />
    )
  } else if (currentRoute === APP_ROUTES.memberDetails && activeMember) {
    mainContent = <MemberDetailsPage currentLang={currentLang} member={activeMember} onBack={handleBackFromMember} />
  } else if (currentRoute === APP_ROUTES.newsList) {
    mainContent = (
      <NewsListPage
        currentLang={currentLang}
        news={news}
        events={events}
        onSelectNews={openNews}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigation}
      />
    )
  } else if (currentRoute === APP_ROUTES.newsDetails && activeNews) {
    mainContent = (
      <NewsDetailPage
        currentLang={currentLang}
        item={activeNews}
        onBack={() => handleNavigation(APP_ROUTES.newsList, {skipScrollToTop: true})}
      />
    )
  } else if (currentRoute === APP_ROUTES.eventsList) {
    mainContent = (
      <EventsListPage
        currentLang={currentLang}
        events={events}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigation}
      />
    )
  } else if (currentRoute === APP_ROUTES.eventsDetails && activeEvent) {
    mainContent = (
      <EventsDetailPage
        currentLang={currentLang}
        event={activeEvent}
        onBack={() => handleNavigation(APP_ROUTES.eventsList, {skipScrollToTop: true})}
      />
    )
  } else if (currentRoute === APP_ROUTES.knowledge) {
    mainContent = <KnowledgePage currentLang={currentLang} documents={documents} />
  } else if (currentRoute === APP_ROUTES.join) {
    mainContent = (
      <JoinPage
        currentLang={currentLang}
        anchor={routeParams.activityAnchor}
        onOpenPrivacy={() => handleNavigation(APP_ROUTES.privacy)}
        onOpenTerms={() => handleNavigation(APP_ROUTES.terms)}
      />
    )
  } else if (currentRoute === APP_ROUTES.contacts) {
    mainContent = <ContactsPage currentLang={currentLang} />
  } else if (currentRoute === APP_ROUTES.privacy) {
    mainContent = <PrivacyRoutePage currentLang={currentLang} onBack={() => handleNavigation(APP_ROUTES.home)} />
  } else if (currentRoute === APP_ROUTES.terms) {
    mainContent = <TermsRoutePage currentLang={currentLang} onBack={() => handleNavigation(APP_ROUTES.home)} />
  } else if (currentRoute === APP_ROUTES.admin) {
    mainContent = (
      <AdminApp currentLang={currentLang} setCurrentLang={setAdminLang} />
    )
  } else {
    mainContent = <NotFoundPage currentLang={currentLang} onBackHome={() => handleNavigation(APP_ROUTES.home)} />
  }

  if (currentRoute === APP_ROUTES.admin) {
    return (
      <>
        <SvgDefs />
        <div className="relative min-h-screen overflow-hidden bg-slate-50 text-brand-slate-900 transition-colors duration-300 dark:bg-[#060810] dark:text-brand-slate-100">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-30" aria-hidden />
          <div className="relative z-10">{mainContent}</div>
        </div>
      </>
    )
  }

  return (
    <>
      <SvgDefs />
      <div className="min-h-screen flex flex-col relative">
        <Header
          currentLang={currentLang}
          setCurrentLang={changeLanguage}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
        />

        <main className="flex-grow">
          <PageTransition key={pageTransitionKey}>{mainContent}</PageTransition>
        </main>

        <Footer
          currentLang={currentLang}
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
          onOpenPrivacy={() => handleNavigation(APP_ROUTES.privacy)}
          onOpenTerms={() => handleNavigation(APP_ROUTES.terms)}
        />

        {cookieConsent === null && (
          <CookieBanner
            currentLang={currentLang}
            onAccept={acceptCookies}
            onNecessaryOnly={keepNecessaryCookiesOnly}
            onOpenPrivacy={() => handleNavigation(APP_ROUTES.privacy)}
          />
        )}

        <AnalyticsGate consent={cookieConsent} />
      </div>
    </>
  )
}
