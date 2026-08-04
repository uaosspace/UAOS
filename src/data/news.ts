import {LocalizedText} from '../types'
import {ContentApiError, fetchContentItems} from '../lib/contentApi'
import {
  isRecord,
  readArray,
  readHttpUrl,
  readLocalizedText,
  readString,
  readStringOr,
} from '../lib/contentGuards'

export interface NewsItem {
  id: string
  slug: string
  published: boolean
  publishedAt: string
  title: LocalizedText
  excerpt: LocalizedText
  body: LocalizedText
  coverImageUrl?: string
  /** When set, card opens this URL instead of on-site article. */
  externalUrl?: string
}

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-eu-ppe-standards-update',
    slug: 'eu-ppe-standards-update',
    published: true,
    publishedAt: '2026-07-18',
    title: {
      uk: 'UAOS взяла участь у консультаціях щодо гармонізації стандартів ЗІЗ з ЄС',
      en: 'UAOS participated in consultations on harmonizing PPE standards with the EU',
    },
    excerpt: {
      uk: 'Представники асоціації презентували позицію українських виробників під час робочої зустрічі з профільним регулятором.',
      en: 'Association representatives presented the position of Ukrainian manufacturers during a working meeting with the sector regulator.',
    },
    body: {
      uk: 'UAOS долучилася до робочої групи з адаптації національних стандартів засобів індивідуального захисту до вимог ЄС. У ході зустрічі учасники обговорили терміни перехідного періоду, вимоги до сертифікації та практичні кроки для виробників і постачальників. Асоціація продовжує представляти консолідовану позицію галузі в діалозі з державними органами.',
      en: 'UAOS joined a working group on adapting national personal protective equipment standards to EU requirements. During the meeting, participants discussed transition period timelines, certification requirements, and practical steps for manufacturers and suppliers. The association continues to represent a consolidated industry position in dialogue with state authorities.',
    },
  },
  {
    id: 'news-member-training-program',
    slug: 'member-training-program-launch',
    published: true,
    publishedAt: '2026-06-25',
    title: {
      uk: 'Стартувала навчальна програма для підприємств-учасників асоціації',
      en: 'A training program for member enterprises has launched',
    },
    excerpt: {
      uk: 'Серія практичних семінарів з підбору засобів захисту та оцінки ризиків на робочих місцях для підприємств-споживачів.',
      en: 'A series of practical seminars on selecting protective equipment and assessing workplace risks for consumer enterprises.',
    },
    body: {
      uk: 'У межах напряму «Експертиза та навчання» UAOS запустила серію семінарів для підприємств-учасників. Програма охоплює методики оцінки ризиків, підбір засобів індивідуального захисту під конкретні виробничі умови та огляд типових помилок під час впровадження систем охорони праці. Участь безкоштовна для членів асоціації.',
      en: 'As part of the “Expertise and training” direction, UAOS launched a series of seminars for member enterprises. The program covers risk assessment methods, selecting personal protective equipment for specific production conditions, and a review of common mistakes in implementing occupational safety systems. Participation is free for association members.',
    },
  },
  {
    id: 'news-new-members-welcome',
    slug: 'new-members-summer-2026',
    published: true,
    publishedAt: '2026-06-02',
    title: {
      uk: 'До UAOS долучилися нові учасники з числа виробників та експертних організацій',
      en: 'New members joined UAOS among manufacturers and expert organizations',
    },
    excerpt: {
      uk: 'Каталог учасників асоціації розширився — вітаємо нові компанії та експертні об’єднання у професійній спільноті UAOS.',
      en: 'The association’s member catalog has grown — welcoming new companies and expert unions to the UAOS professional community.',
    },
    body: {
      uk: 'Асоціація вітає нових учасників, що долучилися до професійної спільноти UAOS у другому кварталі 2026 року. Серед нових членів — виробники засобів індивідуального захисту та незалежні експертні організації у сфері охорони праці. Це розширює галузеве представництво асоціації та посилює діалог із державними органами й підприємствами-споживачами.',
      en: 'The association welcomes new members who joined the UAOS professional community in Q2 2026. New members include personal protective equipment manufacturers and independent occupational safety expert organizations. This expands the association’s industry representation and strengthens dialogue with state authorities and consumer enterprises.',
    },
  },
]

export function mapNews(doc: unknown): NewsItem {
  const source = isRecord(doc) ? doc : {}

  return {
    id: readStringOr(source.id, readStringOr(source._id, 'news-unknown')),
    slug: readString(source.slug) || readStringOr(source.id, readStringOr(source._id, 'news-unknown')),
    published: source.published === undefined ? true : Boolean(source.published),
    publishedAt: readStringOr(source.publishedAt, new Date().toISOString()),
    title: readLocalizedText(source.title),
    excerpt: readLocalizedText(source.excerpt),
    body: readLocalizedText(source.body),
    coverImageUrl: readStringOr(source.coverImageUrl, '') || undefined,
    externalUrl: readHttpUrl(source.externalUrl),
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const docs = await fetchContentItems<unknown>('news')
    const mapped = readArray(docs).map(mapNews)
    if (import.meta.env.DEV && mapped.length === 0) {
      console.warn('Content API fetchNews returned empty in DEV, using seed')
      return INITIAL_NEWS
    }
    return mapped
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Content API fetchNews unavailable in DEV, using seed:', err)
      return INITIAL_NEWS
    }
    if (err instanceof ContentApiError) throw err
    throw new ContentApiError('Failed to load news', 500)
  }
}
