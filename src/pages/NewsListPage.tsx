import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {NewsItem} from '../data/news'
import type {AssociationEvent} from '../types'
import {isUpcomingEvent, sortEventsAscending} from '../utils/eventDate'
import EventCard from '../components/events/EventCard'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'
import {Calendar} from 'lucide-react'

interface NewsListPageProps {
  currentLang: Locale
  news: NewsItem[]
  events: AssociationEvent[]
  onSelectNews: (slug: string) => void
  onSelectEvent: (eventId: string) => void
  onNavigate: (route: AppRoute) => void
}

function formatDate(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleDateString(locale, {day: 'numeric', month: 'long', year: 'numeric'})
  } catch {
    return iso.slice(0, 10)
  }
}

/**
 * Сторінка вкладки «Новини»: спочатку блок подій, нижче — новини (окремі картки й посилання).
 */
export default function NewsListPage({
  currentLang,
  news,
  events,
  onSelectNews,
  onSelectEvent,
  onNavigate,
}: NewsListPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${t.news_section_title} — ${t.brand_name}`,
    description: t.news_page_subtitle,
  })

  const upcomingEvents = sortEventsAscending(
    events.filter((event) => event.published && isUpcomingEvent(event)),
  )

  const publishedNews = news
    .filter((item) => item.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <section aria-labelledby="news-page-events-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <h1
                id="news-page-events-heading"
                className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug"
              >
                {t.events_upcoming}
              </h1>
              <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 max-w-xl">
                {t.news_page_events_intro}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(APP_ROUTES.eventsList)}
              className="text-sm font-bold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300 shrink-0"
            >
              {t.events_all}
            </button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentLang={currentLang}
                  onOpenDetails={onSelectEvent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl max-w-md mx-auto">
              <p className="text-sm font-semibold text-brand-slate-500 dark:text-brand-slate-300 uppercase font-mono">
                {t.events_no_upcoming}
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="news-page-news-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <h2
                id="news-page-news-heading"
                className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug"
              >
                {t.news_section_title}
              </h2>
              <p className="text-sm sm:text-base text-brand-slate-600 dark:text-brand-slate-200 max-w-xl">
                {t.news_page_news_intro}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('news-page-news-heading')
                  ?.scrollIntoView({behavior: 'smooth', block: 'start'})
              }
              className="text-sm font-bold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300 shrink-0"
            >
              {t.news_link} →
            </button>
          </div>

          {publishedNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedNews.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectNews(item.slug)}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col text-left shadow-sm group"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-brand-blue-500/20 to-brand-slate-900/40 relative overflow-hidden">
                    {item.coverImageUrl ? (
                      <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-brand-slate-400 uppercase">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.publishedAt, currentLang)}
                    </span>
                    <h3 className="text-base font-display font-bold text-brand-slate-900 dark:text-white leading-snug group-hover:text-brand-blue-500 dark:group-hover:text-brand-sky-300 transition-colors">
                      {item.title[currentLang]}
                    </h3>
                    <p className="text-xs text-brand-slate-600 dark:text-brand-slate-300 leading-relaxed line-clamp-3">
                      {item.excerpt[currentLang]}
                    </p>
                    <span className="mt-auto pt-2 text-xs font-bold text-brand-blue-500 group-hover:text-brand-blue-600 dark:text-brand-sky-300">
                      {t.news_read_more} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl max-w-md mx-auto">
              <p className="text-sm font-semibold text-brand-slate-500 dark:text-brand-slate-300 uppercase font-mono">
                {t.news_empty}
              </p>
            </div>
          )}
        </section>
      </div>
    </article>
  )
}
