import {TRANSLATIONS} from '../data/translations'
import {useSectionNavigation} from '../hooks/useSectionNavigation'
import BrandLogo from './BrandLogo'
import type {Locale} from '../data/locales'

interface FooterProps {
  currentLang: Locale
  currentRoute?: string
  onNavigate: (route: string) => void
  onOpenPrivacy?: () => void
}

const FOOTER_NAV = [
  'nav_about',
  'nav_participants',
  'nav_producers',
  'nav_news',
  'nav_standards',
  'nav_education',
] as const

const FOOTER_NAV_TARGETS = [
  'about',
  'participants',
  'services',
  'news',
  'services',
  'services',
] as const

const FOOTER_ACTIVITY = [
  'footer_activity_1',
  'footer_activity_2',
  'footer_activity_3',
  'footer_activity_4',
  'footer_activity_5',
] as const

export default function Footer({
  currentLang,
  currentRoute = 'home',
  onNavigate,
  onOpenPrivacy,
}: FooterProps) {
  const t = TRANSLATIONS[currentLang]
  const goToSection = useSectionNavigation(() => onNavigate('home'), currentRoute)
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer" id="contacts">
      <div className="container footer-grid">
        <div className="footer-brand">
          <button
            type="button"
            className="brand"
            aria-label={t.aria_home}
            onClick={() => {
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
          <p>{t.footer_desc}</p>
          <div className="socials">
            <a href="#join" aria-label={t.social_linkedin} onClick={(event) => { event.preventDefault(); goToSection('join') }}>in</a>
            <a href="#join" aria-label={t.social_facebook} onClick={(event) => { event.preventDefault(); goToSection('join') }}>f</a>
            <a href="#join" aria-label={t.social_youtube} onClick={(event) => { event.preventDefault(); goToSection('join') }}>▶</a>
            <a href="#join" aria-label={t.social_telegram} onClick={(event) => { event.preventDefault(); goToSection('join') }}>↗</a>
          </div>
        </div>

        <div className="footer-col">
          <h3>{t.footer_nav_title}</h3>
          {FOOTER_NAV.map((key, index) => (
            <button key={key} type="button" onClick={() => goToSection(FOOTER_NAV_TARGETS[index])}>
              {t[key]}
            </button>
          ))}
          <button type="button" onClick={() => goToSection('contacts')}>
            {t.nav_contacts}
          </button>
        </div>

        <div className="footer-col">
          <h3>{t.footer_activity_title}</h3>
          {FOOTER_ACTIVITY.map((key) => (
            <button key={key} type="button" onClick={() => goToSection('services')}>
              {t[key]}
            </button>
          ))}
        </div>

        <div className="footer-col">
          <h3>{t.footer_contacts_title}</h3>
          <p>{t.footer_address.split('\n').map((line, index) => (
            <span key={line}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}</p>
          <a href={`tel:${t.footer_phone.replace(/\s/g, '')}`}>{t.footer_phone}</a>
          <a href={`mailto:${t.footer_email}`}>{t.footer_email}</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          © 2012–{year} {t.footer_copyright}
        </span>
        <span className="footer-legal">
          <button type="button" onClick={onOpenPrivacy}>
            {t.footer_privacy}
          </button>
          <button type="button" onClick={() => goToSection('join')}>
            {t.footer_terms}
          </button>
        </span>
      </div>
    </footer>
  )
}
