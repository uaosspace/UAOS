import {useMemo, useState} from 'react'
import type {Locale} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {AssociationEvent} from '../types'
import {isUpcomingEvent, sortEventsAscending, sortEventsDescending} from '../utils/eventDate'
import EventCard from '../components/events/EventCard'
import {APP_ROUTES, type AppRoute} from '../routes/appRoutes'

interface EventsListPageProps {
  currentLang: Locale
  events: AssociationEvent[]
  onSelectEvent: (eventId: string) => void
  onNavigate: (route: AppRoute) => void
}

type TabKey = 'upcoming' | 'archive'

export default function EventsListPage({currentLang, events, onSelectEvent, onNavigate}: EventsListPageProps) {
  const t = TRANSLATIONS[currentLang]
  const [tab, setTab] = useState<TabKey>('upcoming')

  useDocumentMeta({
    title: `${t.events_upcoming} — ${t.brand_name}`,
    description: t.events_upcoming,
  })

  const publishedEvents = useMemo(() => events.filter((event) => event.published), [events])
  const upcoming = useMemo(
    () => sortEventsAscending(publishedEvents.filter(isUpcomingEvent)),
    [publishedEvents],
  )
  const archive = useMemo(
    () => sortEventsDescending(publishedEvents.filter((event) => !isUpcomingEvent(event))),
    [publishedEvents],
  )

  const visibleEvents = tab === 'upcoming' ? upcoming : archive

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div className="space-y-3 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-brand-slate-900 dark:text-white tracking-tight leading-snug">
              {t.events_upcoming}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(APP_ROUTES.newsList)}
            className="text-sm font-bold text-brand-blue-500 hover:text-brand-blue-600 dark:text-brand-sky-300 shrink-0"
          >
            {t.news_link}
          </button>
        </div>

        <div className="flex gap-2 bg-brand-slate-100 dark:bg-brand-slate-900 p-1 rounded-lg w-fit mx-auto sm:mx-0 mb-8">
          {(['upcoming', 'archive'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === key
                  ? 'bg-white dark:bg-brand-slate-800 shadow-sm text-brand-slate-900 dark:text-white'
                  : 'text-brand-slate-600 dark:text-brand-slate-300 hover:text-brand-slate-900 dark:hover:text-white'
              }`}
            >
              {key === 'upcoming' ? t.events_upcoming_tab : t.events_archive_tab}
            </button>
          ))}
        </div>

        {visibleEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleEvents.map((event) => (
              <EventCard key={event.id} event={event} currentLang={currentLang} onOpenDetails={onSelectEvent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl max-w-md mx-auto">
            <p className="text-sm font-semibold text-brand-slate-500 dark:text-brand-slate-300 uppercase font-mono">
              {t.events_empty}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
