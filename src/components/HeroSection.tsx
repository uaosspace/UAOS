import type {Locale} from '../data/locales'
import type {CSSProperties} from 'react'
import {TRANSLATIONS} from '../data/translations'
import {heroImageCssValue, SITE_VISUAL} from '../data/siteVisual'
import ScribbleLink from './ScribbleLink'
import OutlineLink from './OutlineLink'
import {useSectionNavigation} from '../hooks/useSectionNavigation'

interface HeroSectionProps {
  currentLang: Locale
  currentRoute?: string
  onNavigate?: (route: string) => void
  /** URL hero-фото справа; за замовчуванням — SITE_VISUAL.heroImageUrl */
  heroImageUrl?: string
}

export default function HeroSection({
  currentLang,
  currentRoute = 'home',
  onNavigate,
  heroImageUrl = SITE_VISUAL.heroImageUrl,
}: HeroSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const goToSection = useSectionNavigation(() => onNavigate?.('home'), currentRoute)

  return (
    <section className="hero" id="about">
      <div
        className="hero-photo"
        aria-hidden="true"
        style={{'--hero-image-url': heroImageCssValue(heroImageUrl)} as CSSProperties}
      />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">{t.hero_eyebrow}</div>
          <h1>
            {t.hero_title_before}{' '}
            <span className="accent-word">{t.hero_title_accent}</span>{' '}
            {t.hero_title_mid}{' '}
            <span className="underlit">{t.hero_title_underlit}</span>
          </h1>
          <p className="hero-lead">{t.hero_lead}</p>
          <div className="hero-actions">
            <ScribbleLink
              href="#join"
              onClick={(event) => {
                event.preventDefault()
                goToSection('join')
              }}
            >
              <span className="label">{t.hero_cta_join}</span>
              <span className="arrow">→</span>
            </ScribbleLink>
            <OutlineLink
              href="#participants"
              onClick={(event) => {
                event.preventDefault()
                goToSection('participants')
              }}
            >
              {t.hero_cta_catalog} <span>→</span>
            </OutlineLink>
          </div>
          <div className="hero-index">{t.hero_index}</div>
        </div>
      </div>
      <aside className="side-identity" aria-hidden="true">
        <span>{t.hero_side_label}</span>
        <svg className="side-tryzub">
          <use href="#tryzub" />
        </svg>
      </aside>
    </section>
  )
}
