import {AssociationEvent} from '../types'
import {ContentApiError, fetchContentItems} from '../lib/contentApi'
import {
  isRecord,
  readArray,
  readEventFormat,
  readEventType,
  readHttpUrl,
  readLocalizedText,
  readStringOr,
} from '../lib/contentGuards'

export const INITIAL_EVENTS: AssociationEvent[] = [
  {
    id: 'evt_demo_1',
    published: true,
    title: {
      uk: 'Тренінг "Основи безпеки на виробництві"',
      en: 'Training "Fundamentals of Industrial Safety"',
    },
    shortDescription: {
      uk: 'Базовий тренінг для нових спеціалістів з охорони праці.',
      en: 'Basic training for new occupational safety specialists.',
    },
    fullDescription: {
      uk: 'Детальний опис тренінгу...',
      en: 'Detailed description of the training...',
    },
    type: 'training',
    format: 'online',
    startAt: '2026-09-24T15:00:00.000Z',
    endAt: '2026-09-24T17:00:00.000Z',
    timeZone: 'Europe/Kyiv',
    onlineUrl: 'https://zoom.us/j/123456789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt_demo_2',
    published: true,
    title: {
      uk: 'Конференція "Майбутнє охорони праці"',
      en: 'Conference "Future of Occupational Safety"',
    },
    shortDescription: {
      uk: 'Щорічна конференція членів асоціації.',
      en: 'Annual conference of association members.',
    },
    fullDescription: {
      uk: 'Детальний опис конференції...',
      en: 'Detailed description of the conference...',
    },
    type: 'conference',
    format: 'hybrid',
    startAt: '2026-10-15T09:00:00.000Z',
    endAt: '2026-10-15T18:00:00.000Z',
    timeZone: 'Europe/Kyiv',
    location: {
      uk: 'Київ, вул. Хрещатик, 1',
      en: 'Kyiv, Khreshchatyk st., 1',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Преобразует документ события (public API) в безопасную модель для календаря.
 */
export function mapEvent(doc: unknown): AssociationEvent {
  const source = isRecord(doc) ? doc : {}
  const eventId = readStringOr(source.id, readStringOr(source._id, 'event-unknown'))
  const locationValue = source.location
  const organizerValue = source.organizer

  return {
    id: eventId,
    published: source.published === undefined ? true : Boolean(source.published),
    title: readLocalizedText(source.title),
    shortDescription: readLocalizedText(source.shortDescription),
    fullDescription: readLocalizedText(source.fullDescription),
    type: readEventType(source.type),
    format: readEventFormat(source.format),
    startAt: readStringOr(source.startAt, new Date().toISOString()),
    endAt: readStringOr(source.endAt, readStringOr(source.startAt, new Date().toISOString())),
    timeZone: readStringOr(source.timeZone, 'Europe/Kyiv'),
    location: isRecord(locationValue)
      ? readLocalizedText(locationValue)
      : typeof locationValue === 'string' && locationValue
        ? {uk: locationValue, en: locationValue}
        : undefined,
    onlineUrl: readHttpUrl(source.onlineUrl),
    registrationUrl: readHttpUrl(source.registrationUrl),
    organizer: isRecord(organizerValue)
      ? readLocalizedText(organizerValue)
      : typeof organizerValue === 'string' && organizerValue
        ? {uk: organizerValue, en: organizerValue}
        : undefined,
    coverImageUrl: readStringOr(source.coverImageUrl, '') || undefined,
    createdAt: readStringOr(source.createdAt, new Date().toISOString()),
    updatedAt: readStringOr(source.updatedAt, new Date().toISOString()),
  }
}

/** Async loader: public content API; DEV may fall back to seed if API is down. */
export async function fetchEvents(): Promise<AssociationEvent[]> {
  try {
    const docs = await fetchContentItems<unknown>('events')
    const mapped = readArray(docs).map(mapEvent)
    if (import.meta.env.DEV && mapped.length === 0) {
      console.warn('Content API fetchEvents returned empty in DEV, using seed')
      return INITIAL_EVENTS
    }
    return mapped
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchEvents unavailable in DEV, using seed:', err)
      return INITIAL_EVENTS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load events', 500)
  }
}

/** @deprecated Sync localStorage API — kept for rare callers; prefer fetchEvents */
export function getEvents(): AssociationEvent[] {
  return INITIAL_EVENTS
}
