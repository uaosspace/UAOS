import {useEffect, useMemo, useState} from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import SvgDefs from './components/SvgDefs'
import CookieBanner from './components/CookieBanner'
import AnalyticsGate from './components/AnalyticsGate'
import {useAppNavigation} from './hooks/useAppNavigation'
import {useCookieConsent} from './hooks/useCookieConsent'
import {useMembersResource} from './hooks/content/useMembersResource'
import {LOCALE_META, parseStoredLocale, type Locale} from './data/locales'
import {TRANSLATIONS} from './data/translations'
import HomePage from './pages/HomePage'
import MemberDetailsPage from './pages/MemberDetailsPage'
import PrivacyRoutePage from './pages/PrivacyRoutePage'
import {APP_ROUTES} from './routes/appRoutes'

export default function App() {
  const [currentLang, setCurrentLang] = useState<Locale>(() =>
    parseStoredLocale(localStorage.getItem('uaos_lang')),
  )

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('uaos_theme')
    if (saved === 'light' || saved === 'dark') return saved
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return systemPrefersDark ? 'dark' : 'light'
  })

  const {
    currentRoute,
    activeMemberSlug,
    handleNavigation,
    handleSelectMember,
  } = useAppNavigation()

  const membersNeeded =
    currentRoute === APP_ROUTES.home || currentRoute === APP_ROUTES.memberDetails
  const {data: members} = useMembersResource(membersNeeded)

  const {
    cookieConsent,
    acceptCookies,
    keepNecessaryCookiesOnly,
  } = useCookieConsent()

  const t = TRANSLATIONS[currentLang]

  useEffect(() => {
    localStorage.setItem('uaos_lang', currentLang)
    window.document.documentElement.lang = LOCALE_META[currentLang].htmlLang
  }, [currentLang])

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
    () => members.find((member) => member.slug === activeMemberSlug) ?? null,
    [activeMemberSlug, members],
  )

  return (
    <>
      <SvgDefs />
      <div className="min-h-screen flex flex-col relative">
        <Header
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
        />

        <main className="flex-grow">
          {currentRoute === APP_ROUTES.home ? (
            <HomePage
              currentLang={currentLang}
              currentRoute={currentRoute}
              members={members}
              onNavigate={handleNavigation}
              onSelectMember={handleSelectMember}
            />
          ) : currentRoute === APP_ROUTES.memberDetails && activeMember ? (
            <MemberDetailsPage
              currentLang={currentLang}
              member={activeMember}
              onBack={() => handleNavigation('home', {skipScrollToTop: true})}
            />
          ) : currentRoute === APP_ROUTES.privacy ? (
            <PrivacyRoutePage currentLang={currentLang} onBack={() => handleNavigation('home')} />
          ) : (
            <div className="container py-32 text-center space-y-4">
              <h2 className="text-2xl font-bold">{t.page_not_found}</h2>
              <button
                type="button"
                onClick={() => handleNavigation('home')}
                className="scribble-link compact"
              >
                <span className="label">{t.back_home}</span>
                <span className="arrow">→</span>
              </button>
            </div>
          )}
        </main>

        <Footer
          currentLang={currentLang}
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
          onOpenPrivacy={() => handleNavigation('privacy')}
        />

        {cookieConsent === null && (
          <CookieBanner
            currentLang={currentLang}
            onAccept={acceptCookies}
            onNecessaryOnly={keepNecessaryCookiesOnly}
            onOpenPrivacy={() => handleNavigation('privacy')}
          />
        )}

        <AnalyticsGate consent={cookieConsent} />
      </div>
    </>
  )
}
