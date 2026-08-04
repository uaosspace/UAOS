import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import ScribbleLink from './ScribbleLink'
import {useReveal} from '../hooks/useReveal'

interface JoinSectionProps {
  currentLang: Locale
  /** CTA-баннер на головній веде на /join замість mailto (розділ 6 ТЗ). */
  onCtaClick?: () => void
}

export default function JoinSection({currentLang, onCtaClick}: JoinSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <section className="join-section" id="join">
      <div className="container reveal" ref={revealRef}>
        <div className="join-panel">
          <div className="join-copy">
            <h2>
              {t.join_title_before}{' '}
              <span className="underlit">{t.join_title_underlit}</span>
            </h2>
            <p>{t.join_desc}</p>
          </div>
          <div className="join-action">
            <ScribbleLink
              href="/join#join-form"
              onClick={
                onCtaClick
                  ? (event) => {
                      event.preventDefault()
                      onCtaClick()
                    }
                  : undefined
              }
            >
              <span className="label">{t.join_cta}</span>
              <span className="arrow">→</span>
            </ScribbleLink>
          </div>
        </div>
      </div>
    </section>
  )
}
