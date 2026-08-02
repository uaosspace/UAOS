import {useState} from 'react'
import {Menu, X} from 'lucide-react'
import {TRANSLATIONS} from '../data/translations'
import type {Locale} from '../data/locales'
import BrandLogo from './BrandLogo'
import LanguageSwitcher from './LanguageSwitcher'
import ScribbleLink from './ScribbleLink'
import {useSectionNavigation} from '../hooks/useSectionNavigation'

interface HeaderProps {
  currentLang: Locale
  setCurrentLang: (lang: Locale) => void
  currentTheme: 'light' | 'dark'
  setCurrentTheme: (theme: 'light' | 'dark') => void
  currentRoute: string
  onNavigate: (route: string) => void
}

const NAV_ITEMS = [
  {id: 'about', key: 'nav_about' as const},
  {id: 'participants', key: 'nav_participants' as const},
  {id: 'services', key: 'nav_producers' as const},
  {id: 'services', key: 'nav_services' as const},
  {id: 'news', key: 'nav_news' as const},
  {id: 'services', key: 'nav_standards' as const},
  {id: 'services', key: 'nav_education' as const},
  {id: 'contacts', key: 'nav_contacts' as const},
]

export default function Header({
  currentLang,
  setCurrentLang,
  currentTheme,
  setCurrentTheme,
  currentRoute,
  onNavigate,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = TRANSLATIONS[currentLang]
  const goToSection = useSectionNavigation(() => onNavigate('home'), currentRoute)

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false)
    goToSection(sectionId)
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          type="button"
          className="brand"
          aria-label={t.aria_home}
          onClick={() => {
            setMobileMenuOpen(false)
            if (currentRoute !== 'home') {
              onNavigate('home')
            } else {
              goToSection('about')
            }
          }}
        >
          <BrandLogo />
          <span className="brand-copy">
            <strong>{t.brand_line_primary}</strong>
            <span>{t.brand_line_secondary}</span>
          </span>
        </button>

        <nav
          className={`desktop-nav${mobileMenuOpen ? ' open' : ''}`}
          id="site-nav"
          aria-label={t.aria_main_nav}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item.id)}
            >
              {t[item.key]}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <LanguageSwitcher currentLang={currentLang} setCurrentLang={setCurrentLang} />

          <div className="theme-switch" role="group" aria-label={t.aria_theme}>
            <button
              type="button"
              data-set-theme="dark"
              aria-label={t.theme_dark}
              aria-pressed={currentTheme === 'dark'}
              title={t.theme_dark_title}
              onClick={() => setCurrentTheme('dark')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 15.4A8.5 8.5 0 0 1 8.6 4 8.5 8.5 0 1 0 20 15.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              data-set-theme="light"
              aria-label={t.theme_light}
              aria-pressed={currentTheme === 'light'}
              title={t.theme_light_title}
              onClick={() => setCurrentTheme('light')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <ScribbleLink compact href="#join" onClick={(event) => {
            event.preventDefault()
            handleNavClick('join')
          }}>
            <span className="label">{t.nav_join}</span>
            <span className="arrow">→</span>
          </ScribbleLink>

          <button
            className="menu-button"
            type="button"
            aria-controls="site-nav"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t.menu_close : t.menu_open}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  )
}
