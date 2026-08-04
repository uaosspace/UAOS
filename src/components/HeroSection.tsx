import {useEffect, useState} from 'react'
import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {SITE_VISUAL} from '../data/siteVisual'
import ScribbleLink from './ScribbleLink'
import OutlineLink from './OutlineLink'
import HeroVyshyvankaCorner from './HeroVyshyvankaCorner'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface HeroSectionProps {
  currentLang: Locale
  onNavigate: (route: AppRoute, options?: {anchor?: string}) => void
  /** Список URL hero-фото; за замовчуванням — SITE_VISUAL.heroImageUrls */
  heroImageUrls?: readonly string[]
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeroSection({
  currentLang,
  onNavigate,
  heroImageUrls = SITE_VISUAL.heroImageUrls,
}: HeroSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const photos = heroImageUrls.length > 0 ? heroImageUrls : SITE_VISUAL.heroImageUrls
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (photos.length < 2 || prefersReducedMotion()) return

    photos.forEach((url, index) => {
      if (index === 0) return
      const img = new Image()
      img.src = url
    })

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length)
    }, SITE_VISUAL.heroRotateMs)

    return () => window.clearInterval(id)
  }, [photos])

  return (
    <section className="hero" id="about">
      <div className="hero-photos" aria-hidden="true">
        {photos.map((url, index) => (
          <img
            key={url}
            className={`hero-photo${index === activeIndex ? ' is-active' : ''}`}
            src={url}
            alt=""
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-copy-ornament-scope">
            <HeroVyshyvankaCorner />
            <div className="eyebrow">
              <svg className="eyebrow-check" aria-hidden="true">
                <use href="#icon-check-mark" />
              </svg>
              <span className="eyebrow-copy">
                <span className="eyebrow-line">{t.brand_line_primary}</span>
                <span className="eyebrow-line eyebrow-line-secondary">{t.brand_line_secondary}</span>
              </span>
            </div>
            <h1>{t.hero_title}</h1>
            <p className="hero-lead">{t.hero_lead}</p>
          </div>
          <div className="hero-actions">
            <ScribbleLink
              href="/join#join-form"
              onClick={(event) => {
                event.preventDefault()
                onNavigate(APP_ROUTES.join, {anchor: 'join-form'})
              }}
            >
              <span className="label">{t.hero_cta_join}</span>
              <span className="arrow">→</span>
            </ScribbleLink>
            <OutlineLink
              href="/members"
              onClick={(event) => {
                event.preventDefault()
                onNavigate(APP_ROUTES.membersCatalog)
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
