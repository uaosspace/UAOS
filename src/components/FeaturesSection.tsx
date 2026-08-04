import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'
import {useSpotlightHandler} from '../hooks/useSpotlight'
import {ACTIVITY_DIRECTIONS} from '../data/activityDirections'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface FeaturesSectionProps {
  currentLang: Locale
  onNavigate: (route: AppRoute, options?: {anchor?: string}) => void
}

/**
 * Секція «4 напрями діяльності» на головній — джерело даних єдине з /activity (ACTIVITY_DIRECTIONS),
 * щоб уникнути дублювання копірайту (розділ 6.2/9 ТЗ).
 */
export default function FeaturesSection({currentLang, onNavigate}: FeaturesSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()
  const onSpotlight = useSpotlightHandler()

  const directions = ACTIVITY_DIRECTIONS.slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section className="section features" id="services">
      <div className="container">
        <div className="feature-grid reveal" ref={revealRef}>
          {directions.map((direction) => (
            <article key={direction.id} className="feature-card spotlight" onPointerMove={onSpotlight}>
              <svg className="feature-icon" aria-hidden="true">
                <use href={`#${direction.icon}`} />
              </svg>
              <h3>{resolveLocalized(direction.title, currentLang)}</h3>
              <p>{resolveLocalized(direction.shortDescription, currentLang)}</p>
              <button
                type="button"
                className="details"
                onClick={() => onNavigate(APP_ROUTES.activity, {anchor: direction.anchor})}
              >
                {t.btn_read_more} <span>→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
