import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'
import {useSpotlightHandler} from '../hooks/useSpotlight'
import {useSectionNavigation} from '../hooks/useSectionNavigation'

interface FeaturesSectionProps {
  currentLang: Locale
  currentRoute?: string
  onNavigate?: (route: string) => void
}

const FEATURES = [
  {icon: 'icon-shield', titleKey: 'feature_1_title', descKey: 'feature_1_desc'},
  {icon: 'icon-doc', titleKey: 'feature_2_title', descKey: 'feature_2_desc'},
  {icon: 'icon-cap', titleKey: 'feature_3_title', descKey: 'feature_3_desc'},
  {icon: 'icon-globe', titleKey: 'feature_4_title', descKey: 'feature_4_desc'},
] as const

export default function FeaturesSection({
  currentLang,
  currentRoute = 'home',
  onNavigate,
}: FeaturesSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()
  const onSpotlight = useSpotlightHandler()
  const goToSection = useSectionNavigation(() => onNavigate?.('home'), currentRoute)

  return (
    <section className="section features" id="services">
      <div className="container">
        <div className="feature-grid reveal" ref={revealRef}>
          {FEATURES.map((feature) => (
            <article
              key={feature.titleKey}
              className="feature-card spotlight"
              onPointerMove={onSpotlight}
            >
              <svg className="feature-icon" aria-hidden="true">
                <use href={`#${feature.icon}`} />
              </svg>
              <h3>{t[feature.titleKey]}</h3>
              <p>{t[feature.descKey]}</p>
              <button
                type="button"
                className="details"
                onClick={() => goToSection('join')}
              >
                {t.feature_details} <span>→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
