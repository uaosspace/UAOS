import {useEffect, useState} from 'react'
import type {Locale} from '../data/locales'
import {resolveLocalized} from '../data/locales'
import {TRANSLATIONS} from '../data/translations'
import {useDocumentMeta} from '../hooks/useDocumentMeta'
import type {AssociationEvent} from '../types'
import EventDetails from '../components/events/EventDetails'
import {ArrowLeft, Loader2} from 'lucide-react'
import {ContentApiError} from '../lib/contentApi'

interface EventsDetailPageProps {
  currentLang: Locale
  eventSlug: string
  event: AssociationEvent | null
  onBack: () => void
}

function mapApiEvent(raw: Record<string, unknown>): AssociationEvent {
  return {
    id: String(raw.id || ''),
    published: Boolean(raw.published ?? true),
    title: (raw.title as AssociationEvent['title']) || {uk: '', en: ''},
    shortDescription:
      (raw.shortDescription as AssociationEvent['shortDescription']) || {uk: '', en: ''},
    fullDescription:
      (raw.fullDescription as AssociationEvent['fullDescription']) || {uk: '', en: ''},
    type: (String(raw.type || 'meeting') as AssociationEvent['type']),
    format: (String(raw.format || 'online') as AssociationEvent['format']),
    startAt: String(raw.startAt || ''),
    endAt: String(raw.endAt || ''),
    timeZone: String(raw.timeZone || 'Europe/Kyiv'),
    location: raw.location as AssociationEvent['location'],
    onlineUrl: raw.onlineUrl ? String(raw.onlineUrl) : undefined,
    registrationUrl: raw.registrationUrl ? String(raw.registrationUrl) : undefined,
    organizer: raw.organizer as AssociationEvent['organizer'],
    coverImageUrl: raw.coverImageUrl ? String(raw.coverImageUrl) : undefined,
    createdAt: String(raw.createdAt || ''),
    updatedAt: String(raw.updatedAt || ''),
  }
}

export default function EventsDetailPage({
  currentLang,
  eventSlug,
  event,
  onBack,
}: EventsDetailPageProps) {
  const t = TRANSLATIONS[currentLang]
  const [resolved, setResolved] = useState<AssociationEvent | null>(event)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!event)

  useEffect(() => {
    if (event) {
      setResolved(event)
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetch(`/api/public/events/${encodeURIComponent(eventSlug)}`, {
      credentials: 'include',
      headers: {Accept: 'application/json'},
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new ContentApiError(
            typeof data.error === 'string' ? data.error : 'Event unavailable',
            response.status,
          )
        }
        if (!cancelled) {
          setResolved(mapApiEvent((data.item ?? {}) as Record<string, unknown>))
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ContentApiError && err.status === 401) {
          setError(t.events_meeting_login_needed)
        } else if (err instanceof ContentApiError && err.status === 403) {
          setError(t.events_meeting_forbidden)
        } else {
          setError(err instanceof Error ? err.message : t.events_meeting_unavailable)
        }
        setResolved(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [event, eventSlug, t.events_meeting_forbidden, t.events_meeting_login_needed, t.events_meeting_unavailable])

  useDocumentMeta({
    title: resolved
      ? `${resolveLocalized(resolved.title, currentLang)} — ${t.brand_name}`
      : t.brand_name,
    description: resolved ? resolveLocalized(resolved.shortDescription, currentLang) : '',
    ogImage: resolved?.coverImageUrl,
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

        {loading ? (
          <div className="flex items-center gap-2 text-brand-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.events_meeting_loading}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        {resolved ? (
          <div className="rounded-2xl border border-brand-slate-100 dark:border-brand-slate-800 shadow-sm">
            <EventDetails event={resolved} currentLang={currentLang} />
          </div>
        ) : null}
      </div>
    </article>
  )
}
