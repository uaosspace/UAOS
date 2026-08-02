/**
 * One-off seed helper for demo events.
 * Usage (after .env.local has project id + SANITY_API_WRITE_TOKEN):
 *   node --env-file=.env.local scripts/seed-events.mjs
 */
import {createClient} from '@sanity/client'

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || projectId === 'yourProjectId' || !token) {
  console.error('Set VITE_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN first.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

const events = [
  {
    _type: 'event',
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
  },
  {
    _type: 'event',
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
  },
]

for (const event of events) {
  const created = await client.create(event)
  console.log('Created', created._id, created.title?.uk)
}

console.log('Done. Publish is already set via published:true.')
