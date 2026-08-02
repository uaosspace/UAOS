import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'
import {useSpotlightHandler} from '../hooks/useSpotlight'
import {useSectionNavigation} from '../hooks/useSectionNavigation'

interface NewsSectionProps {
  currentLang: Locale
  currentRoute?: string
  onNavigate?: (route: string) => void
}

const NEWS_ITEMS = [
  {
    dateKey: 'news_1_date',
    titleKey: 'news_1_title',
    descKey: 'news_1_desc',
    gradient: 'linear-gradient(135deg, #1a3a52 0%, #0d6ea8 100%)',
  },
  {
    dateKey: 'news_2_date',
    titleKey: 'news_2_title',
    descKey: 'news_2_desc',
    gradient: 'linear-gradient(135deg, #243b4f 0%, #3d7a99 100%)',
  },
  {
    dateKey: 'news_3_date',
    titleKey: 'news_3_title',
    descKey: 'news_3_desc',
    gradient: 'linear-gradient(135deg, #1e3344 0%, #2a6080 100%)',
  },
] as const

export default function NewsSection({
  currentLang,
  currentRoute = 'home',
  onNavigate,
}: NewsSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()
  const onSpotlight = useSpotlightHandler()
  const goToSection = useSectionNavigation(() => onNavigate?.('home'), currentRoute)

  return (
    <section className="section" id="news">
      <div className="container reveal" ref={revealRef}>
        <div className="section-kicker" data-index="02 /">
          {t.news_kicker}
        </div>
        <div className="section-heading">
          <h2>{t.news_title}</h2>
          <button type="button" className="text-link" onClick={() => goToSection('join')}>
            {t.news_link} <span>→</span>
          </button>
        </div>
        <div className="news-grid">
          {NEWS_ITEMS.map((item) => (
            <article
              key={item.titleKey}
              className="news-card spotlight"
              onPointerMove={onSpotlight}
            >
              <div className="news-image">
                <div
                  className="news-image-placeholder"
                  style={{background: item.gradient}}
                  aria-hidden="true"
                />
              </div>
              <div className="news-body">
                <div className="news-date">{t[item.dateKey]}</div>
                <h3>{t[item.titleKey]}</h3>
                <p>{t[item.descKey]}</p>
                <button type="button" className="read-more" onClick={() => goToSection('join')}>
                  {t.news_read_more} <span>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
