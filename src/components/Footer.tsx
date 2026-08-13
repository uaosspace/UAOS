import {useMemo} from 'react'
import {TRANSLATIONS} from '../data/translations'
import BrandLogo from './BrandLogo'
import type {Locale} from '../data/locales'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'
import {useSiteSettingsResource} from '../hooks/content/useSiteSettingsResource'

interface FooterProps {
  currentLang: Locale
  currentRoute?: AppRoute
  onNavigate: (route: AppRoute) => void
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
}

const FOOTER_NAV = [
  {key: 'nav_about' as const, route: APP_ROUTES.about},
  {key: 'nav_participants' as const, route: APP_ROUTES.membersCatalog},
  {key: 'nav_activity' as const, route: APP_ROUTES.activity},
  {key: 'nav_news' as const, route: APP_ROUTES.newsList},
  {key: 'nav_knowledge' as const, route: APP_ROUTES.knowledge},
  {key: 'nav_contacts' as const, route: APP_ROUTES.contacts},
]

const FOOTER_ACTIVITY = [
  'footer_activity_1',
  'footer_activity_2',
  'footer_activity_3',
  'footer_activity_4',
] as const

export default function Footer({
  currentLang,
  onNavigate,
  onOpenPrivacy,
  onOpenTerms,
}: FooterProps) {
  const t = TRANSLATIONS[currentLang]
  const year = new Date().getFullYear()
  const {data: settings} = useSiteSettingsResource(true)
  const footerNav = useMemo(
    () =>
      FOOTER_NAV.filter(
        (item) => item.route !== APP_ROUTES.knowledge || settings.knowledgeShowOnSite,
      ),
    [settings.knowledgeShowOnSite],
  )

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <button
            type="button"
            className="brand"
            aria-label={t.aria_home}
            onClick={() => onNavigate(APP_ROUTES.home)}
          >
            <BrandLogo />
            <span className="brand-copy">
              <strong>{t.brand_line_primary}</strong>
              <span>{t.brand_line_secondary}</span>
            </span>
          </button>
          <p>{t.footer_desc}</p>
          {settings.socialsShowOnSite ? (
          <div className="socials">
            <a href={`mailto:${t.footer_email}`} aria-label={t.social_linkedin}>in</a>
            <a href={`mailto:${t.footer_email}`} aria-label={t.social_facebook}>f</a>
            <a href={`mailto:${t.footer_email}`} aria-label={t.social_youtube}>▶</a>
            <a href={`mailto:${t.footer_email}`} aria-label={t.social_telegram}>↗</a>
          </div>
          ) : null}
        </div>

        <div className="footer-col">
          <h3>{t.footer_nav_title}</h3>
          {footerNav.map((item) => (
            <button key={item.key} type="button" onClick={() => onNavigate(item.route)}>
              {t[item.key]}
            </button>
          ))}
        </div>

        <div className="footer-col">
          <h3>{t.footer_activity_title}</h3>
          {FOOTER_ACTIVITY.map((key) => (
            <button key={key} type="button" onClick={() => onNavigate(APP_ROUTES.activity)}>
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
          <button type="button" onClick={onOpenTerms ?? (() => onNavigate(APP_ROUTES.terms))}>
            {t.footer_terms}
          </button>
          <a href="/admin" className="footer-admin-link">
            {t.nav_admin}
          </a>
        </span>
      </div>
    </footer>
  )
}
