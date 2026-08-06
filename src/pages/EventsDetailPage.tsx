import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {AssociationEvent} from '../types'
import EventDetails from '../components/events/EventDetails'
import {ArrowLeft} from 'lucide-react'

interface EventsDetailPageProps {
  currentLang: Locale
  event: AssociationEvent
  onBack: () => void
}

export default function EventsDetailPage({currentLang, event, onBack}: EventsDetailPageProps) {
  const t = TRANSLATIONS[currentLang]
  useDocumentMeta({
    title: `${resolveLocalized(event.title, currentLang)} — ${t.brand_name}`,
    description: resolveLocalized(event.shortDescription, currentLang),
    ogImage: event.coverImageUrl,
    ogType: 'article',
  })

  return (
    <article className="pt-24 pb-20 bg-transparent min-h-screen transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-slate-500 hover:text-brand-blue-500 dark:hover:text-brand-sky-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.events_back_to_list}
        </button>

        <div className="rounded-2xl border border-brand-slate-100 dark:border-brand-slate-800 shadow-sm">
          <EventDetails event={event} currentLang={currentLang} />
        </div>
      </div>
    </article>
  )
}
