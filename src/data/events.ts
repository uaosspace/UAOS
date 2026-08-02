import {AssociationEvent} from '../types'
import {getSanityClient, sanityConfigured, urlForImage} from '../lib/sanity'
import {
  isRecord,
  readArray,
  readEventFormat,
  readEventType,
  readHttpUrl,
  readLocalizedText,
  readString,
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

const EVENTS_QUERY = `*[_type == "event" && published == true] | order(startAt asc) {
  _id,
  _createdAt,
  _updatedAt,
  published,
  title,
  shortDescription,
  fullDescription,
  type,
  format,
  startAt,
  endAt,
  timeZone,
  location,
  onlineUrl,
  registrationUrl,
  organizer,
  coverImage
}`

/**
 * Преобразует Sanity-документ события в безопасную модель для календаря.
 */
export function mapEvent(doc: unknown): AssociationEvent {
  const source = isRecord(doc) ? doc : {}
  const eventId = readStringOr(source._id, 'event-unknown')

  return {
    id: eventId,
    published: Boolean(source.published),
    title: readLocalizedText(source.title),
    shortDescription: readLocalizedText(source.shortDescription),
    fullDescription: readLocalizedText(source.fullDescription),
    type: readEventType(source.type),
    format: readEventFormat(source.format),
    startAt: readStringOr(source.startAt, new Date().toISOString()),
    endAt: readStringOr(source.endAt, readStringOr(source.startAt, new Date().toISOString())),
    timeZone: readStringOr(source.timeZone, 'Europe/Kyiv'),
    location: isRecord(source.location) ? readLocalizedText(source.location) : undefined,
    onlineUrl: readHttpUrl(source.onlineUrl),
    registrationUrl: readHttpUrl(source.registrationUrl),
    organizer: isRecord(source.organizer) ? readLocalizedText(source.organizer) : undefined,
    coverImageUrl: urlForImage(source.coverImage, 'eventCover') || undefined,
    createdAt: readStringOr(source._createdAt, new Date().toISOString()),
    updatedAt: readStringOr(source._updatedAt, new Date().toISOString()),
  }
}

/** Async loader: Sanity when configured, otherwise seed. */
export async function fetchEvents(): Promise<AssociationEvent[]> {
  const client = getSanityClient()
  if (!client || !sanityConfigured) {
    return INITIAL_EVENTS
  }
  try {
    const docs = await client.fetch(EVENTS_QUERY)
    const eventDocs = readArray(docs)
    if (eventDocs.length === 0) {
      return INITIAL_EVENTS
    }
    return eventDocs.map(mapEvent)
  } catch (err) {
    console.error('Sanity fetchEvents failed, using seed:', err)
    return INITIAL_EVENTS
  }
}

/** @deprecated Sync localStorage API — kept for rare callers; prefer fetchEvents */
export function getEvents(): AssociationEvent[] {
  return INITIAL_EVENTS
}
