import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useReveal} from '../hooks/useReveal'
import {useSpotlightHandler} from '../hooks/useSpotlight'
import type {NewsItem} from '../data/news'
import type {AssociationEvent} from '../types'
import {isUpcomingEvent, sortEventsAscending} from '../utils/eventDate'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface NewsSectionProps {
  currentLang: Locale
  news: NewsItem[]
  events: AssociationEvent[]
  onSelectNews: (slug: string) => void
  onSelectEvent: (eventId: string) => void
  onNavigate: (route: AppRoute) => void
}

function formatDate(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleDateString(locale, {day: 'numeric', month: 'short', year: 'numeric'})
  } catch {
    return iso.slice(0, 10)
  }
}

/**
 * Об'єднаний блок «Новини та найближчі події» на головній (розділ 6.5 ТЗ):
 * до 2 останніх новин + 1 найближча подія, з graceful fallback якщо чогось немає.
 */
export default function NewsSection({
  currentLang,
  news,
  events,
  onSelectNews,
  onSelectEvent,
  onNavigate,
}: NewsSectionProps) {
  const t = TRANSLATIONS[currentLang]
  const revealRef = useReveal<HTMLDivElement>()
  const onSpotlight = useSpotlightHandler()

  const latestNews = news
    .filter((item) => item.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 2)

  const nextEvent = sortEventsAscending(events.filter((event) => event.published && isUpcomingEvent(event)))[0]

  const cards = [
    ...latestNews.map((item) => ({
      kind: 'news' as const,
      key: `news-${item.id}`,
      date: formatDate(item.publishedAt, currentLang),
      title: item.title[currentLang],
      desc: item.excerpt[currentLang],
      coverImageUrl: item.coverImageUrl,
      onOpen: () => onSelectNews(item.slug),
    })),
    ...(nextEvent
      ? [
          {
            kind: 'event' as const,
            key: `event-${nextEvent.id}`,
            date: formatDate(nextEvent.startAt, currentLang),
            title: nextEvent.title[currentLang],
            desc: nextEvent.shortDescription[currentLang],
            coverImageUrl: nextEvent.coverImageUrl,
            onOpen: () => onSelectEvent(nextEvent.id),
          },
        ]
      : []),
  ].slice(0, 3)

  return (
    <section className="section" id="news">
      <div className="container reveal" ref={revealRef}>
        <div className="section-kicker">
          {t.news_kicker}
        </div>
        <div className="section-heading">
          <h2>{t.news_title}</h2>
          <button type="button" className="text-link" onClick={() => onNavigate(APP_ROUTES.newsList)}>
            {t.news_link} <span>→</span>
          </button>
        </div>
        {cards.length > 0 ? (
          <div className="news-grid">
            {cards.map((card) => (
              <article key={card.key} className="news-card spotlight" onPointerMove={onSpotlight}>
                <div className="news-image">
                  {card.coverImageUrl ? (
                    <img src={card.coverImageUrl} alt="" className="news-image-photo" />
                  ) : (
                    <div
                      className="news-image-placeholder"
                      style={{
                        background:
                          card.kind === 'event'
                            ? 'linear-gradient(135deg, #1e3344 0%, #2a6080 100%)'
                            : 'linear-gradient(135deg, #1a3a52 0%, #0d6ea8 100%)',
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="news-body">
                  <div className="news-date">
                    {card.date}
                    {card.kind === 'event' && ` · ${t.events_upcoming_tab}`}
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <button type="button" className="read-more" onClick={card.onOpen}>
                    {t.news_read_more} <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-slate-500 dark:text-brand-slate-300">{t.news_empty}</p>
        )}
      </div>
    </section>
  )
}
